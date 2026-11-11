import { describe, expect, it } from 'vitest';
import { ALL_KINGS } from '../data/rules';
import { KING_THEMES } from '../data/uiPalette';
import { KING_CARD_NATIVE, KING_CARD_WINDOW, LOCKED_SHADE, kingCardDensity, kingSuit, lockedShade, paintKingCard } from './kingCardArt';
import { PixelCanvas } from './pixel';

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

  it('paints a locked king as the same card in dark greys, alpha unchanged (owner 2026-11-10)', () => {
    const open = paintKingCard('wheat');
    const locked = paintKingCard('wheat', true);
    expect(same(open, locked)).toBe(false);
    expect(same(locked, lockedShade(open))).toBe(true);
    for (let i = 0; i < locked.data.length; i += 4) {
      expect(locked.data[i + 3]).toBe(open.data[i + 3]);
      expect(locked.data[i]).toBe(locked.data[i + 1]);
      expect(locked.data[i + 1]).toBe(locked.data[i + 2]);
      expect(locked.data[i]!).toBeLessThanOrEqual(Math.ceil(255 * LOCKED_SHADE));
    }
  });
});

describe('lockedShade', () => {
  it('turns each pixel into a dark grey of its luminance and keeps hard alpha', () => {
    const art = new PixelCanvas(2, 1);
    art.set(0, 0, 0xffffff);
    art.set(1, 0, 0xff0000, 0);
    const out = lockedShade(art);
    expect([...out.data.slice(0, 4)]).toEqual([128, 128, 128, 255]);
    expect(out.data[7]).toBe(0);
    expect(art.data[0]).toBe(255); // the source is not changed
  });
});

describe('king card from an approved picture (2026-11-09)', () => {
  const bg = (): PixelCanvas => {
    const c = new PixelCanvas(KING_CARD_NATIVE.w, KING_CARD_NATIVE.h);
    c.fillRect(0, 0, c.width, c.height, 0x336699);
    return c;
  };
  it('keeps the picture under the border, and still draws the window and the glyphs in place', () => {
    const plain = paintKingCard('wheat');
    const art = paintKingCard('wheat', false, bg());
    const at = (c: PixelCanvas, x: number, y: number) => [...c.data.slice((y * c.width + x) * 4, (y * c.width + x) * 4 + 4)];
    expect(at(art, 5, 40)).toEqual([0x33, 0x66, 0x99, 255]); // border area: the picture
    const wx = KING_CARD_WINDOW.x + 4;
    const wy = KING_CARD_WINDOW.y + 4;
    expect(at(art, wx, wy)).toEqual(at(plain, wx, wy)); // window fill: unchanged
    expect(at(art, 2, 2)).toEqual(at(plain, 2, 2)); // the K glyph's first pixel
  });
  it('greys the picture for a locked king and ignores a picture of the wrong size', () => {
    const locked = paintKingCard('wheat', true, bg());
    const i = (40 * locked.width + 5) * 4;
    expect(locked.data[i]).toBe(locked.data[i + 1]);
    expect(locked.data[i + 1]).toBe(locked.data[i + 2]);
    expect(paintKingCard('wheat', false, new PixelCanvas(10, 10)).data).toEqual(paintKingCard('wheat').data);
  });
});

describe('paintKingCard over the HD background twin', () => {
  /** A flat background of `w`×`h` with a distinct colour at every pixel row, opaque. */
  const background = (w: number, h: number): PixelCanvas => {
    const c = new PixelCanvas(w, h);
    for (let y = 0; y < h; y++) c.fillRect(0, y, w, 1, 0x101010 + y);
    return c;
  };

  it('paints a 132×192 card whose glyphs and window are the 66×96 ones at 2×2 px', () => {
    const sd = paintKingCard('stone', false, background(66, 96));
    const hdBg = background(132, 192);
    const hd = paintKingCard('stone', false, hdBg);
    expect([hd.width, hd.height]).toEqual([132, 192]);
    expect(kingCardDensity(hdBg)).toBe(2);
    expect(kingCardDensity(background(66, 96))).toBe(1);
    expect(kingCardDensity(null)).toBe(1);
    const t = KING_THEMES.stone;
    for (const colour of [t.bgDark, t.bgMid]) {
      const small = cells(sd, colour, 0, 0, 66, 96);
      const big = cells(hd, colour, 0, 0, 132, 192);
      const expected = new Set<string>();
      for (const key of small) {
        const [x, y] = key.split(',').map(Number) as [number, number];
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) expected.add(`${x * 2 + dx!},${y * 2 + dy!}`);
      }
      // Every SD mark pixel is a 2×2 block in the HD card (the background rows never use the theme colours).
      for (const key of expected) expect(big.has(key), key).toBe(true);
    }
  });

  it('keeps the background picture outside the marks', () => {
    const hd = paintKingCard('wheat', false, background(132, 192));
    // Right edge, middle height: no glyph or window there.
    expect(colorAt(hd, 130, 100)).toBe(0x101010 + 100);
  });

  it('falls back to the painted 66×96 card for a background of any other size', () => {
    expect(paintKingCard('wheat', false, background(100, 100)).width).toBe(66);
  });
});
