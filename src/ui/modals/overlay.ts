import type Phaser from 'phaser';
import { UI_PALETTE } from '../../data/uiPalette';

/** Opacity of the dimming layer behind every side panel and modal (§10.5). */
export const OVERLAY_ALPHA = 0.6;

export interface OverlayOptions {
  /** Opacity of the dimming layer (default `OVERLAY_ALPHA`). */
  alpha?: number;
  /** Colour of the dimming layer (default `UI_PALETTE.outline`). */
  color?: number;
}

/**
 * Full-screen dimming layer (`outline` at 60 % unless told otherwise) that swallows pointer
 * input so nothing underneath (HUD or board) reacts while a modal is open. It only darkens;
 * there is no blur. Call `fitOverlay` on resize.
 */
export const createOverlay = (
  scene: Phaser.Scene,
  { alpha = OVERLAY_ALPHA, color = UI_PALETTE.outline }: OverlayOptions = {},
): Phaser.GameObjects.Rectangle =>
  scene.add
    .rectangle(0, 0, scene.scale.width, scene.scale.height, color, alpha)
    .setOrigin(0, 0)
    .setInteractive();

export const fitOverlay = (scene: Phaser.Scene, overlay: Phaser.GameObjects.Rectangle): void => {
  const { width, height } = scene.scale;
  overlay.setSize(width, height);
  if (overlay.input) overlay.input.hitArea.setSize(width, height);
};
