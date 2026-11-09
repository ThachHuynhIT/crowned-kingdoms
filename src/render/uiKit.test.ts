import { afterEach, describe, expect, it } from 'vitest';
import { UI_PALETTE } from '../data/uiPalette';
import { PixelCanvas } from './pixel';
import { UI_FRAMES, UI_FRAME_IDS } from './uiArt';
import {
  UI_KIT_FILES,
  UI_KIT_FRAME,
  UI_KIT_RECOLOR,
  KIT_COLOURS,
  activateUiKitFrames,
  recolorKit,
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

  it('kit_does_not_override_themed_frames: activating every kit frame leaves king frames generated', () => {
    activateUiKitFrames(Object.keys(UI_KIT_FILES) as (keyof typeof UI_KIT_FILES)[]);
    expect(uiFrameDef('panel@wheat')).toEqual(UI_FRAMES.panel);
    expect(uiFrameDef('card@arcane')).toEqual(UI_FRAMES.card);
    expect(uiFrameDef('panel')).toBe(UI_KIT_FRAME);
  });

  it('derives every state from the one Pixel Adventure tile by swapping colours (2026-11-09)', () => {
    const tile = new PixelCanvas(2, 1);
    tile.set(0, 0, KIT_COLOURS.ring);
    tile.set(1, 0, KIT_COLOURS.cream);
    const rare = recolorKit(tile, UI_KIT_RECOLOR.cardRare);
    expect([...rare.data.slice(0, 4)]).toEqual([(UI_PALETTE.gold >> 16) & 255, (UI_PALETTE.gold >> 8) & 255, UI_PALETTE.gold & 255, 255]);
    expect([...rare.data.slice(4, 8)]).toEqual([...tile.data.slice(4, 8)]); // the cream centre is untouched
    expect([...recolorKit(tile).data]).toEqual([...tile.data]);
    expect(new Set(Object.values(UI_KIT_FILES)).size).toBe(1);
    expect(UI_KIT_FRAME).toEqual({ w: 16, h: 16, slice: 4, border: 4 });
  });

  it('uses one texture key per frame', () => {
    expect(kitTextureKey('panel')).not.toBe(kitTextureKey('button'));
  });
});
