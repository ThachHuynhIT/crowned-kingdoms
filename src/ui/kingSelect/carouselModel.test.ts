import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../game/cards/registry';
import { kingChoices, nextIndex, swipeTarget } from './carouselModel';

describe('kingChoices', () => {
  const choices = kingChoices(CONTENT);

  it('lists the three playable kings first, then the other six in ALL_KINGS order', () => {
    expect(choices.map((c) => c.id)).toEqual([
      'wheat', 'stone', 'arcane', 'clock', 'forge', 'grove', 'moon', 'nomad', 'tide',
    ]);
    expect(choices.map((c) => c.playable)).toEqual([true, true, true, false, false, false, false, false, false]);
  });

  it('takes playable kings and their nine cards from the registry, never hardcoded', () => {
    const playable = CONTENT.kings();
    for (const [i, king] of playable.entries()) {
      expect(choices[i]!.id).toBe(king.id);
      expect(choices[i]!.nameVi).toBe(king.nameVi);
      expect(choices[i]!.cards).toEqual(king.cards.map((c) => c.id));
      expect(choices[i]!.cards).toHaveLength(9);
      expect(choices[i]!.note).toBeNull();
    }
  });

  it('shows a locked king as a mystery: the card says "Vua của ?" and "Sắp ra mắt"', () => {
    for (const c of choices.filter((x) => !x.playable)) {
      expect(c.cards).toEqual([]);
      expect(c.title).toEqual({ prefix: 'Vua của ', title: '?' });
      expect(c.note).toBe('Sắp ra mắt');
      expect(c.nameVi).toBe(CONTENT.enemyKings().find((e) => e.id === c.id)!.nameVi);
    }
  });

  it('splits a playable king name into prefix and coloured title', () => {
    const first = CONTENT.kings()[0]!;
    expect(choices[0]!.title).toEqual({ prefix: 'Vua của ', title: first.nameVi.replace(/^Vua /, '') });
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
