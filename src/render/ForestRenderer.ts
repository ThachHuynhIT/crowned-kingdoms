import type { RunMode } from '../data/rules';
import type Phaser from 'phaser';
import { layoutForest } from './forestModel';
import { FOREST_APPROVED, FOREST_CATALOG, forestFile, imageArtKey } from './imageArt';
import { iso } from './isoView';

/** The forest sits behind the cliff (depth 0.2) and above the ground and the field image (depth ≤ 0.01). */
const DEPTH_BASE = 0.05;
const DEPTH_SPAN = 0.1;

/**
 * The forest behind the mountain cliff (spec 2026-11-08 §6, Q5): the seeded layout of the owner-approved forest
 * objects, each drawn upright on the plateau, i.e. its projected foot raised by the cliff height `lift`, and sorted
 * among themselves by that foot. The whole layer stays behind the cliff, so the cliff hides the trunks along its top
 * and no tree ever covers the board, a building or a unit. Drawing only; an object whose PNG did not load is skipped.
 */
export class ForestRenderer {
  private images: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, seed: number, lift: number, mode: RunMode = 'normal') {
    const approved = FOREST_CATALOG.filter((a) => FOREST_APPROVED.includes(a.id) && scene.textures.exists(imageArtKey(forestFile(a.id))));
    const placed = layoutForest(seed, approved, mode);
    const feet = placed.map((p) => iso(p));
    const ys = feet.map((f) => f.y);
    const lo = Math.min(...ys, 0);
    const hi = Math.max(...ys, lo + 1);
    placed.forEach((p, i) => {
      const at = feet[i]!;
      this.images.push(
        scene.add
          .image(Math.round(at.x), Math.round(at.y - lift), imageArtKey(forestFile(p.assetId)))
          .setOrigin(0.5, 1)
          .setDepth(DEPTH_BASE + (DEPTH_SPAN * (at.y - lo)) / (hi - lo + 1)),
      );
    });
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
