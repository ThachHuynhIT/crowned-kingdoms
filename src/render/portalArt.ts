import { PALETTE } from '../data/palette';
import { PixelCanvas, pixelHash } from './pixel';

/** The code-drawn enemy portal (spec 2026-11-08 §3, Q2), shown until the owner approves the portal art (Q5). */
export const PORTAL_SIZE = { w: 96, h: 112 } as const;
/** Canvas row of the portal's foot: the centre of the glowing ground ellipse, anchored on the portal's world point. */
export const PORTAL_FOOT_Y = 100;

/**
 * A stone gate with a swirling purple mouth over a glowing ground ellipse (96 × 48 on screen at zoom 1). Pixel art:
 * every pixel is opaque or empty, colours from the palette, specks from `pixelHash` (no randomness).
 */
export const paintPortal = (): PixelCanvas => {
  const { w, h } = PORTAL_SIZE;
  const c = new PixelCanvas(w, h);
  const cx = w / 2;
  // ground glow: a 2:1 ellipse (isometric), plum rim, purple inside, a lighter core
  c.fillEllipse(cx, PORTAL_FOOT_Y, 46, 11, PALETTE.plum);
  c.fillEllipse(cx, PORTAL_FOOT_Y, 42, 9, PALETTE.purple);
  c.fillEllipse(cx, PORTAL_FOOT_Y, 26, 5, PALETTE.waterLight);
  // the mouth: an upright oval of swirling light between the pillars
  c.fillEllipse(cx, 62, 26, 36, PALETTE.outline);
  c.fillEllipse(cx, 62, 24, 34, PALETTE.plum);
  c.fillEllipse(cx, 64, 19, 29, PALETTE.purple);
  for (let y = 30; y < 96; y++)
    for (let x = 24; x < 72; x++) {
      const dx = (x - cx) / 19;
      const dy = (y - 64) / 29;
      if (dx * dx + dy * dy > 1) continue;
      const r = pixelHash(x, y, 7);
      if (r < 0.08) c.set(x, y, PALETTE.waterLight);
      else if (r < 0.14) c.set(x, y, PALETTE.white);
    }
  // two stone pillars and a lintel, outlined
  const block = (x: number, y: number, bw: number, bh: number): void => {
    c.fillRect(x - 1, y - 1, bw + 2, bh + 2, PALETTE.outline);
    c.fillRect(x, y, bw, bh, PALETTE.stone);
    c.fillRect(x, y, bw, 2, PALETTE.stoneLight);
    c.fillRect(x + bw - 2, y + 2, 2, bh - 2, PALETTE.stoneDark);
  };
  block(12, 26, 12, 74);
  block(72, 26, 12, 74);
  block(8, 16, 80, 12);
  // a rune on the lintel
  c.fillRect(cx - 4, 20, 8, 4, PALETTE.purple);
  return c;
};
