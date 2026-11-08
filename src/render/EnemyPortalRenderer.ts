import type Phaser from 'phaser';
import { ENEMY_PORTAL } from '../data/battle';
import { ensurePortalTexture } from './atlas';
import { iso } from './isoView';
import { PORTAL_FOOT_Y, PORTAL_SIZE } from './portalArt';

/**
 * The enemy portal at the south end of the road (spec 2026-11-08 §3, Q2): drawn upright on the projected
 * `ENEMY_PORTAL` point, depth-sorted by that point like a standing object, so foes stepping out of its mouth
 * (just north of it) are drawn behind the gate. Drawing only: the battle never sees it. The code-drawn gate stays
 * until the owner approves the portal art (Q5), which will only swap the texture.
 */
export class EnemyPortalRenderer {
  private image: Phaser.GameObjects.Image | null;

  constructor(scene: Phaser.Scene) {
    const at = iso(ENEMY_PORTAL);
    this.image = scene.add
      .image(Math.round(at.x), Math.round(at.y), ensurePortalTexture(scene.textures))
      .setOrigin(0.5, PORTAL_FOOT_Y / PORTAL_SIZE.h)
      .setDepth(at.y);
  }

  /** Safe to call twice. */
  destroy(): void {
    this.image?.destroy();
    this.image = null;
  }
}
