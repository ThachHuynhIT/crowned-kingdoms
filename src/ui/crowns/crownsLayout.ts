import type { Rect, Size } from '../hud/layout';

/** Sizes of the Crowns screen (§10.9), logical px. */
export const CROWNS = {
  close: 48,
  /** Portrait crop shown at scale 1 at the left of a king row. */
  chip: { w: 56, h: 48 },
  rowPad: 6,
  rowGap: 4,
  sectionH: 28,
  sectionGap: 14,
  highestH: 28,
  bottomPad: 16,
  /** Desktop panel: widest panel, header height inside the inset, row height, column gap. */
  panel: { maxW: 1040, headerH: 56, rowH: 54, colGap: 24, button: { w: 124, h: 44 } },
  /** Scrolling column (phones, short screens): pinned header, column width, row heights. */
  scroll: { headerH: 64, maxColW: 560, kingRowH: 86, cardRowH: 60, button: { w: 96, h: 44 } },
} as const;

export interface CrownsRow {
  row: Rect;
  chip: Rect;
  name: Rect;
  status: Rect;
  /** Mastery bar and its label (king rows only). */
  bar: Rect | null;
  mastery: Rect | null;
  button: Rect;
}

export interface CrownsLayout {
  /** 'panel': everything fits in one centred panel. 'scroll': a column scrolled under a pinned header. */
  mode: 'panel' | 'scroll';
  /** The panel (panel mode) or the whole screen (scroll mode). */
  panel: Rect;
  /** Pinned area holding title, balance and ✕ (never scrolls). */
  header: Rect;
  title: Rect;
  balance: Rect;
  close: Rect;
  /** Scrolling content starts below this y (scroll mode); positions below are at scroll 0. */
  contentTop: number;
  kingsTitle: Rect;
  kings: CrownsRow[];
  cardsTitle: Rect;
  cards: CrownsRow[];
  highest: Rect;
  /** How far the content can scroll up (0 when it fits). */
  maxScroll: number;
}

/**
 * One shop row. Wide (desktop): name and price on the first line, mastery bar and its label on
 * the second, button on the right. Narrow (phones): name, price, mastery label, bar stacked.
 */
const rowParts = (row: Rect, wide: boolean, king: boolean, button: { w: number; h: number }): CrownsRow => {
  const pad = CROWNS.rowPad;
  const chip = { x: row.x + pad, y: Math.round(row.y + (row.h - CROWNS.chip.h) / 2), ...CROWNS.chip };
  const btn = { x: row.x + row.w - pad - button.w, y: Math.round(row.y + (row.h - button.h) / 2), ...button };
  const x0 = chip.x + chip.w + 8;
  const textW = btn.x - 8 - x0;
  if (wide) {
    const half = Math.floor(textW / 2);
    const name = { x: x0, y: row.y + 6, w: textW - half, h: 20 };
    const status = { x: x0 + textW - half, y: row.y + 6, w: half, h: 20 };
    const barW = Math.min(160, half);
    const bar = king ? { x: x0, y: row.y + row.h - 10 - 10, w: barW, h: 10 } : null;
    const mastery = king ? { x: x0 + barW + 8, y: row.y + row.h - 26, w: textW - barW - 8, h: 20 } : null;
    return { row, chip, name, status, bar, mastery, button: btn };
  }
  const name = { x: x0, y: row.y + 6, w: textW, h: 20 };
  const status = { x: x0, y: row.y + 28, w: textW, h: 18 };
  const mastery = king ? { x: x0, y: row.y + 48, w: textW, h: 16 } : null;
  const bar = king ? { x: x0, y: row.y + 68, w: textW, h: 10 } : null;
  return { row, chip, name, status, bar, mastery, button: btn };
};

const stack = (x: number, y: number, w: number, h: number, n: number): Rect[] =>
  Array.from({ length: n }, (_, i) => ({ x, y: y + i * (h + CROWNS.rowGap), w, h }));

const stackH = (h: number, n: number): number => n * h + Math.max(0, n - 1) * CROWNS.rowGap;

