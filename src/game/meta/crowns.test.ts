import { describe, expect, it } from 'vitest';
import { crownPoints, runKey } from './crowns';
import { fakeRun } from './testRun';

describe('crownPoints', () => {
  it('a Gai 0 victory with 30 years, 6 conquests, 3 bosses is 83', () => {
    const b = crownPoints(fakeRun({ years: 30, conquered: 6, bosses: 3, won: true }));
    expect(b).toEqual({ years: 30, conquests: 18, bosses: 15, victory: 20, multiplier: 1, total: 83 });
  });
  it('the same run at Gai 5 doubles', () => {
    expect(crownPoints(fakeRun({ years: 30, conquered: 6, bosses: 3, won: true, difficulty: 5 })).total).toBe(166);
  });
  it('a loss in year 7 with 1 conquest at Gai 2 is 14', () => {
    expect(crownPoints(fakeRun({ years: 7, conquered: 1, bosses: 0, won: false, difficulty: 2 })).total).toBe(14);
  });
  it('runKey joins seed, king, difficulty and perk', () => {
    expect(
      runKey(fakeRun({ years: 1, conquered: 0, bosses: 0, won: false, seed: 9, difficulty: 3, perk: 'wheat_p2' })),
    ).toBe('9:wheat:3:wheat_p2');
    expect(runKey(fakeRun({ years: 1, conquered: 0, bosses: 0, won: false, seed: 9 }))).toBe('9:wheat:0:-');
  });
});
