import { describe, expect, it } from 'vitest';
import type { Rect, Size } from '../hud/layout';
import { cardLayout, fitArt, type CardDensity } from './cardLayout';

const SIZES: readonly [Size, CardDensity][] = [
  [{ w: 72, h: 112 }, 'compact'],
  [{ w: 84, h: 132 }, 'compact'],
  [{ w: 96, h: 144 }, 'compact'],
  [{ w: 120, h: 180 }, 'full'],
  [{ w: 180, h: 288 }, 'full'],
];
const INSET = 4;

const inside = (r: Rect, outer: Rect): boolean =>
  r.x >= outer.x && r.y >= outer.y && r.x + r.w <= outer.x + outer.w && r.y + r.h <= outer.y + outer.h;
const overlap = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('cardLayout', () => {
  it.each(SIZES)('regions_stay_inside %j (%s)', (size, density) => {
    const l = cardLayout(size, INSET, density);
    const card = { x: 0, y: 0, ...size };
    for (const r of [l.header, l.icon, l.name, l.art, l.badge, l.description]) {
      expect(inside(r, card)).toBe(true);
      expect(r.w).toBeGreaterThan(0);
      expect(r.h).toBeGreaterThan(0);
    }
    expect(inside(l.icon, l.header)).toBe(true);
    expect(inside(l.name, l.header)).toBe(true);
    expect(overlap(l.icon, l.name)).toBe(false);
  });

  it.each(SIZES)('header_art_description_order %j (%s)', (size, density) => {
    const l = cardLayout(size, INSET, density);
    expect(l.header.y + l.header.h).toBeLessThanOrEqual(l.art.y);
    expect(l.art.y + l.art.h).toBeLessThanOrEqual(l.badge.y);
    expect(l.badge.y + l.badge.h).toBeLessThanOrEqual(l.description.y);
    expect(l.description.y + l.description.h).toBeLessThanOrEqual(size.h - INSET);
  });

  it.each(SIZES)('badge_has_own_space %j (%s)', (size, density) => {
    const l = cardLayout(size, INSET, density);
    for (const other of [l.header, l.art, l.description]) expect(overlap(l.badge, other)).toBe(false);
    expect(l.badge.h).toBeGreaterThanOrEqual(density === 'full' ? 12 : 10);
  });

  it('the art area fits an integer-scaled 32×24 picture on every supported size', () => {
    for (const [size, density] of SIZES) {
      const { art } = cardLayout(size, INSET, density);
      const fit = fitArt(art, { w: 32, h: 24 });
      expect(fit.scale).toBeGreaterThanOrEqual(1);
      expect(fit.w).toBe(32 * fit.scale);
      expect(inside({ x: fit.x, y: fit.y, w: fit.w, h: fit.h }, art)).toBe(true);
    }
  });

  it('full cards leave room for at least two description lines', () => {
    expect(cardLayout({ w: 120, h: 180 }, INSET, 'full').description.h).toBeGreaterThanOrEqual(24);
  });
});

describe('fitArt', () => {
  const area: Rect = { x: 10, y: 20, w: 100, h: 80 };

  it('uses the largest integer scale that fits, capped at 3, centred', () => {
    expect(fitArt(area, { w: 32, h: 24 })).toEqual({ x: 10 + (100 - 96) / 2, y: 20 + (80 - 72) / 2, w: 96, h: 72, scale: 3 });
    expect(fitArt({ x: 0, y: 0, w: 64, h: 48 }, { w: 32, h: 24 }).scale).toBe(2);
    expect(fitArt({ x: 0, y: 0, w: 64, h: 40 }, { w: 32, h: 24 }).scale).toBe(1);
  });

  it('never goes below scale 1 (the layout guarantees the room) and never stretches', () => {
    const fit = fitArt({ x: 0, y: 0, w: 20, h: 10 }, { w: 32, h: 24 });
    expect(fit.scale).toBe(1);
    expect(fit.w).toBe(32);
    expect(fit.h).toBe(24);
  });

  it('places a taller future picture without distortion', () => {
    const fit = fitArt({ x: 0, y: 0, w: 96, h: 144 }, { w: 64, h: 96 });
    expect(fit).toMatchObject({ scale: 1, w: 64, h: 96, x: 16, y: 24 });
  });
});
