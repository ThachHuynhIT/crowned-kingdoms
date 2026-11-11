import { MARGIN, type Rect, type Size } from '../hud/layout';
import { CLOSE_BUTTON, centredPanel } from '../modals/modalLayout';
import { isDesktop } from '../realm/realmLayout';

/**
 * Pure layout of the king detail screen (after choosing a king): title and back on top, the
 * king's nine cards, the big king card, the action row (Đặc quyền · Độ khó ‹ › · Chơi), the
 * seed row and the run-mode row. Desktop (width ≥ 768) puts the cards left of the king card and
 * centres the whole block under the title, both ways (owner 2026-11-10): big 116×180 cards in
 * rows of 5 + 4, or 3 × 3 where 5 columns do not fit, or the small 84×132 cards on short
 * screens. Phones stack the small king card, a 3×3 grid, the seed row and the actions.
 * Rects are logical screen px; no button is ever shrunk below 44×44.
 */
export interface KingDetailLayout {
  desktop: boolean;
  title: Rect;
  back: Rect;
  /** The nine cards of the king, row by row. */
  cards: readonly Rect[];
  /** The king card (66×96 art px at scale 4 on desktop, 2 on phones). */
  portrait: Rect;
  perks: Rect;
  /** Name of the chosen perk: just above the perks button on desktop, beside the king card on phones. */
  perkName: Rect;
  /** The label between the two difficulty arrows. */
  difficulty: Rect;
  previous: Rect;
  next: Rect;
  play: Rect;
  seed: Rect;
  reroll: Rect;
  /** The run-mode toggle: "30 năm" then "Vô tận" (spec 2026-11-09 §2). */
  modes: readonly Rect[];
  /** Why Vô tận is locked: right of the toggle on desktop, under it on phones. */
  modeNote: Rect;
}

interface GridSpec {
  w: number;
  h: number;
  gap: number;
  cols: number;
}

/** Desktop card grids, first one that fits the screen wins. */
const DESKTOP_GRIDS: readonly GridSpec[] = [
  { w: 116, h: 180, gap: 10, cols: 5 },
  { w: 116, h: 180, gap: 10, cols: 3 },
  { w: 84, h: 132, gap: 8, cols: 3 },
];
const CARD_PHONE = { w: 72, h: 112, gap: 6, cols: 3 } as const;
/** Native size of the king card art (see `KING_CARD_NATIVE`), times the screen scale. */
const KING_CARD = { w: 66, h: 96 } as const;
const CARD_COUNT = 9;
const MODE_BUTTON = { w: 120, h: 44 } as const;
const MODE_GAP = 8;
const MODE_NOTE_W = 300;
/** Bottom of the title row on desktop; the block is centred in the room below it. */
const DESK_TITLE_BOTTOM = 64;
const PORTRAIT_GAP = 48;
/** Grid/king card → footer (24, the perk caption sits in it) → seed row → mode row. */
const DESK_BELOW = 24 + 56 + 12 + 44 + 12 + 44;
/** The action row needs Đặc quyền · ‹ Độ khó › (388 px), a gap and Chơi (168 px). */
const FOOTER_MIN_W = 388 + 8 + 168;

const gridSize = (g: GridSpec): { w: number; h: number } => {
  const rows = Math.ceil(CARD_COUNT / g.cols);
  return { w: g.cols * g.w + (g.cols - 1) * g.gap, h: rows * g.h + (rows - 1) * g.gap };
};

/** Cards row by row; a short last row is centred under the full ones. */
const gridCards = (x: number, y: number, g: GridSpec): Rect[] => {
  const full = gridSize(g).w;
  return Array.from({ length: CARD_COUNT }, (_, i) => {
    const row = Math.floor(i / g.cols);
    const inRow = Math.min(g.cols, CARD_COUNT - row * g.cols);
    const rowW = inRow * g.w + (inRow - 1) * g.gap;
    return {
      x: x + Math.round((full - rowW) / 2) + (i % g.cols) * (g.w + g.gap),
      y: y + row * (g.h + g.gap),
      w: g.w,
      h: g.h,
    };
  });
};

/** Card grid of the short landscape layout (3 columns of the nine kings). */
const CARD_SHORT = { w: 56, h: 86, gap: 6, cols: 3 } as const;

/**
 * Short landscape screens (night 12/11/2026: on 844×390 and 667×375 "Chơi" was below the screen, so no run could
 * start): the king card and the grid on the left, then a column on the right with the modes, the seed, the perk and
 * difficulty row and Chơi at the bottom.
 */
