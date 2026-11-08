import { describe, expect, it } from 'vitest';
import { BATTLE } from '../data/battle';
import { FIELD_DECOR } from '../data/fieldDecoration';
import type { DecorAsset } from './decorationModel';
import { layoutForest } from './forestModel';

const ASSETS: DecorAsset[] = [
  { id: 'forest_pine_a', tall: true, radius: 20 },
  { id: 'forest_pine_b', tall: true, radius: 18 },
  { id: 'forest_rock', tall: true, radius: 24 },
];
const F = FIELD_DECOR.forest;

describe('layoutForest (spec 2026-11-08 §6)', () => {
  it('forest_uses_own_salt_sorted_assets: deterministic per seed, varies by seed, independent of asset order', () => {
    const a = layoutForest(3, ASSETS);
    expect(layoutForest(3, [...ASSETS].reverse())).toEqual(a);
    expect(layoutForest(4, ASSETS)).not.toEqual(a);
    expect(layoutForest(3, [])).toEqual([]);
  });

  it('forest_is_dense_only_north_of_wall, its footprint 24 px clear of the wall foot (after the jitter)', () => {
    for (let seed = 1; seed <= 20; seed++)
      for (const p of layoutForest(seed, ASSETS)) {
        const r = ASSETS.find((x) => x.id === p.assetId)!.radius;
        expect(p.y + r).toBeLessThanOrEqual(F.y1);
        expect(F.y1).toBe(BATTLE.wallY - 24);
        expect(p.x).toBeGreaterThanOrEqual(F.x0 - F.jitter);
        expect(p.x).toBeLessThanOrEqual(F.x1 + F.jitter);
      }
    const n = layoutForest(1, ASSETS).length;
    const cells = Math.floor((F.x1 - F.x0) / F.grid) * Math.floor((F.y1 - F.y0) / F.grid);
    expect(n).toBeGreaterThan(cells * 0.6); // dense: about 72% of the cells
    expect(n).toBeLessThan(cells * 0.8);
  });

  it('is mostly pines, some rocks; only pines when no rock is approved', () => {
    const list = layoutForest(2, ASSETS);
    const rocks = list.filter((p) => p.assetId === 'forest_rock').length;
    expect(rocks / list.length).toBeGreaterThan(0.04);
    expect(rocks / list.length).toBeLessThan(0.18);
    expect(layoutForest(2, ASSETS.slice(0, 1)).every((p) => p.assetId === 'forest_pine_a')).toBe(true);
  });

  it('forest_config_values_are_pinned', () => {
    expect(F).toMatchObject({ salt: 6811, grid: 64, jitter: 16, occupancy: 0.72, pineShare: 0.9, y1: 152 });
  });
});
