import { describe, expect, it } from 'vitest';
import { RULES_ENDLESS, RULES_FULL, RULES_G2 } from '../../data/rules';
import type { RunState } from '../run/state';
import { decodeMeta } from './codec';
import { crownPoints, settleRun } from './crowns';
import { defaultProfile, isEndlessUnlocked } from './profile';
import { fakeRun } from './testRun';

const withRules = (s: RunState, rules: RunState['rules']): RunState =>
  ({ ...s, rules, mode: rules.calendar === 'endless' ? 'endless' : 'normal' }) as RunState;

describe('Endless crown points (spec 2026-11-09 §8)', () => {
  it('caps scored years at 60 and bosses at 3; no victory bonus', () => {
    const run = withRules(fakeRun({ years: 100, conquered: 6, bosses: 10, won: false }), RULES_ENDLESS);
    expect(crownPoints(run)).toMatchObject({ years: 60, conquests: 18, bosses: 15, victory: 0, total: 93 });
    expect(crownPoints({ ...run, difficulty: 5 }).total).toBe(186);
    expect(run.stats.completedYears).toBe(100);
  });

  it('normal runs keep the uncapped formula', () => {
    const run = withRules(fakeRun({ years: 30, conquered: 6, bosses: 3, won: true }), RULES_FULL);
    expect(crownPoints(run).total).toBe(83);
  });
});

describe('Endless unlock', () => {
  it('a default profile has Endless locked', () => {
    expect(isEndlessUnlocked(defaultProfile())).toBe(false);
  });

  it('only a won normal 30-year full run with 30 completed years unlocks it', () => {
    const win = withRules(fakeRun({ years: 30, conquered: 6, bosses: 3, won: true }), RULES_FULL);
    const r = settleRun(defaultProfile(), win);
    expect(r.profile.endlessUnlocked).toBe(true);
    expect(r.unlocks).toContain('Đã mở chế độ Vô tận');
    // Settling again neither double-counts nor repeats the notice.
    const again = settleRun(r.profile, win);
    expect(again.profile).toBe(r.profile);

    for (const run of [
      withRules(fakeRun({ years: 15, conquered: 2, bosses: 0, won: true }), RULES_G2),
      withRules(fakeRun({ years: 29, conquered: 6, bosses: 3, won: false }), RULES_FULL),
      withRules(fakeRun({ years: 100, conquered: 6, bosses: 10, won: false }), RULES_ENDLESS),
    ]) {
      expect(settleRun(defaultProfile(), run).profile.endlessUnlocked).toBe(false);
    }
  });

  it('an Endless run never adds a win', () => {
    const run = withRules(fakeRun({ years: 100, conquered: 6, bosses: 10, won: false }), RULES_ENDLESS);
    expect(settleRun(defaultProfile(), run).profile.wins.wheat).toBe(0);
  });

  it('decodeMeta: a missing flag is false (old profiles carry no proof of a 30-year win), a broken one is repaired', () => {
    const base = { ...defaultProfile(), wins: { ...defaultProfile().wins, wheat: 3 } } as Record<string, unknown>;
    delete base.endlessUnlocked;
    expect(decodeMeta(base).profile.endlessUnlocked).toBe(false);
    expect(decodeMeta({ ...base, endlessUnlocked: true }).profile.endlessUnlocked).toBe(true);
    const broken = decodeMeta({ ...base, endlessUnlocked: 'yes' });
    expect(broken.kind).toBe('repaired');
    expect(broken.profile.endlessUnlocked).toBe(false);
  });
});
