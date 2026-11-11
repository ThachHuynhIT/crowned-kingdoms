import type { RunMode } from '../data/rules';
import { geometryFor } from '../game/run/boardGeometry';
import { BATTLE } from '../data/battle';
import { FIELD_DECOR } from '../data/fieldDecoration';
import { FIELD_TERRAINS, fieldTerrainAt, generateField } from './fieldArt';
import { pixelHash } from './pixel';

/** One approved wild object: tall ones stand outside the field, low ones inside it. `radius`: world px footprint. */
export interface DecorAsset {
  readonly id: string;
  readonly tall: boolean;
  readonly radius: number;
}

/** Where one decoration stands (world px, its foot). */
export interface DecorPlacement {
  readonly assetId: string;
  readonly tall: boolean;
  readonly x: number;
  readonly y: number;
}

const WATER = FIELD_TERRAINS.indexOf('water');
const PATH = FIELD_TERRAINS.indexOf('path');

/**
 * Scatter the approved wild objects for one run (spec 2026-11-06 §5, P4). Deterministic: positions come from
 * `pixelHash` with the decoration's own salt and the run seed (never the run's RNG streams), assets are
 * sorted by id first, and every placement is tried a bounded number of times (a crowded field just gets fewer
 * objects). Decoration is drawing only: the battle never sees it.
 */
export const layoutDecorations = (
  seed: number,
  assets: readonly DecorAsset[],
  mode: RunMode = 'normal',
): readonly DecorPlacement[] => {
  const pool = [...assets].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const tall = pool.filter((a) => a.tall);
  const low = pool.filter((a) => !a.tall);
  const out: DecorPlacement[] = [];
  const radiusOf = new Map(pool.map((a) => [a.id, a.radius]));
  const free = (x: number, y: number, r: number): boolean =>
    out.every((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      const min = (radiusOf.get(p.assetId) ?? 0) + r;
      return dx * dx + dy * dy >= min * min;
    });
  const h = (i: number, k: number): number => pixelHash(i, k + FIELD_DECOR.salt, seed);
  const F = BATTLE.field;
  // The whole footprint (a circle of `r`) stays out of the battlefield and the portal (spec 2026-11-08 §5).
  const touches = (x: number, y: number, r: number, z: { x0: number; x1: number; y0: number; y1: number }): boolean => {
    const dx = Math.max(z.x0 - x, 0, x - z.x1);
    const dy = Math.max(z.y0 - y, 0, y - z.y1);
    return dx * dx + dy * dy < r * r;
  };
  const clear = (x: number, y: number, r: number): boolean =>
    !touches(x, y, r, FIELD_DECOR.combatClear) && !touches(x, y, r, FIELD_DECOR.portalClear);

  // Tall: a ring outside the field (west, east and south; north is the mountain), never on the road's line.
  const ring = FIELD_DECOR.tall.ring;
  for (let i = 0, placed = 0; tall.length > 0 && placed < FIELD_DECOR.tall.count && i < FIELD_DECOR.tall.attempts; i++) {
    const a = tall[Math.floor(h(i, 1) * tall.length)]!;
    const side = Math.floor(h(i, 2) * 3);
    const depth = ring.inner + a.radius + h(i, 3) * (ring.outer - ring.inner - a.radius);
    const along = h(i, 4);
    const x = side === 0 ? -depth : side === 1 ? F + depth : -ring.outer + along * (F + 2 * ring.outer);
    const y = side === 2 ? F + depth : FIELD_DECOR.northLimit + along * (F + ring.outer - FIELD_DECOR.northLimit);
    if (side === 2 && Math.abs(x - F / 2) < FIELD_DECOR.low.roadHalf + a.radius) continue;
    if (!clear(x, y, a.radius) || !free(x, y, a.radius)) continue;
    out.push({ assetId: a.id, tall: true, x: Math.round(x), y: Math.round(y) });
    placed++;
  }

  // Low: inside the field, in the two side bands only, off the board (with a pad), the road and the water.
  const field = generateField(seed, mode);
  const cfg = FIELD_DECOR.low;
  const lo = geometryFor(mode).boardMin - cfg.boardPad;
  const hi = geometryFor(mode).boardMax + cfg.boardPad;
  for (let i = 0, placed = 0; low.length > 0 && placed < cfg.count && i < cfg.attempts; i++) {
    const a = low[Math.floor(h(i, 11) * low.length)]!;
    const r = a.radius;
    const x = Math.round(cfg.margin + h(i, 12) * (F - 2 * cfg.margin));
    const y = Math.round(FIELD_DECOR.northLimit + h(i, 13) * (F - cfg.margin - FIELD_DECOR.northLimit));
    if (x + r > lo && x - r < hi && y + r > lo && y - r < hi) continue;
    if (x > cfg.edge.west && x < cfg.edge.east) continue; // the middle of the field is the battlefield
    if (!clear(x, y, r)) continue;
    let blocked = false;
    for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [0, 0]] as const) {
      const t = fieldTerrainAt(field, x + dx, y + dy);
      if (t === null || t === WATER || t === PATH) blocked = true;
    }
    if (blocked || !free(x, y, r)) continue;
    out.push({ assetId: a.id, tall: false, x, y });
    placed++;
  }
  return out;
};
