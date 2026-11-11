import { describe, expect, it } from 'vitest';
import { DECREES } from '../../data/decrees';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import { RUN } from '../../data/run';
import type { BattleResult } from '../battle/types';
import { CONTENT } from '../cards/registry';
import { applyCommand, type CommandResult } from './commands';
import { isCouncilYear, isFinalYear } from './endlessRules';
import type { RunCommand, RunState } from './state';
import { newRun } from './yearFlow';

const result = (won: boolean, over: Partial<BattleResult> = {}): BattleResult => ({
  won,
  ticks: 400,
  throneHpLostPct: 5,
  kills: 10,
  killsBySource: {},
  interventionsUsed: 1,
  unitsLost: 0,
  capped: 0,
  inputs: [],
  ...over,
});

const ok = (r: CommandResult): RunState => {
  if ('error' in r) throw new Error(`illegal: ${r.error}`);
  return r.state;
};
const run = (s: RunState, cmd: RunCommand): RunState => ok(applyCommand(s, cmd, CONTENT));

const fight = (rules: typeof RULES_FULL, year: number, over: Partial<RunState> = {}): RunState => ({
  ...newRun(5, 'wheat', CONTENT, rules),
  year,
  phase: 'battle',
  played: true,
  army: { attacker: 'raiders', budget: 10, level: 1, statMult: 1, waves: [] },
  ...over,
});

describe('final year and council years (spec 2026-11-09 §3)', () => {
  it('normal ends at rules.years; endless never has a final year', () => {
    expect(isFinalYear(fight(RULES_FULL, 30))).toBe(true);
    expect(isFinalYear(fight(RULES_FULL, 29))).toBe(false);
    expect(isFinalYear(fight(RULES_ENDLESS, 30))).toBe(false);
    expect(isFinalYear(fight(RULES_ENDLESS, 1_000_000))).toBe(false);
  });

  it('councils: normal 5..25, endless every multiple of 5', () => {
    const normal = (RUN.councilYears as readonly number[]).filter((y) => isCouncilYear(fight(RULES_FULL, y)));
    expect(normal).toEqual([...RUN.councilYears]);
    expect(isCouncilYear(fight(RULES_FULL, 30))).toBe(false);
    for (const y of [5, 10, 25, 30, 35, 40, 1000]) expect(isCouncilYear(fight(RULES_ENDLESS, y))).toBe(true);
    for (const y of [29, 31, 41]) expect(isCouncilYear(fight(RULES_ENDLESS, y))).toBe(false);
  });
});

describe('endless continues past year 30', () => {
  it('a won year-30 battle ends a normal run but gives an endless run its reward and council', () => {
    const normal = run(fight(RULES_FULL, 30), { type: 'battleResult', result: result(true) });
    expect(normal.phase).toBe('ended');
    expect(normal.won).toBe(true);

    const endless = run(fight(RULES_ENDLESS, 30), { type: 'battleResult', result: result(true) });
    expect(endless.phase).toBe('reward');
    expect(endless.won).toBeNull();
    expect(endless.offers?.kind).toBe('reward');
    expect(endless.pendingOffers.some((o) => o.kind === 'council')).toBe(true);
  });

  it('a lost battle with lives left keeps going (council at 35); the last life ends the run as a loss', () => {
    const lost = run(fight(RULES_ENDLESS, 35, { lives: 2 }), { type: 'battleResult', result: result(false) });
    expect(lost.phase).toBe('council');
    expect(lost.lives).toBe(1);
    const dead = run(fight(RULES_ENDLESS, 35, { lives: 1 }), { type: 'battleResult', result: result(false) });
    expect(dead.phase).toBe('ended');
    expect(dead.won).toBe(false);
    expect(dead.offers).toBeNull();
    expect(dead.pendingOffers).toEqual([]);
  });

  it('advancing from yearEnd at year 31 starts year 32', () => {
    const s = run(fight(RULES_ENDLESS, 31), { type: 'battleResult', result: result(true) });
    const picked = run(s, { type: 'pickOffer', index: null });
    expect(picked.phase).toBe('yearEnd');
    const next = run(picked, { type: 'advance' });
    expect(next.year).toBe(32);
    expect(next.phase === 'planning' || next.phase === 'quest').toBe(true);
  });

  it('a repeat attack by a conquered king pays nothing again and attacks stay at 3', () => {
    const base = fight(RULES_ENDLESS, 39);
    const king = base.enemyKings[0]!;
    base.army = { ...base.army!, attacker: king };
    base.enemies[king] = { attacks: 3, status: 'conquered' };
    const gold = base.gold;
    const s = run(base, { type: 'battleResult', result: result(true) });
    expect(s.enemies[king]).toEqual({ attacks: 3, status: 'conquered' });
    expect(s.stats.conquered).toBe(base.stats.conquered);
    expect(s.pendingConquest).toBeNull();
    expect(s.offers?.kind).toBe('reward');
    expect(s.gold - gold).toBeLessThan(RUN.conquestGold + 1_000);
    expect(s.pendingOffers.some((o) => o.kind === 'conquest')).toBe(false);
  });

  it('a repeat boss counts in bossesWon but bossesDefeated stays unique', () => {
    const base = fight(RULES_ENDLESS, 40, { army: { attacker: 'boss', budget: 10, level: 1, statMult: 1, waves: [], boss: 'boss_bog_ogre', bossOrdinal: 1 } });
    base.stats.bossesWon = 1;
    base.stats.bossesDefeated = ['boss_bog_ogre'];
    const s = run(base, { type: 'battleResult', result: result(true, { bossDefeated: 'boss_bog_ogre' }) });
    expect(s.stats.bossesWon).toBe(2);
    expect(s.stats.bossesDefeated).toEqual(['boss_bog_ogre']);
  });

  it('no council modal once every decree is owned', () => {
    const base = fight(RULES_ENDLESS, 25, { decrees: DECREES.map((d) => d.id) });
    const s = run(base, { type: 'battleResult', result: result(false) });
    expect(s.offers).toBeNull();
    expect(s.pendingOffers).toEqual([]);
    expect(s.phase).toBe('yearEnd');
    const later = run(fight(RULES_ENDLESS, 35, { decrees: DECREES.map((d) => d.id) }), { type: 'battleResult', result: result(false) });
    expect([later.offers?.kind, ...later.pendingOffers.map((o) => o.kind)]).toEqual(['blessing']);
  });
});
