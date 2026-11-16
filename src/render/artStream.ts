/**
 * Close-up art streamed after start-up (13/11/2026): Preload loads the display density's art, `ArtStreamScene` loads
 * the close-up twins in the background, and the next scene that builds the `sprites` atlas while no other scene shows
 * it swaps them in (`applyStreamedArt`). Until then the game runs on the start-up art.
 */
import type Phaser from 'phaser';
import type { Content } from '../game/cards/registry';
import { GROUND_KEY, ROAD_TAIL_KEY, SPRITES_KEY, buildSpritesTexture } from './atlas';

interface StreamState {
  /** Pairs of (start-up key, streamed key), in load order. */
  readonly swaps: readonly { readonly from: string; readonly to: string }[];
  ready: boolean;
  applied: boolean;
}

let stream: StreamState | null = null;

/** The background load has started; `swaps` pairs each start-up key with the key that replaces it. */
export const artStreamStarted = (swaps: readonly { readonly from: string; readonly to: string }[]): void => {
  stream = { swaps, ready: false, applied: false };
};

/** The background load has finished (files that failed simply never replace their start-up art). */
export const artStreamReady = (): void => {
  if (stream) stream.ready = true;
};

/** Streamed art has loaded but the atlas still holds the start-up art. */
export const streamedArtPending = (): boolean => stream !== null && stream.ready && !stream.applied;

/**
 * Swap the streamed art in: drop the `sprites` atlas, the painted ground and road tail (rebuilt from the new art) and
 * every start-up texture whose replacement loaded, then build the atlas again. Call it only when no scene shows
 * any of those textures.
 */
export const applyStreamedArt = (textures: Phaser.Textures.TextureManager, content: Content): void => {
  if (!stream || !stream.ready || stream.applied) return;
  stream.applied = true;
  for (const key of [SPRITES_KEY, GROUND_KEY, ROAD_TAIL_KEY]) if (textures.exists(key)) textures.remove(key);
  for (const { from, to } of stream.swaps) if (textures.exists(to) && textures.exists(from)) textures.remove(from);
  buildSpritesTexture(textures, content);
};

/** Test hook: forget the stream. */
export const resetArtStream = (): void => {
  stream = null;
};
