import { describe, expect, it } from 'vitest';
import { ENDLESS_LIVES_CAP } from '../../data/endless';
import { RULES_ENDLESS } from '../../data/rules';
import { RUN } from '../../data/run';
import { CONTENT } from '../cards/registry';
import { modifierAt } from '../run/endlessModifiers';
import type { RunState } from '../run/state';
import { newRun } from '../run/yearFlow';
import { decodeRun } from './codec';

const env = (state: unknown) => ({ formatVersion: 1, version: 7, contentHash: 1, state });
const kind = (state: unknown): string => decodeRun(env(state), CONTENT).kind;

/** An Endless run at `year` (planning), consistent with its modifier block. */
const endlessAt = (year: number, over: Partial<NonNullable<RunState['endless']>> = {}): RunState => {
  const s = newRun(21, 'stone', CONTENT, RULES_ENDLESS);
  const m = modifierAt(21, year);
  return {
    ...s,
    year,
    endless: { ...s.endless!, modifierId: m?.id ?? null, modifierStartYear: m?.startYear ?? 0, ...over },
  };
};

describe('Endless save validation (spec 2026-11-09 §8)', () => {
  it('accepts a year-65 Endless run with 49 plots and an unbounded year', () => {
    expect(kind(endlessAt(65, { lastBlessingYear: 65 }))).toBe('ok');
    expect(kind(endlessAt(1_000_000))).toBe('ok');
  });

  it('rejects fractional or unsafe years', () => {
    expect(kind({ ...endlessAt(40), year: 40.5 })).toBe('incompatible');
    expect(kind({ ...endlessAt(40), year: Number.MAX_SAFE_INTEGER + 2 })).toBe('incompatible');
  });

  it('checks blessing stacks: known id, positive integer, at most the cap', () => {
    expect(kind(endlessAt(40, { blessingStacks: { vigor: 20 } }))).toBe('ok');
    expect(kind(endlessAt(40, { blessingStacks: { vigor: 21 } }))).toBe('incompatible');
    expect(kind(endlessAt(40, { blessingStacks: { vigor: 0 } }))).toBe('incompatible');
    expect(kind(endlessAt(40, { blessingStacks: { vigor: -1 } }))).toBe('incompatible');
  });

  it('lives follow the Endless cap: vitality 2 allows 6, never 7; no vitality allows RUN.maxLives', () => {
    const two = endlessAt(40, { blessingStacks: { vitality: 2 } });
    const cap = Math.min(ENDLESS_LIVES_CAP, RUN.maxLives + 2);
    expect(kind({ ...two, lives: cap })).toBe('ok');
    expect(kind({ ...two, lives: cap + 1 })).toBe('incompatible');
    expect(kind({ ...endlessAt(40), lives: RUN.maxLives + 1 })).toBe('incompatible');
  });

  it('lastBlessingYear is 0 or a milestone (30, 35, …) not after the current year', () => {
    expect(kind(endlessAt(40, { lastBlessingYear: 35 }))).toBe('ok');
    expect(kind(endlessAt(40, { lastBlessingYear: 33 }))).toBe('incompatible');
    expect(kind(endlessAt(40, { lastBlessingYear: 25 }))).toBe('incompatible');
    expect(kind(endlessAt(40, { lastBlessingYear: 45 }))).toBe('incompatible');
  });

  it('the stored modifier must be the block of the current year', () => {
    const s = endlessAt(45);
    const other = (['elite', 'double_edge', 'famine', 'siege'] as const).find((id) => id !== s.endless!.modifierId)!;
    expect(kind({ ...s, endless: { ...s.endless!, modifierId: other } })).toBe('incompatible');
    expect(kind({ ...s, endless: { ...s.endless!, modifierStartYear: 31 } })).toBe('incompatible');
    expect(kind({ ...endlessAt(20), endless: { ...endlessAt(20).endless!, modifierId: 'elite' } })).toBe('incompatible');
  });
});
