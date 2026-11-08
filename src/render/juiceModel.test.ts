import { describe, expect, it } from 'vitest';
import { shakeOffset, showsFloatingDamage } from './juiceModel';

describe('shakeOffset', () => {
  it('steps through integer screen offsets every 30 ms', () => {
    const sequence = [
      { x: 2, y: 0 },
      { x: -2, y: 1 },
      { x: 1, y: -2 },
      { x: -1, y: 2 },
      { x: 0, y: -1 },
    ];
    sequence.forEach((offset, i) => {
      expect(shakeOffset(i * 30, true)).toEqual(offset);
      expect(shakeOffset(i * 30 + 29.99, true)).toEqual(offset);
    });
  });

  it('returns to zero at the end and afterwards', () => {
    expect(shakeOffset(150, true)).toEqual({ x: 0, y: 0 });
    expect(shakeOffset(600, true)).toEqual({ x: 0, y: 0 });
  });

  it('returns zero while disabled', () => {
    expect(shakeOffset(0, false)).toEqual({ x: 0, y: 0 });
    expect(shakeOffset(90, false)).toEqual({ x: 0, y: 0 });
  });
});

describe('showsFloatingDamage', () => {
  it('only shows damage at or above 50', () => {
    expect(showsFloatingDamage(49.99)).toBe(false);
    expect(showsFloatingDamage(50)).toBe(true);
  });
});
