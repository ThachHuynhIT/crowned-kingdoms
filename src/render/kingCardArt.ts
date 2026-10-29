import { hashSeed } from '../core/random';
import { ALL_KINGS } from '../data/rules';
import type { KingId } from '../data/types';
import { KING_THEMES, LOCKED_THEME, type KingTheme } from '../data/uiPalette';
import { PixelCanvas, pixelHash } from './pixel';

/**
 * The tall king card of the king-select screens, drawn like a playing card in the king's
 * colours: a "K" and a suit in the top-left and (as their own turned-around bitmaps) in the
 * bottom-right, a soft smoky edge, and an empty window for the portrait. Pure TS, no Phaser.
 * 66×96 art px; draw it at an integer scale.
 */
export const KING_CARD_NATIVE = { w: 66, h: 96 } as const;
/** Where the portrait goes (48×72 art px, so a 96×144 portrait fits at half the card's scale). */
export const KING_CARD_WINDOW = { x: 9, y: 8, w: 48, h: 72 } as const;

export type KingSuit = 'diamond' | 'spade' | 'heart' | 'club';
const SUITS: readonly KingSuit[] = ['diamond', 'spade', 'heart', 'club'];

/** The kings take the four suits in turn, in `ALL_KINGS` order. */
export const kingSuit = (id: KingId): KingSuit => SUITS[Math.max(0, ALL_KINGS.indexOf(id)) % SUITS.length]!;

const GLYPH_K = ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'];
const GLYPH_SUIT: Readonly<Record<KingSuit, readonly string[]>> = {
  diamond: ['..#..', '.###.', '#####', '.###.', '..#..'],
  spade: ['..#..', '.###.', '#####', '#####', '..#..'],
  heart: ['.#.#.', '#####', '#####', '.###.', '..#..'],
  club: ['..#..', '.###.', '#####', '#.#.#', '..#..'],
};
const GLYPH_QUESTION = ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'];
const GLYPH_LOCK = ['..###..', '.#...#.', '.#...#.', '#######', '#######', '###.###', '###.###', '#######'];

/** The same bitmap turned 180°: a separate bitmap for the bottom-right corner. */
const upsideDown = (rows: readonly string[]): string[] => [...rows].reverse().map((r) => [...r].reverse().join(''));

const blit = (c: PixelCanvas, rows: readonly string[], x: number, y: number, color: number, scale = 1): void => {
  rows.forEach((row, gy) => {
    [...row].forEach((ch, gx) => {
      if (ch === '#') c.fillRect(x + gx * scale, y + gy * scale, scale, scale, color);
    });
  });
};

const mix = (a: number, b: number, t: number): number => {
  const ch = (shift: number): number =>
    Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

const W = KING_CARD_NATIVE.w;
const H = KING_CARD_NATIVE.h;
const WIN = KING_CARD_WINDOW;

/** Cut the outer corners (corner pixel and its two neighbours) and close them with the outline. */
const roundCorners = (c: PixelCanvas, outline: number): void => {
  for (const [x, y, dx, dy] of [[0, 0, 1, 1], [W - 1, 0, -1, 1], [0, H - 1, 1, -1], [W - 1, H - 1, -1, -1]] as const) {
    c.set(x, y, 0, 0);
    c.set(x + dx, y, 0, 0);
    c.set(x, y + dy, 0, 0);
    c.set(x + dx, y + dy, outline);
  }
};

/** King card art; `locked` paints it in the grey theme with a "?" and a padlock in the window. */
export const paintKingCard = (king: KingId, locked = false): PixelCanvas => {
  const t: KingTheme = locked ? LOCKED_THEME : KING_THEMES[king];
  const seed = hashSeed(locked ? `${king}-locked` : king);
  const c = new PixelCanvas(W, H);
  c.fillRect(0, 0, W, H, t.panel);

  // Smoky edge: 2×2 blocks of light and shade that thin out towards the middle.
  const smokeLight = mix(t.panel, t.light, 0.85);
  const smokeShade = mix(t.panel, t.bgMid, 0.16);
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
      const strength = Math.max(0, 1 - edge / 9);
      const r = pixelHash(x >> 1, y >> 1, seed);
      if (r < 0.34 * strength) c.set(x, y, smokeLight);
      else if (r > 1 - 0.2 * strength) c.set(x, y, smokeShade);
    }
  }

  // Frame outline.
  const ring = (inset: number, color: number): void => {
    c.fillRect(inset, inset, W - 2 * inset, 1, color);
    c.fillRect(inset, H - 1 - inset, W - 2 * inset, 1, color);
    c.fillRect(inset, inset, 1, H - 2 * inset, color);
    c.fillRect(W - 1 - inset, inset, 1, H - 2 * inset, color);
  };
  ring(0, t.bgDark);

  // Portrait window: outline, then a flat fill the portrait is drawn over.
  c.fillRect(WIN.x - 1, WIN.y - 1, WIN.w + 2, WIN.h + 2, t.bgDark);
  c.fillRect(WIN.x, WIN.y, WIN.w, WIN.h, t.bgMid);

  // Corner marks: K over the suit top-left; their own upside-down bitmaps bottom-right.
  const suit = GLYPH_SUIT[kingSuit(king)];
  blit(c, GLYPH_K, 2, 2, t.bgMid);
  blit(c, suit, 2, 11, t.bgMid);
  blit(c, upsideDown(GLYPH_K), W - 7, H - 2 - GLYPH_K.length, t.bgMid);
  blit(c, upsideDown(suit), W - 7, H - 11 - suit.length, t.bgMid);

  if (locked) {
    blit(c, GLYPH_QUESTION, WIN.x + 14, WIN.y + 12, t.light, 4);
    blit(c, GLYPH_LOCK, WIN.x + 14, WIN.y + 44, t.panel, 3);
  }
  roundCorners(c, t.bgDark);
  return c;
};
