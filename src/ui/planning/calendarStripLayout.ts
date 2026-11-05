import type { Rect } from '../hud/layout';

/**
 * Pure layout of the calendar strip of the planning HUD: `count` year cells in one row, each a
 * touch target of at least 44×44, joined by short bars that sit in the gaps and never cover a
 * cell's tap area. Cells keep 44 px even if the strip is too narrow (they then spill to the right);
 * they never shrink below it. Whole pixels. The calendar itself (which years, who attacks)
 * comes from the calendar model; this only places them.
 */
export interface CalendarStripLayout {
  cells: readonly Rect[];
  /** The bar between cell i and i + 1 (`count - 1` of them). */
  links: readonly Rect[];
}

const MIN_CELL = 44;
const MIN_GAP = 4;
const LINK_H = 4;

export const calendarStripLayout = (rect: Rect, count: number): CalendarStripLayout => {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return { cells: [], links: [] };
  const size = Math.max(MIN_CELL, Math.min(rect.h, Math.floor((rect.w - (n - 1) * MIN_GAP) / n)));
  const gap = n > 1 ? Math.max(MIN_GAP, Math.floor((rect.w - n * size) / (n - 1))) : 0;
  const total = n * size + (n - 1) * gap;
  const x0 = rect.x + Math.floor((rect.w - total) / 2);
  const y = rect.y + Math.floor((rect.h - size) / 2);
  const cells = Array.from({ length: n }, (_, i) => ({ x: x0 + i * (size + gap), y, w: size, h: size }));
  const linkY = y + Math.floor((size - LINK_H) / 2);
  const links = cells.slice(0, -1).map((c) => ({ x: c.x + c.w, y: linkY, w: gap, h: LINK_H }));
  return { cells, links };
};
