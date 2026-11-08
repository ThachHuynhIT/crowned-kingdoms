import type Phaser from 'phaser';
import { layoutDecorations } from './decorationModel';
import { DECOR_APPROVED, DECOR_CATALOG, decorFile, imageArtKey } from './imageArt';
import { iso } from './isoView';

/**
 * The wild objects around the board (spec 2026-11-06 §5, P4): the seeded layout of the owner-approved objects,
 * each drawn upright on its projected foot and depth-sorted with the buildings and units. Drawing only; an object
 * whose PNG did not load is skipped. Nothing moves, so there is no per-frame update.
 */
export class DecorationRenderer {
  private images: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, seed: number) {
    const approved = DECOR_CATALOG.filter((a) => DECOR_APPROVED.includes(a.id) && scene.textures.exists(imageArtKey(decorFile(a.id))));
    for (const p of layoutDecorations(seed, approved)) {
      const at = iso(p);
      this.images.push(
        scene.add.image(Math.round(at.x), Math.round(at.y), imageArtKey(decorFile(p.assetId))).setOrigin(0.5, 1).setDepth(at.y),
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
