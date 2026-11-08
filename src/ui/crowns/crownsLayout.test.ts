import { describe, expect, it } from 'vitest';
import { TOUCH_TARGET, type Rect } from '../hud/layout';
import { CROWNS, crownsLayout, type CrownsLayout, type CrownsRow } from './crownsLayout';

const DESKTOP = { w: 1280, h: 720 };
const PHONE = { w: 375, h: 812 };
/** Panel border (2× / 1×) + 16 px padding, as the scene passes it. */
const DESKTOP_INSET = 28;
const PHONE_INSET = 22;

const inside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
const overlap = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const rows = (l: CrownsLayout): CrownsRow[] => [...l.kings, ...l.cards];

const checkRows = (l: CrownsLayout, screenW: number) => {
  const all = rows(l);
  all.forEach((r, i) => {
    expect(r.row.x, `row ${i} on screen`).toBeGreaterThanOrEqual(0);
    expect(r.row.x + r.row.w, `row ${i} on screen`).toBeLessThanOrEqual(screenW);
    for (const part of [r.chip, r.name, r.status, r.button, ...(r.bar ? [r.bar] : []), ...(r.mastery ? [r.mastery] : [])]) {
      expect(inside(part, r.row), `row ${i} part inside the row`).toBe(true);
    }
    expect(r.button.w).toBeGreaterThanOrEqual(TOUCH_TARGET);
    expect(r.button.h).toBeGreaterThanOrEqual(TOUCH_TARGET);
    expect(overlap(r.button, r.name) || overlap(r.button, r.status) || overlap(r.button, r.chip)).toBe(false);
    if (r.bar) expect(overlap(r.button, r.bar)).toBe(false);
    for (let j = i + 1; j < all.length; j++) expect(overlap(r.row, all[j]!.row), `rows ${i}/${j} apart`).toBe(false);
  });
  expect(l.kings).toHaveLength(9);
  expect(l.cards).toHaveLength(2);
  expect(l.kings.every((k) => k.bar !== null && k.mastery !== null)).toBe(true);
  expect(l.cards.every((c) => c.bar === null && c.mastery === null)).toBe(true);
};

describe('crownsLayout', () => {
  it('desktop 1280×720: one panel, kings on the left, cards and the best thorn on the right, nothing scrolls', () => {
    const l = crownsLayout(DESKTOP, DESKTOP_INSET);
    expect(l.mode).toBe('panel');
    expect(l.maxScroll).toBe(0);
    expect(inside(l.panel, { x: 0, y: 0, ...DESKTOP })).toBe(true);
    checkRows(l, DESKTOP.w);
    for (const r of rows(l)) expect(inside(r.row, l.panel)).toBe(true);
    for (const r of [l.title, l.balance, l.close, l.kingsTitle, l.cardsTitle, l.highest]) expect(inside(r, l.panel)).toBe(true);
    expect(l.cards[0]!.row.x).toBeGreaterThan(l.kings[0]!.row.x + l.kings[0]!.row.w);
    expect(l.close).toMatchObject({ w: CROWNS.close, h: CROWNS.close });
    expect(overlap(l.close, l.title) || overlap(l.close, l.balance)).toBe(false);
    expect(l.highest.y).toBeGreaterThanOrEqual(l.cards[1]!.row.y + l.cards[1]!.row.h);
  });

  it('phone 375×812: one column under a pinned header with a 48×48 ✕, scrolled to reach the end', () => {
    const l = crownsLayout(PHONE, PHONE_INSET);
    expect(l.mode).toBe('scroll');
    checkRows(l, PHONE.w);
    expect(l.close).toEqual({ x: PHONE.w - 8 - 48, y: 8, w: 48, h: 48 });
    expect(inside(l.close, l.header)).toBe(true);
    expect(l.header).toMatchObject({ x: 0, y: 0, w: PHONE.w });
    expect(l.contentTop).toBeGreaterThanOrEqual(l.header.y + l.header.h);
    expect(l.kingsTitle.y).toBeGreaterThanOrEqual(l.contentTop);
    // One column: every row the same x and width.
    expect(new Set(rows(l).map((r) => `${r.row.x}/${r.row.w}`)).size).toBe(1);
    // The end of the content comes up to the bottom of the screen, no further.
    expect(l.maxScroll).toBeGreaterThan(0);
    expect(l.highest.y + l.highest.h + CROWNS.bottomPad - l.maxScroll).toBe(PHONE.h);
  });

  it('a short landscape screen (812×375) falls back to the scrolling column', () => {
    const l = crownsLayout({ w: 812, h: 375 }, DESKTOP_INSET);
    expect(l.mode).toBe('scroll');
    checkRows(l, 812);
  });
});
