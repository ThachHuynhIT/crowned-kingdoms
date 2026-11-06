import { describe, expect, it } from 'vitest';
import { ISO, isoDepth, project, unproject } from './iso';

describe('isometric projection (2:1, owner decision 2026-11-06: a 64 px plot is a 128×64 diamond)', () => {
  it('maps the world axes onto the two 2:1 diagonals', () => {
    expect(project({ x: 64, y: 0 })).toEqual({ x: 64, y: 32 });
    expect(project({ x: 0, y: 64 })).toEqual({ x: -64, y: 32 });
    expect(project({ x: 384, y: 384 })).toEqual({ x: 0, y: 384 });
    expect([ISO.plotW, ISO.plotH]).toEqual([128, 64]);
  });

  it('turns one 64 px plot into a diamond 128 wide and 64 tall', () => {
    const c = [project({ x: 0, y: 0 }), project({ x: 64, y: 0 }), project({ x: 64, y: 64 }), project({ x: 0, y: 64 })];
    const xs = c.map((p) => p.x);
    const ys = c.map((p) => p.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBe(128);
    expect(Math.max(...ys) - Math.min(...ys)).toBe(64);
  });

  it('round-trips negative and fractional points without rounding', () => {
    for (const p of [{ x: 0, y: 0 }, { x: -12.5, y: 7.25 }, { x: 768, y: 832 }, { x: 3.1, y: -40.7 }]) {
      const back = unproject(project(p));
      expect(back.x).toBeCloseTo(p.x, 12);
      expect(back.y).toBeCloseTo(p.y, 12);
    }
  });

  it('sorts depth by the projected foot y (x + y), so nearer (south-east) things draw on top', () => {
    expect(isoDepth({ x: 100, y: 100 })).toBeLessThan(isoDepth({ x: 100, y: 101 }));
    expect(isoDepth({ x: 100, y: 100 })).toBeLessThan(isoDepth({ x: 101, y: 100 }));
    expect(isoDepth({ x: 150, y: 50 })).toBe(isoDepth({ x: 50, y: 150 }));
  });
});
