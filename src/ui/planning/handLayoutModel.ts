import type { Rect, Size } from '../hud/layout';

export const HAND_STEP = 160;

/** Fixed desktop action columns; purchased cards never shrink. */
export const handWindow = (screen: Size, count: number, scrollX: number): {
  viewport: Rect; cards: Rect[]; scrollMax: number; scroll: number;
} => {
  const n = Math.max(0, Math.floor(count));
  const viewport = { x: 168, y: screen.h - 218, w: Math.max(148, screen.w - 336), h: 208 };
  const width = Math.max(0, n * 160 - 12);
  const capacity = Math.max(1, Math.floor((viewport.w + 12) / HAND_STEP));
  const scrollMax = Math.max(0, n - capacity) * HAND_STEP;
  const requested = Number.isFinite(scrollX) ? scrollX : 0;
  const scroll = Math.min(scrollMax, Math.max(0, Math.round(requested / HAND_STEP) * HAND_STEP));
  const start = viewport.x + Math.max(0, (viewport.w - width) / 2) - scroll;
  return { viewport, scrollMax, scroll, cards: Array.from({ length: n }, (_, i) => ({
    x: start + i * 160, y: viewport.y, w: 148, h: 208,
  })) };
};
