import { describe, expect, it } from 'vitest';
import { SPRITES_KEY, cardArtFrame } from '../../render/atlas';
import { resolveCardImage, type CardImageRef } from './cardImage';

describe('resolveCardImage', () => {
  it('falls back to the 32×24 picture in the sprites atlas when no vertical art exists', () => {
    expect(resolveCardImage('wheat_militia', {})).toEqual({
      key: SPRITES_KEY,
      frame: cardArtFrame('wheat_militia'),
      w: 32,
      h: 24,
    });
  });

  it('uses the new picture and its own metadata as soon as one is registered for the card', () => {
    const vertical: CardImageRef = { key: 'card-art-vertical', frame: 'wheat_militia', w: 64, h: 96 };
    expect(resolveCardImage('wheat_militia', { wheat_militia: vertical })).toEqual(vertical);
  });

  it('only replaces the cards that have new art', () => {
    const vertical: CardImageRef = { key: 'card-art-vertical', frame: 'wheat_militia', w: 64, h: 96 };
    expect(resolveCardImage('wheat_scarecrow', { wheat_militia: vertical }).key).toBe(SPRITES_KEY);
  });
});
