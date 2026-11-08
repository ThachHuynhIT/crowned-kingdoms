import { FIELD_DECOR } from '../data/fieldDecoration';
import type { DecorAsset } from './decorationModel';
import { pixelHash } from './pixel';

/** Where one forest object stands (world px, its foot), north of the mountain wall. */
export interface ForestPlacement {
  readonly assetId: string;
  readonly x: number;
  readonly y: number;
}

/**
 * The dense forest behind the mountain cliff (spec 2026-11-08 §6, Q5): one candidate per grid cell of
 * `FIELD_DECOR.forest`, kept with probability `occupancy`, a pine `pineShare` of the time (else a rock), jittered, and
 * dropped when its footprint would reach the wall gap (`y + radius > y1`). Deterministic: `pixelHash` with the
 * forest's own salt and the run seed (never a run RNG stream); assets sorted by id first. Drawing only.
 */
export const layoutForest = (seed: number, assets: readonly DecorAsset[]): readonly ForestPlacement[] => {
  const pool = [...assets].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const pines = pool.filter((a) => a.id.startsWith('forest_pine'));
  const rocks = pool.filter((a) => a.id.startsWith('forest_rock'));
  if (pines.length === 0 && rocks.length === 0) return [];
  const f = FIELD_DECOR.forest;
  const out: ForestPlacement[] = [];
  const cols = Math.floor((f.x1 - f.x0) / f.grid);
  const rows = Math.floor((f.y1 - f.y0) / f.grid);
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const h = (k: number): number => pixelHash(i, j * 8 + k + f.salt, seed);
      if (h(0) >= f.occupancy) continue;
      const set = rocks.length === 0 || (pines.length > 0 && h(1) < f.pineShare) ? pines : rocks;
      const a = set[Math.floor(h(2) * set.length)]!;
      const x = Math.round(f.x0 + (i + 0.5) * f.grid + (h(3) - 0.5) * 2 * f.jitter);
      const y = Math.round(f.y0 + (j + 0.5) * f.grid + (h(4) - 0.5) * 2 * f.jitter);
      if (y + a.radius > f.y1) continue;
      out.push({ assetId: a.id, x, y });
    }
  return out;
};
