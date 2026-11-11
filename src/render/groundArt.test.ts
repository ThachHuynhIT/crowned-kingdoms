import { describe, expect, it } from 'vitest';
import { GROUND_TILES, groundPatch, isoGroundTile } from './groundArt';
import { squareToIso } from './isoArt';
import { PixelCanvas } from './pixel';

const tiles = [0x112233, 0x445566, 0x778899].map((c, k) => {
  const t = new PixelCanvas(4, 4);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) t.set(x, y, c + x * 16 + y * 4096 + k);
  return t;
});
const px = (c: PixelCanvas, x: number, y: number): number[] => {
  const i = (y * c.width + x) * 4;
  return [c.data[i]!, c.data[i + 1]!, c.data[i + 2]!, c.data[i + 3]!];
};

describe('ground beyond the field (spec 2026-11-08 §5)', () => {
  it('groundPatch: GROUND_TILES² tiles of the given set, opaque, deterministic', () => {
    const p = groundPatch(tiles);
    expect([p.width, p.height]).toEqual([GROUND_TILES * 4, GROUND_TILES * 4]);
    for (let i = 3; i < p.data.length; i += 4) expect(p.data[i]).toBe(255);
    expect(Array.from(groundPatch(tiles).data)).toEqual(Array.from(p.data));
    const used = new Set<string>();
    for (let j = 0; j < GROUND_TILES; j++) for (let i = 0; i < GROUND_TILES; i++) used.add(px(p, i * 4, j * 4).join());
    expect(used.size).toBeGreaterThan(1); // the tiles vary
  });

  it('inside_and_outside_field_share_grass_samples: the iso tile equals squareToIso of the patch where the diamond is', () => {
    const p = groundPatch(tiles);
    const n = p.width;
    const tile = isoGroundTile(p);
    expect([tile.width, tile.height]).toEqual([2 * n, n]);
    const diamond = squareToIso(p);
    let compared = 0;
    for (let v = 0; v < n; v++)
      for (let u = 0; u < 2 * n; u++) {
        if (px(diamond, u, v)[3] === 0) continue;
        expect(px(tile, u, v), `${u},${v}`).toEqual(px(diamond, u, v));
        compared++;
      }
    expect(compared).toBeGreaterThan(n * n / 2);
    for (let i = 3; i < tile.data.length; i += 4) expect(tile.data[i]).toBe(255); // the corners are filled too
  });

  it('negative_world_coordinates_keep_tile_phase: the tile repeats seamlessly side by side and top to bottom', () => {
    const p = groundPatch(tiles);
    const n = p.width;
    const tile = isoGroundTile(p);
    // a 2×2 block of tiles equals one big isometric view of a 2×-wrapped patch: compare against direct sampling
    const sample = (u: number, v: number): number[] => {
      const qx = u + 0.5 - n;
      const qy = v + 0.5;
      const x = ((Math.floor(qy - qx / 2) % n) + n) % n;
      const y = ((Math.floor(qy + qx / 2) % n) + n) % n;
      return px(p, x, y);
    };
    for (let v = -n; v < 2 * n; v += 3)
      for (let u = -2 * n; u < 4 * n; u += 5) {
        const tu = ((u % (2 * n)) + 2 * n) % (2 * n);
        const tv = ((v % n) + n) % n;
        expect(px(tile, tu, tv), `${u},${v}`).toEqual(sample(u, v));
      }
  });
});
