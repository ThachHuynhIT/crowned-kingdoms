import type { Rect } from '../hud/layout';
import { unlockButtonRect } from './carouselLayout';

/** King card art size and its portrait window (`KING_CARD_NATIVE`, `KING_CARD_WINDOW` in render/kingCardArt). */
const CARD_W = 66;
const WINDOW = { x: 9, y: 8, w: 48, h: 72 } as const;
/** The padlock icon frame (`icon_lock`) is 16×16 art px. */
const LOCK_ART = 16;
/** Height of the padlock's centre inside the window, in card art px from the card's top. */
const LOCK_CENTRE_Y = 35;

/** Where the marks of a locked king card go (owner 2026-11-10): the padlock, then the "Mở khoá: …" line. */
export interface LockedCardLayout {
  /** Top-left of the padlock and its whole-number scale (16 × scale screen px square). */
  lock: { x: number; y: number; scale: number };
  /** Box of the unlock condition text: under the padlock, inside the portrait window, above the unlock button. */
  note: Rect;
}

/**
 * Pure layout of the marks drawn over a locked king card placed in `card` (any width; the art scale is
 * `card.w / 66`). The padlock is centred across the card at a whole scale; whole screen px everywhere.
 */
export const lockedCardLayout = (card: Rect): LockedCardLayout => {
  const s = card.w / CARD_W;
  const scale = Math.max(1, Math.floor(s));
  const size = LOCK_ART * scale;
  const lock = {
    x: card.x + Math.round((card.w - size) / 2),
    y: card.y + Math.round(LOCK_CENTRE_Y * s - size / 2),
    scale,
  };
  const noteY = lock.y + size + Math.round(3 * s);
  const windowBottom = card.y + Math.round((WINDOW.y + WINDOW.h) * s);
  const bottom = Math.min(windowBottom, unlockButtonRect(card).y - 4);
  return {
    lock,
    note: { x: card.x + Math.round(WINDOW.x * s), y: noteY, w: Math.round(WINDOW.w * s), h: Math.max(0, bottom - noteY) },
  };
};
