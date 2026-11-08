import type Phaser from 'phaser';
import type { KingId } from '../data/types';
import { project } from '../core/iso';
import { DecorationRenderer } from './DecorationRenderer';
import { EnemyPortalRenderer } from './EnemyPortalRenderer';
import { IsoWallRenderer } from './IsoWallRenderer';
import { ensureFieldTexture, ensureGroundTexture, ensureRoadTailTexture, fieldTextureScale, groundTextureScale } from './atlas';
import { ROAD_TAIL } from './fieldArt';

/** The ground covers at least this many projected px each way around the origin (any view of the map). */
const GROUND_SPAN = 8192;
/** World (−8, −8), projected (0, −8): the origin of the field's 16 px grass tile grid (dual grid, half a tile up-left). */
const TILE_GRID_Y = -8;

/**
 * The battle field for one seed: grass ground tiled well beyond the field (depth −1, so the
 * map fills the whole screen) with the painted field image at (0, 0) on top (depth 0) and the mountain wall behind the castle (depth 0.1–0.4).
 */
export class FieldRenderer {
  private readonly textures: Phaser.Textures.TextureManager;
  private readonly key: string;
  private image: Phaser.GameObjects.Image | null;
  private ground: Phaser.GameObjects.TileSprite | null;
  private roadTail: Phaser.GameObjects.Image | null;
  private wall: IsoWallRenderer | null;
  private decor: DecorationRenderer | null;
  private portal: EnemyPortalRenderer | null;

  constructor(scene: Phaser.Scene, seed: number, kingId?: KingId) {
    this.textures = scene.textures;
    this.key = ensureFieldTexture(scene.textures, seed);
    // The ground tile repeats every (pw × ph) on screen; its pixel (pw/2, 0) is the grass grid origin, so the
    // TileSprite starts a whole number of periods left/up of it: the grass beyond the field lines up with the field's.
    const groundKey = ensureGroundTexture(scene.textures);
    const scale = groundTextureScale(scene.textures);
    const src = scene.textures.get(groundKey).getSourceImage();
    const pw = src.width * scale;
    const ph = src.height * scale;
    const nx = Math.ceil(GROUND_SPAN / 2 / pw);
    const ny = Math.ceil(GROUND_SPAN / 2 / ph);
    this.ground = scene.add
      .tileSprite(-pw / 2 - nx * pw, TILE_GRID_Y - ny * ph, (2 * nx + 1) * pw, (2 * ny + 1) * ph, groundKey)
      .setOrigin(0, 0)
      .setTileScale(scale)
      .setDepth(-1);
    // The isometric field: its top corner is world (0, 0), projected (0, 0).
    this.image = scene.add
      .image(0, 0, this.key)
      .setOrigin(0.5, 0)
      .setScale(fieldTextureScale(scene.textures, this.key))
      .setDepth(0);
    // The road's last stretch from the field's edge to the enemy portal.
    const tail = project({ x: ROAD_TAIL.x, y: ROAD_TAIL.y });
    this.roadTail = scene.add
      .image(tail.x, tail.y, ensureRoadTailTexture(scene.textures))
      .setOrigin(0.5, 0)
      .setScale(fieldTextureScale(scene.textures, this.key))
      .setDepth(0.01);
    // Isometric cliff drawn in code until the isometric wall art (Task 11); the king skin waits for it.
    void kingId;
    this.wall = new IsoWallRenderer(scene, seed);
    this.decor = new DecorationRenderer(scene, seed);
    this.portal = new EnemyPortalRenderer(scene);
  }

  /** Destroys the images, then removes the `field-<seed>` texture (nothing else uses it). */
  destroy(): void {
    if (this.image === null) return;
    this.wall?.destroy();
    this.wall = null;
    this.decor?.destroy();
    this.decor = null;
    this.portal?.destroy();
    this.portal = null;
    this.ground?.destroy();
    this.ground = null;
    this.roadTail?.destroy();
    this.roadTail = null;
    this.image.destroy();
    this.image = null;
    if (this.textures.exists(this.key)) this.textures.remove(this.key);
  }
}
