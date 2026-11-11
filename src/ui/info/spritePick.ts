/**
 * Picking what the player clicked by the sprite they see (owner 10/11/2026), not by the ground under it: a
 * building or a unit stands upright above its feet, so at the overview zoom most of its art is over another plot's
 * diamond or far from its collision circle. Pure maths in camera (projected) space; no Phaser.
 */
import type { Point } from '../hud/layout';

/** A click this many screen px off a sprite still picks it (divide by the camera zoom for camera space). */
export const PICK_SLOP = 4;

/** A sprite as drawn: anchored at its feet (0.5, 1), `scale` screen-world px per frame px, depth = foot y. */
export interface SpriteBox {
  readonly id: number;
  readonly left: number;
  readonly top: number;
  readonly w: number;
  readonly h: number;
  readonly footY: number;
  readonly scale: number;
  /** Atlas frame of the sprite, passed back to the opacity test. */
  readonly frame: string;
  /** Count only the sprite's opaque pixels (buildings); false = the whole box (small units). */
  readonly exact: boolean;
  readonly flipX?: boolean;
}

export const spriteBox = (s: {
  id: number;
  x: number;
  footY: number;
  frameW: number;
  frameH: number;
  scale: number;
  exact: boolean;
  frame: string;
  flipX?: boolean;
}): SpriteBox => {
  const w = s.frameW * s.scale;
  const h = s.frameH * s.scale;
  return {
    id: s.id,
    left: s.x - w / 2,
    top: s.footY - h,
    w,
    h,
    footY: s.footY,
    scale: s.scale,
    frame: s.frame,
    exact: s.exact,
    ...(s.flipX ? { flipX: true } : {}),
  };
};

/** Is frame pixel (u, v) of `frame` opaque? */
export type OpacityTest = (frame: string, u: number, v: number) => boolean;

/**
 * The sprite under camera point `p`: of the boxes (grown by `slop`) that hold it, front to back (largest foot y
 * first, ties to the lowest id), the first one that is solid there: any box without `exact`, an `exact` one where
 * `opaque` says its nearest frame pixel is opaque (without `opaque`, the box). Null when none.
 */
export const pickSprite = (
  boxes: readonly SpriteBox[],
  p: Point,
  slop = 0,
  opaque?: OpacityTest,
): number | null => {
  const hits = boxes
    .filter((b) => p.x >= b.left - slop && p.x <= b.left + b.w + slop && p.y >= b.top - slop && p.y <= b.top + b.h + slop)
    .sort((a, b) => b.footY - a.footY || a.id - b.id);
  for (const b of hits) {
    if (!b.exact || !opaque) return b.id;
    const fw = Math.round(b.w / b.scale);
    const fh = Math.round(b.h / b.scale);
    const clamp = (n: number, max: number): number => Math.max(0, Math.min(max - 1, n));
    const u0 = clamp(Math.floor((p.x - b.left) / b.scale), fw);
    const u = b.flipX ? fw - 1 - u0 : u0;
    const v = clamp(Math.floor((p.y - b.top) / b.scale), fh);
    if (opaque(b.frame, u, v)) return b.id;
  }
  return null;
};
