import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../game/cards/registry';
import { defaultProfile, type MetaProfile } from '../../game/meta';
import { perkButtonCaption, perkOptions, togglePerk } from './perkModel';

const mastery = (stone: number): MetaProfile => ({ ...defaultProfile(), mastery: { ...defaultProfile().mastery, stone } });

describe('perkOptions', () => {
  it('lists the three perks of the king with name and text from the registry', () => {
    const list = perkOptions(CONTENT, mastery(0), 'stone', null);
    expect(list.map((p) => p.id)).toEqual(['stone_p1', 'stone_p2', 'stone_p3']);
    CONTENT.king('stone').perks.forEach((perk, i) => {
      expect(list[i]!.nameVi).toBe(perk.nameVi);
      expect(list[i]!.textVi).toBe(perk.textVi);
    });
  });

  it('mastery 0: all three locked with their mastery mark', () => {
    const list = perkOptions(CONTENT, mastery(0), 'stone', null);
    expect(list.map((p) => p.unlocked)).toEqual([false, false, false]);
    expect(list.map((p) => p.note)).toEqual(['Thông thạo 10', 'Thông thạo 30', 'Thông thạo 60']);
  });

  it('mastery 30: two open, the third locked and says "Thông thạo 60"', () => {
    const list = perkOptions(CONTENT, mastery(30), 'stone', null);
    expect(list.map((p) => p.unlocked)).toEqual([true, true, false]);
    expect(list.map((p) => p.note)).toEqual([null, null, 'Thông thạo 60']);
  });

  it('marks the chosen perk, and only that one', () => {
    const list = perkOptions(CONTENT, mastery(30), 'stone', 'stone_p2');
    expect(list.map((p) => p.selected)).toEqual([false, true, false]);
  });
});

describe('togglePerk', () => {
  const p = mastery(30);
  it('choosing perk 1 then perk 2 keeps only perk 2', () => {
    const first = togglePerk(p, 'stone', null, 'stone_p1');
    expect(first).toBe('stone_p1');
    expect(togglePerk(p, 'stone', first, 'stone_p2')).toBe('stone_p2');
  });
  it('tapping the chosen perk again clears the choice', () => {
    expect(togglePerk(p, 'stone', 'stone_p2', 'stone_p2')).toBeNull();
  });
  it('a locked perk cannot be chosen: the choice stays', () => {
    expect(togglePerk(p, 'stone', 'stone_p1', 'stone_p3')).toBe('stone_p1');
    expect(togglePerk(p, 'stone', null, 'stone_p3')).toBeNull();
  });
});

describe('perkButtonCaption', () => {
  it('names the chosen perk, or says none is chosen', () => {
    expect(perkButtonCaption(CONTENT, 'stone', null)).toBe('Chưa chọn đặc quyền');
    expect(perkButtonCaption(CONTENT, 'stone', 'stone_p2')).toBe(CONTENT.king('stone').perks[1].nameVi);
  });
});
