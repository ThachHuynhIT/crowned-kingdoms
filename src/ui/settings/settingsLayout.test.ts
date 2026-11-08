import { describe, expect, it } from 'vitest';
import type { Rect } from '../hud/layout';
import { settingsLayout } from './settingsLayout';

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('settingsLayout', () => {
  for (const screen of [
    { w: 1280, h: 720 },
    { w: 375, h: 812 },
  ]) {
    it(`fits all controls without overlaps at ${screen.w}×${screen.h}`, () => {
      const l = settingsLayout(screen);
      const buttons = [
        ...l.rows.flatMap((r) => [r.minus, r.plus]),
        l.shake,
        l.discard,
        l.confirm,
        l.cancel,
        l.close,
      ];
      const rects = [
        ...buttons,
        l.title,
        l.message,
        ...l.rows.flatMap((r) => [r.label, r.value]),
      ];
      for (const b of buttons) {
        expect(b.w).toBeGreaterThanOrEqual(48);
        expect(b.h).toBeGreaterThanOrEqual(48);
      }
      for (const [i, r] of rects.entries()) {
        expect(r.x).toBeGreaterThanOrEqual(l.panel.x);
        expect(r.y).toBeGreaterThanOrEqual(l.panel.y);
        expect(r.x + r.w).toBeLessThanOrEqual(l.panel.x + l.panel.w);
        expect(r.y + r.h).toBeLessThanOrEqual(l.panel.y + l.panel.h);
        for (const other of rects.slice(i + 1)) expect(overlaps(r, other)).toBe(false);
      }
      for (const row of l.rows) {
        expect(row.minus).toMatchObject({ w: 48, h: 48 });
        expect(row.plus).toMatchObject({ w: 48, h: 48 });
      }
      expect(l.panel.x).toBeGreaterThanOrEqual(0);
      expect(l.panel.y).toBeGreaterThanOrEqual(0);
      expect(l.panel.x + l.panel.w).toBeLessThanOrEqual(screen.w);
      expect(l.panel.y + l.panel.h).toBeLessThanOrEqual(screen.h);
    });
  }
});
