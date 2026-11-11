import { describe, expect, it } from 'vitest';
import type { Rect } from '../hud/layout';
import { calendarStripLayout } from './calendarStripLayout';

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (r: Rect, outer: Rect): boolean =>
  r.x >= outer.x && r.y >= outer.y && r.x + r.w <= outer.x + outer.w && r.y + r.h <= outer.y + outer.h;

const DESKTOP_STRIP: Rect = { x: 994, y: 10, w: 276, h: 52 };
const PHONE_STRIP: Rect = { x: 10, y: 64, w: 295, h: 52 };

describe('calendarStripLayout', () => {
  for (const [name, rect] of [['desktop', DESKTOP_STRIP], ['phone', PHONE_STRIP]] as const) {
    it(`five cells in a row, each a touch target of at least 44×44, linked by short bars (${name})`, () => {
      const l = calendarStripLayout(rect, 5);
      expect(l.cells).toHaveLength(5);
      expect(l.links).toHaveLength(4);
      for (const c of l.cells) {
        expect(c.w).toBeGreaterThanOrEqual(44);
        expect(c.h).toBeGreaterThanOrEqual(44);
        expect(inside(c, rect)).toBe(true);
      }
      expect(new Set(l.cells.map((c) => c.y)).size).toBe(1);
      for (let i = 1; i < 5; i++) expect(l.cells[i]!.x).toBeGreaterThan(l.cells[i - 1]!.x + l.cells[i - 1]!.w - 1);
    });

    it(`links sit in the gaps and never cover a cell's tap area (${name})`, () => {
      const l = calendarStripLayout(rect, 5);
      for (const link of l.links) {
        for (const c of l.cells) expect(overlaps(link, c)).toBe(false);
        expect(inside(link, rect)).toBe(true);
      }
      l.links.forEach((link, i) => {
        expect(link.x).toBe(l.cells[i]!.x + l.cells[i]!.w);
        expect(link.x + link.w).toBe(l.cells[i + 1]!.x);
      });
    });
  }

  it('one cell is centred and has no links; none is empty', () => {
    const one = calendarStripLayout(DESKTOP_STRIP, 1);
    expect(one.cells).toHaveLength(1);
    expect(one.links).toEqual([]);
    expect(one.cells[0]!.x + one.cells[0]!.w / 2).toBeCloseTo(DESKTOP_STRIP.x + DESKTOP_STRIP.w / 2, 0);
    expect(calendarStripLayout(DESKTOP_STRIP, 0)).toEqual({ cells: [], links: [] });
  });

  it('a strip too narrow for five touch targets keeps them 44 wide instead of shrinking them', () => {
    const l = calendarStripLayout({ x: 0, y: 0, w: 150, h: 52 }, 5);
    for (const c of l.cells) expect(c.w).toBe(44);
  });

  it('uses whole pixels', () => {
    const l = calendarStripLayout({ x: 3, y: 7, w: 301, h: 55 }, 5);
    for (const r of [...l.cells, ...l.links]) for (const v of [r.x, r.y, r.w, r.h]) expect(Number.isInteger(v)).toBe(true);
  });
});
