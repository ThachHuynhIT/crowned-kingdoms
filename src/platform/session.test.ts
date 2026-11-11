import { META_SAVE_VERSION } from '../data/meta';
import { RUN } from '../data/run';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import {
  INCOMPATIBLE_RUN_TEXT,
  META_READ_ONLY_TEXT,
  META_MEMORY_ONLY_TEXT,
  META_SAVE_FAILED_TEXT,
  SETTINGS_SAVE_FAILED_TEXT,
  STORAGE_WARNING_TEXT,
  UNLOCK_SAVE_FAILED_TEXT,
} from '../data/save';
import type { BattleResult } from '../game/battle/types';
import { CONTENT } from '../game/cards/registry';
import { createGameBus } from '../game/events';
import { crownPoints, defaultProfile, type MetaProfile } from '../game/meta';
import { fakeRun } from '../game/meta/testRun';
import { RunController } from '../game/run/RunController';
import type { RunState } from '../game/run/state';
import { startYear } from '../game/run/yearFlow';
import { encodeRun } from '../game/save/codec';
import { MemorySaveStore } from '../game/save/MemorySaveStore';
import { runState } from '../game/testing/fixtures';
import { createSession, type GameSession, openSession } from './session';

describe('createSession', () => {
  it('loads nothing from a fresh browser', async () => {
    const s = await createSession(new IDBFactory(), () => undefined, CONTENT);
    expect(await s.load()).toEqual({ kind: 'empty' });
  });

  it('checkpoints a run and loads it back after a reload (a second session on the same disk)', async () => {
    const disk = new IDBFactory();
    const first = await createSession(disk, () => undefined, CONTENT);
    const state = runState();
    await first.persistence.checkpoint(state);
    const second = await createSession(disk, () => undefined, CONTENT);
    expect(await second.load()).toEqual({ kind: 'ok', state });
  });

  it('an unusable save is reported once, removed, and the profile is not touched', async () => {
    const disk = new IDBFactory();
    const s = await createSession(disk, () => undefined, CONTENT);
    await s.store.saveMeta({ crowns: 1 });
    await s.store.saveRun({ ...encodeRun(runState(), CONTENT), formatVersion: 9 } as never);
    expect(await s.load()).toEqual({ kind: 'incompatible', message: INCOMPATIBLE_RUN_TEXT });
    expect(await s.load()).toEqual({ kind: 'empty' });
    expect(await s.store.loadMeta()).toEqual({ crowns: 1 });
  });

  it('without IndexedDB the session still works in memory and warns once', async () => {
    const warnings: string[] = [];
    const s = await createSession(null, (t) => warnings.push(t), CONTENT);
    await s.persistence.checkpoint(runState());
    expect((await s.load()).kind).toBe('ok');
    expect(warnings).toEqual([STORAGE_WARNING_TEXT]);
  });
});

/** A memory store that logs every write; `failEnd` makes the end-of-run transaction fail (nothing changes). */
class LoggingStore extends MemorySaveStore {
  log: string[] = [];
  failEnd = false;
  failMeta = false;
  override saveRun(save: Parameters<MemorySaveStore['saveRun']>[0]): Promise<void> {
    this.log.push('saveRun');
    return super.saveRun(save);
  }
  override clearRun(): Promise<void> {
    this.log.push('clearRun');
    return super.clearRun();
  }
  override endRun(profile: unknown): Promise<void> {
    this.log.push('endRun');
    if (this.failEnd) return Promise.reject(new Error('page closed'));
    return super.endRun(profile);
  }
  override saveMeta(profile: unknown): Promise<void> {
    this.log.push('saveMeta');
    if (this.failMeta) return Promise.reject(new Error('disk full'));
    return super.saveMeta(profile);
  }
}

const loss: BattleResult = {
  won: false,
  ticks: 300,
  throneHpLostPct: 100,
  kills: 0,
  killsBySource: {},
  interventionsUsed: 0,
  unitsLost: 0,
  capped: 0,
  inputs: [],
};

/** Drives `state` (planning with one life, or a loaded battle) to the end of the run through `session`. */
const playToEnd = async (session: GameSession, state: RunState) => {
  const bus = createGameBus();
  const controller = new RunController(bus, CONTENT, state, session.persistence);
  const ended: { crownPoints: number; unlocks: string[] }[] = [];
  bus.on('run:ended', (e) => ended.push(e));
  if (state.phase === 'battle') controller.kickoff();
  // G1 auto-start: selling down to RUN.battleHandMax cards starts the battle
  else for (let i = state.hand.length; i > RUN.battleHandMax; i--) bus.emit('ui:command', { command: { type: 'discard', handIndex: 0 } });
  await controller.whenIdle();
  bus.emit('battle:ended', { result: loss });
  await controller.whenIdle();
  expect(controller.state.phase).toBe('ended');
  return { controller, ended };
};
const lastLife = (): RunState => startYear(runState({ lives: 1, year: 4 }), CONTENT);

