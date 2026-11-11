import { describe, expect, it } from 'vitest';
import { deathPopFrame, deathPopPuffs, shakeOffset, showsFloatingDamage } from './juiceModel';

describe('shakeOffset', () => {
  it('steps through integer screen offsets every 30 ms', () => {
    const sequence = [
      { x: 2, y: 0 },
      { x: -2, y: 1 },
      { x: 1, y: -2 },
      { x: -1, y: 2 },
      { x: 0, y: -1 },
    ];
    sequence.forEach((offset, i) => {
      expect(shakeOffset(i * 30, true)).toEqual(offset);
      expect(shakeOffset(i * 30 + 29.99, true)).toEqual(offset);
    });
  });

  it('returns to zero at the end and afterwards', () => {
    expect(shakeOffset(150, true)).toEqual({ x: 0, y: 0 });
    expect(shakeOffset(600, true)).toEqual({ x: 0, y: 0 });
  });

  it('returns zero while disabled', () => {
    expect(shakeOffset(0, false)).toEqual({ x: 0, y: 0 });
    expect(shakeOffset(90, false)).toEqual({ x: 0, y: 0 });
  });
});

describe('showsFloatingDamage', () => {
  it('only shows damage at or above 50', () => {
    expect(showsFloatingDamage(49.99)).toBe(false);
    expect(showsFloatingDamage(50)).toBe(true);
  });
});

describe('death pop', () => {
  it('shows frames 0..3, one every DEATH_FRAME_MS, then nothing', () => {
    expect([0, 44, 45, 90, 135, 179, 180].map(deathPopFrame)).toEqual([0, 0, 1, 2, 3, 3, null]);
    expect(deathPopFrame(-5)).toBe(0);
  });

  it('puffs grow outward in whole pixels and shrink, never negative', () => {
    const sizes = [0, 1, 2, 3].map((f) => deathPopPuffs(f));
    for (const puffs of sizes) {
      expect(puffs).toHaveLength(6);
      for (const p of puffs) {
        expect(Number.isInteger(p.dx) && Number.isInteger(p.dy) && Number.isInteger(p.size)).toBe(
          true,
        );
        expect(p.size).toBeGreaterThan(0);
      }
    }
    const reach = (f: number) => Math.max(...deathPopPuffs(f).map((p) => Math.abs(p.dx)));
    expect(reach(3)).toBeGreaterThan(reach(0));
    expect(deathPopPuffs(3)[0]!.size).toBeLessThan(deathPopPuffs(0)[0]!.size);
  });
});
