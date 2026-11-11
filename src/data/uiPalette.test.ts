import { describe, expect, it } from 'vitest';
import { ALL_KINGS } from './rules';
import { KING_THEMES, LOCKED_THEME, UI_PALETTE, type KingTheme } from './uiPalette';

const FIELDS = ['bgDark', 'bgMid', 'panel', 'light', 'accent'] as const;
const colours = (t: KingTheme): number[] => FIELDS.map((f) => t[f]);

describe('KING_THEMES', () => {
  it('nine_distinct_themes: one theme per king, valid 24-bit colours, no two kings alike', () => {
    expect(Object.keys(KING_THEMES).sort()).toEqual([...ALL_KINGS].sort());
    for (const id of ALL_KINGS) {
      for (const c of colours(KING_THEMES[id])) {
        expect(Number.isInteger(c), `${id} ${c}`).toBe(true);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(0xffffff);
      }
    }
    const tuples = ALL_KINGS.map((id) => colours(KING_THEMES[id]).join(','));
    expect(new Set(tuples).size).toBe(9);
    for (const f of ['panel', 'accent', 'bgMid'] as const) {
      expect(new Set(ALL_KINGS.map((id) => KING_THEMES[id][f])).size, f).toBe(9);
    }
  });

  it('lookup_preserves_palette: arcane differs from wheat and the old UI_PALETTE is untouched', () => {
    expect(KING_THEMES.arcane).not.toEqual(KING_THEMES.wheat);
    expect(UI_PALETTE.text).toBe(0x3b1d0a);
    expect(UI_PALETTE.cream).toBe(0xf5deb3);
    expect(UI_PALETTE.wood).toBe(0xb5651d);
  });

  it('has a grey theme for locked kings that is not any king theme', () => {
    for (const c of colours(LOCKED_THEME)) expect(Number.isInteger(c)).toBe(true);
    expect(ALL_KINGS.some((id) => colours(KING_THEMES[id]).join() === colours(LOCKED_THEME).join())).toBe(false);
    const grey = (c: number): boolean => Math.abs(((c >> 16) & 255) - ((c >> 8) & 255)) < 16 && Math.abs(((c >> 8) & 255) - (c & 255)) < 16;
    expect(grey(LOCKED_THEME.panel) && grey(LOCKED_THEME.bgMid)).toBe(true);
  });
});
