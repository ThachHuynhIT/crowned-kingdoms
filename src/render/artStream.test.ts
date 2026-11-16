import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./atlas', () => ({
  SPRITES_KEY: 'sprites',
  GROUND_KEY: 'field-ground',
  ROAD_TAIL_KEY: 'field-road-tail',
  buildSpritesTexture: vi.fn(),
}));

import type Phaser from 'phaser';
import type { Content } from '../game/cards/registry';
import { buildSpritesTexture } from './atlas';
import { applyStreamedArt, artStreamReady, artStreamStarted, resetArtStream, streamedArtPending } from './artStream';

const fakeTextures = (keys: string[]) => {
  const set = new Set(keys);
  return {
    set,
    textures: { exists: (k: string) => set.has(k), remove: (k: string) => set.delete(k) } as unknown as Phaser.Textures.TextureManager,
  };
};
const content = {} as Content;

describe('streamed close-up art', () => {
  afterEach(() => {
    resetArtStream();
    vi.mocked(buildSpritesTexture).mockClear();
  });

  it('is pending only once the stream has loaded, and only until it is applied', () => {
    expect(streamedArtPending()).toBe(false);
    artStreamStarted([{ from: 'imgart-a', to: 'imgart-uhd-a' }]);
    expect(streamedArtPending()).toBe(false);
    artStreamReady();
    expect(streamedArtPending()).toBe(true);
    applyStreamedArt(fakeTextures([]).textures, content);
    expect(streamedArtPending()).toBe(false);
  });

  it('does nothing before the stream is ready', () => {
    const t = fakeTextures(['sprites', 'imgart-a', 'imgart-uhd-a']);
    artStreamStarted([{ from: 'imgart-a', to: 'imgart-uhd-a' }]);
    applyStreamedArt(t.textures, content);
    expect([...t.set]).toEqual(['sprites', 'imgart-a', 'imgart-uhd-a']);
    expect(buildSpritesTexture).not.toHaveBeenCalled();
  });

  it('drops the atlas, ground and the start-up art whose twin loaded, keeps the rest, then rebuilds the atlas', () => {
    const t = fakeTextures(['sprites', 'field-ground', 'field-road-tail', 'imgart-a', 'imgart-uhd-a', 'imgart-b']);
    artStreamStarted([
      { from: 'imgart-a', to: 'imgart-uhd-a' },
      { from: 'imgart-b', to: 'imgart-uhd-b' }, // failed to load: the start-up art stays
    ]);
    artStreamReady();
    applyStreamedArt(t.textures, content);
    expect([...t.set].sort()).toEqual(['imgart-b', 'imgart-uhd-a']);
    expect(buildSpritesTexture).toHaveBeenCalledOnce();
    applyStreamedArt(t.textures, content); // applied once only
    expect(buildSpritesTexture).toHaveBeenCalledOnce();
  });
});
