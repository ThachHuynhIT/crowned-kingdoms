import type { Rect, Size } from './layout';

/**
 * Wooden backboards of the desktop HUD (owner 12/11/2026: "bố trí button và bộ UI trên PC đơn giản quá"): the `board`
 * frame behind the top row (lives, gold, help, year strip, enemy), behind the left action column, behind the hand and
 * behind the deck button. Pure: the scene stretches one nine-slice per rect. Edges that touch a screen edge run past
 * it by `BLEED` so the frame's outer border sits off screen there.
 */
export const BLEED = 8;
const PAD = 8;
/** The top row's board stops 4 px under its controls, clear of the year label right below them. */
const TOP_PAD = 4;

export interface HudBoards {
  top: Rect;
  left: Rect;
  hand: Rect;
  right: Rect;
}

/** The smallest rect holding every rect in `rs`, grown by `pad`. */
export const around = (rs: readonly Rect[], pad: number): Rect => {
  const x = Math.min(...rs.map((r) => r.x)) - pad;
  const y = Math.min(...rs.map((r) => r.y)) - pad;
  const x2 = Math.max(...rs.map((r) => r.x + r.w)) + pad;
  const y2 = Math.max(...rs.map((r) => r.y + r.h)) + pad;
  return { x, y, w: x2 - x, h: y2 - y };
};

/** Run a rect past the screen's left, right or bottom edge where it comes within `PAD` of it. */
const bleed = (r: Rect, screen: Size, edges: { left?: boolean; right?: boolean; bottom?: boolean; top?: boolean }): Rect => {
  let { x, y, w, h } = r;
  if (edges.left) {
    w += x + BLEED;
    x = -BLEED;
  }
  if (edges.top) {
    h += y + BLEED;
    y = -BLEED;
  }
  if (edges.right) w = screen.w + BLEED - x;
  if (edges.bottom) h = screen.h + BLEED - y;
  return { x, y, w, h };
};

export const hudBoards = (
  screen: Size,
  l: { lives: Rect; calendar: readonly Rect[]; shop: Rect; reroll: Rect; sell: Rect; deck: Rect },
  hand: Rect,
  topRight: Rect,
): HudBoards => {
  const top = bleed(around([l.lives, ...l.calendar, topRight], TOP_PAD), screen, { left: true, right: true, top: true });
  const left = bleed(around([l.shop, l.reroll, l.sell], PAD), screen, { left: true, bottom: true });
  const right = bleed(around([l.deck], PAD), screen, { right: true, bottom: true });
  const tray = bleed(around([hand], PAD), screen, { bottom: true });
  return { top, left, hand: tray, right };
};

/**
 * Battle HUD backboards (desktop): the top row (lives, gold, year strip, and the speed buttons when they share it) and,
 * when the speed buttons sit elsewhere (a 2×2 block, or a second row), a board of their own.
 */
export const battleBoards = (
  screen: Size,
  l: { lives: Rect; calendar: readonly Rect[]; speed: readonly Rect[] },
): { top: Rect; speed: Rect | null } => {
  const speedInTop = l.speed.every((s) => s.y === l.lives.y);
  const top = bleed(around([l.lives, ...l.calendar, ...(speedInTop ? l.speed : [])], TOP_PAD), screen, {
    left: true,
    right: true,
    top: true,
  });
  return { top, speed: speedInTop ? null : around(l.speed, TOP_PAD) };
};
