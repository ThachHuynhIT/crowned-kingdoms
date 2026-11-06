import type Phaser from 'phaser';
import { BATTLE } from '../data/battle';
import type { KingId } from '../data/types';
import { project } from '../core/iso';
import { IsoWallRenderer } from './IsoWallRenderer';
import { ensureFieldTexture, ensureGroundTexture, fieldTextureScale, groundTextureScale } from './atlas';

/** The ground tile spans this many world px each way around the field (covers any zoom ≥ 1). */
const GROUND_SPAN = 4096;

/**
 * The battle field for one seed: grass ground tiled well beyond the field (depth −1, so the
 * map fills the whole screen) with the painted field image at (0, 0) on top (depth 0) and the mountain wall behind the castle (depth 0.1–0.4).
 */
export class FieldRenderer {
  private readonly textures: Phaser.Textures.TextureManager;
  private readonly key: string;
  private image: Phaser.GameObjects.Image | null;
  private ground: Phaser.GameObjects.TileSprite | null;
  private wall: IsoWallRenderer | null;

  constructor(scene: Phaser.Scene, seed: number, kingId?: KingId) {
    this.textures = scene.textures;
    this.key = ensureFieldTexture(scene.textures, seed);
    const mid = project({ x: BATTLE.field / 2, y: BATTLE.field / 2 });
    this.ground = scene.add
      .tileSprite(mid.x, mid.y, GROUND_SPAN, GROUND_SPAN, ensureGroundTexture(scene.textures))
      .setTileScale(groundTextureScale(scene.textures))
      .setDepth(-1);
    // The isometric field: its top corner is world (0, 0), projected (0, 0).
    this.image = scene.add
      .image(0, 0, this.key)
      .setOrigin(0.5, 0)
      .setScale(fieldTextureScale(scene.textures, this.key))
      .setDepth(0);
    // Isometric cliff drawn in code until the isometric wall art (Task 11); the king skin waits for it.
    void kingId;
    this.wall = new IsoWallRenderer(scene, seed);
  }

  /** Destroys the images, then removes the `field-<seed>` texture (nothing else uses it). */
  destroy(): void {
    if (this.image === null) return;
    this.wall?.destroy();
    this.wall = null;
    this.ground?.destroy();
    this.ground = null;
    this.image.destroy();
    this.image = null;
    if (this.textures.exists(this.key)) this.textures.remove(this.key);
  }
}
