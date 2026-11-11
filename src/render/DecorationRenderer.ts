import type { RunMode } from '../data/rules';
import type Phaser from 'phaser';
import { layoutDecorations } from './decorationModel';
import { DECOR_APPROVED, DECOR_CATALOG, decorFile, imageArtScale, imageArtTexture } from './imageArt';
import { iso } from './isoView';

/**
 * The wild objects around the board (spec 2026-11-06 §5, P4): the seeded layout of the owner-approved objects,
 * each drawn upright on its projected foot and depth-sorted with the buildings and units. Drawing only; an object
 * whose PNG did not load is skipped. Nothing moves, so there is no per-frame update. An HD twin (density ≥ 2) is drawn at
 * half scale, so every object keeps its size and foot.
 */
export class DecorationRenderer {
  private images: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, seed: number, mode: RunMode = 'normal') {
    const exists = (key: string): boolean => scene.textures.exists(key);
    const approved = DECOR_CATALOG.filter((a) => DECOR_APPROVED.includes(a.id) && imageArtTexture(exists, decorFile(a.id)) !== null);
    for (const p of layoutDecorations(seed, approved, mode)) {
      const at = iso(p);
      const tex = imageArtTexture(exists, decorFile(p.assetId))!;
      this.images.push(
        scene.add
          .image(Math.round(at.x), Math.round(at.y), tex.key)
          .setOrigin(0.5, 1)
          .setScale(imageArtScale(1, tex.hd))
          .setDepth(at.y),
      );
    }
  }

  get count(): number {
    return this.images.length;
  }

  /** Safe to call twice. */
  destroy(): void {
    for (const i of this.images) i.destroy();
    this.images = [];
  }
}