describe('session meta profile (G4)', () => {
  it('loads the profile once at boot and never writes it just for opening', async () => {
    const store = new LoggingStore();
    const s = await openSession(store, CONTENT);
    expect(s.meta()).toEqual(defaultProfile());
    expect(s.metaReadOnly).toBe(false);
    expect(store.log).toEqual([]);
  });

  it('settles a run once, keeps the profile across reloads, and does not add the same run twice', async () => {
    const disk = new IDBFactory();
    const run = fakeRun({ years: 10, conquered: 2, bosses: 1, won: false });
    const first = await createSession(disk, () => undefined, CONTENT);
    const out = await first.settleRun(run);
    expect(out.credited).toBe(true);
    expect(out.breakdown).toEqual(crownPoints(run));
    expect(out.crownPoints).toBe(21);
    expect(first.meta().crownPoints).toBe(21);
    const second = await createSession(disk, () => undefined, CONTENT);
    expect(second.meta().crownPoints).toBe(21);
    expect(second.meta().mastery.wheat).toBe(21);
    const again = await second.settleRun(run);
    expect(again).toMatchObject({ credited: false, crownPoints: 21, unlocks: [] });
    expect(second.meta().crownPoints).toBe(21);
  });

  it('unlocks resolve after the profile is saved and refuse what the profile cannot pay for', async () => {
    const disk = new IDBFactory();
    const s = await createSession(disk, () => undefined, CONTENT);
    expect(await s.unlockKing('grove')).toMatchObject({ ok: false, reason: 'notAllowed' });
    await s.settleRun(fakeRun({ years: 30, conquered: 0, bosses: 0, won: false }));
    const r = await s.unlockKing('grove');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.profile.unlockedKings).toContain('grove');
    expect(s.meta().crownPoints).toBe(5);
    expect(await s.unlockCard('neutral_duplicate')).toMatchObject({ ok: false, reason: 'notAllowed' });
    const reloaded = await createSession(disk, () => undefined, CONTENT);
    expect(reloaded.meta().unlockedKings).toContain('grove');
    expect(reloaded.meta().crownPoints).toBe(5);
  });

  it('a profile from a newer game is read-only: no saveMeta ever, unlocks refused, the score still shown', async () => {
    const store = new LoggingStore();
    const newer: MetaProfile = { ...defaultProfile(), version: 99, crownPoints: 500 };
    await store.saveMeta(newer);
    store.log.length = 0;
    const s = await openSession(store, CONTENT);
    expect(s.metaReadOnly).toBe(true);
    expect(s.meta().crownPoints).toBe(500);
    expect(await s.unlockKing('grove')).toEqual({ ok: false, reason: 'readOnly', message: META_READ_ONLY_TEXT });
    expect(await s.unlockCard('neutral_duplicate')).toEqual({ ok: false, reason: 'readOnly', message: META_READ_ONLY_TEXT });
    const { controller, ended } = await playToEnd(s, lastLife());
    expect(ended).toEqual([
      expect.objectContaining({ crownPoints: crownPoints(controller.state).total, unlocks: [META_READ_ONLY_TEXT], credited: false }),
    ]);
    expect(s.meta().crownPoints).toBe(500);
    expect(store.log).not.toContain('saveMeta');
    expect(store.log).not.toContain('endRun');
    expect(store.log.at(-1)).toBe('clearRun'); // the ended run is still dropped
    expect(await store.loadMeta()).toEqual(newer);
  });

  it('ends the run with ONE endRun (profile + run clear together): no separate saveMeta or clearRun', async () => {
    const store = new LoggingStore();
    const s = await openSession(store, CONTENT);
    const { controller, ended } = await playToEnd(s, lastLife());
    const writes = store.log.filter((w) => w !== 'saveRun');
    expect(writes).toEqual(['endRun']);
    expect(ended[0]).toMatchObject({ credited: true });
    expect(ended[0]!.crownPoints).toBe(crownPoints(controller.state).total);
    expect(s.meta().crownPoints).toBe(crownPoints(controller.state).total);
    expect(await store.loadRun()).toBeNull();
  });

  it('no window between the profile write and the run clear: a failed endRun leaves both as they were', async () => {
    const store = new LoggingStore();
    store.failEnd = true; // the page closes (or the disk fails) during the single end-of-run transaction
    const first = await openSession(store, CONTENT);
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const a = await playToEnd(first, lastLife());
    err.mockRestore();
    expect(a.ended[0]).toMatchObject({ credited: false, unlocks: [META_SAVE_FAILED_TEXT] });
    expect(first.meta().crownPoints).toBe(0); // nothing credited, in memory or on disk
    expect(await store.loadMeta()).toBeNull();
    expect(store.log).not.toContain('saveMeta');
    expect(store.log).not.toContain('clearRun');

    store.failEnd = false;
    const second = await openSession(store, CONTENT); // reload: the last battle entry is still saved
    const loaded = await second.load();
    expect(loaded.kind).toBe('ok');
    if (loaded.kind !== 'ok') return;
    expect(loaded.state.phase).toBe('battle');
    const b = await playToEnd(second, loaded.state);
    expect(b.controller.state).toEqual(a.controller.state);
    expect(b.ended[0]).toMatchObject({ credited: true });
    expect(second.meta().crownPoints).toBe(crownPoints(b.controller.state).total);
    expect(second.meta().settledRuns).toHaveLength(1);
    expect(await store.loadRun()).toBeNull();
  });

  it('without IndexedDB the profile still works for the session, with one warning', async () => {
    const warnings: string[] = [];
    const s = await createSession(null, (t) => warnings.push(t), CONTENT);
    await s.settleRun(fakeRun({ years: 5, conquered: 0, bosses: 0, won: false }));
    expect(s.meta().crownPoints).toBe(5);
    expect(warnings).toEqual([STORAGE_WARNING_TEXT]);
  });

  it('a failed unlock save says the unlock was not saved (not the run-score text) and keeps the profile', async () => {
    const store = new LoggingStore();
    const s = await openSession(store, CONTENT);
    await s.settleRun(fakeRun({ years: 30, conquered: 0, bosses: 0, won: false }));
    store.failMeta = true;
    const r = await s.unlockKing('grove');
    expect(r).toEqual({ ok: false, reason: 'saveFailed', message: UNLOCK_SAVE_FAILED_TEXT });
    expect(UNLOCK_SAVE_FAILED_TEXT).not.toBe(META_SAVE_FAILED_TEXT);
    expect(s.meta().unlockedKings).not.toContain('grove');
    expect(s.meta().crownPoints).toBe(30);
  });

  it('meta() hands out a copy: changing it does not change the session profile', async () => {
    const s = await openSession(new MemorySaveStore(), CONTENT);
    const copy = s.meta();
    copy.crownPoints = 999;
    copy.unlockedKings.push('grove');
    expect(s.meta().crownPoints).toBe(0);
    expect(s.meta().unlockedKings).not.toContain('grove');
  });
});

