import { describe, expect, it } from 'vitest';
import { BATTLE } from '../../data/battle';
import { NORMAL_GEOMETRY } from '../../data/boardGeometry';
import { formationSlots, insideLeash, isRanged, leashBox } from './formation';

describe('formation in front of the board (2026-11-09)', () => {
  const g = NORMAL_GEOMETRY;

  it('ranged rows stand nearer the board, melee rows in front of them (south, towards the foe)', () => {
    const slots = formationSlots('normal', 3, 4);
    const rangedY = slots.ranged.map((p) => p.y);
    const meleeY = slots.melee.map((p) => p.y);
    expect(Math.min(...rangedY)).toBeGreaterThan(g.boardMax);
    expect(Math.min(...meleeY)).toBeGreaterThan(Math.max(...rangedY));
  });

  it('centres each row on the board and keeps every slot on the field and inside the leash', () => {
    const slots = formationSlots('normal', 70, 70);
    const mid = (g.boardMin + g.boardMax) / 2;
    const firstRow = slots.ranged.slice(0, BATTLE.formationPerRow);
    const xs = firstRow.map((p) => p.x);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(mid, 9);
    for (const p of [...slots.ranged, ...slots.melee]) {
      expect(insideLeash('normal', p.x, p.y)).toBe(true);
      expect(p.x).toBeGreaterThanOrEqual(g.boardMin);
      expect(p.x).toBeLessThanOrEqual(g.boardMax);
    }
    // a full row then wraps to the next one
    expect(slots.ranged[BATTLE.formationPerRow]!.y).toBe(slots.ranged[0]!.y + BATTLE.formationRowGap);
  });

  it('is deterministic and gives every unit its own slot', () => {
    const a = formationSlots('normal', 20, 20);
    expect(formationSlots('normal', 20, 20)).toEqual(a);
    const keys = new Set([...a.ranged, ...a.melee].map((p) => `${p.x},${p.y}`));
    expect(keys.size).toBe(40);
  });

  it('melee means a reach of at most meleeMaxRange', () => {
    expect(isRanged(2)).toBe(false);
    expect(isRanged(BATTLE.meleeMaxRange)).toBe(false);
    expect(isRanged(56)).toBe(true);
  });

  it('the leash is the board plus allyLeashPlots plots on every side', () => {
    const box = leashBox('normal');
    const reach = BATTLE.allyLeashPlots * BATTLE.plot;
    expect(box).toEqual({ x0: g.boardMin - reach, x1: g.boardMax + reach, y0: g.boardMin - reach, y1: g.boardMax + reach });
    expect(insideLeash('normal', g.boardMax + reach + 1, 400)).toBe(false);
    expect(BATTLE.allyLeashPlots).toBe(4);
  });
});
