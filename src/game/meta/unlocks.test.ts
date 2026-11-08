import { describe, expect, it } from 'vitest';
import { runKey, settleRun } from './crowns';
import { fakeRun } from './testRun';
import { defaultProfile } from './profile';
import {
  availableDifficulties,
  canUnlockKing,
  isKingUnlocked,
  unlockCard,
  unlockedPerks,
  unlockKing,
} from './unlocks';

const rich = (points: number) => ({ ...defaultProfile(), crownPoints: points });

describe('unlocks', () => {
  it('default profile opens arcane, stone, wheat', () => {
    expect(defaultProfile().unlockedKings).toEqual(['arcane', 'stone', 'wheat']);
    expect(isKingUnlocked(defaultProfile(), 'wheat')).toBe(true);
    expect(isKingUnlocked(defaultProfile(), 'grove')).toBe(false);
  });
  it('grove needs 25 points and spends them', () => {
    expect(canUnlockKing(rich(24), 'grove')).toBe(false);
    expect(unlockKing(rich(24), 'grove').unlockedKings).not.toContain('grove');
    const p = unlockKing(rich(25), 'grove');
    expect(p.unlockedKings).toContain('grove');
    expect(p.crownPoints).toBe(0);
    expect(unlockKing(p, 'grove')).toBe(p);
  });
  it('nomad needs a win as well', () => {
    expect(canUnlockKing(rich(80), 'nomad')).toBe(false);
    const won = { ...rich(80), wins: { ...defaultProfile().wins, wheat: 1 } };
    expect(canUnlockKing(won, 'nomad')).toBe(true);
    expect(unlockKing(won, 'nomad').crownPoints).toBe(0);
  });
  it('cards cost points and do not charge twice', () => {
    expect(unlockCard(rich(14), 'neutral_duplicate').unlockedCards).toEqual([]);
    const p = unlockCard(rich(20), 'neutral_duplicate');
    expect(p.unlockedCards).toEqual(['neutral_duplicate']);
    expect(p.crownPoints).toBe(5);
    expect(unlockCard(p, 'neutral_duplicate')).toBe(p);
    const r = rich(99);
    expect(unlockCard(r, 'wheat_militia')).toBe(r);
  });
  it('perks follow mastery', () => {
    const m = (v: number) => ({ ...defaultProfile(), mastery: { ...defaultProfile().mastery, wheat: v } });
    expect(unlockedPerks(m(9), 'wheat')).toEqual([]);
    expect(unlockedPerks(m(29), 'wheat')).toEqual(['wheat_p1']);
    expect(unlockedPerks(m(30), 'wheat')).toEqual(['wheat_p1', 'wheat_p2']);
    expect(unlockedPerks(m(60), 'wheat')).toHaveLength(3);
  });
  it('difficulties', () => {
    expect(availableDifficulties(defaultProfile())).toEqual([0]);
    expect(availableDifficulties({ ...defaultProfile(), highestDifficultyWon: 0 })).toEqual([0, 1]);
    expect(availableDifficulties({ ...defaultProfile(), highestDifficultyWon: 5 })).toEqual([0, 1, 2, 3, 4, 5]);
  });
  it('settleRun credits once', () => {
    const run = fakeRun({ years: 30, conquered: 6, bosses: 3, won: true });
    const a = settleRun(defaultProfile(), run);
    expect(a.profile.crownPoints).toBe(83);
    expect(a.profile.mastery.wheat).toBe(83);
    expect(a.profile.wins.wheat).toBe(1);
    expect(a.profile.highestDifficultyWon).toBe(0);
    expect(a.unlocks).toContain('Mở độ khó Gai 1');
    expect(a.unlocks.some((u) => u.startsWith('Mở đặc quyền:'))).toBe(true);
    const b = settleRun(a.profile, run);
    expect(b.profile).toBe(a.profile);
    expect(b.breakdown.total).toBe(83);
    expect(b.unlocks).toEqual([]);
  });
  it('keeps only the 20 most recent settled runs', () => {
    let p = defaultProfile();
    for (let s = 0; s < 25; s++) {
      p = settleRun(p, fakeRun({ years: 1, conquered: 0, bosses: 0, won: false, seed: s })).profile;
    }
    expect(p.settledRuns).toHaveLength(20);
    expect(p.settledRuns[19]).toBe(runKey(fakeRun({ years: 1, conquered: 0, bosses: 0, won: false, seed: 24 })));
  });
  it('replaying the same seed with a different outcome settles again', () => {
    const a = fakeRun({ years: 5, conquered: 0, bosses: 0, won: false, seed: 3 });
    const b = fakeRun({ years: 9, conquered: 1, bosses: 0, won: false, seed: 3 });
    const p = settleRun(settleRun(defaultProfile(), a).profile, b).profile;
    expect(p.crownPoints).toBe(5 + 12);
  });
});
