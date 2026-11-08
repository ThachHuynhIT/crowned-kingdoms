import { describe, expect, it } from 'vitest';
import { RULES_FULL } from '../../data/rules';
import { aggregateBalance, csv, parseBalanceArgs } from './balance';
import { greedyBot } from './bots/greedy';
import { runHeadless } from './headless';
import { createRunStats, type RunStats } from './stats';

const stats = (over: Partial<RunStats>): RunStats => ({
  seed: 1,
  kingId: 'wheat',
  difficulty: 0,
  won: false,
  yearReached: 10,
  completedYears: 10,
  commands: 100,
  picks: {},
  offered: {},
  battlesReached: {},
  battlesLost: {},
  ...over,
});

describe('parseBalanceArgs', () => {
  it('defaults to all kings, 500 runs, greedy, Gai 0', () => {
    const o = parseBalanceArgs([]);
    expect(o.kings).toHaveLength(9);
    expect(o).toMatchObject({ runs: 500, bot: 'greedy', difficulty: 0 });
  });

  it('reads every flag', () => {
    expect(
      parseBalanceArgs(['--king', 'moon', '--runs', '20', '--bot', 'random', '--difficulty', '3']),
    ).toEqual({
      kings: ['moon'],
      runs: 20,
      bot: 'random',
      difficulty: 3,
    });
  });

  it.each([
    [['--king', 'dragon']],
    [['--runs', '0']],
    [['--runs', '1.5']],
    [['--runs', 'NaN']],
    [['--bot', 'smart']],
    [['--difficulty', '-1']],
    [['--difficulty', '6']],
    [['--seed', '1']],
    [['--runs']],
  ])('rejects %j', (args) => {
    expect(() => parseBalanceArgs(args)).toThrow();
  });
});

describe('aggregateBalance', () => {
  it('computes win rate, mean year, pick and loss rates with their numerators and denominators', () => {
    const t = aggregateBalance(
      [
        stats({
          won: true,
          yearReached: 30,
          picks: { a: 1 },
          offered: { a: 2, b: 1 },
          battlesReached: { 1: 1, 2: 1 },
          battlesLost: { 2: 1 },
        }),
        stats({ seed: 2, yearReached: 10, offered: { a: 1 }, battlesReached: { 1: 1 } }),
        stats({ seed: 1, kingId: 'stone', won: true, yearReached: 30 }),
      ],
      ['a', 'b', 'c'],
    );
    expect(t.kings).toEqual([
      // ALL_KINGS order (sorted ids)
      { kingId: 'stone', runs: 1, wins: 1, winRate: 1, meanYear: 30 },
      { kingId: 'wheat', runs: 2, wins: 1, winRate: 0.5, meanYear: 20 },
    ]);
    expect(t.cards).toEqual([
      { cardId: 'a', picked: 1, offered: 3, rate: 1 / 3 },
      { cardId: 'b', picked: 0, offered: 1, rate: 0 },
      { cardId: 'c', picked: 0, offered: 0, rate: null },
    ]);
    expect(t.years).toEqual([
      { year: 1, lost: 0, reached: 2, rate: 0 },
      { year: 2, lost: 1, reached: 1, rate: 1 },
    ]);
    expect(t.spread).toBe(0.5);
    expect(t.onTarget).toBe(false);
  });

  it('is on target when every king is within 35–65% and the spread is at most 15 points', () => {
    const runs = (kingId: 'wheat' | 'stone', wins: number) =>
      Array.from({ length: 20 }, (_, i) => stats({ seed: i + 1, kingId, won: i < wins }));
    expect(aggregateBalance([...runs('wheat', 8), ...runs('stone', 11)]).onTarget).toBe(true); // 40% / 55%
    expect(aggregateBalance([...runs('wheat', 7), ...runs('stone', 11)]).onTarget).toBe(false); // 35% / 55%: spread 20
    expect(aggregateBalance([...runs('wheat', 6), ...runs('stone', 7)]).onTarget).toBe(false); // 30% below the band
  });
});

describe('csv', () => {
  it('escapes quotes, commas and newlines and leaves null cells empty', () => {
    expect(csv([['a', 'b,c', 'say "hi"', 'x\ny', null, 3]])).toBe(
      'a,"b,c","say ""hi""","x\ny",,3\n',
    );
  });
});

describe('createRunStats on a real run', () => {
  it('counts battles per year, offers and picks, identically for the same seed', () => {
    const collect = () => {
      const c = createRunStats(2, 'stone', 0);
      const result = runHeadless({
        seed: 2,
        kingId: 'stone',
        rules: RULES_FULL,
        bot: greedyBot,
        onCommand: c.observe,
      });
      return { s: c.finish(result), result };
    };
    const { s, result } = collect();
    expect(s.completedYears).toBe(result.state.stats.battlesWon + result.state.stats.battlesLost);
    expect(Object.values(s.battlesLost).reduce((a, b) => a + b, 0)).toBe(
      result.state.stats.battlesLost,
    );
    expect(s.yearReached).toBe(result.state.year);
    expect(s.won).toBe(result.state.won === true);
    const picked = Object.values(s.picks).reduce((a, b) => a + b, 0);
    expect(picked).toBeGreaterThan(0);
    for (const [id, n] of Object.entries(s.picks))
      expect(n).toBeLessThanOrEqual(s.offered[id] ?? 0);
    expect(JSON.stringify(collect().s)).toBe(JSON.stringify(s));
  }, 60_000);

  it('passes difficulty and perk to newRun', () => {
    const r = runHeadless({
      seed: 1,
      kingId: 'wheat',
      rules: RULES_FULL,
      bot: greedyBot,
      difficulty: 3,
      perk: 'wheat_p1',
    });
    expect(r.state.difficulty).toBe(3);
    expect(r.state.perk).toBe('wheat_p1');
  }, 60_000);
});
