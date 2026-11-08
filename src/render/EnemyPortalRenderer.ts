import type Phaser from 'phaser';
import { ENEMY_PORTAL } from '../data/battle';
import { ensurePortalTexture } from './atlas';
import { PORTAL_APPROVED, PORTAL_ART, imageArtKey } from './imageArt';
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
    const art = imageArtKey(PORTAL_ART.file);
    const useArt = PORTAL_APPROVED && scene.textures.exists(art);
    this.image = useArt
      ? scene.add
          .image(Math.round(at.x), Math.round(at.y), art)
          .setOrigin(PORTAL_ART.foot.x / PORTAL_ART.width, PORTAL_ART.foot.y / PORTAL_ART.height)
          .setDepth(at.y)
      : scene.add
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
