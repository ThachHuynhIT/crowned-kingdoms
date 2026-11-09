import { describe, expect, it } from 'vitest';
import { ENDLESS_LIVES_CAP } from '../../data/endless';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import { RUN, unlockCost } from '../../data/run';
import { CONTENT } from '../cards/registry';
import { applyCommand } from './commands';
import { endlessInterest, maxLivesForRun, pickBlessing, plotPurchasePrice } from './endlessBlessings';
import type { RunState } from './state';
import { newRun, startYear } from './yearFlow';

type Id = 'harvest' | 'treasury' | 'vitality' | 'interest' | 'reroll' | 'survey';
const endless = (stacks: Partial<Record<Id, number>> = {}, over: Partial<RunState> = {}): RunState => {
  const s = newRun(3, 'wheat', CONTENT, RULES_ENDLESS);
  return { ...s, year: 31, endless: { ...s.endless!, blessingStacks: stacks }, ...over };
};
/** A blessing offer holding exactly `id` at index 0. */
const offering = (s: RunState, id: Id): RunState => ({
  ...s,
  phase: 'blessing',
  offers: { kind: 'blessing', blessingIds: [id, 'might', 'haste'], year: 30 },
  pendingOffers: [],
});

describe('lives (vitality)', () => {
  it('normal cap is RUN.maxLives; each vitality stack raises the Endless cap by one up to 6', () => {
    expect(maxLivesForRun(newRun(3, 'wheat', CONTENT, RULES_FULL))).toBe(RUN.maxLives);
    expect(maxLivesForRun(endless())).toBe(RUN.maxLives);
    expect(maxLivesForRun(endless({ vitality: 1 }))).toBe(Math.min(ENDLESS_LIVES_CAP, RUN.maxLives + 1));
    expect(maxLivesForRun(endless({ vitality: 2 }))).toBe(Math.min(ENDLESS_LIVES_CAP, RUN.maxLives + 2));
  });

  it('picking vitality at full lives raises the cap and heals one at once', () => {
    const s = offering(endless({}, { lives: RUN.maxLives }), 'vitality');
    const next = pickBlessing(s, 0);
    if (typeof next === 'string') throw new Error(next);
    expect(next.lives).toBe(RUN.maxLives + 1);
    const again = pickBlessing(offering(next, 'vitality'), 0);
    if (typeof again === 'string') throw new Error(again);
    expect(again.lives).toBe(RUN.maxLives + 2);
  });
});

describe('year start economy', () => {
  it('harvest adds 2 tax per stack and reroll a free reroll per stack, from the next year', () => {
    const base = { ...endless(), phase: 'yearEnd' as const };
    const plain = startYear(base, CONTENT);
    const blessed = startYear({ ...base, endless: { ...base.endless!, blessingStacks: { harvest: 2, reroll: 1 } } }, CONTENT);
    expect(blessed.gold - plain.gold).toBe(4);
    expect(blessed.stats.goldEarned - plain.stats.goldEarned).toBe(4);
    expect(blessed.freeRerollsLeft - plain.freeRerollsLeft).toBe(1);
  });

  it('interest: 2% per stack of the balance after upkeep, floored, at most 10 per stack', () => {
    expect(endlessInterest(endless({ interest: 1 }), 123)).toBe(2);
    expect(endlessInterest(endless({ interest: 1 }), 1000)).toBe(10);
    expect(endlessInterest(endless({ interest: 2 }), 1000)).toBe(20);
    expect(endlessInterest(endless({ interest: 2 }), 300)).toBe(12);
    expect(endlessInterest(endless(), 1000)).toBe(0);
    expect(endlessInterest(endless({ interest: 1 }), -5)).toBe(0);
  });

  it('interest is paid at year start on the balance before tax', () => {
    const base = { ...endless({}, { gold: 100 }), phase: 'yearEnd' as const };
    const plain = startYear(base, CONTENT);
    const blessed = startYear({ ...base, endless: { ...base.endless!, blessingStacks: { interest: 1 } } }, CONTENT);
    expect(blessed.gold - plain.gold).toBe(2);
  });

  it('treasury adds 2 gold per stack to a won battle', () => {
    const fight = (stacks: Partial<Record<Id, number>>): RunState => ({
      ...endless(stacks),
      year: 31,
      phase: 'battle',
      played: true,
      army: { attacker: 'raiders', budget: 10, level: 1, statMult: 1, waves: [] },
    });
    const res = { won: true, ticks: 1, throneHpLostPct: 0, kills: 0, killsBySource: {}, interventionsUsed: 0, unitsLost: 0, capped: 0, inputs: [] };
    const a = applyCommand(fight({}), { type: 'battleResult', result: res }, CONTENT);
    const b = applyCommand(fight({ treasury: 3 }), { type: 'battleResult', result: res }, CONTENT);
    if ('error' in a || 'error' in b) throw new Error('illegal');
    expect(b.state.gold - a.state.gold).toBe(6);
  });
});

describe('plot prices', () => {
  it('inner plots keep unlockCost; outer plots cost 20 + 2k; survey takes 10% per stack, floored, at least 1', () => {
    const s = endless({}, { purchasedPlots: 0 });
    expect(plotPurchasePrice(s, 5)).toBe(unlockCost(0));
    expect(plotPurchasePrice(s, 34)).toBe(20);
    expect(plotPurchasePrice({ ...s, purchasedPlots: 1 }, 34)).toBe(22);
    const survey = endless({ survey: 1 }, { purchasedPlots: 0 });
    expect(plotPurchasePrice(survey, 34)).toBe(18);
    expect(plotPurchasePrice(survey, 5)).toBe(Math.max(1, Math.floor((unlockCost(0) * 90) / 100)));
    expect(plotPurchasePrice(endless({ survey: 5 }), 5)).toBeGreaterThanOrEqual(1);
    const normal = newRun(3, 'wheat', CONTENT, RULES_FULL);
    expect(plotPurchasePrice(normal, 5)).toBe(unlockCost(normal.purchasedPlots));
  });

  it('unlockPlot charges the shared price', () => {
    const s = endless({ survey: 1 }, { phase: 'planning', gold: 100 });
    s.plots[5]!.unlocked = true;
    const r = applyCommand(s, { type: 'unlockPlot', plot: 34 }, CONTENT);
    if ('error' in r) throw new Error(r.error);
    expect(r.state.gold).toBe(100 - 18);
    expect(r.state.purchasedPlots).toBe(1);
  });
});
