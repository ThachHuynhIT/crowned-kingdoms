import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { BATTLE } from '../data/battle';

// Uploading a texture needs a DOM canvas; the renderer test only cares which images are created.
vi.mock('./atlas', () => ({ addPixelTexture: vi.fn() }));

import { MountainWallRenderer, WALL_EXTENT } from './MountainWallRenderer';
import { wallImageKey } from './mountainWallAssets';

class FakeImage {
  destroyed = false;
  depth = 0;
  scale = 1;
  flipX = false;
  constructor(
    readonly x: number,
    readonly y: number,
    readonly texture: string,
  ) {}
  setOrigin(): this {
    return this;
  }
  setScale(k: number): this {
    this.scale = k;
    return this;
  }
  setFlipX(f: boolean): this {
    this.flipX = f;
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

const fakeScene = (loaded: readonly string[] = []) => {
  const images: FakeImage[] = [];
  const scene = {
    textures: { exists: (key: string) => loaded.includes(key) },
    add: {
      image: (x: number, y: number, texture: string) => {
        const i = new FakeImage(x, y, texture);
        images.push(i);
        return i;
      },
    },
  } as unknown as Phaser.Scene;
  return { scene, images };
};

describe('MountainWallRenderer with approved art', () => {
  it('uses the king image at scale 0.5, on integer pixels, standing on the wall line, and no placeholders', () => {
    const { scene, images } = fakeScene([wallImageKey('terrain_mountain_wall_mid_moon')]);
    new MountainWallRenderer(scene, 5, 'moon');
    expect(images.length).toBeGreaterThan(10);
    for (const i of images) {
      expect(i.texture).toBe(wallImageKey('terrain_mountain_wall_mid_moon'));
      expect(i.scale).toBe(0.5);
      expect(Number.isInteger(i.x) && Number.isInteger(i.y)).toBe(true);
      expect(i.y + 192 * 0.5).toBe(BATTLE.wallY); // 192 art px tall, baseline at the bottom
      expect(i.depth).toBeGreaterThan(0);
      expect(i.depth).toBeLessThan(1);
    }
  });

  it('another king, or an image that did not load, falls back to the placeholder wall', () => {
    const { scene, images } = fakeScene([wallImageKey('terrain_mountain_wall_mid_moon')]);
    new MountainWallRenderer(scene, 5, 'wheat');
    expect(images.every((i) => i.texture.startsWith('wall_'))).toBe(true);
    const none = fakeScene();
    new MountainWallRenderer(none.scene, 5, 'moon');
    expect(none.images.every((i) => i.texture.startsWith('wall_'))).toBe(true);
  });
});

describe('MountainWallRenderer', () => {
  it('places images on integer pixels, above the field and below the plots, covering the field width', () => {
    const { scene, images } = fakeScene();
    new MountainWallRenderer(scene, 3);
    expect(images.length).toBeGreaterThan(10);
    for (const i of images) {
      expect(Number.isInteger(i.x)).toBe(true);
      expect(Number.isInteger(i.y)).toBe(true);
      expect(i.depth).toBeGreaterThan(0);
      expect(i.depth).toBeLessThan(1);
      expect(i.scale).toBe(1);
    }
    const xs = images.map((i) => i.x);
    expect(Math.min(...xs)).toBeLessThan(-WALL_EXTENT);
    expect(Math.max(...xs)).toBeGreaterThan(BATTLE.field + WALL_EXTENT - 1);
    // the bodies stand on the wall line: image bottom (y + 96) = wallY for a middle face
    const faces = images.filter((i) => i.texture.startsWith('wall_middle'));
    for (const f of faces) expect(f.y + 96).toBe(BATTLE.wallY);
  });

  it('destroy frees every image and is safe to call twice; reloading 20 times leaves nothing behind', () => {
    const { scene, images } = fakeScene();
    for (let n = 0; n < 20; n++) {
      const w = new MountainWallRenderer(scene, n);
      w.destroy();
      w.destroy();
    }
    expect(images.every((i) => i.destroyed)).toBe(true);
  });
});
