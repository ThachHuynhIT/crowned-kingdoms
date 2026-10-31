import type { Rect, Size } from '../hud/layout';

/**
 * Pure layout of one vertical card face: a header (kind icon + name), a picture area, a
 * badge line ("Lên cấp 2") that always has its own space, and the description box below.
 * Rects are in the card's own pixels (origin top-left); `inset` is the frame border plus
 * padding. `compact` is for small cards (one description line), `full` for big ones.
 */
export type CardDensity = 'compact' | 'full';

export interface CardFaceLayout {
  header: Rect;
  /** Kind icon, left end of the header. */
  icon: Rect;
  /** Name, right of the icon, up to two lines. */
  name: Rect;
  art: Rect;
  badge: Rect;
  description: Rect;
}

export const CARD_ICON = 16;
/** Largest integer scale of the card picture; bigger boxes get more air, not a blurrier picture. */
export const MAX_ART_SCALE = 3;

const GAP = 2;
const HEADER_H = { compact: 22, full: 28 } as const;
const BADGE_H = { compact: 10, full: 12 } as const;
/** Smallest description box the art area may squeeze the layout down to. */
const DESCRIPTION_MIN_H = { compact: 14, full: 24 } as const;

export const cardLayout = (size: Size, inset: number, density: CardDensity): CardFaceLayout => {
  const x = inset;
  const y = inset;
  const w = Math.max(1, size.w - 2 * inset);
  const h = Math.max(1, size.h - 2 * inset);
  const headerH = HEADER_H[density];
  const badgeH = BADGE_H[density];

  const header = { x, y, w, h: headerH };
  const icon = { x, y: y + Math.floor((headerH - CARD_ICON) / 2), w: CARD_ICON, h: CARD_ICON };
  const name = { x: x + CARD_ICON + GAP, y, w: Math.max(1, w - CARD_ICON - GAP), h: headerH };

  const room = h - headerH - badgeH - DESCRIPTION_MIN_H[density] - 3 * GAP;
  const artH = Math.max(1, Math.min(Math.floor((w * 3) / 4), room));
  const art = { x, y: header.y + headerH + GAP, w, h: artH };
  const badge = { x, y: art.y + artH + GAP, w, h: badgeH };
  const descY = badge.y + badgeH + GAP;
  const description = { x, y: descY, w, h: Math.max(1, y + h - descY) };
  return { header, icon, name, art, badge, description };
};

export interface ArtFit extends Rect {
  scale: number;
}

/**
 * Where a picture of `art` px goes inside `area`: the largest integer scale (1..MAX_ART_SCALE)
 * that fits, centred. Never stretched; scale 1 even if the area is too small (layouts
 * guarantee the room for the supported card sizes).
 */
export const fitArt = (area: Rect, art: Size): ArtFit => {
  const scale = Math.max(1, Math.min(MAX_ART_SCALE, Math.floor(area.w / art.w), Math.floor(area.h / art.h)));
  const w = art.w * scale;
  const h = art.h * scale;
  return { x: area.x + Math.floor((area.w - w) / 2), y: area.y + Math.floor((area.h - h) / 2), w, h, scale };
};
