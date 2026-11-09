import { describe, expect, it } from 'vitest';
import type { Rect } from '../hud/layout';
import { fitName, savesLayout } from './savesLayout';

const DESKTOP = { w: 1280, h: 720 };
const MOBILE = { w: 375, h: 812 };
const inside = (a: Rect, b: Rect): boolean => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
const overlap = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('saves screen layout (2026-11-09)', () => {
  for (const [label, screen] of [['desktop', DESKTOP], ['mobile', MOBILE]] as const) {
    it(`${label}: the autosave and ten slots fit, on screen, with 44 px targets that never overlap`, () => {
      const l = savesLayout(screen, 11);
      expect(l.rows).toHaveLength(11);
      expect(inside(l.panel, { x: 0, y: 0, ...screen })).toBe(true);
      const targets = [l.back, l.prev, l.next, ...l.rows.flatMap((r) => [r.open, r.rename, r.remove])];
      for (const t of targets) {
        expect(t.w).toBeGreaterThanOrEqual(44);
        expect(t.h).toBeGreaterThanOrEqual(44);
        expect(inside(t, l.panel)).toBe(true);
      }
      for (let i = 0; i < targets.length; i++)
        for (let j = i + 1; j < targets.length; j++) expect(overlap(targets[i]!, targets[j]!)).toBe(false);
      for (const r of l.rows) {
        expect(r.text.w).toBeGreaterThan(100);
        expect(overlap(r.text, r.open)).toBe(false);
      }
    });
  }

  it('a short screen (phone in landscape) shows fewer rows per page; the rest are on later pages', () => {
    const l = savesLayout({ w: 812, h: 375 }, 11);
    expect(l.rows.length).toBeLessThan(11);
    expect(l.perPage).toBe(l.rows.length);
    expect(l.perPage).toBeGreaterThan(0);
    expect(inside(l.panel, { x: 0, y: 0, w: 812, h: 375 })).toBe(true);
  });

  it('shortens a long name with an ellipsis', () => {
    expect(fitName('Ván ngắn', 18)).toBe('Ván ngắn');
    expect(fitName('Một cái tên rất là dài dòng', 10)).toBe('Một cái t…');
  });
});
