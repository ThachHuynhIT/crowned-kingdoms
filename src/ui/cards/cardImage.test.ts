import { describe, expect, it } from 'vitest';
import { SPRITES_KEY, cardArtFrame } from '../../render/atlas';
import { CARD_ART_FILES, VERTICAL_CARD_ART, pickCardImage, resolveCardImage, type CardImageRef } from './cardImage';
import { cardLayout, fitArt, type CardDensity } from './cardLayout';

const WHEAT = ['throne', 'field', 'fertilizer', 'windmill', 'harvest_festival', 'granary', 'peasant_horde', 'militia', 'reapers', 'scarecrow'];

describe('pickCardImage', () => {
  const small: CardImageRef = { key: 's', frame: '__BASE', w: 48, h: 36 };
  const big: CardImageRef = { key: 'b', frame: '__BASE', w: 96, h: 72, small };

  it('keeps the full picture when it fits at scale 1', () => {
    expect(pickCardImage({ w: 112, h: 84 }, big)).toBe(big);
  });

  it('falls back to the smaller picture instead of scaling by a fraction', () => {
    expect(pickCardImage({ w: 88, h: 66 }, big)).toBe(small);
  });

  it('keeps the only picture there is', () => {
    expect(pickCardImage({ w: 10, h: 10 }, small)).toBe(small);
  });
});

describe('Wheat card art (approved 2026-10-29, wired 2026-11-06)', () => {
  it('every Wheat card has a 96×72 picture with a 48×36 fallback, both loaded', () => {
    for (const card of WHEAT) {
      const ref = VERTICAL_CARD_ART[`wheat_${card}`];
      expect(ref, card).toMatchObject({ w: 96, h: 72, small: { w: 48, h: 36 } });
      expect(CARD_ART_FILES.map((f) => f.key)).toContain(ref!.key);
      expect(CARD_ART_FILES.map((f) => f.key)).toContain(ref!.small!.key);
    }
    expect(new Set(CARD_ART_FILES.map((f) => f.key)).size).toBe(CARD_ART_FILES.length);
  });

  it('on every card size a Wheat picture fits whole at an integer scale', () => {
    const sizes: [number, number, CardDensity][] = [
      [72, 112, 'compact'], [84, 132, 'compact'], [96, 144, 'compact'], [100, 150, 'compact'],
      [108, 162, 'full'], [120, 176, 'full'], [120, 180, 'full'], [180, 288, 'full'],
    ];
    for (const [w, h, density] of sizes) {
      const { art } = cardLayout({ w, h }, 4, density);
      const ref = pickCardImage(art, VERTICAL_CARD_ART.wheat_field!);
      const fit = fitArt(art, ref);
      expect(fit.w, `${w}x${h}`).toBeLessThanOrEqual(art.w);
      expect(fit.h, `${w}x${h}`).toBeLessThanOrEqual(art.h);
    }
  });
});

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
