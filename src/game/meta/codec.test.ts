import { describe, expect, it } from 'vitest';
import { decodeMeta } from './codec';
import { defaultProfile } from './profile';

describe('decodeMeta', () => {
  it('missing input is the default profile', () => {
    expect(decodeMeta(undefined)).toEqual({ kind: 'ok', profile: defaultProfile() });
  });
  it('a clean profile round-trips as ok', () => {
    const p = { ...defaultProfile(), crownPoints: 12 };
    expect(decodeMeta(JSON.parse(JSON.stringify(p)))).toEqual({ kind: 'ok', profile: p });
  });
  it('repairs a bad number field and keeps the rest', () => {
    for (const bad of [-5, 'x', 1.5, null]) {
      const r = decodeMeta({ ...defaultProfile(), crownPoints: bad, wins: { ...defaultProfile().wins, wheat: 3 } });
      expect(r.kind).toBe('repaired');
      expect(r.profile.crownPoints).toBe(0);
      expect(r.profile.wins.wheat).toBe(3);
    }
  });
  it('drops unknown ids and always keeps the starters', () => {
    const r = decodeMeta({
      ...defaultProfile(),
      unlockedKings: ['grove', 'dragon'],
      unlockedCards: ['neutral_duplicate', 'x_y', 7],
    });
    expect(r.kind).toBe('repaired');
    expect(r.profile.unlockedKings).toEqual(['arcane', 'grove', 'stone', 'wheat']);
    expect(r.profile.unlockedCards).toEqual(['neutral_duplicate']);
  });
  it('clamps difficulty and settings', () => {
    const r = decodeMeta({ ...defaultProfile(), highestDifficultyWon: 99, settings: { master: 50, music: 'a' } });
    expect(r.kind).toBe('repaired');
    expect(r.profile.highestDifficultyWon).toBe(5);
    expect(r.profile.settings).toEqual({ master: 50, music: 100, sfx: 100, screenShake: true });
  });
  it('never throws on garbage', () => {
    for (const g of [null, 5, 'a', [], { settledRuns: 4, mastery: 'x', wins: [] }]) {
      const r = decodeMeta(g);
      expect(r.profile.unlockedKings).toContain('wheat');
    }
  });
  it('a newer version still decodes', () => {
    const r = decodeMeta({ ...defaultProfile(), version: 3, crownPoints: 7 });
    expect(r.kind).toBe('newer');
    expect(r.profile.crownPoints).toBe(7);
  });
  it('trims settled runs to 20 and drops non-strings', () => {
    const runs = Array.from({ length: 25 }, (_, i) => `r${i}`);
    const r = decodeMeta({ ...defaultProfile(), settledRuns: [...runs, 3] });
    expect(r.profile.settledRuns).toEqual(runs.slice(5));
  });
});

describe('decodeMeta v1 -> v2 (Endless, spec 2026-11-09 §2)', () => {
  it('migrates a v1 profile to v2: every progress field kept, Endless still locked even with wins', () => {
    const v1 = { ...defaultProfile(), version: 1, crownPoints: 55, wins: { ...defaultProfile().wins, stone: 3 } } as Record<string, unknown>;
    delete v1.endlessUnlocked;
    const r = decodeMeta(v1);
    expect(r.kind).toBe('repaired'); // written back once as v2
    expect(r.profile.version).toBe(2);
    expect(r.profile.crownPoints).toBe(55);
    expect(r.profile.wins.stone).toBe(3);
    expect(r.profile.endlessUnlocked).toBe(false);
  });

  it('a v2 profile round-trips unchanged', () => {
    const v2 = { ...defaultProfile(), endlessUnlocked: true };
    const r = decodeMeta(JSON.parse(JSON.stringify(v2)));
    expect(r.kind).toBe('ok');
    expect(r.profile).toEqual(v2);
  });
});

describe('decodeMeta settings (G5)', () => {
  const old = (settings: unknown) => ({
    ...defaultProfile(),
    crownPoints: 42,
    mastery: { ...defaultProfile().mastery, wheat: 31 },
    unlockedKings: ['arcane', 'grove', 'stone', 'wheat'],
    unlockedCards: ['neutral_duplicate'],
    settledRuns: ['a', 'b'],
    settings,
  });

  it('a v1 profile without screenShake gets true and keeps every other field', () => {
    const r = decodeMeta(old({ master: 30, music: 70, sfx: 20 }));
    expect(r.profile.settings).toEqual({ master: 30, music: 70, sfx: 20, screenShake: true });
    expect(r.profile.version).toBe(2);
    expect(r.profile.crownPoints).toBe(42);
    expect(r.profile.mastery.wheat).toBe(31);
    expect(r.profile.unlockedKings).toEqual(['arcane', 'grove', 'stone', 'wheat']);
    expect(r.profile.unlockedCards).toEqual(['neutral_duplicate']);
    expect(r.profile.settledRuns).toEqual(['a', 'b']);
  });

  it('screenShake false stays false and a profile with it round-trips as ok', () => {
    const r = decodeMeta(old({ master: 30, music: 70, sfx: 20, screenShake: false }));
    expect(r.kind).toBe('ok');
    expect(r.profile.settings.screenShake).toBe(false);
  });

  it('a wrong screenShake type is repaired on its own', () => {
    const r = decodeMeta(old({ master: 30, music: 70, sfx: 20, screenShake: 'no' }));
    expect(r.kind).toBe('repaired');
    expect(r.profile.settings).toEqual({ master: 30, music: 70, sfx: 20, screenShake: true });
  });

  it('keeps an old off-step volume such as 25', () => {
    expect(decodeMeta(old({ master: 25, music: 25, sfx: 25, screenShake: true })).profile.settings.master).toBe(25);
  });
});
