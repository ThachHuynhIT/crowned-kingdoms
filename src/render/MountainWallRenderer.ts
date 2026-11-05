import type Phaser from 'phaser';
import { BATTLE } from '../data/battle';
import type { KingId } from '../data/types';
import { ensureMountainWallTextures } from './mountainWallAssets';
import { layoutWall } from './mountainWallModel';

/** How far the wall runs past each side of the field (world px): covers any camera at zoom ≥ 1. */
export const WALL_EXTENT = 1024;

/**
 * The mountain wall behind the castle: pieces laid along the north edge at `BATTLE.wallY`, drawn above
 * the field and below every plot and sprite. Textures are shared and never removed here; nothing is
 * animated, so there is no per-frame update.
 */
export class MountainWallRenderer {
  private images: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, seed: number, kingId?: KingId) {
    const assets = ensureMountainWallTextures(scene.textures, kingId);
    const byId = new Map(assets.map((a) => [a.id, a]));
    for (const p of layoutWall(-WALL_EXTENT, BATTLE.field + WALL_EXTENT, BATTLE.wallY, seed, assets)) {
      const asset = byId.get(p.assetId)!;
      const k = asset.imageScale;
      for (const part of asset.parts) {
        const px = p.flip ? asset.w - part.sourceX - part.w : part.sourceX;
        this.images.push(
          scene.add
            .image(p.x + px * k, p.footY - asset.baseline * k + part.sourceY * k, part.texture, part.frame)
            .setOrigin(0, 0)
            .setScale(k)
            .setFlipX(p.flip)
            .setDepth(p.depth),
        );
      }
    }
  }

  /** Destroys every image; safe to call twice. */
  destroy(): void {
    for (const i of this.images) i.destroy();
    this.images = [];
  }
}
