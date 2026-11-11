import type { RunMode } from '../data/rules';
import { geometryFor } from '../game/run/boardGeometry';
import type Phaser from 'phaser';
import { ensurePortalTexture } from './atlas';
import { PORTAL_APPROVED, PORTAL_ART, imageArtScale, imageArtTexture } from './imageArt';
import { iso } from './isoView';
import { PORTAL_FOOT_Y, PORTAL_SIZE } from './portalArt';

/**
 * The enemy portal at the south end of the road (spec 2026-11-08 §3, Q2): drawn upright on the projected
 * `ENEMY_PORTAL` point, depth-sorted by that point like a standing object, so foes stepping out of its mouth
 * (just north of it) are drawn behind the gate. Drawing only: the battle never sees it. The code-drawn gate stays
 * until the owner approves the portal art (Q5), which will only swap the texture. Its HD twin (density ≥ 2) is drawn at
 * half scale with the same relative origin, so the foot stays on the portal point.
 */
export class EnemyPortalRenderer {
  private image: Phaser.GameObjects.Image | null;

  constructor(scene: Phaser.Scene, mode: RunMode = 'normal') {
    const at = iso(geometryFor(mode).portal);
    const art = PORTAL_APPROVED ? imageArtTexture((key) => scene.textures.exists(key), PORTAL_ART.file) : null;
    this.image = art
      ? scene.add
          .image(Math.round(at.x), Math.round(at.y), art.key)
          .setOrigin(PORTAL_ART.foot.x / PORTAL_ART.width, PORTAL_ART.foot.y / PORTAL_ART.height)
          .setScale(imageArtScale(1, art.hd))
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