describe('session settle on a store that is not persistent', () => {
  it('credits the points but adds the memory-only notice', async () => {
    const s = await createSession(null, () => undefined, CONTENT);
    const out = await s.settleRun(fakeRun({ years: 10, conquered: 2, bosses: 1, won: false }));
    expect(out.credited).toBe(true);
    expect(out.unlocks).toContain(META_MEMORY_ONLY_TEXT);
  });

  it('has no notice on a persistent store', async () => {
    const s = await createSession(new IDBFactory(), () => undefined, CONTENT);
    const out = await s.settleRun(fakeRun({ years: 10, conquered: 2, bosses: 1, won: false }));
    expect(out.credited).toBe(true);
    expect(out.unlocks).not.toContain(META_MEMORY_ONLY_TEXT);
  });
});

describe('session settings and discard (G5 §4)', () => {
  it('updateSettings saves, then publishes, and survives a reload', async () => {
    const disk = new IDBFactory();
    const s = await createSession(disk, () => undefined, CONTENT);
    const r = await s.updateSettings({ music: 30, screenShake: false });
    expect(r).toMatchObject({ ok: true });
    expect(s.meta().settings).toEqual({ master: 100, music: 30, sfx: 100, screenShake: false, graphics: 'high', effects: true, damageNumbers: true });
    const again = await createSession(disk, () => undefined, CONTENT);
    expect(again.meta().settings).toEqual({ master: 100, music: 30, sfx: 100, screenShake: false, graphics: 'high', effects: true, damageNumbers: true });
  });

  it('a newer profile refuses settings and never writes', async () => {
    const store = new LoggingStore();
    await store.saveMeta({ ...defaultProfile(), version: META_SAVE_VERSION + 1 });
    store.log = [];
    const s = await openSession(store, CONTENT);
    expect(await s.updateSettings({ master: 10 })).toMatchObject({ ok: false, reason: 'readOnly' });
    expect(store.log).toEqual([]);
    expect(s.meta().settings.master).toBe(100);
  });

  it('a failed write answers saveFailed and keeps the previous settings in memory', async () => {
    const store = new LoggingStore();
    const s = await openSession(store, CONTENT);
    store.failMeta = true;
    expect(await s.updateSettings({ sfx: 40 })).toEqual({
      ok: false,
      reason: 'saveFailed',
      message: SETTINGS_SAVE_FAILED_TEXT,
    });
    expect(s.meta().settings.sfx).toBe(100);
  });

  it('rejects non-finite or out-of-range values without writing', async () => {
    const store = new LoggingStore();
    const s = await openSession(store, CONTENT);
    for (const patch of [{ master: Number.NaN }, { music: 101 }, { sfx: -1 }, { screenShake: 'x' as never }, { graphics: 'ultra' as never }, { effects: 1 as never }]) {
      expect(await s.updateSettings(patch)).toMatchObject({ ok: false, reason: 'notAllowed' });
    }
    expect(store.log).toEqual([]);
  });

  it('concurrent settings, unlock and settle keep every field', async () => {
    const disk = new IDBFactory();
    const s = await createSession(disk, () => undefined, CONTENT);
    const run = fakeRun({ years: 30, conquered: 4, bosses: 3, won: true });
    await Promise.all([
      s.updateSettings({ master: 40 }),
      s.settleRun(run),
      s.updateSettings({ music: 60 }),
      s.unlockKing('grove'),
      s.updateSettings({ sfx: 20, screenShake: false }),
    ]);
    const p = s.meta();
    expect(p.settings).toEqual({ master: 40, music: 60, sfx: 20, screenShake: false, graphics: 'high', effects: true, damageNumbers: true });
    expect(p.unlockedKings).toContain('grove');
    expect(p.settledRuns.length).toBe(1);
    const reloaded = (await createSession(disk, () => undefined, CONTENT)).meta();
    expect(reloaded).toEqual(p);
  });

  it('discardRun waits for a pending checkpoint, then clears only the run', async () => {
    const disk = new IDBFactory();
    const s = await createSession(disk, () => undefined, CONTENT);
    await s.updateSettings({ master: 70 });
    const before = s.meta();
    const pending = s.persistence.checkpoint(runState());
    const out = await s.discardRun();
    await pending;
    expect(out).toEqual({ persistent: true });
    const again = await createSession(disk, () => undefined, CONTENT);
    expect(await again.load()).toEqual({ kind: 'empty' });
    expect(again.meta()).toEqual(before);
  });

  it('discardRun never settles or touches the profile; a store without a probe promises only this session', async () => {
    const store = new LoggingStore();
    const s = await openSession(store, CONTENT);
    await s.persistence.checkpoint(runState());
    store.log = [];
    expect(await s.discardRun()).toEqual({ persistent: false });
    expect(store.log).toEqual(['clearRun']);
    expect(await store.loadRun()).toBeNull();
  });

  it('a disk that fails to delete reports persistent=false; a new session may still see the run', async () => {
    const disk = new IDBFactory();
    const warnings: string[] = [];
    const first = await createSession(disk, (t) => warnings.push(t), CONTENT);
    await first.persistence.checkpoint(runState());
    const deleteSpy = vi.spyOn(IDBObjectStore.prototype, 'delete').mockImplementation(() => {
      throw new Error('disk error');
    });
    try {
      expect(await first.discardRun()).toEqual({ persistent: false });
    } finally {
      deleteSpy.mockRestore();
    }
    expect(warnings).toEqual([STORAGE_WARNING_TEXT]);
    expect(await first.load()).toEqual({ kind: 'empty' });
    // The disk delete failed: a fresh session on the same browser can still find the old run.
    const second = await createSession(disk, () => undefined, CONTENT);
    expect((await second.load()).kind).toBe('ok');
    // Settings still work in this session, in memory only, with no second warning.
    expect(await first.updateSettings({ master: 10 })).toMatchObject({ ok: true });
    expect(first.meta().settings.master).toBe(10);
    expect(warnings).toEqual([STORAGE_WARNING_TEXT]);
  });
});
