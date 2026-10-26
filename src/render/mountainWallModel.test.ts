import { describe, expect, it } from 'vitest';
import { BATTLE } from '../data/battle';
import { paintMountainWall } from './mountainWallArt';
import { placeholderWallAssets } from './mountainWallAssets';
import { WALL_DEPTH, layoutWall } from './mountainWallModel';

const assets = placeholderWallAssets();
const byId = new Map(assets.map((a) => [a.id, a]));
const L = -1024;
const R = BATTLE.field + 1024;

describe('layoutWall', () => {
  const placements = layoutWall(L, R, BATTLE.wallY, 7, assets);
  const middles = placements.filter((p) => byId.get(p.assetId)!.role === 'middle');

  it('covers the whole span without gaps or overlaps', () => {
    expect(middles[0]!.x).toBe(L);
    for (let i = 1; i < middles.length; i++) {
      const prev = middles[i - 1]!;
      expect(middles[i]!.x).toBe(prev.x + byId.get(prev.assetId)!.w);
    }
    const last = middles[middles.length - 1]!;
    expect(last.x + byId.get(last.assetId)!.w).toBeGreaterThanOrEqual(R);
  });

  it('has an end cap on each side and puts every foot on the wall line', () => {
    const left = placements.find((p) => byId.get(p.assetId)!.role === 'left')!;
    const right = placements.find((p) => byId.get(p.assetId)!.role === 'right')!;
    expect(left.x + byId.get('left')!.w).toBe(L);
    expect(right.x).toBeGreaterThanOrEqual(R);
    for (const p of placements) expect(p.footY).toBe(BATTLE.wallY);
  });

  it('is deterministic for a seed and changes only variants (never the span) with the seed', () => {
    expect(layoutWall(L, R, BATTLE.wallY, 7, assets)).toEqual(placements);
    const other = layoutWall(L, R, BATTLE.wallY, 8, assets).filter((p) => byId.get(p.assetId)!.role === 'middle');
    expect(other[0]!.x).toBe(L);
    expect(other.reduce((w, p) => w + byId.get(p.assetId)!.w, 0)).toBeGreaterThanOrEqual(R - L);
  });

  it('wall_depth: every wall layer sits above the field and below every plot and sprite', () => {
    for (const p of placements) {
      expect(p.depth).toBeGreaterThan(0); // the painted field is at depth 0
      expect(p.depth).toBeLessThan(1); // plots start at depth 1
    }
    expect(WALL_DEPTH.far).toBeLessThan(WALL_DEPTH.body);
    expect(WALL_DEPTH.body).toBeLessThan(WALL_DEPTH.foot);
    expect(WALL_DEPTH.foot).toBeLessThan(WALL_DEPTH.attachment);
  });

  it('returns nothing when the assets are incomplete (no middle or no cap)', () => {
    expect(layoutWall(L, R, 64, 1, assets.filter((a) => a.role !== 'middle'))).toEqual([]);
    expect(layoutWall(L, R, 64, 1, assets.filter((a) => a.role !== 'left'))).toEqual([]);
  });

  it('a very wide source split into parts keeps every part inside the asset and each part within the GPU limit', () => {
    for (const a of assets) {
      for (const part of a.parts) {
        expect(part.sourceX + part.w).toBeLessThanOrEqual(a.w);
        expect(part.sourceY + part.h).toBeLessThanOrEqual(a.h);
        expect(part.w).toBeLessThanOrEqual(2048);
      }
    }
  });
});

describe('placeholder art', () => {
  it('uses only alpha 0 or 255 and has no holes inside a middle face', () => {
    for (const a of assets) {
      const art = paintMountainWall(a.id, a.w, a.h);
      for (let i = 3; i < art.data.length; i += 4) expect([0, 255]).toContain(art.data[i]);
    }
    const mid = paintMountainWall('middle_a', 128, 96);
    for (let y = 8; y < 96; y++) for (let x = 0; x < 128; x++) expect(mid.alphaAt(x, y)).toBe(255);
  });

  it('caps slope towards the outside and are not empty', () => {
    const left = paintMountainWall('left', 48, 96);
    expect(left.alphaAt(0, 0)).toBe(0);
    expect(left.alphaAt(47, 95)).toBe(255);
    expect(left.alphaAt(0, 95)).toBe(255);
  });
});
