import { describe, expect, it } from 'vitest';
import { ALL_KINGS } from '../data/rules';
import { KING_THEMES } from '../data/uiPalette';
import { packShelves } from './atlas';
import {
  SKINNABLE_FRAMES,
  UI_FRAMES,
  UI_FRAME_IDS,
  UI_THEMED_FRAME_IDS,
  baseFrame,
  paintUiFrame,
  themedFrame,
} from './uiArt';
import type { PixelCanvas } from './pixel';

const colorAt = (c: PixelCanvas, x: number, y: number): number => {
  const i = (y * c.width + x) * 4;
  return (c.data[i]! << 16) | (c.data[i + 1]! << 8) | c.data[i + 2]!;
};

describe('themed UI frames', () => {
  it('all_nine_skins_packed: every skinnable frame exists for every king and fits the ui atlas', () => {
    expect(UI_THEMED_FRAME_IDS).toHaveLength(ALL_KINGS.length * SKINNABLE_FRAMES.length);
    for (const king of ALL_KINGS) for (const base of SKINNABLE_FRAMES) expect(UI_THEMED_FRAME_IDS).toContain(themedFrame(base, king));
    const sprites = [...UI_FRAME_IDS, ...UI_THEMED_FRAME_IDS].map((id) => ({ name: id, art: paintUiFrame(id) }));
    const { height } = packShelves(sprites, 128);
    expect(height).toBeLessThanOrEqual(4096);
  });

  it('paints each themed frame at the size and slice of its base frame, with crisp alpha', () => {
    for (const id of UI_THEMED_FRAME_IDS) {
      const def = UI_FRAMES[baseFrame(id)];
      const art = paintUiFrame(id);
      expect([art.width, art.height], id).toEqual([def.w, def.h]);
      for (let i = 3; i < art.data.length; i += 4) expect([0, 255]).toContain(art.data[i]);
    }
  });

  it('colours a themed panel from the king theme: outline from bgDark, core from panel', () => {
    for (const king of ALL_KINGS) {
      const art = paintUiFrame(themedFrame('panel', king));
      const t = KING_THEMES[king];
      expect(colorAt(art, 2, 0), king).toBe(t.bgDark);
      expect(colorAt(art, Math.floor(art.width / 2), Math.floor(art.height / 2)), king).toBe(t.panel);
    }
    expect(colorAt(paintUiFrame(themedFrame('panel', 'arcane')), 12, 12)).not.toBe(
      colorAt(paintUiFrame(themedFrame('panel', 'wheat')), 12, 12),
    );
  });

  it('keeps the neutral frames exactly as they were', () => {
    expect(UI_FRAME_IDS).toContain('panel');
    expect(UI_FRAME_IDS.some((id) => String(id).includes('@'))).toBe(false);
  });
});
