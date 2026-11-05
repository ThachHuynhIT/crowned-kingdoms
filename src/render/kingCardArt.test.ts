import { describe, expect, it } from 'vitest';
import { ALL_KINGS } from '../data/rules';
import { KING_THEMES, LOCKED_THEME } from '../data/uiPalette';
import { KING_CARD_NATIVE, KING_CARD_WINDOW, kingSuit, paintKingCard } from './kingCardArt';
import type { PixelCanvas } from './pixel';

const colorAt = (c: PixelCanvas, x: number, y: number): number => {
  const i = (y * c.width + x) * 4;
  return (c.data[i]! << 16) | (c.data[i + 1]! << 8) | c.data[i + 2]!;
};
const same = (a: PixelCanvas, b: PixelCanvas): boolean => a.data.every((v, i) => v === b.data[i]);

/** Pixels of `colour` inside the box, as "x,y" keys. */
const cells = (c: PixelCanvas, colour: number, x0: number, y0: number, w: number, h: number): Set<string> => {
  const out = new Set<string>();
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (c.alphaAt(x, y) === 255 && colorAt(c, x, y) === colour) out.add(`${x},${y}`);
  return out;
};

describe('paintKingCard', () => {
  it('is 66×96 and has crisp alpha with cut corners', () => {
    const art = paintKingCard('wheat');
    expect([art.width, art.height]).toEqual([KING_CARD_NATIVE.w, KING_CARD_NATIVE.h]);
    for (let i = 3; i < art.data.length; i += 4) expect([0, 255]).toContain(art.data[i]);
    for (const [x, y] of [[0, 0], [65, 0], [0, 95], [65, 95]] as const) expect(art.alphaAt(x, y), `${x},${y}`).toBe(0);
    expect(art.alphaAt(31, 0)).toBe(255);
  });

  it('is deterministic per king and different for every king', () => {
    expect(same(paintKingCard('arcane'), paintKingCard('arcane'))).toBe(true);
    for (let i = 0; i < ALL_KINGS.length; i++) {
      for (let j = i + 1; j < ALL_KINGS.length; j++) {
        expect(same(paintKingCard(ALL_KINGS[i]!), paintKingCard(ALL_KINGS[j]!)), `${ALL_KINGS[i]} vs ${ALL_KINGS[j]}`).toBe(false);
      }
    }
  });

  it('is coloured from the king theme: outline, paper and an empty window for the portrait', () => {
    for (const king of ALL_KINGS) {
      const art = paintKingCard(king);
      const t = KING_THEMES[king];
      expect(colorAt(art, 31, 0), king).toBe(t.bgDark);
      expect(colorAt(art, KING_CARD_WINDOW.x + 1, KING_CARD_WINDOW.y + 1), king).toBe(t.bgMid);
      expect(colorAt(art, KING_CARD_WINDOW.x + KING_CARD_WINDOW.w - 2, KING_CARD_WINDOW.y + KING_CARD_WINDOW.h - 2), king).toBe(t.bgMid);
    }
  });

  it('has a K and a suit in the top-left and the same two turned upside down in the bottom-right, from separate bitmaps', () => {
    for (const king of ALL_KINGS) {
      const art = paintKingCard(king);
      const ink = KING_THEMES[king].bgMid;
      const top = cells(art, ink, 2, 2, 5, 14);
      const bottom = cells(art, ink, 59, 80, 5, 14);
      expect(top.size, king).toBeGreaterThan(10);
      const rotated = new Set([...top].map((k) => {
        const [x, y] = k.split(',').map(Number) as [number, number];
        return `${65 - x},${95 - y}`;
      }));
      expect(bottom, king).toEqual(rotated);
    }
  });

  it('gives the kings the four suits in turn', () => {
    expect(ALL_KINGS.map(kingSuit)).toEqual(ALL_KINGS.map((_, i) => ['diamond', 'spade', 'heart', 'club'][i % 4]));
  });

  it('paints a locked king in grey with a "?" and a padlock in the window, hiding the king colours', () => {
    const open = paintKingCard('wheat');
    const locked = paintKingCard('wheat', true);
    expect(same(open, locked)).toBe(false);
    expect(colorAt(locked, 31, 0)).toBe(LOCKED_THEME.bgDark);
    const win = new Set<number>();
    for (let y = KING_CARD_WINDOW.y; y < KING_CARD_WINDOW.y + KING_CARD_WINDOW.h; y++) {
      for (let x = KING_CARD_WINDOW.x; x < KING_CARD_WINDOW.x + KING_CARD_WINDOW.w; x++) win.add(colorAt(locked, x, y));
    }
    expect(win.size).toBeGreaterThanOrEqual(2);
    for (const c of win) {
      const r = (c >> 16) & 255; const g = (c >> 8) & 255; const b = c & 255;
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(24); // grey only
    }
  });
});
