import { describe, expect, it } from 'vitest';
import type { KingId } from '../../data/types';
import { CONTENT } from '../../game/cards/registry';
import { defaultProfile, type MetaProfile } from '../../game/meta';
import { kingChoices, nextIndex, swipeTarget, unlockLabel } from './carouselModel';

describe('kingChoices', () => {
  const choices = kingChoices(CONTENT, defaultProfile());
  const withPoints = (crownPoints: number, extra: Partial<MetaProfile> = {}): MetaProfile => ({
    ...defaultProfile(),
    crownPoints,
    ...extra,
  });
  const find = (list: ReturnType<typeof kingChoices>, id: KingId) => list.find((c) => c.id === id)!;

  it('default profile: wheat, stone, arcane are playable and lead; the six others are locked in ALL_KINGS order', () => {
    expect(choices.map((c) => c.id)).toEqual([
      'wheat', 'stone', 'arcane', 'clock', 'forge', 'grove', 'moon', 'nomad', 'tide',
    ]);
    expect(choices.filter((c) => c.playable).map((c) => c.id)).toEqual(['wheat', 'stone', 'arcane']);
  });

  it('takes the lock state from the profile, not a hard-coded list: an unlocked king joins the playable group', () => {
    const list = kingChoices(CONTENT, withPoints(0, { unlockedKings: ['arcane', 'moon', 'stone', 'wheat'] }));
    expect(list.map((c) => c.id)).toEqual([
      'wheat', 'stone', 'arcane', 'moon', 'clock', 'forge', 'grove', 'nomad', 'tide',
    ]);
    expect(find(list, 'moon').playable).toBe(true);
    expect(find(list, 'moon').cards).toHaveLength(9);
  });

  it('a locked king says what unlocks him, from KING_UNLOCK', () => {
    expect(find(choices, 'grove').note).toBe('Cần 25 điểm Vương Miện');
    expect(find(choices, 'tide').note).toBe('Cần 25 điểm Vương Miện');
    expect(find(choices, 'forge').note).toBe('Cần 40 điểm Vương Miện');
    expect(find(choices, 'clock').note).toBe('Cần 40 điểm Vương Miện');
    expect(find(choices, 'moon').note).toBe('Cần 60 điểm Vương Miện');
    expect(find(choices, 'nomad').note).toBe('Cần 80 điểm và thắng 1 ván');
    for (const c of choices.filter((x) => !x.playable)) {
      expect(c.cards).toEqual([]);
      expect(c.title).toEqual({ prefix: 'Vua của ', title: '?' });
      expect(c.nameVi).toBe(CONTENT.king(c.id).nameVi);
    }
  });

  it('default profile: nobody can be unlocked yet', () => {
    expect(choices.every((c) => c.unlockCost === null)).toBe(true);
  });

  it('40 points: grove, tide, forge and clock offer an unlock with their price; moon and nomad do not', () => {
    const list = kingChoices(CONTENT, withPoints(40));
    expect(find(list, 'grove').unlockCost).toBe(25);
    expect(find(list, 'tide').unlockCost).toBe(25);
    expect(find(list, 'forge').unlockCost).toBe(40);
    expect(find(list, 'clock').unlockCost).toBe(40);
    expect(find(list, 'moon').unlockCost).toBeNull();
    expect(find(list, 'nomad').unlockCost).toBeNull();
    expect(find(list, 'wheat').unlockCost).toBeNull();
  });

  it('nomad needs a won run as well as 80 points', () => {
    expect(find(kingChoices(CONTENT, withPoints(90)), 'nomad').unlockCost).toBeNull();
    const won = withPoints(90, { wins: { ...defaultProfile().wins, stone: 1 } });
    expect(find(kingChoices(CONTENT, won), 'nomad').unlockCost).toBe(80);
  });

  it('takes playable kings and their nine cards from the registry, never hardcoded', () => {
    for (const c of choices.filter((x) => x.playable)) {
      const king = CONTENT.king(c.id);
      expect(c.nameVi).toBe(king.nameVi);
      expect(c.cards).toEqual(king.cards.map((x) => x.id));
      expect(c.cards).toHaveLength(9);
      expect(c.note).toBeNull();
    }
  });

  it('splits a playable king name into prefix and coloured title', () => {
    const wheat = CONTENT.king('wheat');
    expect(choices[0]!.title).toEqual({ prefix: 'Vua của ', title: wheat.nameVi.replace(/^Vua /, '') });
  });
});

describe('unlockLabel', () => {
  it('reads "Mở khoá (N)"', () => {
    expect(unlockLabel(25)).toBe('Mở khoá (25)');
  });
});

describe('nextIndex', () => {
  it('moves by delta and stops at both ends without wrapping', () => {
    expect(nextIndex(0, -1, 9)).toBe(0);
    expect(nextIndex(8, 1, 9)).toBe(8);
    expect(nextIndex(3, 1, 9)).toBe(4);
    expect(nextIndex(3, -2, 9)).toBe(1);
    expect(nextIndex(3, 99, 9)).toBe(8);
  });
  it('is safe for zero or one king', () => {
    expect(nextIndex(0, 1, 0)).toBe(0);
    expect(nextIndex(0, -1, 1)).toBe(0);
    expect(nextIndex(0, 1, 1)).toBe(0);
  });
});

describe('swipeTarget', () => {
  it('does not change at 40 px or less, either way', () => {
    expect(swipeTarget(4, 40, 9)).toBe(4);
    expect(swipeTarget(4, -40, 9)).toBe(4);
    expect(swipeTarget(4, 0, 9)).toBe(4);
  });
  it('changes by exactly one king past 40 px: dragging right shows the previous king', () => {
    expect(swipeTarget(4, 41, 9)).toBe(3);
    expect(swipeTarget(4, -41, 9)).toBe(5);
    expect(swipeTarget(4, 500, 9)).toBe(3);
    expect(swipeTarget(4, -500, 9)).toBe(5);
  });
  it('does not wrap and copes with empty and single lists', () => {
    expect(swipeTarget(0, 100, 9)).toBe(0);
    expect(swipeTarget(8, -100, 9)).toBe(8);
    expect(swipeTarget(0, 100, 0)).toBe(0);
    expect(swipeTarget(0, -100, 1)).toBe(0);
  });
});
