import { pixelHash } from './pixel';
import type { WallAsset } from './mountainWallAssets';

/** Where one wall piece goes: `x` is its left edge in the world, `footY` the world y of the wall foot. */
export interface WallPlacement {
  assetId: string;
  x: number;
  footY: number;
  flip: boolean;
  depth: number;
}

/** Depth of each wall layer: all of them sit above the field image (0) and below every plot and sprite (≥ 1). */
export const WALL_DEPTH = { far: 0.1, body: 0.2, foot: 0.3, attachment: 0.4 } as const;

const pick = (pool: readonly WallAsset[], i: number, seed: number, salt: number): WallAsset =>
  pool[Math.floor(pixelHash(i, salt, seed) * pool.length)]!;

/**
 * Lays out the wall along [left, right] (world x): end caps just outside the span, middle segments
 * and foot strips in between, deterministic for `seed` (variants only; the span never changes). End caps and
 * feet are optional; returns [] when the assets lack a middle.
 */
export const layoutWall = (
  left: number,
  right: number,
  wallY: number,
  seed: number,
  assets: readonly WallAsset[],
): readonly WallPlacement[] => {
  const middles = assets.filter((a) => a.role === 'middle');
  const feet = assets.filter((a) => a.role === 'foot');
  const capL = assets.find((a) => a.role === 'left');
  const capR = assets.find((a) => a.role === 'right');
  if (middles.length === 0) return [];
  const out: WallPlacement[] = [];
  let x = left;
  for (let i = 0; x < right; i++) {
    const a = pick(middles, i, seed, 1);
    out.push({ assetId: a.id, x, footY: wallY, flip: pixelHash(i, 5, seed) > 0.5, depth: WALL_DEPTH.body });
    x += a.w * a.imageScale;
  }
  if (capL !== undefined) {
    out.push({ assetId: capL.id, x: left - capL.w * capL.imageScale, footY: wallY, flip: false, depth: WALL_DEPTH.body });
  }
  if (capR !== undefined) out.push({ assetId: capR.id, x, footY: wallY, flip: false, depth: WALL_DEPTH.body });
  if (feet.length > 0) {
    // One rubble variant along the whole wall: the strips tile with themselves, not with each other.
    const a = pick(feet, 0, seed, 2);
    let fx = left;
    for (let i = 0; fx < x; i++) {
      out.push({ assetId: a.id, x: fx, footY: wallY, flip: pixelHash(i, 6, seed) > 0.5, depth: WALL_DEPTH.foot });
      fx += a.w * a.imageScale;
    }
  }
  return out;
};
