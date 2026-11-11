import type { Rect, Size } from '../hud/layout';

/** A full-size hand card (desktop, screens at least 650 px tall). */
export const HAND_CARD = { w: 148, h: 208 } as const;
const HAND_GAP = 12;
/** Scroll step of a full-size hand: one card and its gap. */
export const HAND_STEP = HAND_CARD.w + HAND_GAP;
/** Hand cards take at most this share of a short screen's height (night 12/11/2026: landscape phones). */
const HAND_SHARE = 0.32;
/** Smallest hand card height (CardView then shows its compact face: picture and name). */
const HAND_CARD_MIN_H = 112;
const HAND_BOTTOM = 10;
/** Width of the action columns left (Mua thẻ, Đổi bài, Bán bài) and right (Bộ bài) of the hand. */
const ACTION_COLUMN = 168;

/**
 * Size of a hand card on `screen`: full size from 650 px tall; on shorter screens (landscape phones) it shrinks with
 * the height, keeping its shape, so the board stays visible above the hand.
 */
export const handCardSize = (screen: Size): { w: number; h: number } => {
  const h = Math.min(HAND_CARD.h, Math.max(HAND_CARD_MIN_H, Math.round(screen.h * HAND_SHARE)));
  return { w: Math.round((HAND_CARD.w * h) / HAND_CARD.h), h };
};

/** Fixed desktop action columns; purchased cards never shrink. */
export const handWindow = (screen: Size, count: number, scrollX: number): {
  viewport: Rect; cards: Rect[]; scrollMax: number; scroll: number; step: number;
} => {
  const n = Math.max(0, Math.floor(count));
  const card = handCardSize(screen);
  const step = card.w + HAND_GAP;
  const viewport = {
    x: ACTION_COLUMN,
    y: screen.h - card.h - HAND_BOTTOM,
    w: Math.max(card.w, screen.w - 2 * ACTION_COLUMN),
    h: card.h,
  };
  const width = Math.max(0, n * step - HAND_GAP);
  const capacity = Math.max(1, Math.floor((viewport.w + HAND_GAP) / step));
  const scrollMax = Math.max(0, n - capacity) * step;
  const requested = Number.isFinite(scrollX) ? scrollX : 0;
  const scroll = Math.min(scrollMax, Math.max(0, Math.round(requested / step) * step));
  const start = viewport.x + Math.max(0, (viewport.w - width) / 2) - scroll;
  return { viewport, scrollMax, scroll, step, cards: Array.from({ length: n }, (_, i) => ({
    x: start + i * step, y: viewport.y, w: card.w, h: card.h,
  })) };
};
