import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import {
  INCOMPATIBLE_RUN_TEXT,
  META_READ_ONLY_TEXT,
  META_MEMORY_ONLY_TEXT,
  META_SAVE_FAILED_TEXT,
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
  else bus.emit('ui:command', { command: { type: 'discard', handIndex: 0 } });
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
