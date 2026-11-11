import { describe, expect, it } from 'vitest';
import { KING_THEMES, LOCKED_THEME, UI_PALETTE } from '../data/uiPalette';
import { contrastRatio } from './contrast';

const AA = 4.5;

describe('text contrast (WCAG AA)', () => {
  it('matches the reference values', () => {
    expect(contrastRatio(0x000000, 0xffffff)).toBeCloseTo(21, 5);
    expect(contrastRatio(0x777777, 0xffffff)).toBeCloseTo(4.48, 2);
  });

  it('body, good and bad text read on the cream paper', () => {
    for (const bg of [UI_PALETTE.cream, UI_PALETTE.creamLight]) {
      for (const fg of [UI_PALETTE.text, UI_PALETTE.goodText, UI_PALETTE.badText])
        expect(contrastRatio(fg, bg), `${fg.toString(16)} on ${bg.toString(16)}`).toBeGreaterThanOrEqual(AA);
    }
    expect(contrastRatio(UI_PALETTE.text, UI_PALETTE.creamDark)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(UI_PALETTE.badText, UI_PALETTE.creamDark)).toBeGreaterThanOrEqual(AA);
  });

  it('every king theme keeps the body text readable on its paper and its light text on its dark background', () => {
    for (const t of [...Object.values(KING_THEMES), LOCKED_THEME]) {
      expect(contrastRatio(UI_PALETTE.text, t.panel)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(UI_PALETTE.text, t.light)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(t.light, t.bgDark)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(t.accent, t.bgDark)).toBeGreaterThanOrEqual(AA);
    }
  });
});
