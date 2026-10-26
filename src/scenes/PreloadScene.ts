import Phaser from 'phaser';
import { UI_PALETTE } from '../data/uiPalette';
import { CONTENT } from '../game/cards/registry';
import { buildSpritesTexture, buildUiTexture } from '../render/atlas';
import { WALL_IMAGES, WALL_IMAGE_DIR, wallImageKey } from '../render/mountainWallAssets';
import { IMAGE_ART_DIR, IMAGE_ART_FILES, imageArtKey } from '../render/imageArt';
import type { UiFrame } from '../render/uiArt';
import { UI_KIT_DIR, UI_KIT_FILES, kitTextureKey } from '../render/uiKit';
import { textStyle } from '../ui/theme';
import { SCENES } from './keys';

const LOADING_LABEL = 'Đang dựng vương quốc…';

/** Loads (or, for now, generates) every shared asset before the menu appears. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.preload);
  }

  preload(): void {
    const { width, height } = this.scale;
    const label = this.add
      .text(width / 2, height / 2, LOADING_LABEL, textStyle(16, UI_PALETTE.creamLight))
      .setOrigin(0.5);
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => {
      label.setText(`${LOADING_LABEL} ${Math.round(p * 100)}%`);
    });
    // Kenney Pixel UI Pack frames (CC0); a file that fails to load leaves the generated frame.
    for (const [frame, file] of Object.entries(UI_KIT_FILES) as [UiFrame, string][]) {
      this.load.image(kitTextureKey(frame), UI_KIT_DIR + file);
    }
    // Image art (G3e ai-v1); a file that fails to load leaves the generated art in its place.
    for (const file of IMAGE_ART_FILES) this.load.image(imageArtKey(file), `${IMAGE_ART_DIR}${file}.png`);
    // Mountain wall backdrop per king (G3e); a file that fails to load leaves the placeholder wall.
    for (const s of WALL_IMAGES) this.load.image(wallImageKey(s.id), `${WALL_IMAGE_DIR}${s.id}.png`);
    // Real assets (atlases, audio) will be queued here with this.load.*.
  }

  create(): void {
    buildUiTexture(this.textures);
    // World sprites, card pictures and icons: built once, shared by every scene.
    buildSpritesTexture(this.textures, CONTENT);
    this.scene.start(SCENES.mainMenu);
  }
}
