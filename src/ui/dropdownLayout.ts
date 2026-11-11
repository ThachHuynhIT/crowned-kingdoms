import type { Rect, Size } from './hud/layout';

/**
 * Where a dropdown's choices go (night 12/11/2026): a grid of `count` cells of at least 44×44 px, opening below the
 * button that owns it (above when there is more room there), as many columns as the screen height needs, kept on
 * screen with an 8 px margin. Pure.
 */
export const DROPDOWN_CELL_H = 44;
const GAP = 4;
const PAD = 8;
const MARGIN = 8;

export interface DropdownLayout {
  panel: Rect;
  cells: Rect[];
}

export const dropdownLayout = (anchor: Rect, count: number, screen: Size, cellW = Math.max(120, anchor.w)): DropdownLayout => {
  const below = screen.h - (anchor.y + anchor.h) - MARGIN;
  const above = anchor.y - MARGIN;
  const room = Math.max(below, above);
  const fitRows = Math.max(1, Math.floor((room - 2 * PAD + GAP) / (DROPDOWN_CELL_H + GAP)));
  const cols = Math.max(1, Math.ceil(count / fitRows));
  const rows = Math.ceil(count / cols);
  const w = cols * cellW + (cols - 1) * GAP + 2 * PAD;
  const h = rows * DROPDOWN_CELL_H + (rows - 1) * GAP + 2 * PAD;
  const y = below >= h || below >= above ? anchor.y + anchor.h + 4 : anchor.y - 4 - h;
  const x = Math.min(Math.max(MARGIN, anchor.x), screen.w - MARGIN - w);
  const panel = { x, y: Math.min(Math.max(MARGIN, y), screen.h - MARGIN - h), w, h };
  const cells = Array.from({ length: count }, (_, i) => ({
    x: panel.x + PAD + Math.floor(i / rows) * (cellW + GAP),
    y: panel.y + PAD + (i % rows) * (DROPDOWN_CELL_H + GAP),
    w: cellW,
    h: DROPDOWN_CELL_H,
  }));
  return { panel, cells };
};
