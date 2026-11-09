import { describe, expect, it } from 'vitest';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import { greedyBot } from './bots/greedy';
import { runHeadless } from './headless';

/** Endless E4 (plan 2026-11-09 Task 10): real headless runs past year 30, deterministic, bounded by a horizon. */
describe('runHeadless in Endless', () => {
  it('refuses an Endless run without a positive year horizon', () => {
    expect(() =>
      runHeadless({ seed: 1, kingId: 'stone', rules: RULES_ENDLESS, bot: greedyBot }),
    ).toThrow(/horizon/);
    expect(() =>
      runHeadless({
        seed: 1,
        kingId: 'stone',
        rules: RULES_ENDLESS,
        bot: greedyBot,
        stopAfterYears: 0,
      }),
    ).toThrow(/horizon/);
  });

  it('stops at the end of year N after every offer, before advancing (yearEnd, lives > 0, not won)', () => {
    const r = runHeadless({
      seed: 1,
      kingId: 'stone',
      rules: RULES_ENDLESS,
      bot: greedyBot,
      stopAfterYears: 3,
    });
    expect(r.stoppedBy).toBe('yearLimit');
    expect(r.state.year).toBe(3);
    expect(r.state.phase).toBe('yearEnd');
    expect(r.state.won).toBeNull();
  }, 60_000);

  it('a normal run is unchanged by the new options (no stop, ends by itself)', () => {
    const a = runHeadless({ seed: 2, kingId: 'wheat', rules: RULES_FULL, bot: greedyBot });
    expect(a.stoppedBy).toBeUndefined();
    expect(a.state.phase).toBe('ended');
  }, 60_000);

  it('the greedy bot survives a real Endless run past year 40 (blessings at 30/35/40, boss 40), deterministically', () => {
    const run = () =>
      runHeadless({
        seed: ENDLESS_SEED,
        kingId: ENDLESS_KING,
        rules: RULES_ENDLESS,
        bot: greedyBot,
        stopAfterYears: 40,
      });
    const a = run();
    expect(a.stoppedBy).toBe('yearLimit');
    expect(a.state.year).toBe(40);
    expect(a.state.lives).toBeGreaterThan(0);
    expect(a.state.won).toBeNull();
    expect(a.state.stats.completedYears).toBe(40);
    const stacks = Object.values(a.state.endless?.blessingStacks ?? {}).reduce(
      (s, n) => s + (n ?? 0),
      0,
    );
    expect(stacks).toBe(3); // years 30, 35 and 40
    expect(a.state.endless?.lastBlessingYear).toBe(40);
    const b = run();
    expect(JSON.stringify(b.state)).toBe(JSON.stringify(a.state));
    expect(b.commands).toBe(a.commands);
  }, 300_000);
});

// Measured on 2026-11-09 (seeds 1..20 tried in order, the first that lives to 40 is frozen here).
const ENDLESS_SEED = 1;
const ENDLESS_KING = 'stone' as const;
