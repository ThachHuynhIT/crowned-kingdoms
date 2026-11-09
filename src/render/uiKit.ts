import { UI_PALETTE } from '../data/uiPalette';
import { PixelCanvas } from './pixel';
import { UI_FRAMES, baseFrame, type AnyUiFrame, type UiFrame, type UiFrameDef } from './uiArt';

/**
 * Kenney "UI Pack - Pixel Adventure" (CC0, chosen by the owner 2026-11-09 to replace the thick, rounded Pixel UI Pack
 * frames; docs/assets.manifest.yml, docs/licenses/kenney-ui-pack-pixel-adventure/) laid over the generated UI frames:
 * one 16×16 tile with a 1 px dark outline, a 2 px wood ring, a 1 px shadow and a cream centre (square corners,
 * nine-slice 4). Every state of a frame group (button states, card rarities) is that same tile with some colours
 * swapped (`UI_KIT_RECOLOR`), so frames that swap into each other keep one size and slice. Frames not listed (hotbar
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

/** Colour swaps [from, to] that turn the plain tile into each state (ART_STYLE: rare gold, selected red). */
export const UI_KIT_RECOLOR: Readonly<Partial<Record<UiFrame, readonly (readonly [number, number])[]>>> = {
  buttonHover: [
    [KIT_COLOURS.cream, 0xfffaee],
    [KIT_COLOURS.ring, 0xd99c5a],
  ],
  buttonDown: [
    [KIT_COLOURS.cream, 0xead6ad],
    [KIT_COLOURS.ring, KIT_COLOURS.shadow],
  ],
  buttonActive: [[KIT_COLOURS.ring, UI_PALETTE.gold]],
  cardUncommon: [[KIT_COLOURS.ring, UI_PALETTE.good]],
  cardRare: [[KIT_COLOURS.ring, UI_PALETTE.gold]],
  cardSelected: [[KIT_COLOURS.ring, UI_PALETTE.select]],
};

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

const active = new Set<UiFrame>();

export const activateUiKitFrames = (frames: readonly UiFrame[]): void => {
  for (const f of frames) active.add(f);
};

export const resetUiKitFrames = (): void => active.clear();

/** Size, slice and border of `frame` as actually painted in the atlas; king frames (`base@king`) are always generated. */
export const uiFrameDef = (frame: AnyUiFrame): UiFrameDef =>
  active.has(frame as UiFrame) ? UI_KIT_FRAME : UI_FRAMES[baseFrame(frame)];
