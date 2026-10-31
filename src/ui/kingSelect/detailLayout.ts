import { MARGIN, type Rect, type Size } from '../hud/layout';
import { isDesktop } from '../realm/realmLayout';

/**
 * Pure layout of the king detail screen (after choosing a king): title and back on top, the
 * king's nine cards in a 3×3 grid, the big king card, the action row (Đặc quyền · Độ khó ‹ ›
 * · Chơi) and the seed row. Desktop (width ≥ 768) puts the grid left of the king card and needs
 * about 650 px of height; phones stack the small king card, grid, seed row and the actions.
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
  /** The label between the two difficulty arrows. */
  difficulty: Rect;
  previous: Rect;
  next: Rect;
  play: Rect;
  seed: Rect;
  reroll: Rect;
}

const CARD_DESKTOP = { w: 84, h: 132, gap: 8 } as const;
const CARD_PHONE = { w: 72, h: 112, gap: 6 } as const;
/** Native size of the king card art (see `KING_CARD_NATIVE`), times the screen scale. */
const KING_CARD = { w: 66, h: 96 } as const;
const GRID = 3;

const gridCards = (x: number, y: number, c: { w: number; h: number; gap: number }): Rect[] =>
  Array.from({ length: GRID * GRID }, (_, i) => ({
    x: x + (i % GRID) * (c.w + c.gap),
    y: y + Math.floor(i / GRID) * (c.h + c.gap),
    w: c.w,
    h: c.h,
  }));

export const detailLayout = (screen: Size, inset: number): KingDetailLayout => {
  const { w } = screen;
  const margin = Math.max(MARGIN, inset);
  const desktop = isDesktop(w);

  if (desktop) {
    const gridW = GRID * CARD_DESKTOP.w + (GRID - 1) * CARD_DESKTOP.gap;
    const gridH = GRID * CARD_DESKTOP.h + (GRID - 1) * CARD_DESKTOP.gap;
    const portraitW = KING_CARD.w * 4;
    const portraitH = KING_CARD.h * 4;
    const totalW = gridW + 48 + portraitW;
    const x0 = Math.round((w - totalW) / 2);
    const top = 86;
    const footerY = top + gridH + 24;
    const seedY = footerY + 56 + 12;
    const seedRowW = 300 + 8 + 120;
    const seedX = Math.round((w - seedRowW) / 2);
    const back = { x: margin, y: margin, w: 120, h: 48 };
    return {
      desktop,
      title: { x: back.x + back.w + margin, y: 20, w: Math.max(0, w - 2 * (back.x + back.w + margin)), h: 44 },
      back,
      cards: gridCards(x0, top, CARD_DESKTOP),
      portrait: { x: x0 + gridW + 48, y: top + Math.round((gridH - portraitH) / 2), w: portraitW, h: portraitH },
      perks: { x: x0, y: footerY, w: 140, h: 56 },
      previous: { x: x0 + 148, y: footerY, w: 44, h: 56 },
      difficulty: { x: x0 + 192, y: footerY, w: 152, h: 56 },
      next: { x: x0 + 344, y: footerY, w: 44, h: 56 },
      play: { x: x0 + totalW - 168, y: footerY, w: 168, h: 56 },
      seed: { x: seedX, y: seedY, w: 300, h: 44 },
      reroll: { x: seedX + 308, y: seedY, w: 120, h: 44 },
    };
  }

  const gridW = GRID * CARD_PHONE.w + (GRID - 1) * CARD_PHONE.gap;
  const gridH = GRID * CARD_PHONE.h + (GRID - 1) * CARD_PHONE.gap;
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
  return {
    desktop,
    title: { x: back.x + back.w + margin, y: 14, w: Math.max(0, w - 2 * (back.x + back.w + margin)), h: 40 },
    back,
    cards: gridCards(Math.round((w - gridW) / 2), gridY, CARD_PHONE),
    portrait: { x: Math.round((w - portraitW) / 2), y: portraitY, w: portraitW, h: portraitH },
    perks: { x: margin, y: rowY, w: 100, h: 48 },
    previous: { x: margin + 108, y: rowY, w: 44, h: 48 },
    difficulty: { x: margin + 152, y: rowY, w: nextX - (margin + 152), h: 48 },
    next: { x: nextX, y: rowY, w: 44, h: 48 },
    play: { x: margin, y: playY, w: rowW, h: 56 },
    seed: { x: margin, y: seedY, w: rowW - 8 - 120, h: 44 },
    reroll: { x: margin + rowW - 120, y: seedY, w: 120, h: 44 },
  };
};
