import { describe, expect, it } from 'vitest';
import { Rng, hashSeed } from '../../../core/random';
import { GREEDY_MAX_REROLLS } from '../../../data/balance';
import { ALL_KINGS, RULES_FULL } from '../../../data/rules';
import { CONTENT } from '../../cards/registry';
import { applyCommand } from '../../run/commands';
import { newRun } from '../../run/yearFlow';
import { attackStats, battleSetup, structure, throneSetup, unitStats } from '../../testing/fixtures';
import { runHeadless } from '../headless';
import { estimatePower, greedyBot } from './greedy';

const rng = () => new Rng(hashSeed('greedy-test'));

describe('estimatePower', () => {
  it('counts our units and towers once, never the enemy waves', () => {
    const troop = structure(7, { spawn: { stats: unitStats({ hp: 10, dmg: 4, interval: 20 }), count: 2 } }); // 2 × 10 × 2 = 40
    const tower = structure(8, { kind: 'tower', hp: 30, attack: attackStats({ dmg: 6, interval: 10 }) }); // 30 × 6 = 180
    const throne = throneSetup({ attack: null, hp: 300 });
    const setup = battleSetup({
      throne,
      structures: [tower, troop],
      waves: [{ spawnTick: 0, spawns: [{ stats: unitStats({ hp: 999, dmg: 99 }), edge: 'S' }] }],
    });
    expect(estimatePower(setup)).toBe(220);
  });

  it('adds pulse DPS (dmg × 10 / everyTicks) and multi-attack to the HP product, and start summons by count', () => {
    // pulse 10 dmg every 20 ticks = 10 × 10 / 20 = 5 dps; attack 6 dmg / 10 ticks = 6 dps × 2 targets = 12
    const tower = structure(8, {
      kind: 'tower',
      hp: 30,
      attack: attackStats({ dmg: 6, interval: 10 }),
      multiAttack: 2,
      pulse: { everyTicks: 20, radius: 40, dmg: 10, dmgType: 'physical', stunTicks: 0 },
      startSummon: { stats: unitStats({ hp: 20, dmg: 5, interval: 10 }), count: 3 }, // 3 × 20 × 5 = 300
    });
    const setup = battleSetup({ throne: throneSetup({ attack: null }), structures: [tower] });
    expect(estimatePower(setup)).toBe(30 * (12 + 5) + 300);
  });

  it('gives 0 for a non-positive interval', () => {
    const setup = battleSetup({ throne: throneSetup({ attack: attackStats({ dmg: 6, interval: 0 }) }) });
    expect(estimatePower(setup)).toBe(0);
  });
});

describe('greedyBot', () => {
  it('turns auto-fire on first, then plays a legal card, without touching its input or the bot Rng', () => {
    let state = newRun(1, 'wheat', CONTENT, RULES_FULL);
    const before = JSON.stringify(state);
    const r = rng();
    const first = greedyBot(state, CONTENT, r);
    expect(first).toEqual({ type: 'setAutoFire', on: true });
    state = (applyCommand(state, first, CONTENT) as { state: typeof state }).state;
    const next = greedyBot(state, CONTENT, r);
    expect(next.type).toBe('play');
    expect('error' in applyCommand(state, next, CONTENT)).toBe(false);
    expect(r.int(0, 1_000_000)).toBe(rng().int(0, 1_000_000)); // no draw from the bot Rng
    expect(JSON.stringify(newRun(1, 'wheat', CONTENT, RULES_FULL))).toBe(before);
  });

  it('is deterministic: the same state always gives the same command', () => {
    const state = { ...newRun(3, 'stone', CONTENT, RULES_FULL), autoFire: true };
    expect(greedyBot(state, CONTENT, rng())).toEqual(greedyBot(state, CONTENT, rng()));
  });

  it('rerolls at most GREEDY_MAX_REROLLS times a year, and only when nothing can be played', () => {
    const base = { ...newRun(1, 'wheat', CONTENT, RULES_FULL), autoFire: true, gold: 999 };
    const empty = { ...base, hand: [] as typeof base.hand };
    expect(greedyBot({ ...empty, rerollsThisYear: 0 }, CONTENT, rng()).type).toBe('reroll');
    expect(greedyBot({ ...empty, rerollsThisYear: GREEDY_MAX_REROLLS }, CONTENT, rng()).type).not.toBe('reroll');
    expect(greedyBot(base, CONTENT, rng()).type).not.toBe('reroll');
  });
});

describe('greedyBot full runs (RULES_FULL, 9 kings × 3 seeds)', () => {
  for (const kingId of ALL_KINGS) {
    it(`${kingId} finishes 30-year runs without an illegal command, deterministically`, () => {
      for (const seed of [1, 2, 3]) {
        const a = runHeadless({ seed, kingId, rules: RULES_FULL, bot: greedyBot });
        expect(a.state.phase).toBe('ended');
        expect(a.state.year).toBeLessThanOrEqual(30);
        expect(typeof a.state.won).toBe('boolean');
        const all = [...a.state.hand, ...a.state.drawPile, ...a.state.discardPile].sort();
        expect(all).toEqual([...a.state.deck].sort());
        const b = runHeadless({ seed, kingId, rules: RULES_FULL, bot: greedyBot });
        expect(JSON.stringify(b.state)).toBe(JSON.stringify(a.state));
        expect(b.commands).toBe(a.commands);
      }
    }, 300_000);
  }
});
