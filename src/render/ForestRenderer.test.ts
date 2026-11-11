import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import type * as ImageArt from './imageArt';

// Pretend the pine is approved, so the renderer has something to draw.
vi.mock('./imageArt', async (orig) => {
  const real = await orig<typeof ImageArt>();
  return { ...real, FOREST_APPROVED: ['forest_pine_a'] };
});

import { project } from '../core/iso';
import { ForestRenderer } from './ForestRenderer';
import { layoutForest } from './forestModel';
import { FOREST_CATALOG } from './imageArt';

class FakeImage {
  depth = 0;
  destroyed = false;
  constructor(readonly x: number, readonly y: number, readonly key: string) {}
  setOrigin(): this {
    return this;
  }
  setDepth(d: number): this {
    this.depth = d;
    return this;
  }
  destroy(): void {
    this.destroyed = true;
  }
}

const scene = (loaded: (key: string) => boolean) => {
  const images: FakeImage[] = [];
  const s = {
    textures: { exists: loaded },
    add: { image: (x: number, y: number, key: string) => (images.push(new FakeImage(x, y, key)), images.at(-1)!) },
  } as unknown as Phaser.Scene;
  return { s, images };
};

describe('ForestRenderer (spec 2026-11-08 §6)', () => {
  it('forest_feet_stay_behind_cliff_top: each tree on its projected foot raised by the cliff, behind the cliff layer', () => {
    const { s, images } = scene(() => true);
    const r = new ForestRenderer(s, 9, 150);
    const expected = layoutForest(9, FOREST_CATALOG.filter((a) => a.id === 'forest_pine_a'));
    expect(r.count).toBe(expected.length);
    expected.forEach((p, i) => {
      const at = project(p);
      expect([images[i]!.x, images[i]!.y]).toEqual([Math.round(at.x), Math.round(at.y - 150)]);
      expect(images[i]!.depth).toBeGreaterThanOrEqual(0.05);
      expect(images[i]!.depth).toBeLessThan(0.2); // the cliff (and everything on the board) is drawn over the forest
    });
    // nearer trees (larger projected foot y) are drawn over farther ones
    const byY = expected.map((p, i) => ({ y: project(p).y, d: images[i]!.depth })).sort((a, b) => a.y - b.y);
    for (let k = 1; k < byY.length; k++) expect(byY[k]!.d).toBeGreaterThanOrEqual(byY[k - 1]!.d);
    r.destroy();
    r.destroy();
    expect(images.every((i) => i.destroyed)).toBe(true);
  });

  it('missing_png_is_safe: an approved object whose PNG did not load is not drawn', () => {
    const { s, images } = scene(() => false);
    expect(new ForestRenderer(s, 9, 150).count).toBe(0);
    expect(images).toHaveLength(0);
  });
});
