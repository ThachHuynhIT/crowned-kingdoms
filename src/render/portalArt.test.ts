import { describe, expect, it } from 'vitest';
import { PALETTE } from '../data/palette';
import { PORTAL_FOOT_Y, PORTAL_SIZE, paintPortal } from './portalArt';

describe('paintPortal (code-drawn enemy portal, spec 2026-11-08 §3)', () => {
  it('is 96 × 112, pixel art (alpha 0 or 255), palette colours only, deterministic', () => {
    const c = paintPortal();
    expect([c.width, c.height]).toEqual([PORTAL_SIZE.w, PORTAL_SIZE.h]);
    const palette = new Set<number>(Object.values(PALETTE));
    for (let i = 0; i < c.data.length; i += 4) {
      expect([0, 255]).toContain(c.data[i + 3]);
      if (c.data[i + 3] === 255) expect(palette.has((c.data[i]! << 16) | (c.data[i + 1]! << 8) | c.data[i + 2]!), `colour at ${i / 4}`).toBe(true);
    }
    expect(Array.from(paintPortal().data)).toEqual(Array.from(c.data));
  });

  it('stands on its foot: the ground glow is centred on the foot row, 92 px wide (96 × 48 projected footprint)', () => {
    const c = paintPortal();
    const row = (y: number) => [...Array(c.width).keys()].filter((x) => c.alphaAt(x, y) === 255);
    const foot = row(PORTAL_FOOT_Y);
    expect(foot[0]).toBe(2);
    expect(foot.at(-1)).toBe(93);
    expect(row(PORTAL_SIZE.h - 1)).toEqual([]);
    expect(row(0)).toEqual([]);
  });
});
