import type Phaser from 'phaser';
import { SPRITES_KEY, iconFrame, ruleIconFrame } from '../render/atlas';
import type { IconId } from '../render/iconArt';

/** The atlas frame of the per-rule icon `id` (a decree, quest or `perk_<perkId>`), else the shared `fallback` icon. */
export const ruleIconOr = (scene: Phaser.Scene, id: string, fallback: IconId): string => {
  const frame = ruleIconFrame(id);
  return scene.textures.exists(SPRITES_KEY) && scene.textures.get(SPRITES_KEY).has(frame) ? frame : iconFrame(fallback);
};
