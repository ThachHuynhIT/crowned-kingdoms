import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import type * as ImageArt from './imageArt';

// Pretend two objects are approved, so the renderer has something to draw.
vi.mock('./imageArt', async (orig) => {
  const real = await orig<typeof ImageArt>();
  return { ...real, DECOR_APPROVED: ['bush_green', 'tree_oak'] };
});

import { project } from '../core/iso';
import { DecorationRenderer } from './DecorationRenderer';
import { layoutDecorations } from './decorationModel';
import { DECOR_CATALOG, decorFile, imageArtHdKey, imageArtKey } from './imageArt';

class FakeImage {
  depth = 0;
  destroyed = false;
  constructor(readonly x: number, readonly y: number, readonly key: string) {}
  scale = 1;
  setOrigin(): this {
    return this;
  }
  setScale(s: number): this {
    this.scale = s;
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

describe('DecorationRenderer', () => {
  it('draws only approved, loaded objects, upright on their projected feet, depth = projected foot y', () => {
    const { s, images } = scene(() => true);
    const r = new DecorationRenderer(s, 9);
    const expected = layoutDecorations(9, DECOR_CATALOG.filter((a) => a.id === 'bush_green' || a.id === 'tree_oak'));
    expect(r.count).toBe(expected.length);
    expected.forEach((p, i) => {
      const at = project(p);
      expect([images[i]!.x, images[i]!.y]).toEqual([Math.round(at.x), Math.round(at.y)]);
      expect(images[i]!.depth).toBe(at.y);
      expect(images[i]!.key).toContain(p.assetId);
    });
    r.destroy();
    expect(images.every((i) => i.destroyed)).toBe(true);
  });

  it('skips an approved object whose PNG did not load', () => {
    const { s, images } = scene((key) => !key.includes('tree_oak'));
    new DecorationRenderer(s, 9);
    expect(images.some((i) => i.key.includes('tree_oak'))).toBe(false);
    expect(images.length).toBeGreaterThan(0);
  });

  it('draws the ai-v1 PNG at scale 1 and its HD twin (density >= 2) at 0.5, on the same foot', () => {
    const sd = scene((key) => !key.startsWith('imgart-hd-') && !key.startsWith('imgart-uhd-'));
    const hd = scene((key) => key.startsWith('imgart-hd-'));
    new DecorationRenderer(sd.s, 9);
    new DecorationRenderer(hd.s, 9);
    expect(hd.images.length).toBe(sd.images.length);
    sd.images.forEach((a, i) => {
      const b = hd.images[i]!;
      expect([b.x, b.y, b.depth]).toEqual([a.x, a.y, a.depth]);
      expect(a.scale).toBe(1);
      expect(b.scale).toBe(0.5);
      expect(DECOR_CATALOG.some((d) => a.key === imageArtKey(decorFile(d.id)) && b.key === imageArtHdKey(decorFile(d.id)))).toBe(true);
    });
  });
});
