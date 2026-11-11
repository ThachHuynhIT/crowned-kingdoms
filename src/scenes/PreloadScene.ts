import Phaser from 'phaser';
import { ALL_KINGS } from '../data/rules';
import { UI_PALETTE } from '../data/uiPalette';
import { CONTENT } from '../game/cards/registry';
import { buildSpritesTexture, buildUiTexture } from '../render/atlas';
import { WALL_IMAGES, WALL_IMAGE_DIR, wallImageKey } from '../render/mountainWallAssets';
import { imageArtLoads, useHdArt } from '../render/imageArt';
import { PORTRAIT_ASSETS, PORTRAIT_DIR, portraitLargeTextureKey, portraitTextureKey } from '../render/portraitAssets';
import type { UiFrame } from '../render/uiArt';
import { UI_KIT_DIR, UI_KIT_FILES, kitTextureKey } from '../render/uiKit';
import { CARD_ART_FILES } from '../ui/cards/cardImage';
import { KING_BADGE_FILES } from '../ui/realm/kingBadge';
import { queueHudArtHd } from '../render/hudArtHd';
import { bindSceneDisplay, displayMetrics, logicalSize } from '../ui/displayRuntime';
import { textStyle } from '../ui/theme';
import { SCENES } from './keys';

const LOADING_LABEL = 'Đang dựng vương quốc…';

/** Loads (or, for now, generates) every shared asset before the menu appears. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.preload);
  }

  preload(): void {
    const { w: width, h: height } = logicalSize(this);
    const label = this.add
      .text(width / 2, height / 2, LOADING_LABEL, textStyle(16, UI_PALETTE.creamLight))
      .setOrigin(0.5);
    bindSceneDisplay(this, () => {
      const s = logicalSize(this);
      label.setPosition(s.w / 2, s.h / 2);
    });
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => {
      label.setText(`${LOADING_LABEL} ${Math.round(p * 100)}%`);
    });
    // Kenney Pixel UI Pack frames (CC0); a file that fails to load leaves the generated frame.
    for (const [frame, file] of Object.entries(UI_KIT_FILES) as [UiFrame, string][]) {
      this.load.image(kitTextureKey(frame), UI_KIT_DIR + file);
    }
    // Image art (G3e ai-v1; its HD twins from ai-v1-hd at density ≥ 2); a file that fails to load leaves the generated
    // art in its place.
    for (const { key, url } of imageArtLoads(useHdArt(displayMetrics(this).density))) this.load.image(key, url);
    // Mountain wall backdrop per king (G3e); a file that fails to load leaves the placeholder wall.
    for (const s of WALL_IMAGES) this.load.image(wallImageKey(s.id), `${WALL_IMAGE_DIR}${s.id}.png`);
    // King portraits (G3e), 96×144 each; a file that fails to load leaves the generated placeholder portrait.
    for (const id of ALL_KINGS) {
      this.load.image(portraitTextureKey(id), `${PORTRAIT_DIR}${PORTRAIT_ASSETS[id].file}`);
      this.load.image(portraitLargeTextureKey(id), `${PORTRAIT_DIR}${PORTRAIT_ASSETS[id].large.file}`);
    }
    // Card illustrations (G3e, 96×72 + 48×36); a file that fails to load leaves the 32×24 atlas picture.
    for (const f of CARD_ART_FILES) this.load.image(f.key, f.url);
    // King badges on the calendar (G3e, 32 + 16 px); a file that fails to load leaves the colour square.
    for (const f of KING_BADGE_FILES) this.load.image(f.key, f.url);
    // HD twins of the HUD art (cards, portraits, king cards, menu, icons) on density ≥ 2 screens (11/11/2026).
    queueHudArtHd(this.load, displayMetrics(this).density);
    // Real assets (atlases, audio) will be queued here with this.load.*.
  }

  create(): void {
    buildUiTexture(this.textures);
    // World sprites, card pictures and icons: built once, shared by every scene.
    buildSpritesTexture(this.textures, CONTENT);
    this.scene.start(SCENES.mainMenu);
  }
}
