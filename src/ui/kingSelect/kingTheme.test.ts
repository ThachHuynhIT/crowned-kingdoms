import { describe, expect, it } from 'vitest';
import { ALL_KINGS } from '../../data/rules';
import { KING_THEMES, LOCKED_THEME, UI_PALETTE } from '../../data/uiPalette';
import { kingTheme, lockedTheme } from './kingTheme';

const channel = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const luminance = (c: number): number =>
  0.2126 * channel((c >> 16) & 255) + 0.7152 * channel((c >> 8) & 255) + 0.0722 * channel(c & 255);
const contrast = (a: number, b: number): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

describe('kingTheme', () => {
  it('returns the table entry of each king and the grey theme for locked ones', () => {
    for (const id of ALL_KINGS) expect(kingTheme(id)).toBe(KING_THEMES[id]);
    expect(lockedTheme()).toBe(LOCKED_THEME);
  });

  it('keeps the body text readable on every panel and the title readable on every dark background', () => {
    for (const [id, theme] of [...ALL_KINGS.map((k) => [k, KING_THEMES[k]] as const), ['locked', LOCKED_THEME] as const]) {
      expect(contrast(UI_PALETTE.text, theme.panel), `${id} text on panel`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(UI_PALETTE.text, theme.light), `${id} text on light`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.light, theme.bgDark), `${id} title on bgDark`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.accent, theme.bgDark), `${id} accent on bgDark`).toBeGreaterThanOrEqual(3);
    }
  });
});
