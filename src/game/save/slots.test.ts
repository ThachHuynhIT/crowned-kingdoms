import { describe, expect, it } from 'vitest';
import { MAX_SAVE_SLOTS, SLOT_NAME_MAX } from '../../data/save';
import { CONTENT } from '../cards/registry';
import { runState } from '../testing/fixtures';
import { encodeRun } from './codec';
import { cleanSlotName, defaultSlotName, makeSlot, nextSlotId, readSlot, slotSummaries } from './slots';

const state = runState({ year: 7 });
const save = encodeRun(state, CONTENT);
const slot = (id: string, savedAt: number, name = 'Ván thử') => makeSlot(id, name, savedAt, state, save);

describe('save slots (2026-11-09)', () => {
  it('a slot keeps the run, its name, when it was saved, the king, the year and the mode', () => {
    expect(slot('s1', 1000)).toEqual({ id: 's1', name: 'Ván thử', savedAt: 1000, kingId: state.kingId, year: 7, mode: state.mode, save });
  });

  it('cleans a typed name and refuses an empty one', () => {
    expect(cleanSlotName('  Ván   của  tôi ')).toBe('Ván của tôi');
    expect(cleanSlotName('   ')).toBeNull();
    expect(cleanSlotName('x'.repeat(SLOT_NAME_MAX + 9))).toHaveLength(SLOT_NAME_MAX);
    expect(defaultSlotName('Vua Lúa Mì', 7)).toBe('Vua Lúa Mì — Năm 7');
  });

  it('never trusts the disk: a record of the wrong shape reads as null', () => {
    expect(readSlot(slot('s1', 5))).toEqual(slot('s1', 5));
    for (const bad of [null, 3, [], { ...slot('s1', 5), id: '' }, { ...slot('s1', 5), name: '  ' }, { ...slot('s1', 5), savedAt: Number.NaN },
      { ...slot('s1', 5), year: 0 }, { ...slot('s1', 5), mode: 'arcade' }, { ...slot('s1', 5), save: null }])
      expect(readSlot(bad)).toBeNull();
  });

  it('lists the good slots newest first, without the run inside', () => {
    const list = slotSummaries([slot('s1', 10), 'junk', slot('s3', 30), slot('s2', 30)]);
    expect(list.map((s) => s.id)).toEqual(['s2', 's3', 's1']);
    expect(list[0]).not.toHaveProperty('save');
  });

  it('gives a new slot the smallest free id, and none past MAX_SAVE_SLOTS', () => {
    expect(nextSlotId([])).toBe('s1');
    expect(nextSlotId(['s1', 's3'])).toBe('s2');
    expect(nextSlotId(Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => `s${i + 1}`))).toBeNull();
    expect(MAX_SAVE_SLOTS).toBe(10);
  });
});
