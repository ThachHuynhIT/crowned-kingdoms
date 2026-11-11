import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

// The real texture upload needs a DOM canvas; the renderer only needs the key back.
vi.mock('./atlas', () => ({ ensurePortalTexture: () => 'enemy-portal' }));

import { project } from '../core/iso';
import { ENEMY_PORTAL } from '../data/battle';
import { EnemyPortalRenderer } from './EnemyPortalRenderer';
import { PORTAL_APPROVED, PORTAL_ART, imageArtHdKey, imageArtKey } from './imageArt';
import { PORTAL_FOOT_Y, PORTAL_SIZE } from './portalArt';

class FakeImage {
  depth = 0;
  origin: [number, number] = [0, 0];
  scale = 1;
  destroyed = 0;
  constructor(readonly x: number, readonly y: number, readonly key: string) {}
  setOrigin(x: number, y: number): this {
    this.origin = [x, y];
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
    this.destroyed += 1;
  }
}

const fakeScene = (loaded: boolean | ((key: string) => boolean)) => {
  const images: FakeImage[] = [];
  const scene = {
    textures: { exists: typeof loaded === 'function' ? loaded : () => loaded },
    add: { image: (x: number, y: number, key: string) => (images.push(new FakeImage(x, y, key)), images.at(-1)!) },
  } as unknown as Phaser.Scene;
  return { scene, images };
};

describe('EnemyPortalRenderer', () => {
  it('approved_portal_art_stands_on_its_foot: the owner-approved PNG, its base diamond on the projected portal point', () => {
    expect(PORTAL_APPROVED).toBe(true);
    const { scene, images } = fakeScene((key) => key === imageArtKey(PORTAL_ART.file));
    const r = new EnemyPortalRenderer(scene);
    const at = project(ENEMY_PORTAL);
    expect(images).toHaveLength(1);
    expect([images[0]!.x, images[0]!.y]).toEqual([Math.round(at.x), Math.round(at.y)]);
    expect(images[0]!.key).toBe(imageArtKey(PORTAL_ART.file));
    expect(images[0]!.origin).toEqual([PORTAL_ART.foot.x / PORTAL_ART.width, PORTAL_ART.foot.y / PORTAL_ART.height]);
    expect(images[0]!.depth).toBe(at.y);
    r.destroy();
  });

  it('draws the HD twin (density >= 2) at half scale with the same origin, so the foot stays on the portal point', () => {
    const { scene, images } = fakeScene((key) => key === imageArtHdKey(PORTAL_ART.file));
    new EnemyPortalRenderer(scene);
    const at = project(ENEMY_PORTAL);
    expect(images[0]!.key).toBe(imageArtHdKey(PORTAL_ART.file));
    expect(images[0]!.scale).toBe(0.5);
    expect([images[0]!.x, images[0]!.y]).toEqual([Math.round(at.x), Math.round(at.y)]);
    expect(images[0]!.origin).toEqual([PORTAL_ART.foot.x / PORTAL_ART.width, PORTAL_ART.foot.y / PORTAL_ART.height]);
  });

  it('portal_fallback_uses_data_and_destroy_is_idempotent: the code gate when the PNG did not load', () => {
    const { scene, images } = fakeScene(false);
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
