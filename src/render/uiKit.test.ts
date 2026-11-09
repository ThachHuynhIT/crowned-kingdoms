import { afterEach, describe, expect, it } from 'vitest';
import { KING_THEMES, UI_PALETTE } from '../data/uiPalette';
import { PixelCanvas } from './pixel';
import { UI_FRAMES, UI_FRAME_IDS } from './uiArt';
import {
  UI_KIT_FILES,
  UI_KIT_FRAME,
  KIT_COLOURS,
  activateUiKitFrames,
  kitStatePal,
  kitSwaps,
  recolorKit,
  themeKitPal,
  kitTextureKey,
  resetUiKitFrames,
  uiFrameDef,
} from './uiKit';

afterEach(() => resetUiKitFrames());

describe('uiKit', () => {
  it('maps only known UI frames, never the hotbar slots or the bar', () => {
    for (const id of Object.keys(UI_KIT_FILES)) expect(UI_FRAME_IDS).toContain(id);
    for (const id of ['slot', 'slotHover', 'slotSelected', 'bar']) expect(UI_KIT_FILES).not.toHaveProperty(id);
  });

  it('gives frames that swap into each other (button, card states) the same kit size', () => {
    expect(UI_KIT_FRAME.w).toBe(UI_KIT_FRAME.h);
    expect(UI_KIT_FRAME.slice * 2).toBeLessThan(UI_KIT_FRAME.w);
    expect(UI_KIT_FRAME.border).toBeLessThanOrEqual(UI_KIT_FRAME.slice);
  });

  it('reports the generated definition until a frame is activated, then the kit one', () => {
    expect(uiFrameDef('panel')).toBe(UI_FRAMES.panel);
    activateUiKitFrames(['panel']);
    expect(uiFrameDef('panel')).toBe(UI_KIT_FRAME);
    expect(uiFrameDef('button')).toBe(UI_FRAMES.button);
  });

  it('king frames use the kit too once activated (2026-11-09), painted in the king theme', () => {
    expect(uiFrameDef('panel@wheat')).toEqual(UI_FRAMES.panel);
    activateUiKitFrames(['panel', 'panel@wheat']);
    expect(uiFrameDef('panel@wheat')).toBe(UI_KIT_FRAME);
    expect(uiFrameDef('card@arcane')).toEqual(UI_FRAMES.card);
    const pal = themeKitPal(KING_THEMES.wheat);
    expect([pal.outline, pal.shadow, pal.cream]).toEqual([KING_THEMES.wheat.bgDark, KING_THEMES.wheat.bgMid, KING_THEMES.wheat.panel]);
  });

  it('derives every state from the one Pixel Adventure tile by swapping colours (2026-11-09)', () => {
    const tile = new PixelCanvas(2, 1);
    tile.set(0, 0, KIT_COLOURS.ring);
    tile.set(1, 0, KIT_COLOURS.cream);
    const rare = recolorKit(tile, kitSwaps(kitStatePal('cardRare', KIT_COLOURS)));
    expect([...rare.data.slice(0, 4)]).toEqual([(UI_PALETTE.gold >> 16) & 255, (UI_PALETTE.gold >> 8) & 255, UI_PALETTE.gold & 255, 255]);
    expect([...rare.data.slice(4, 8)]).toEqual([...tile.data.slice(4, 8)]); // the cream centre is untouched
    expect([...recolorKit(tile).data]).toEqual([...tile.data]);
    expect([...recolorKit(tile, kitSwaps(KIT_COLOURS)).data]).toEqual([...tile.data]); // neutral = the tile itself
    expect(new Set(Object.values(UI_KIT_FILES)).size).toBe(1);
    expect(UI_KIT_FRAME).toEqual({ w: 16, h: 16, slice: 4, border: 4 });
  });

  it('uses one texture key per frame', () => {
    expect(kitTextureKey('panel')).not.toBe(kitTextureKey('button'));
  });
});
