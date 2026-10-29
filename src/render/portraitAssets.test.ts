import { describe, expect, it } from 'vitest';
import { ALL_KINGS } from '../data/rules';
import { KING_CARD_WINDOW } from './kingCardArt';
import { PORTRAIT_ASSETS, PORTRAIT_DIR, portraitPlacement, portraitTextureKey } from './portraitAssets';

describe('PORTRAIT_ASSETS', () => {
  it('lists all nine kings with 96×144 pictures, unique files and unique texture keys', () => {
    expect(Object.keys(PORTRAIT_ASSETS).sort()).toEqual([...ALL_KINGS].sort());
    const files = ALL_KINGS.map((k) => PORTRAIT_ASSETS[k].file);
    expect(new Set(files).size).toBe(9);
    expect(new Set(ALL_KINGS.map(portraitTextureKey)).size).toBe(9);
    for (const k of ALL_KINGS) {
      expect(PORTRAIT_ASSETS[k]).toEqual({ file: `${k}.png`, width: 96, height: 144 });
    }
  });

  it('keeps the pictures in their own folder, apart from the world atlas', () => {
    expect(PORTRAIT_DIR).toBe('assets/art/ai-v1/portraits/');
    expect(portraitTextureKey('wheat')).toBe('king-portrait-wheat');
  });
});

describe('portraitPlacement', () => {
  const win = KING_CARD_WINDOW;

  it('puts a 96×144 portrait in the window at half the card scale (whole pixels), filling it', () => {
    for (const scale of [2, 4]) {
      const p = portraitPlacement(win, scale, { w: 96, h: 144 });
      expect(p).toEqual({ x: win.x * scale, y: win.y * scale, scale: scale / 2 });
    }
  });

  it('centres the old 48×48 placeholder top to bottom at the card scale', () => {
    const p = portraitPlacement(win, 4, { w: 48, h: 48 });
    expect(p.scale).toBe(4);
    expect(p.x).toBe(win.x * 4);
    expect(p.y).toBe(win.y * 4 + ((win.h * 4 - 48 * 4) >> 1));
  });

  it('uses a non-integer card scale (carousel) without rounding the picture scale away', () => {
    const p = portraitPlacement(win, 4.9, { w: 96, h: 144 });
    expect(p.scale).toBeCloseTo(2.45, 5);
    expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
  });
});