const shortLandscapeLayout = (screen: Size, margin: number): KingDetailLayout => {
  const { w, h } = screen;
  const back = { x: margin, y: margin, w: 96, h: 44 };
  const title = { x: back.x + back.w + margin, y: margin, w: Math.max(0, w - 2 * (back.x + back.w + margin)), h: 44 };
  const top = back.y + back.h + 8;
  const bottom = h - margin;
  const grid = gridSize(CARD_SHORT);
  const portraitW = KING_CARD.w * 2;
  const portraitH = KING_CARD.h * 2;
  const portrait = { x: margin, y: top + Math.max(0, Math.round((bottom - top - portraitH) / 2)), w: portraitW, h: portraitH };
  const gridX = portrait.x + portraitW + 12;
  const gridY = top + Math.max(0, Math.round((bottom - top - grid.h) / 2));
  const colX = gridX + grid.w + 16;
  const colW = w - margin - colX;
  const modeW = Math.min(MODE_BUTTON.w, Math.floor((colW - MODE_GAP) / 2));
  const play = { x: colX, y: bottom - 56, w: colW, h: 56 };
  const rowY = play.y - 8 - 48;
  const seedY = rowY - 22 - 8 - 44;
  const modeY = top;
  const nextX = colX + colW - 44;
  // "ĐẶC QUYỀN" needs 140 px to clear the frame when the column has room.
  const perksW = colW >= 420 ? 140 : 100;
  return {
    desktop: false,
    title,
    back,
    cards: gridCards(gridX, gridY, CARD_SHORT),
    portrait,
    perks: { x: colX, y: rowY, w: perksW, h: 48 },
    perkName: { x: colX, y: rowY - 22, w: colW, h: 20 },
    previous: { x: colX + perksW + 8, y: rowY, w: 44, h: 48 },
    difficulty: { x: colX + perksW + 52, y: rowY, w: Math.max(44, nextX - (colX + perksW + 52)), h: 48 },
    next: { x: nextX, y: rowY, w: 44, h: 48 },
    play,
    seed: { x: colX, y: seedY, w: colW - 8 - 120, h: 44 },
    reroll: { x: colX + colW - 120, y: seedY, w: 120, h: 44 },
    modes: [
      { x: colX, y: modeY, w: modeW, h: MODE_BUTTON.h },
      { x: colX + modeW + MODE_GAP, y: modeY, w: modeW, h: MODE_BUTTON.h },
    ],
    modeNote: { x: colX, y: modeY + MODE_BUTTON.h + 4, w: colW, h: Math.max(20, seedY - 4 - (modeY + MODE_BUTTON.h + 4)) },
  };
};

export const detailLayout = (screen: Size, inset: number): KingDetailLayout => {
  const { w } = screen;
  const margin = Math.max(MARGIN, inset);
  // Landscape and too short for the desktop block (grid, footer, seed and mode rows) or the tall phone column.
  if (w > screen.h && w >= 640 && screen.h < 560) return shortLandscapeLayout(screen, margin);
  const desktop = isDesktop(w);

  if (desktop) {
    const portraitW = KING_CARD.w * 4;
    const portraitH = KING_CARD.h * 4;
    const room = screen.h - DESK_TITLE_BOTTOM - margin;
    const blockOf = (g: GridSpec): { g: GridSpec; w: number; h: number; gridW: number; gridH: number } => {
      const size = gridSize(g);
      const totalW = Math.max(size.w + PORTRAIT_GAP + portraitW, FOOTER_MIN_W);
      return { g, w: totalW, h: Math.max(size.h, portraitH) + DESK_BELOW, gridW: size.w, gridH: size.h };
    };
    const options = DESKTOP_GRIDS.map(blockOf);
    const block = options.find((b) => b.w <= w - 2 * margin && b.h <= room) ?? options[options.length - 1]!;
    const { gridW, gridH } = block;
    const upperH = Math.max(gridH, portraitH);
    const totalW = block.w;
    const x0 = Math.round((w - totalW) / 2);
    const top = DESK_TITLE_BOTTOM + Math.max(0, Math.floor((room + margin - block.h) / 2));
    const gridY = top + Math.round((upperH - gridH) / 2);
    const footerY = top + upperH + 24;
    const seedY = footerY + 56 + 12;
    const seedRowW = 300 + 8 + 120;
    const seedX = Math.round((w - seedRowW) / 2);
    const back = { x: margin, y: margin, w: 120, h: 48 };
    const modeY = seedY + 44 + 12;
    const modeRowW = 2 * MODE_BUTTON.w + MODE_GAP + 12 + MODE_NOTE_W;
    const modeX = Math.round((w - modeRowW) / 2);
    return {
      desktop,
      title: { x: back.x + back.w + margin, y: 20, w: Math.max(0, w - 2 * (back.x + back.w + margin)), h: 44 },
      back,
      cards: gridCards(x0, gridY, block.g),
      portrait: { x: x0 + gridW + PORTRAIT_GAP, y: top + Math.round((upperH - portraitH) / 2), w: portraitW, h: portraitH },
      perks: { x: x0, y: footerY, w: 140, h: 56 },
      perkName: { x: x0, y: footerY - 22, w: 388, h: 20 },
      previous: { x: x0 + 148, y: footerY, w: 44, h: 56 },
      difficulty: { x: x0 + 192, y: footerY, w: 152, h: 56 },
      next: { x: x0 + 344, y: footerY, w: 44, h: 56 },
      play: { x: x0 + totalW - 168, y: footerY, w: 168, h: 56 },
      seed: { x: seedX, y: seedY, w: 300, h: 44 },
      reroll: { x: seedX + 308, y: seedY, w: 120, h: 44 },
      modes: [
        { x: modeX, y: modeY, w: MODE_BUTTON.w, h: MODE_BUTTON.h },
        { x: modeX + MODE_BUTTON.w + MODE_GAP, y: modeY, w: MODE_BUTTON.w, h: MODE_BUTTON.h },
      ],
      modeNote: { x: modeX + 2 * MODE_BUTTON.w + MODE_GAP + 12, y: modeY, w: MODE_NOTE_W, h: MODE_BUTTON.h },
    };
  }

  const { w: gridW, h: gridH } = gridSize(CARD_PHONE);
  const portraitW = KING_CARD.w * 2;
  const portraitH = KING_CARD.h * 2;
  const portraitY = 64;
  const gridY = portraitY + portraitH + 8;
  const seedY = gridY + gridH + 8;
  const rowY = seedY + 44 + 8;
  const playY = rowY + 48 + 8;
  const rowW = w - 2 * margin;
  const back = { x: margin, y: margin, w: 96, h: 48 };
  const nextX = margin + rowW - 44;
  // Phones: the toggle stacks in the column left of the king card, the locked reason under it.
  const portraitX = Math.round((w - portraitW) / 2);
  const modeW = Math.min(MODE_BUTTON.w, portraitX - 8 - margin);
  const noteY = portraitY + 2 * (MODE_BUTTON.h + MODE_GAP);
  return {
    desktop,
    title: { x: back.x + back.w + margin, y: 14, w: Math.max(0, w - 2 * (back.x + back.w + margin)), h: 40 },
    back,
    cards: gridCards(Math.round((w - gridW) / 2), gridY, CARD_PHONE),
    portrait: { x: Math.round((w - portraitW) / 2), y: portraitY, w: portraitW, h: portraitH },
    perks: { x: margin, y: rowY, w: 100, h: 48 },
    perkName: {
      x: Math.round((w - portraitW) / 2) + portraitW + 8,
      y: portraitY + portraitH - 44,
      w: w - margin - (Math.round((w - portraitW) / 2) + portraitW + 8),
      h: 44,
    },
    previous: { x: margin + 108, y: rowY, w: 44, h: 48 },
    difficulty: { x: margin + 152, y: rowY, w: nextX - (margin + 152), h: 48 },
    next: { x: nextX, y: rowY, w: 44, h: 48 },
    play: { x: margin, y: playY, w: rowW, h: 56 },
    seed: { x: margin, y: seedY, w: rowW - 8 - 120, h: 44 },
    reroll: { x: margin + rowW - 120, y: seedY, w: 120, h: 44 },
    modes: [
      { x: margin, y: portraitY, w: modeW, h: MODE_BUTTON.h },
      { x: margin, y: portraitY + MODE_BUTTON.h + MODE_GAP, w: modeW, h: MODE_BUTTON.h },
    ],
    modeNote: { x: margin, y: noteY, w: modeW, h: portraitY + portraitH - noteY },
  };
};

