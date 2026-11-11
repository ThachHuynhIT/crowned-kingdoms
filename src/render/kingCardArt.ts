import { hashSeed } from '../core/random';
import { ALL_KINGS } from '../data/rules';
import type { KingId } from '../data/types';
import { KING_THEMES, type KingTheme } from '../data/uiPalette';
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

/** How bright a locked card or portrait stays: its greys are scaled down to this share (owner 2026-11-10). */
export const LOCKED_SHADE = 0.5;

/**
 * `art` as a dark-grey copy (luminance × `LOCKED_SHADE`) for a locked king: the picture still reads, but dim and
 * colourless. Alpha is copied unchanged, so hard 0/255 edges stay hard; no blur.
 */
export const lockedShade = (art: PixelCanvas): PixelCanvas => {
  const out = new PixelCanvas(art.width, art.height);
  out.data.set(art.data);
  for (let i = 0; i < out.data.length; i += 4) {
    const l = Math.round((out.data[i]! * 0.3 + out.data[i + 1]! * 0.59 + out.data[i + 2]! * 0.11) * LOCKED_SHADE);
    out.data[i] = l;
    out.data[i + 1] = l;
    out.data[i + 2] = l;
  }
  return out;
};

/**
 * King card art; `locked` is the same card in dark greys (`lockedShade`; the scene draws the portrait, the padlock and
 * the unlock condition over it, owner 2026-11-10). With `background` (the
 * approved 66×96 picture of that king's card, 2026-11-09) the picture replaces the painted paper, smoke and frame;
 * the portrait window and the corner glyphs are still drawn over it, so their layout never changes. A background of
 * exactly twice that size (its 132×192 HD twin, 2026-11-11) gives a 132×192 card: the same glyphs and window, each card
 * px drawn as 2×2 (`kingCardDensity` reads it back; draw it at half the usual scale).
 */
export const paintKingCard = (king: KingId, locked = false, background: PixelCanvas | null = null): PixelCanvas => {
  const card = paintOpenCard(king, background);
  return locked ? lockedShade(card) : card;
};

/** Art px per card px of a card painted over `background`: 2 for the 132×192 HD twin, else 1. */
export const kingCardDensity = (background: { width: number; height: number } | null): 1 | 2 =>
  background !== null && background.width === W * 2 && background.height === H * 2 ? 2 : 1;

const paintOpenCard = (king: KingId, background: PixelCanvas | null): PixelCanvas => {
  const t: KingTheme = KING_THEMES[king];
  const seed = hashSeed(king);
  const s = kingCardDensity(background);
  if (background && background.width === W * s && background.height === H * s) {
    const c = new PixelCanvas(W * s, H * s);
    const art = background;
    c.blit(art, 0, 0);
    // The glyphs sit on a patch of the picture's own paper (its centre, which the portrait covers anyway), so they
    // read even where the picture's ornament reaches into the corners.
    const i = ((WIN.y + WIN.h / 2) * s * W * s + (W / 2) * s) * 4;
    const paper = (art.data[i]! << 16) | (art.data[i + 1]! << 8) | art.data[i + 2]!;
    c.fillRect(s, s, 7 * s, 16 * s, paper);
    c.fillRect((W - 8) * s, (H - 17) * s, 7 * s, 16 * s, paper);
    drawFaceMarks(c, king, t, s);
    return c;
  }
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

  drawFaceMarks(c, king, t);
  roundCorners(c, t.bgDark);
  return c;
};

/** Portrait window (outline, then a flat fill the portrait is drawn over) and the corner glyphs; `s` art px per card px. */
const drawFaceMarks = (c: PixelCanvas, king: KingId, t: KingTheme, s = 1): void => {
  c.fillRect((WIN.x - 1) * s, (WIN.y - 1) * s, (WIN.w + 2) * s, (WIN.h + 2) * s, t.bgDark);
  c.fillRect(WIN.x * s, WIN.y * s, WIN.w * s, WIN.h * s, t.bgMid);

  // Corner marks: K over the suit top-left; their own upside-down bitmaps bottom-right.
  const suit = GLYPH_SUIT[kingSuit(king)];
  blit(c, GLYPH_K, 2 * s, 2 * s, t.bgMid, s);
  blit(c, suit, 2 * s, 11 * s, t.bgMid, s);
  blit(c, upsideDown(GLYPH_K), (W - 7) * s, (H - 2 - GLYPH_K.length) * s, t.bgMid, s);
  blit(c, upsideDown(suit), (W - 7) * s, (H - 11 - suit.length) * s, t.bgMid, s);
};
