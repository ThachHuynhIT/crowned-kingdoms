import { ALL_KINGS } from '../data/rules';
import type { KingId } from '../data/types';
import type { KING_CARD_WINDOW } from './kingCardArt';

/**
 * The king portraits (G3e): 96×144 pictures, one per king, loaded by `PreloadScene` as plain
 * images (their own textures, apart from the world atlas). A picture that fails to load leaves
 * the generated placeholder portrait in its place. Changing a portrait later means replacing
 * the PNG and its manifest entry; nothing else changes.
 */
export const PORTRAIT_DIR = 'assets/art/ai-v1/portraits/';

export interface PortraitAsset {
  readonly file: string;
  readonly width: 96;
  readonly height: 144;
  /** The same picture at 144×216 (2026-11-10), shown at scale 1 on a king card drawn at scale 3. */
  readonly large: { readonly file: string; readonly width: 144; readonly height: 216 };
}

export const PORTRAIT_ASSETS: Readonly<Record<KingId, PortraitAsset>> = Object.fromEntries(
  ALL_KINGS.map((id) => [id, { file: `${id}.png`, width: 96, height: 144, large: { file: `${id}-144.png`, width: 144, height: 216 } } as const]),
) as Record<KingId, PortraitAsset>;

export const portraitTextureKey = (id: KingId): string => `king-portrait-${id}`;
export const portraitLargeTextureKey = (id: KingId): string => `king-portrait-${id}-144`;

/**
 * Which copy of a portrait shows sharp on a king card drawn at `cardScale` (the window is 48 card
 * px wide): the 144-px copy when the window is a whole multiple of 144 px but not of 96 (card
 * scale 3, 9…), else the 96-px one.
 */
export const pickPortraitCopy = (cardScale: number): 'normal' | 'large' => {
  const shown = Math.round(cardScale * 48);
  return shown % 96 !== 0 && shown % 144 === 0 ? 'large' : 'normal';
};

/**
 * Where a portrait of `art` px goes on a king card drawn at `cardScale`: its scale is whatever
 * makes it as wide as the card's window (half the card scale for a 96-px-wide picture), and it is
 * centred top to bottom. Screen px, whole numbers.
 */
export const portraitPlacement = (
  win: typeof KING_CARD_WINDOW,
  cardScale: number,
  art: { w: number; h: number },
): { x: number; y: number; scale: number } => {
  const scale = (cardScale * win.w) / art.w;
  return {
    x: Math.round(win.x * cardScale),
    y: Math.round(win.y * cardScale + (win.h * cardScale - art.h * scale) / 2),
    scale,
  };
};