/** Panel mode, or null when the panel would not fit the screen (narrow or short). */
const panelLayout = (screen: Size, inset: number, kingCount: number, cardCount: number): CrownsLayout | null => {
  const P = CROWNS.panel;
  if (screen.w < 768) return null;
  const w = Math.min(P.maxW, screen.w - 32);
  const h = 2 * inset + P.headerH + CROWNS.sectionH + stackH(P.rowH, kingCount);
  if (h > screen.h - 16) return null;
  const panel = { x: Math.round((screen.w - w) / 2), y: Math.round((screen.h - h) / 2), w, h };
  const innerX = panel.x + inset;
  const innerW = panel.w - 2 * inset;
  const top = panel.y + inset;
  const close = { x: innerX + innerW - CROWNS.close, y: top, w: CROWNS.close, h: CROWNS.close };
  const textW = innerW - CROWNS.close - 8;
  const leftW = Math.round((innerW - P.colGap) * 0.58);
  const rightX = innerX + leftW + P.colGap;
  const rightW = innerW - leftW - P.colGap;
  const y0 = top + P.headerH;
  const kingsTitle = { x: innerX, y: y0, w: leftW, h: CROWNS.sectionH };
  const cardsTitle = { x: rightX, y: y0, w: rightW, h: CROWNS.sectionH };
  const kings = stack(innerX, y0 + CROWNS.sectionH, leftW, P.rowH, kingCount).map((r) => rowParts(r, true, true, P.button));
  const cards = stack(rightX, y0 + CROWNS.sectionH, rightW, P.rowH, cardCount).map((r) => rowParts(r, true, false, P.button));
  const highest = { x: rightX, y: y0 + CROWNS.sectionH + stackH(P.rowH, cardCount) + CROWNS.sectionGap, w: rightW, h: CROWNS.highestH };
  return {
    mode: 'panel',
    panel,
    header: { x: panel.x, y: panel.y, w: panel.w, h: inset + P.headerH },
    title: { x: innerX, y: top, w: textW, h: 30 },
    balance: { x: innerX, y: top + 30, w: textW, h: 20 },
    close,
    contentTop: y0,
    kingsTitle,
    kings,
    cardsTitle,
    cards,
    highest,
    maxScroll: 0,
  };
};

const scrollLayout = (screen: Size, kingCount: number, cardCount: number): CrownsLayout => {
  const S = CROWNS.scroll;
  const header = { x: 0, y: 0, w: screen.w, h: S.headerH };
  const close = { x: screen.w - 8 - CROWNS.close, y: 8, w: CROWNS.close, h: CROWNS.close };
  const colW = Math.min(S.maxColW, screen.w - 32);
  const x = Math.round((screen.w - colW) / 2);
  const textX = Math.min(x, 16);
  const textW = close.x - 8 - textX;
  const contentTop = header.h + 8;
  const kingsTitle = { x, y: contentTop, w: colW, h: CROWNS.sectionH };
  const kingsY = kingsTitle.y + CROWNS.sectionH;
  const kings = stack(x, kingsY, colW, S.kingRowH, kingCount).map((r) => rowParts(r, false, true, S.button));
  const cardsTitle = { x, y: kingsY + stackH(S.kingRowH, kingCount) + CROWNS.sectionGap, w: colW, h: CROWNS.sectionH };
  const cardsY = cardsTitle.y + CROWNS.sectionH;
  const cards = stack(x, cardsY, colW, S.cardRowH, cardCount).map((r) => rowParts(r, false, false, S.button));
  const highest = { x, y: cardsY + stackH(S.cardRowH, cardCount) + CROWNS.sectionGap, w: colW, h: CROWNS.highestH };
  const bottom = highest.y + highest.h + CROWNS.bottomPad;
  return {
    mode: 'scroll',
    panel: { x: 0, y: 0, w: screen.w, h: screen.h },
    header,
    title: { x: textX, y: 8, w: textW, h: 28 },
    balance: { x: textX, y: 36, w: textW, h: 20 },
    close,
    contentTop,
    kingsTitle,
    kings,
    cardsTitle,
    cards,
    highest,
    maxScroll: Math.max(0, bottom - screen.h),
  };
};

/**
 * The Crowns screen: one centred panel when it fits (desktop, `width ≥ 768`), else a single
 * column that scrolls under a pinned header with the 48×48 ✕. `inset` = panel border + padding.
 */
export const crownsLayout = (screen: Size, inset: number, kingCount = 9, cardCount = 2): CrownsLayout =>
  panelLayout(screen, inset, kingCount, cardCount) ?? scrollLayout(screen, kingCount, cardCount);

/** Scroll offset kept in 0..max and on whole pixels. */
export const clampScroll = (scroll: number, max: number): number => Math.round(Math.max(0, Math.min(max, scroll)));