/** The perk dialog: a centred panel, its title, the ✕ button (48×48) and one row per perk. */
export interface PerkDialogLayout {
  panel: Rect;
  title: Rect;
  close: Rect;
  rows: readonly Rect[];
}

const PERK_ROWS = 3;
const ROW_GAP = 8;

/** `inset` is the panel border plus padding (screen px). Phones get taller rows for wrapped text. */
export const perkDialogLayout = (screen: Size, inset: number): PerkDialogLayout => {
  const desktop = isDesktop(screen.w);
  // Short screens (night 12/11/2026: the rows ran off a 375 px landscape phone): rows close up, never under 60 px.
  const fit = Math.floor(
    (screen.h - 2 * MARGIN - 2 * inset - CLOSE_BUTTON - ROW_GAP - (PERK_ROWS - 1) * ROW_GAP) / PERK_ROWS,
  );
  const rowH = Math.max(60, Math.min(desktop ? 80 : 100, fit));
  const wide = desktop || (screen.w > screen.h && screen.w >= 640);
  const width = wide ? Math.min(560, screen.w - 2 * MARGIN) : screen.w - 2 * MARGIN;
  const height = 2 * inset + CLOSE_BUTTON + ROW_GAP + PERK_ROWS * rowH + (PERK_ROWS - 1) * ROW_GAP;
  const panel = centredPanel(screen, width, height);
  const innerX = panel.x + inset;
  const innerW = panel.w - 2 * inset;
  const close = { x: innerX + innerW - CLOSE_BUTTON, y: panel.y + inset, w: CLOSE_BUTTON, h: CLOSE_BUTTON };
  const title = { x: innerX, y: panel.y + inset, w: Math.max(0, innerW - CLOSE_BUTTON - ROW_GAP), h: CLOSE_BUTTON };
  const top = close.y + CLOSE_BUTTON + ROW_GAP;
  const rows = Array.from({ length: PERK_ROWS }, (_, i) => ({ x: innerX, y: top + i * (rowH + ROW_GAP), w: innerW, h: rowH }));
  return { panel, title, close, rows };
};
