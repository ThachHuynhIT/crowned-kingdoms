import Phaser from 'phaser';
import { CONTENT } from '../game/cards/registry';
import { artQuality } from '../render/artQuality';
import { applyStreamedArt, artStreamReady, artStreamStarted, streamedArtPending } from '../render/artStream';
import { buildSpritesTexture } from '../render/atlas';
import { WORLD_PICTURE_FILES, imageArtUhdKey, streamedArtLoads, supersededArtKeys } from '../render/imageArt';
import { smoothTextureIfEnabled } from '../render/smoothArt';
import { displayMetrics } from '../ui/displayRuntime';
import { SCENES } from './keys';

/**
 * Loads the close-up art in the background after the menu appears (13/11/2026). Launched once by Preload and never
 * stopped; it draws nothing. Does nothing outside the 'uhd' art tier.
 */
export class ArtStreamScene extends Phaser.Scene {
  constructor() {
    super(SCENES.artStream);
  }

  create(): void {
    const { tier } = artQuality();
    const density = displayMetrics(this).density;
    const loads = streamedArtLoads(tier, density);
    if (loads.length === 0) return;
    const from = supersededArtKeys(tier, density);
    artStreamStarted(loads.map((l, i) => ({ from: from[i]!, to: l.key })));
    for (const { key, url } of loads) this.load.image(key, url);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      // The world pictures drawn whole (wall, wilds, forest, portal) are mipmapped like Preload's.
      for (const file of WORLD_PICTURE_FILES) smoothTextureIfEnabled(this.textures, imageArtUhdKey(file), true);
      artStreamReady();
    });
    this.load.start();
  }
}

/**
 * Build the `sprites` atlas for `scene` (no-op once built), first swapping in the streamed close-up art when it has
 * loaded and no other scene could still show the old textures.
 */
export const ensureSceneSprites = (scene: Phaser.Scene): void => {
  if (streamedArtPending()) {
    const others = scene.game.scene
      .getScenes(false)
      .filter((s) => s !== scene && s.sys.settings.key !== SCENES.artStream)
      .some((s) => s.sys.isActive() || s.sys.isPaused() || s.sys.isSleeping());
    if (!others) applyStreamedArt(scene.textures, CONTENT);
  }
  buildSpritesTexture(scene.textures, CONTENT);
};
