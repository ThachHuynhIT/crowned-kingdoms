import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

// The real texture upload needs a DOM canvas; the renderer only needs the key back.
vi.mock('./atlas', () => ({ ensurePortalTexture: () => 'enemy-portal' }));

import { project } from '../core/iso';
import { ENEMY_PORTAL } from '../data/battle';
import { EnemyPortalRenderer } from './EnemyPortalRenderer';
import { PORTAL_FOOT_Y, PORTAL_SIZE } from './portalArt';

class FakeImage {
  depth = 0;
  origin: [number, number] = [0, 0];
  destroyed = 0;
  constructor(readonly x: number, readonly y: number, readonly key: string) {}
  setOrigin(x: number, y: number): this {
    this.origin = [x, y];
    return this;
  }
  setDepth(d: number): this {
    this.depth = d;
    return this;
  }
  destroy(): void {
    this.destroyed += 1;
  }
}

describe('EnemyPortalRenderer', () => {
  it('portal_fallback_uses_data_and_destroy_is_idempotent: upright on the projected portal point', () => {
    const images: FakeImage[] = [];
    const scene = {
      textures: {},
      add: { image: (x: number, y: number, key: string) => (images.push(new FakeImage(x, y, key)), images.at(-1)!) },
    } as unknown as Phaser.Scene;
    const r = new EnemyPortalRenderer(scene);
    const at = project(ENEMY_PORTAL);
    expect(images).toHaveLength(1);
    expect([images[0]!.x, images[0]!.y]).toEqual([Math.round(at.x), Math.round(at.y)]);
    expect(images[0]!.origin).toEqual([0.5, PORTAL_FOOT_Y / PORTAL_SIZE.h]);
    expect(images[0]!.depth).toBe(at.y);
    expect(images[0]!.key).toBe('enemy-portal');
    r.destroy();
    r.destroy();
    expect(images[0]!.destroyed).toBe(1);
  });
});
