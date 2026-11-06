import type Phaser from 'phaser';
import { project } from '../core/iso';
import { BATTLE } from '../data/battle';
import { PALETTE } from '../data/palette';
import { WALL_FILE, imageArtKey } from './imageArt';
import { pixelHash } from './pixel';

/** How far the cliff runs past each side of the field (world px). */
export const ISO_WALL_EXTENT = 1024;
/** Height of the cliff face on screen at zoom 1. */
export const ISO_WALL_HEIGHT = 96;
/** The cliff sits behind every plot and sprite (they all stand south of it). */
const DEPTH = 0.2;

/** Fill a closed polygon with the current fill style. */
const fillPoly = (g: Phaser.GameObjects.Graphics, pts: readonly { x: number; y: number }[]): void => {
  g.beginPath();
  g.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i]!.x, pts[i]!.y);
  g.closePath();
  g.fillPath();
};

/**
 * The mountain wall behind the castle in the isometric view (spec 2026-11-06, P3). The world's
 * north edge (y = `BATTLE.wallY`) runs along a 2:1 diagonal on screen, which the horizontal wall
 * pictures cannot follow, so until the isometric wall art exists (Task 11) the cliff is drawn in
 * code: a stone face standing on the projected wall line, a lit top lip, deterministic rock
 * blocks, and the mountain top behind it. Nothing moves; there is no per-frame update.
 */
export class IsoWallRenderer {
  private g: Phaser.GameObjects.Graphics | null;

  private images: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, seed: number) {
    const g = scene.add.graphics().setDepth(DEPTH);
    this.g = g;
    const a = project({ x: -ISO_WALL_EXTENT, y: BATTLE.wallY });
    const b = project({ x: BATTLE.field + ISO_WALL_EXTENT, y: BATTLE.wallY });
    const key = imageArtKey(WALL_FILE);
    if (scene.textures.exists(key)) {
      this.tileArt(scene, key, a, b);
      return;
    }
    const h = ISO_WALL_HEIGHT;
    // Mountain top behind the cliff: everything above the cliff's top edge.
    g.fillStyle(PALETTE.grassDark, 1);
    fillPoly(g, [{ x: a.x, y: a.y - h }, { x: b.x, y: b.y - h }, { x: b.x, y: b.y - h - 4000 }, { x: a.x, y: a.y - h - 4000 }]);
    // The cliff face.
    g.fillStyle(PALETTE.stone, 1);
    fillPoly(g, [a, b, { x: b.x, y: b.y - h }, { x: a.x, y: a.y - h }]);
    // Rock blocks: 2:1 slanted bricks along the face, light from the upper left.
    const dx = b.x - a.x;
    const step = 24;
    for (let i = 0; i * step < dx; i++)
      for (let row = 0; row < 4; row++) {
        const r = pixelHash(i, row, seed);
        const x = a.x + i * step + (row % 2) * (step / 2);
        const y = a.y + ((x - a.x) * (b.y - a.y)) / dx - 12 - row * 22;
        g.fillStyle(r < 0.33 ? PALETTE.stoneDark : r < 0.66 ? PALETTE.stoneLight : PALETTE.stone, 1);
        fillPoly(g, [{ x, y }, { x: x + step - 4, y: y + (step - 4) / 2 }, { x: x + step - 4, y: y + (step - 4) / 2 - 14 }, { x, y: y - 14 }]);
      }
    // Lit top lip and the dark foot line on the ground.
    g.lineStyle(4, PALETTE.stoneLight, 1);
    g.lineBetween(a.x, a.y - h + 2, b.x, b.y - h + 2);
    g.lineStyle(3, PALETTE.outline, 1);
    g.lineBetween(a.x, a.y, b.x, b.y);
  }

  /**
   * The approved cliff segments end to end along the projected wall line: each segment's foot runs at 2:1 and its
   * right foot is its bottom row, so a segment placed at screen x `sx` stands with its bottom-left corner on the line
   * below x `sx + width`. Behind them the mountain top is filled in, as in the code cliff.
   */
  private tileArt(scene: Phaser.Scene, key: string, a: { x: number; y: number }, b: { x: number; y: number }): void {
    const frame = scene.textures.get(key).get();
    const w = frame.width;
    const lineY = (x: number): number => a.y + (x - a.x) / 2;
    const g = this.g!;
    const top = frame.height - w / 2; // face height above the foot at the left edge
    g.fillStyle(PALETTE.grassDark, 1);
    fillPoly(g, [{ x: a.x, y: a.y - top + 4 }, { x: b.x, y: b.y - top + 4 }, { x: b.x, y: b.y - top - 4000 }, { x: a.x, y: a.y - top - 4000 }]);
    for (let sx = a.x; sx < b.x; sx += w) {
      this.images.push(scene.add.image(sx, lineY(sx + w), key).setOrigin(0, 1).setDepth(DEPTH + 0.01));
    }
  }

  /** Safe to call twice. */
  destroy(): void {
    this.g?.destroy();
    this.g = null;
    for (const i of this.images) i.destroy();
    this.images = [];
  }
}
