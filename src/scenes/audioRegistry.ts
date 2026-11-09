import type Phaser from 'phaser';
import type { AudioManager } from '../audio/AudioManager';

const AUDIO_KEY = 'audioManager';

/** One manager for the lifetime of the game; Boot does not open a context. */
export const setAudio = (game: Phaser.Game, audio: AudioManager): void => {
  game.registry.set(AUDIO_KEY, audio);
};

export const getAudio = (scene: Phaser.Scene): AudioManager | null =>
  (scene.registry.get(AUDIO_KEY) as AudioManager | undefined) ?? null;
