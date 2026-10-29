import { describe, expect, it } from 'vitest';
import { largestFitting } from './fitText';

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
