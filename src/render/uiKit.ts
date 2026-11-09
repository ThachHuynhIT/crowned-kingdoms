import { UI_PALETTE, type KingTheme } from '../data/uiPalette';
import { PixelCanvas } from './pixel';
import { UI_FRAMES, baseFrame, type AnyUiFrame, type UiFrame, type UiFrameDef } from './uiArt';

/**
 * Kenney "UI Pack - Pixel Adventure" (CC0, chosen by the owner 2026-11-09 to replace the thick, rounded Pixel UI Pack
 * frames; docs/assets.manifest.yml, docs/licenses/kenney-ui-pack-pixel-adventure/) laid over the generated UI frames:
 * one 16×16 tile with a 1 px dark outline, a 2 px wood ring, a 1 px shadow and a cream centre (square corners,
 * nine-slice 4). Every state of a frame group (button states, card rarities) is that same tile with some colours
 * swapped (`kitStatePal`; a king's frames start from `themeKitPal`), so frames that swap into each other keep one size and slice. Frames not listed (hotbar
 * slots, bars) stay generated. A frame only counts as kit art once its PNG has really been loaded and blitted into the
 * `ui` atlas (`activateUiKitFrames`), so a missing file falls back to the generated frame.
 */
export const UI_KIT_DIR = 'assets/ui/kenney-pixel-adventure/small/';

/** Every kit frame is a 16×16 nine-slice with a 4 px corner and border. */
export const UI_KIT_FRAME: UiFrameDef = { w: 16, h: 16, slice: 4, border: 4 };

const TILE = 'tile_0010.png';

/** Kit PNG (inside `UI_KIT_DIR`) painted over each UI frame. */
export const UI_KIT_FILES: Readonly<Partial<Record<UiFrame, string>>> = {
  panel: TILE,
  tooltip: TILE,
  button: TILE,
  buttonHover: TILE,
  buttonDown: TILE,
  buttonActive: TILE,
  card: TILE,
  cardUncommon: TILE,
  cardRare: TILE,
  cardSelected: TILE,
};

/** The tile's colours (exact RGB). */
export const KIT_COLOURS = { outline: 0x6d4b27, ring: 0xc58747, shadow: 0xa3703a, cream: 0xfff1d2 } as const;

/** The four colour roles of the tile, as painted for one frame state. */
export interface KitPal {
  readonly outline: number;
  readonly ring: number;
  readonly shadow: number;
  readonly cream: number;
}

const mix = (a: number, b: number, t: number): number => {
  const ch = (shift: number): number => Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

/** A king's frames: the tile in that king's theme (dark outline, bright ring, paper centre), 2026-11-09. */
export const themeKitPal = (t: KingTheme): KitPal => ({
  outline: t.bgDark,
  ring: mix(t.bgMid, t.accent, 0.6),
  shadow: t.bgMid,
  cream: t.panel,
});

/** The colours of `frame`'s state on base colours `p` (ART_STYLE: rare gold, selected red). */
export const kitStatePal = (frame: UiFrame, p: KitPal): KitPal => {
  switch (frame) {
    case 'buttonHover':
      return { ...p, cream: mix(p.cream, 0xffffff, 0.6), ring: mix(p.ring, 0xffffff, 0.2) };
    case 'buttonDown':
      return { ...p, cream: mix(p.cream, p.shadow, 0.2), ring: p.shadow };
    case 'buttonActive':
    case 'cardRare':
      return { ...p, ring: UI_PALETTE.gold };
    case 'cardUncommon':
      return { ...p, ring: UI_PALETTE.good };
    case 'cardSelected':
      return { ...p, ring: UI_PALETTE.select };
    default:
      return p;
  }
};

/** Swaps that paint the plain tile in `pal`. */
export const kitSwaps = (pal: KitPal): readonly (readonly [number, number])[] =>
  (['outline', 'ring', 'shadow', 'cream'] as const).map((role) => [KIT_COLOURS[role], pal[role]] as const);

/** `art` with every pixel of an exact `from` colour changed to `to` (alpha kept). */
export const recolorKit = (art: PixelCanvas, swaps: readonly (readonly [number, number])[] = []): PixelCanvas => {
  const out = new PixelCanvas(art.width, art.height);
  out.data.set(art.data);
  for (let i = 0; i < out.data.length; i += 4) {
    const rgb = (out.data[i]! << 16) | (out.data[i + 1]! << 8) | out.data[i + 2]!;
    const swap = swaps.find(([from]) => from === rgb);
    if (!swap) continue;
    out.data[i] = (swap[1] >> 16) & 0xff;
    out.data[i + 1] = (swap[1] >> 8) & 0xff;
    out.data[i + 2] = swap[1] & 0xff;
  }
  return out;
};

export const kitTextureKey = (frame: UiFrame): string => `ui-kit-${frame}`;

const active = new Set<AnyUiFrame>();

export const activateUiKitFrames = (frames: readonly AnyUiFrame[]): void => {
  for (const f of frames) active.add(f);
};

export const resetUiKitFrames = (): void => active.clear();

/** Size, slice and border of `frame` as actually painted in the atlas (king frames too, since 2026-11-09). */
export const uiFrameDef = (frame: AnyUiFrame): UiFrameDef =>
  active.has(frame) ? UI_KIT_FRAME : UI_FRAMES[baseFrame(frame)];
