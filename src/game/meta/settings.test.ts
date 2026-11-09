import { describe, expect, it } from 'vitest';
import { snapVolume, stepVolume } from './settings';

describe('volume steps (G5 §4)', () => {
  it('+ from an off-step value goes up to the next step, − down to the previous one', () => {
    expect(stepVolume(25, 1)).toBe(30);
    expect(stepVolume(25, -1)).toBe(20);
  });
  it('on a step, ± moves by 10 and clamps to 0…100', () => {
    expect(stepVolume(30, 1)).toBe(40);
    expect(stepVolume(30, -1)).toBe(20);
    expect(stepVolume(100, 1)).toBe(100);
    expect(stepVolume(0, -1)).toBe(0);
    expect(stepVolume(95, 1)).toBe(100);
    expect(stepVolume(5, -1)).toBe(0);
  });
  it('slider drags snap to the nearest step', () => {
    expect(snapVolume(24)).toBe(20);
    expect(snapVolume(25)).toBe(30);
    expect(snapVolume(-3)).toBe(0);
    expect(snapVolume(104)).toBe(100);
  });
});
