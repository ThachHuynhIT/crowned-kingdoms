import { IDBDatabase, IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { MAX_SAVE_SLOTS, SLOTS_FULL_TEXT } from '../data/save';
import { CONTENT } from '../game/cards/registry';
import { runState } from '../game/testing/fixtures';
import { createSession } from './session';

const open = (disk: IDBFactory, now = () => 1000) => createSession(disk, () => undefined, CONTENT, now);

describe('named save slots on the device (2026-11-09)', () => {
  it('saves, lists newest first, renames, deletes, and survives a reload', async () => {
    const disk = new IDBFactory();
    let clock = 1000;
    const s = await open(disk, () => clock);
    const a = await s.saveSlot(runState({ year: 3 }), 'Ván A');
    clock = 2000;
    const b = await s.saveSlot(runState({ year: 9 }), 'Ván B');
    expect(a.ok && b.ok).toBe(true);
    expect((await s.listSlots()).map((x) => [x.name, x.year, x.savedAt])).toEqual([
      ['Ván B', 9, 2000],
      ['Ván A', 3, 1000],
    ]);
    const again = await open(disk);
    const list = await again.listSlots();
    expect(list).toHaveLength(2);
    expect((await again.renameSlot(list[1]!.id, '  Ván   đầu ')).ok).toBe(true);
    await again.deleteSlot(list[0]!.id);
    expect((await again.listSlots()).map((x) => x.name)).toEqual(['Ván đầu']);
  });

  it('loading a slot makes it the run being played (the autosave), and keeps the slot', async () => {
    const disk = new IDBFactory();
    const s = await open(disk);
    const saved = await s.saveSlot(runState({ year: 6, gold: 42 }), 'Giữa ván');
    if (!saved.ok) throw new Error('save failed');
    const loaded = await s.loadSlot(saved.slot.id);
    expect(loaded.kind).toBe('ok');
    if (loaded.kind === 'ok') expect([loaded.state.year, loaded.state.gold]).toEqual([6, 42]);
    const resumed = await (await open(disk)).load();
    expect(resumed.kind === 'ok' && resumed.state.gold).toBe(42);
    expect(await s.listSlots()).toHaveLength(1);
  });

  it('refuses an empty name, an eleventh slot, and reports a broken slot as incompatible', async () => {
    const s = await open(new IDBFactory());
    expect((await s.saveSlot(runState(), '   ')).ok).toBe(false);
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) expect((await s.saveSlot(runState(), `Ván ${i}`)).ok).toBe(true);
    expect(await s.saveSlot(runState(), 'Một bản nữa')).toEqual({ ok: false, message: SLOTS_FULL_TEXT });
    const [first] = await s.listSlots();
    await s.store.saveSlot(first!.id, { ...(await s.store.loadSlot(first!.id) as object), save: { formatVersion: 99 } } as never);
    expect((await s.loadSlot(first!.id)).kind).toBe('incompatible');
    expect((await s.loadSlot('nope')).kind).toBe('empty');
  });
});

describe('save slots: review fixes (2026-11-09)', () => {
  it('a damaged slot keeps its id and counts toward the cap; a new slot never overwrites it', async () => {
    const s = await open(new IDBFactory());
    await s.store.saveSlot('s1', { id: 's1', name: '', broken: true } as never);
    const saved = await s.saveSlot(runState(), 'Ván mới');
    expect(saved.ok && saved.slot.id).toBe('s2');
    expect(await s.store.loadSlot('s1')).toMatchObject({ broken: true });
  });

  it('after the disk store falls back to memory, slots read before are still listed', async () => {
    const disk = new IDBFactory();
    const first = await open(disk);
    await first.saveSlot(runState({ year: 4 }), 'Trước khi hỏng');
    const s = await open(disk);
    expect(await s.listSlots()).toHaveLength(1);
    // the disk starts failing: every later call falls back to RAM
    const spy = vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(() => {
      throw new Error('disk gone');
    });
    try {
      expect((await s.listSlots()).map((x) => x.name)).toEqual(['Trước khi hỏng']);
      const more = await s.saveSlot(runState(), 'Chỉ trong phiên');
      expect(more.ok && more.slot.id).toBe('s2');
      expect(more.ok && more.memoryOnly).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});
