import type Phaser from 'phaser';
import { addPixelTexture } from '../render/atlas';
import { hudTexture } from '../render/hudArtHd';
import { MENU_SKY_FILE, imageArtKey, menuImageLayers } from '../render/imageArt';
import { HILL_LAYERS, MENU_SKY_H, menuPixelScale, paintHills, paintSky } from '../render/uiArt';
import { displayMetrics, logicalSize } from './displayRuntime';

const SKY_KEY = 'menu-sky';
const hillKey = (layer: number): string => `menu-hills-${layer}`;
/** Drift of the painted hill strips (screen px per second), far to near. */
const PARALLAX = [4, 8, 16] as const;

/**
 * The main menu's dusk sky and drifting hills (approved pictures, else the painted bands), shared by the screens
 * outside the game (12/11/2026: "update giao diện phần ngoài"): an optional `shade` colour over it keeps text readable
 * and lets King select keep its colour per king. Call `layout()` on resize and `update(delta)` every frame.
 */
export class MenuBackdrop {
  private readonly sky: Phaser.GameObjects.TileSprite;
  private readonly hills: Phaser.GameObjects.TileSprite[];
  private readonly parallax: number[];
  private readonly skyFactor: number;
  private readonly hillFactors: number[];
  private readonly shade: Phaser.GameObjects.Rectangle | null;
  private pix = 1;

  constructor(private readonly scene: Phaser.Scene, shade?: { color: number; alpha: number }) {
    addPixelTexture(scene.textures, SKY_KEY, paintSky());
    const density = displayMetrics(scene).density;
    const sky =
      MENU_SKY_FILE && scene.textures.exists(imageArtKey(MENU_SKY_FILE))
        ? hudTexture(scene.textures, imageArtKey(MENU_SKY_FILE), density)
        : { key: SKY_KEY, factor: 1 };
    this.skyFactor = sky.factor;
    this.sky = scene.add.tileSprite(0, 0, 4, MENU_SKY_H * sky.factor, sky.key).setOrigin(0, 0);
    const pictures = menuImageLayers((file) => scene.textures.exists(imageArtKey(file)));
    if (pictures !== null) {
      this.parallax = pictures.map((layer) => layer.parallax);
      const textures = pictures.map((layer) => hudTexture(scene.textures, imageArtKey(layer.file), density));
      this.hillFactors = textures.map((tex) => tex.factor);
      this.hills = textures.map(({ key }) =>
        scene.add.tileSprite(0, 0, 4, scene.textures.getFrame(key).height, key).setOrigin(0, 1),
      );
    } else {
      HILL_LAYERS.forEach((_, i) => addPixelTexture(scene.textures, hillKey(i), paintHills(i)));
      this.parallax = [...PARALLAX];
      this.hillFactors = HILL_LAYERS.map(() => 1);
      this.hills = HILL_LAYERS.map((layer, i) => scene.add.tileSprite(0, 0, 4, layer.height, hillKey(i)).setOrigin(0, 1));
    }
    this.shade = shade ? scene.add.rectangle(0, 0, 4, 4, shade.color, shade.alpha).setOrigin(0, 0) : null;
    this.layout();
  }

  /** Recolour the shade (King select follows the chosen king). */
  setShade(color: number, alpha: number): void {
    this.shade?.setFillStyle(color, alpha);
  }

  /** Every object of the backdrop, back to front (to send them under the rest of a scene). */
  get objects(): Phaser.GameObjects.GameObject[] {
    return [this.sky, ...this.hills, ...(this.shade ? [this.shade] : [])];
  }

  /** The current art scale (screen px per art px), for scenes that size other art with it. */
  get pixelScale(): number {
    return this.pix;
  }

  layout(): void {
    const { w: width, h: height } = logicalSize(this.scene);
    this.pix = menuPixelScale(height);
    const texW = Math.ceil(width / this.pix) + 1;
    this.sky.setSize(texW * this.skyFactor, MENU_SKY_H * this.skyFactor).setScale(this.pix / this.skyFactor);
    this.hills.forEach((hill, i) => {
      const f = this.hillFactors[i] ?? 1;
      hill.setSize(texW * f, hill.height).setScale(this.pix / f).setPosition(0, height);
    });
    this.shade?.setSize(width, height);
  }

  update(delta: number): void {
    this.hills.forEach((hill, i) => {
      hill.tilePositionX += ((this.parallax[i] ?? 0) * delta * (this.hillFactors[i] ?? 1)) / 1000 / this.pix;
    });
  }
}
