import { describe, expect, it } from 'vitest';
import { dropdownLayout } from './dropdownLayout';
import type { Rect } from './hud/layout';

const inside = (r: Rect, o: Rect): boolean => r.x >= o.x && r.y >= o.y && r.x + r.w <= o.x + o.w && r.y + r.h <= o.y + o.h;
const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('dropdownLayout', () => {
  for (const screen of [
    { w: 1280, h: 720 },
    { w: 844, h: 390 },
    { w: 667, h: 375 },
    { w: 375, h: 812 },
  ]) {
    it(`keeps 11 choices of at least 44 px on a ${screen.w}×${screen.h} screen, without overlaps`, () => {
      const anchor = { x: 40, y: 100, w: 140, h: 44 };
      const l = dropdownLayout(anchor, 11, screen);
      expect(l.cells).toHaveLength(11);
      expect(inside(l.panel, { x: 0, y: 0, w: screen.w, h: screen.h })).toBe(true);
      for (const [i, c] of l.cells.entries()) {
        expect(c.h).toBeGreaterThanOrEqual(44);
        expect(c.w).toBeGreaterThanOrEqual(44);
        expect(inside(c, l.panel)).toBe(true);
        for (const d of l.cells.slice(i + 1)) expect(overlaps(c, d)).toBe(false);
      }
    });
  }
  it('opens below its button in a single column when there is room', () => {
    const l = dropdownLayout({ x: 100, y: 50, w: 140, h: 44 }, 4, { w: 1280, h: 720 });
    expect(l.panel.y).toBeGreaterThanOrEqual(94);
    expect(new Set(l.cells.map((c) => c.x)).size).toBe(1);
  });
});
