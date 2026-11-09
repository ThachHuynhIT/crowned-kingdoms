import { describe, expect, it } from 'vitest';
import { fitTextWidth, largestFitting } from './fitText';

describe('largestFitting', () => {
  it('returns the largest size that fits', () => {
    expect(largestFitting(14, 11, (s) => s <= 12)).toBe(12);
    expect(largestFitting(14, 11, () => true)).toBe(14);
  });

  it('falls back to the smallest size when nothing fits', () => {
    expect(largestFitting(14, 11, () => false)).toBe(11);
  });

  it('copes with a range given the wrong way round', () => {
    expect(largestFitting(10, 12, () => true)).toBe(12);
  });
});

describe('fitTextWidth', () => {
  it('shrinks a text until it fits its width, never below min', () => {
    let size = 0;
    const text = { setFontSize: (s: number) => (size = s), get width() { return size * 10; } };
    expect(fitTextWidth(text, 18, 11, 150)).toBe(15);
    expect(size).toBe(15);
    expect(fitTextWidth(text, 18, 11, 50)).toBe(11);
    expect(fitTextWidth(text, 18, 11, 500)).toBe(18);
  });
});
