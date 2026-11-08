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
/**
 * The river: it starts at the west edge on row `row0` and its centre slides to column `col1` at the south
 * edge, `half` cells either side of the centre. At row 33 (the board's last row) the centre is at most
 * col1 × 13/28 + 2 ≈ 10.4, so with half = 1 it stays west of the board (col 14); at the south edge it is
 * at most col1 + 2 + 2 = 20, west of the road (col 23).
 */
const RIVER = { row0: 20, col1: 16, half: 1 } as const;

/** N×N terrain indices (row-major). The board area is always grass or flowers. */
export const generateField = (seed: number): Uint8Array => {
  const f = new Uint8Array(N * N).fill(GRASS);
  const at = (col: number, row: number): number => row * N + col;

  for (let row = 0; row < N; row++)
    for (let col = 0; col < N; col++)
      if (fractalNoise2D(seed, col, row, { octaves: 2, frequency: 0.35, persistence: 0.5 }) > 0.72)
        f[at(col, row)] = FLOWERS;

  // A river (P4, spec 2026-11-06 §5): from the west edge down to the south edge through the south-west
  // corner, west of the road and clear of the board; it wanders with the seed, sand on its banks. It is
  // only ground art: nothing in the battle collides with it.
  for (let row = 0; row < N; row++) {
    const t = (row - RIVER.row0) / (N - 1 - RIVER.row0);
    if (t < 0) continue;
    const wobble = (valueNoise2D(seed, 3.5, row * 0.18) - 0.5) * 4;
    const centre = RIVER.col1 * t + wobble;
    for (let col = 0; col < N; col++) {
      const d = Math.abs(col - centre);
      if (d <= RIVER.half) f[at(col, row)] = WATER;
      else if (d <= RIVER.half + 1 && f[at(col, row)] !== WATER) f[at(col, row)] = SAND;
    }
  }
  // The river enters at the west edge: a short bend joining the edge to its first row.
  for (let col = 0; col <= 2; col++)
    for (let row = RIVER.row0 - 1; row <= RIVER.row0 + 1; row++) f[at(col, row)] = WATER;

  // A pond in one of the two east corners (the river owns the west), ringed with sand (never on the road).
  const pcx = N - 7;
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

  // Every bank is one unbroken ring: a cell touching water (diagonals too) is sand, so the stair-stepped river
  // never leaves its sand in separate blocks (owner 2026-11-06: river and sand must join up).
  const wet = f.slice();
  for (let row = 0; row < N; row++)
    for (let col = 0; col < N; col++) {
      if (wet[at(col, row)] === WATER) continue;
      let touches = false;
      for (let dr = -1; dr <= 1 && !touches; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && c >= 0 && r < N && c < N && wet[at(c, r)] === WATER) touches = true;
        }
      if (touches) f[at(col, row)] = SAND;
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
/** Optional seamless ground textures (art px, density 2) that colour the water and sand tiles. */
export interface GroundTextures {
  readonly water?: PixelCanvas;
  readonly sand?: PixelCanvas;
}

/**
 * Recolour the opaque pixels of `tile` (drawn at art position ox, oy) from `tex` sampled at the same absolute
 * art position, wrapped: every tile reads one continuous picture, so neighbouring tiles join without a seam.
 */
const textureTile = (tile: PixelCanvas, tex: PixelCanvas, ox: number, oy: number): PixelCanvas => {
  const out = new PixelCanvas(tile.width, tile.height);
  for (let y = 0; y < tile.height; y++)
    for (let x = 0; x < tile.width; x++) {
      const i = (y * tile.width + x) * 4;
      if (tile.data[i + 3] === 0) continue;
      const tx = (((ox + x) % tex.width) + tex.width) % tex.width;
      const ty = (((oy + y) % tex.height) + tex.height) % tex.height;
      const j = (ty * tex.width + tx) * 4;
      out.data[i] = tex.data[j]!;
      out.data[i + 1] = tex.data[j + 1]!;
      out.data[i + 2] = tex.data[j + 2]!;
      out.data[i + 3] = tile.data[i + 3]!;
    }
  return out;
};

export const paintField = (
  seed: number,
  grass?: readonly PixelCanvas[],
  textures?: GroundTextures,
): PixelCanvas => {
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
        const ox = (tx * TILE - TILE / 2) * k;
        const oy = (ty * TILE - TILE / 2) * k;
        const tex = k === 2 ? (t === WATER ? textures?.water : t === SAND ? textures?.sand : undefined) : undefined;
        const tile =
          k === 2 && grass && t === 0 && mask === 15
            ? grass[Math.floor(pixelHash(tx, ty, seed) * grass.length)]!
            : k === 2
              ? upscale(paintFieldTile(t, mask, tileSeed), 2)
              : paintFieldTile(t, mask, tileSeed);
        out.blit(tex ? textureTile(tile, tex, ox, oy) : tile, ox, oy);
      }
  }
  return out;
};

/**
 * The road's last stretch south of the field (spec 2026-11-08 §3/§5): the field texture stops at y = 768, the enemy
 * portal stands at y = 792. World x [368, 400) is the road's two middle columns; the square runs to y 800, under the
 * portal. Path tiles at density `k`, drawn square (laid onto the iso ground with `squareToIso`).
 */
export const ROAD_TAIL = { x: ROAD_COLS[0] * TILE, y: FIELD, size: 2 * TILE } as const;
export const paintRoadTail = (k: 1 | 2): PixelCanvas => {
  const c = new PixelCanvas(ROAD_TAIL.size * k, ROAD_TAIL.size * k);
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 2; i++) {
      const t = paintFieldTile(PATH, 15, 9100 + i * 7 + j * 13);
      c.blit(k === 2 ? upscale(t, 2) : t, i * TILE * k, j * TILE * k);
    }
  return c;
};

/** A plain, fully painted grass tile; tiled under the field so the ground fills the whole screen. */
export const paintGroundTile = (): PixelCanvas => paintFieldTile(0, 15, 0);

/** Terrain index (FIELD_TERRAINS) under world point (x, y) of a `generateField` grid, null off the field. */
export const fieldTerrainAt = (field: Uint8Array, x: number, y: number): number | null => {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  if (col < 0 || row < 0 || col >= N || row >= N) return null;
  return field[row * N + col]!;
};
