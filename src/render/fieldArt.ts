import { fractalNoise2D, valueNoise2D } from '../core/noise';
import { BOARD_ORIGIN, BOARD_SIDE, FIELD, PLOT } from '../data/boardGeometry';
import { PALETTE } from '../data/palette';
import {
  MASK_BL,
  MASK_BR,
  MASK_TL,
  MASK_TR,
  computeDualGrid,
  type TerrainSource,
} from './dualGrid';
import { PixelCanvas, pixelHash, upscale } from './pixel';

/** Terrain names; the index is the data value and the blend priority (higher draws on top). */
export const FIELD_TERRAINS = ['grass', 'flowers', 'path', 'sand', 'water'] as const;

const TILE = 16;
/** Data cells per side: the 768 px field in 16 px cells (spec 06/11/2026: 64 px plots). */
const N = FIELD / TILE;
const [GRASS, FLOWERS, PATH, SAND, WATER] = [0, 1, 2, 3, 4];
const BOARD_FIRST = BOARD_ORIGIN / TILE;
const BOARD_LAST = (BOARD_ORIGIN + BOARD_SIDE * PLOT) / TILE - 1;
/** The single road: the two middle columns, from the board's south edge to the field's (spec 06/11/2026, G). */
const ROAD_COLS = [N / 2 - 1, N / 2] as const;
const onRoad = (col: number, row: number): boolean => row > BOARD_LAST && (col === ROAD_COLS[0] || col === ROAD_COLS[1]);

/** N×N terrain indices (row-major). The board area is always grass or flowers. */
export const generateField = (seed: number): Uint8Array => {
  const f = new Uint8Array(N * N).fill(GRASS);
  const at = (col: number, row: number): number => row * N + col;

  for (let row = 0; row < N; row++)
    for (let col = 0; col < N; col++)
      if (fractalNoise2D(seed, col, row, { octaves: 2, frequency: 0.35, persistence: 0.5 }) > 0.72)
        f[at(col, row)] = FLOWERS;

  // A pond in one of the four outer corners, ringed with sand (never on the road).
  const pcx = valueNoise2D(seed, 1.5, 2.5) < 0.5 ? 6 : N - 7;
  const pcy = valueNoise2D(seed, 4.5, 7.5) < 0.5 ? 6 : N - 7;
  for (let row = 0; row < N; row++)
    for (let col = 0; col < N; col++) {
      const dx = col - pcx;
      const dy = row - pcy;
      const d2 = dx * dx + dy * dy;
      const wobble = valueNoise2D(seed, col * 0.35, row * 0.35);
      if (d2 <= 16 + wobble * 8) f[at(col, row)] = WATER;
      else if (d2 <= 36 + wobble * 12) f[at(col, row)] = SAND;
    }

  // The road from the enemy's side to the board, drawn last so nothing covers it.
  for (let row = 0; row < N; row++) for (let col = 0; col < N; col++) if (onRoad(col, row)) f[at(col, row)] = PATH;

  for (let row = BOARD_FIRST; row <= BOARD_LAST; row++)
    for (let col = BOARD_FIRST; col <= BOARD_LAST; col++)
      if (f[at(col, row)]! > FLOWERS) f[at(col, row)] = GRASS;
  return f;
};

interface TerrainLook {
  readonly base: number;
  readonly speck: readonly number[];
  readonly density: number;
}

const LOOKS: readonly TerrainLook[] = [
  { base: PALETTE.grass, speck: [PALETTE.grassLight, PALETTE.grassDark], density: 0.18 },
  { base: PALETTE.grass, speck: [PALETTE.white, PALETTE.gold, PALETTE.red, PALETTE.grassLight], density: 0.14 },
  { base: PALETTE.path, speck: [PALETTE.soil, PALETTE.sand], density: 0.14 },
  { base: PALETTE.sand, speck: [PALETTE.wheatLight, PALETTE.path], density: 0.12 },
  { base: PALETTE.water, speck: [PALETTE.waterLight, PALETTE.waterDeep], density: 0.16 },
];

/**
 * One 16x16 dual-grid tile of a terrain: the four 8x8 quadrants named by `mask` (TL=1, TR=2,
 * BL=4, BR=8) are painted, with a ragged edge along the midlines; the rest is transparent.
 */
export const paintFieldTile = (terrain: number, mask: number, seed: number): PixelCanvas => {
  const look = LOOKS[terrain];
  if (!look) throw new Error(`Unknown terrain ${terrain}`);
  const c = new PixelCanvas(TILE, TILE);
  const half = TILE / 2;
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++) {
      // Jitter the lookup near the midlines so seams between terrains are not straight.
      const near = Math.abs(x - 7.5) < 2.5 || Math.abs(y - 7.5) < 2.5;
      const jx = near ? Math.round((pixelHash(x, y, seed + 5) - 0.5) * 3) : 0;
      const jy = near ? Math.round((pixelHash(y, x, seed + 6) - 0.5) * 3) : 0;
      const qx = Math.min(TILE - 1, Math.max(0, x + jx)) >= half ? 1 : 0;
      const qy = Math.min(TILE - 1, Math.max(0, y + jy)) >= half ? 1 : 0;
      const bit = qy === 0 ? (qx === 0 ? MASK_TL : MASK_TR) : qx === 0 ? MASK_BL : MASK_BR;
      if ((mask & bit) === 0) continue;
      const r = pixelHash(x, y, seed);
      const color =
        r < look.density
          ? look.speck[Math.floor((r / look.density) * look.speck.length)]!
          : look.base;
      c.set(x, y, color);
    }
  return c;
};

/**
 * The whole 768x768 field: 48x48 data cells blended through the dual grid. The 49x49 display
 * tiles are drawn half a tile up-left so the picture is cropped to the data grid.
 */
export const paintField = (seed: number, grass?: readonly PixelCanvas[]): PixelCanvas => {
  const data = generateField(seed);
  const source: TerrainSource = {
    width: N,
    height: N,
    getClamped: (cx, cy) =>
      data[Math.min(N - 1, Math.max(0, cy)) * N + Math.min(N - 1, Math.max(0, cx))]!,
  };
  const dual = computeDualGrid(source, (t) => t);
  // With grass art (2 art px per world unit) the whole field is painted at twice the density:
  // the grass comes from the art, every other tile is the generated one enlarged 2×.
  const k = grass && grass.length > 0 ? 2 : 1;
  const out = new PixelCanvas(N * TILE * k, N * TILE * k);
  const terrains = [...dual.layers.keys()].sort((a, b) => a - b);
  for (const t of terrains) {
    const layer = dual.layers.get(t)!;
    for (let ty = 0; ty < dual.height; ty++)
      for (let tx = 0; tx < dual.width; tx++) {
        const mask = layer[ty * dual.width + tx]!;
        if (mask < 0) continue;
        const tileSeed = seed + tx * 7919 + ty * 104729;
        const tile =
          k === 2 && grass && t === 0 && mask === 15
            ? grass[Math.floor(pixelHash(tx, ty, seed) * grass.length)]!
            : k === 2
              ? upscale(paintFieldTile(t, mask, tileSeed), 2)
              : paintFieldTile(t, mask, tileSeed);
        out.blit(tile, (tx * TILE - TILE / 2) * k, (ty * TILE - TILE / 2) * k);
      }
  }
  return out;
};

/** A plain, fully painted grass tile; tiled under the field so the ground fills the whole screen. */
export const paintGroundTile = (): PixelCanvas => paintFieldTile(0, 15, 0);
