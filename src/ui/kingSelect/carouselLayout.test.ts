import { describe, expect, it } from 'vitest';
import type { Rect } from '../hud/layout';
import { carouselSlots } from './carouselLayout';

const DESKTOP: Rect = { x: 0, y: 150, w: 1280, h: 500 };
const MOBILE: Rect = { x: 0, y: 130, w: 375, h: 520 };
const NARROW_DESKTOP: Rect = { x: 0, y: 150, w: 768, h: 500 };
const NARROW_PHONE: Rect = { x: 0, y: 130, w: 767, h: 520 };

const overlapsW = (a: Rect, b: Rect): number =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));

describe('carouselSlots', () => {
  for (const [name, rect] of [
    ['desktop', DESKTOP],
    ['mobile', MOBILE],
    ['768', NARROW_DESKTOP],
    ['767', NARROW_PHONE],
  ] as const) {
    it(`centre card is biggest, brightest, in front, 2:3 and inside the area (${name})`, () => {
      const slots = carouselSlots(rect, 4, 9);
      const centre = slots[4]!;
      expect(centre.scale).toBe(1);
      expect(centre.brightness).toBe(1);
      expect(centre.visible).toBe(true);
      expect(Math.abs(centre.rect.w / centre.rect.h - 2 / 3)).toBeLessThan(0.02);
      expect(centre.rect.x).toBeGreaterThanOrEqual(rect.x);
      expect(centre.rect.x + centre.rect.w).toBeLessThanOrEqual(rect.x + rect.w);
      expect(centre.rect.y).toBeGreaterThanOrEqual(rect.y);
      expect(centre.rect.y + centre.rect.h).toBeLessThanOrEqual(rect.y + rect.h);
      for (const s of slots) if (s.index !== 4) expect(centre.depth).toBeGreaterThan(s.depth);
    });

    it(`is symmetric around the centre and uses whole pixels (${name})`, () => {
      const slots = carouselSlots(rect, 4, 9);
      const mid = (r: Rect): number => r.x + r.w / 2;
      for (const k of [1, 2]) {
        const left = slots[4 - k]!;
        const right = slots[4 + k]!;
        expect(left.scale).toBe(right.scale);
        expect(left.rect.w).toBe(right.rect.w);
        expect(left.rect.y).toBe(right.rect.y);
        expect(Math.abs(mid(slots[4]!.rect) - mid(left.rect) - (mid(right.rect) - mid(slots[4]!.rect)))).toBeLessThanOrEqual(1);
      }
      for (const s of slots) {
        for (const v of [s.rect.x, s.rect.y, s.rect.w, s.rect.h]) expect(Number.isInteger(v)).toBe(true);
      }
    });
  }

  it('desktop: neighbours scale 0.8 / 0.62 and sit 24 / 48 px lower; only ±2 are visible', () => {
    const slots = carouselSlots(DESKTOP, 4, 9);
    const c = slots[4]!;
    const mid = (r: Rect): number => r.y + r.h / 2;
    expect(slots[5]!.scale).toBe(0.8);
    expect(slots[6]!.scale).toBe(0.62);
    expect(mid(slots[5]!.rect)).toBe(mid(c.rect) + 24);
    expect(mid(slots[6]!.rect)).toBe(mid(c.rect) + 48);
    expect(slots.map((s) => s.visible)).toEqual([false, false, true, true, true, true, true, false, false]);
    expect(slots[0]!.brightness).toBeLessThan(slots[3]!.brightness);
  });

  it('mobile: neighbours sit 16 / 32 px lower', () => {
    const slots = carouselSlots(MOBILE, 4, 9);
    const mid = (r: Rect): number => r.y + r.h / 2;
    expect(mid(slots[3]!.rect)).toBe(mid(slots[4]!.rect) + 16);
    expect(mid(slots[2]!.rect)).toBe(mid(slots[4]!.rect) + 32);
  });

  it('mobile: every visible card shows at least 44 px inside the area and the ±1 cards stay tappable beside the centre', () => {
    const slots = carouselSlots(MOBILE, 4, 9);
    const centre = slots[4]!.rect;
    for (const s of slots.filter((x) => x.visible)) {
      expect(overlapsW(s.rect, MOBILE), `slot ${s.index}`).toBeGreaterThanOrEqual(44);
    }
    for (const k of [3, 5]) {
      const r = slots[k]!.rect;
      const uncovered =
        r.x < centre.x
          ? centre.x - Math.max(r.x, MOBILE.x)
          : Math.min(r.x + r.w, MOBILE.x + MOBILE.w) - (centre.x + centre.w);
      expect(uncovered, `slot ${k}`).toBeGreaterThanOrEqual(44);
    }
  });

  it('does not invent kings at the ends: the first king has no left neighbours', () => {
    const slots = carouselSlots(DESKTOP, 0, 9);
    expect(slots).toHaveLength(9);
    expect(slots.filter((s) => s.visible).map((s) => s.index)).toEqual([0, 1, 2]);
    expect(slots[0]!.scale).toBe(1);
  });

  it('copes with zero and one king', () => {
    expect(carouselSlots(DESKTOP, 0, 0)).toEqual([]);
    const one = carouselSlots(DESKTOP, 0, 1);
    expect(one).toHaveLength(1);
    expect(one[0]!.visible).toBe(true);
  });
});
