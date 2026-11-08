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
    expect(r.profile.settings).toEqual({ master: 50, music: 100, sfx: 100 });
  });
  it('never throws on garbage', () => {
    for (const g of [null, 5, 'a', [], { settledRuns: 4, mastery: 'x', wins: [] }]) {
      const r = decodeMeta(g);
      expect(r.profile.unlockedKings).toContain('wheat');
    }
  });
  it('a newer version still decodes', () => {
    const r = decodeMeta({ ...defaultProfile(), version: 2, crownPoints: 7 });
    expect(r.kind).toBe('newer');
    expect(r.profile.crownPoints).toBe(7);
  });
  it('trims settled runs to 20 and drops non-strings', () => {
    const runs = Array.from({ length: 25 }, (_, i) => `r${i}`);
    const r = decodeMeta({ ...defaultProfile(), settledRuns: [...runs, 3] });
    expect(r.profile.settledRuns).toEqual(runs.slice(5));
  });
});
