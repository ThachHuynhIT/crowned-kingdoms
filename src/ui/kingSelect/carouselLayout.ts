import type { Rect } from '../hud/layout';

/**
 * Pure layout of the king carousel: the selected card in the middle (full size, brightest,
 * in front), the neighbours smaller, dimmer and lower, five cards visible at most. The
 * `rect` is the carousel area; from 768 px wide it uses the desktop drops (24 / 48 px), below
 * it the phone ones (16 / 32 px) and sizes the cards so the ±1 cards peek out beside the
 * centre card. Cards of 2:3, whole pixels, even heights (so drops are exact).
 */
export interface CarouselSlot {
  /** Index into the list of kings. */
  index: number;
  rect: Rect;
  scale: number;
  /** 1 = full colour; lower dims the card. */
  brightness: number;
  /** Draw order: the selected card is highest. */
  depth: number;
  /** Within two places of the selected card and at least MIN_VISIBLE px inside the area. */
  visible: boolean;
}

/** Narrowest visible part of a card, and the smallest tap target. */
const MIN_VISIBLE = 44;
const DESKTOP_FROM = 768;
const SCALES = [1, 0.8, 0.62] as const;
const BRIGHTNESS = [1, 0.75, 0.5] as const;
/** Distance of the neighbours' centres from the middle, in units of the centre card's width. */
const STEP = [0, 0.78, 1.39] as const;
/** Width of everything shown, in centre-card widths: both ±2 cards (desktop) or both ±1 cards (phone). */
const SPAN_DESKTOP = 3.4;
const SPAN_PHONE = 2.36;

export const carouselSlots = (rect: Rect, selectedIndex: number, count: number): readonly CarouselSlot[] => {
  if (count <= 0) return [];
  const desktop = rect.w >= DESKTOP_FROM;
  const drop = desktop ? [0, 24, 48] : [0, 16, 32];
  const maxDrop = drop[2]!;
  const widthCap = Math.floor((rect.w / (desktop ? SPAN_DESKTOP : SPAN_PHONE)) * 1.5);
  let h0 = Math.min(rect.h - maxDrop, widthCap);
  h0 -= h0 % 2;
  const w0 = Math.round((h0 * 2) / 3);
  const cx = rect.x + rect.w / 2;
  // Spare height (the width, not the height, limits the cards) is split above and below.
  const top = rect.y + Math.floor((rect.h - maxDrop - h0) / 2);

  return Array.from({ length: count }, (_, index) => {
    const offset = index - selectedIndex;
    const k = Math.min(2, Math.abs(offset));
    const scale = SCALES[k]!;
    const w = Math.round(w0 * scale);
    const h = 2 * Math.round((h0 * scale) / 2);
    const midX = cx + Math.sign(offset) * Math.round(STEP[k]! * w0);
    const slotRect = {
      x: Math.round(midX - w / 2),
      y: top + drop[k]! + (h0 - h) / 2,
      w,
      h,
    };
    const inside = Math.max(0, Math.min(slotRect.x + w, rect.x + rect.w) - Math.max(slotRect.x, rect.x));
    return {
      index,
      rect: slotRect,
      scale,
      brightness: BRIGHTNESS[k]!,
      depth: 100 - 10 * Math.abs(offset),
      visible: Math.abs(offset) <= 2 && inside >= MIN_VISIBLE,
    };
  });
};

/**
 * Where the carousel screen puts its parts. The card `area` never covers the back button or
 * the arrows (so a swipe across it cannot hit them): on desktop the arrows stand left and
 * right of it, on phones they sit under it.
 */
export interface CarouselScreenLayout {
  title: Rect;
  back: Rect;
  /** The king's name, centred above the middle card. */
  name: Rect;
  /** The area `carouselSlots` lays the cards in; also the swipe area. */
  area: Rect;
  previous: Rect;
  next: Rect;
}

export const carouselScreen = (screen: { w: number; h: number }): CarouselScreenLayout => {
  const { w, h } = screen;
  if (w >= DESKTOP_FROM) {
    const area = { x: 72, y: 140, w: w - 144, h: h - 140 - 30 };
    const arrowY = area.y + Math.floor(area.h / 2) - 32;
    return {
      title: { x: 140, y: 20, w: w - 280, h: 44 },
      back: { x: 10, y: 10, w: 120, h: 48 },
      name: { x: 0, y: 92, w, h: 36 },
      area,
      previous: { x: 12, y: arrowY, w: 52, h: 64 },
      next: { x: w - 64, y: arrowY, w: 52, h: 64 },
    };
  }
  return {
    title: { x: 116, y: 14, w: w - 232, h: 40 },
    back: { x: 10, y: 10, w: 96, h: 48 },
    name: { x: 0, y: 68, w, h: 32 },
    area: { x: 0, y: 106, w, h: h - 106 - 96 },
    previous: { x: Math.floor(w / 2) - 56, y: h - 80, w: 48, h: 48 },
    next: { x: Math.floor(w / 2) + 8, y: h - 80, w: 48, h: 48 },
  };
};
