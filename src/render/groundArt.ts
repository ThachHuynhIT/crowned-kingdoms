import { PixelCanvas, pixelHash } from './pixel';

/**
 * The grass around the field (spec 2026-11-08 §5, Q4). The field texture is the square field laid onto the isometric
 * ground (`squareToIso`); the ground beyond it must look the same: the same grass tiles, on the same 16-world-px tile
 * grid, seen through the same projection. A square patch of `GROUND_TILES`² tiles repeats with period N, and the
 * projected periodic plane repeats on screen with a rectangular period 2N × N (src/core/iso.ts: one world step along
 * x or y moves the projection by (∓N, N/2)), so one 2N × N tile drawn by a TileSprite covers any amount of ground.
 */

/** Tiles per side of the periodic grass patch. */
export const GROUND_TILES = 8;
/** Salt of the patch's tile choice (the ground is shared by every run, so it does not use the run seed). */
export const GROUND_SALT = 7331;

/** The square periodic patch: tile (i, j) is `tiles[floor(pixelHash(i, j, GROUND_SALT) × n)]`. */
export const groundPatch = (tiles: readonly PixelCanvas[]): PixelCanvas => {
  const t = tiles[0]!.width;
  const n = GROUND_TILES * t;
  const out = new PixelCanvas(n, n);
  for (let j = 0; j < GROUND_TILES; j++)
    for (let i = 0; i < GROUND_TILES; i++) out.blit(tiles[Math.floor(pixelHash(i, j, GROUND_SALT) * tiles.length)]!, i * t, j * t);
  return out;
};

/**
 * One screen period (2N × N px) of the projected periodic `patch` (side N), sampled like `squareToIso` (pixel
 * centres, nearest, through the inverse projection) with the square coordinates wrapped. Its pixel (N, 0) — the top
 * corner of a diamond — is the patch's origin. Every pixel is opaque when the patch is.
 */
export const isoGroundTile = (patch: PixelCanvas): PixelCanvas => {
  const n = patch.width;
  const out = new PixelCanvas(2 * n, n);
  const wrap = (v: number): number => ((v % n) + n) % n;
  for (let v = 0; v < n; v++)
    for (let u = 0; u < 2 * n; u++) {
      const qx = u + 0.5 - n;
      const qy = v + 0.5;
      const x = wrap(Math.floor(qy - qx / 2));
      const y = wrap(Math.floor(qy + qx / 2));
      const i = (y * n + x) * 4;
      const o = (v * out.width + u) * 4;
      out.data[o] = patch.data[i]!;
      out.data[o + 1] = patch.data[i + 1]!;
      out.data[o + 2] = patch.data[i + 2]!;
      out.data[o + 3] = patch.data[i + 3]!;
    }
  return out;
};
