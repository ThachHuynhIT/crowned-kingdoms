import { describe, expect, it } from 'vitest';
import { ENDLESS_BLESSINGS, ENDLESS_BLESSING_IDS, ENDLESS_MAXED_BLESSING_GOLD } from '../../data/endless';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import type { BattleResult } from '../battle/types';
import { CONTENT } from '../cards/registry';
import { applyCommand, type CommandResult } from './commands';
import { blessingStacks, isBlessingYear, pickBlessing, rollBlessingOffer } from './endlessBlessings';
import { cardOffer } from './flow';
import type { RunCommand, RunState } from './state';
import { newRun } from './yearFlow';

const result = (won: boolean): BattleResult => ({
  won,
  ticks: 400,
  throneHpLostPct: 5,
  kills: 10,
  killsBySource: {},
  interventionsUsed: 1,
  unitsLost: 0,
  capped: 0,
  inputs: [],
});
const ok = (r: CommandResult): RunState => {
  if ('error' in r) throw new Error(`illegal: ${r.error}`);
  return r.state;
};
const run = (s: RunState, cmd: RunCommand): RunState => ok(applyCommand(s, cmd, CONTENT));
const fight = (year: number, over: Partial<RunState> = {}, rules = RULES_ENDLESS): RunState => ({
  ...newRun(5, 'wheat', CONTENT, rules),
  year,
  phase: 'battle',
  played: true,
  army: { attacker: 'raiders', budget: 10, level: 1, statMult: 1, waves: [] },
  ...over,
});

describe('blessing table (spec 2026-11-09 §5)', () => {
  it('has the twelve blessings in id order with their caps', () => {
    expect(ENDLESS_BLESSINGS.map((b) => b.id)).toEqual([...ENDLESS_BLESSING_IDS]);
    expect(Object.fromEntries(ENDLESS_BLESSINGS.map((b) => [b.id, b.maxStacks]))).toEqual({
      harvest: 10, treasury: 10, vigor: 20, might: 20, haste: 10, tower_might: 20,
      tower_haste: 10, masonry: 20, vitality: 2, interest: 5, reroll: 3, survey: 5,
    });
  });
});

describe('rolling a blessing offer', () => {
  it('blessing years: 30, 35, 40 … in Endless only', () => {
    for (const y of [30, 35, 40, 1000]) expect(isBlessingYear(fight(y))).toBe(true);
    for (const y of [25, 29, 31]) expect(isBlessingYear(fight(y))).toBe(false);
    expect(isBlessingYear(fight(30, {}, RULES_FULL))).toBe(false);
  });

  it('draws three distinct ids from the blessing stream only, once per milestone', () => {
    const s = { ...fight(30), phase: 'yearEnd' as const };
    const a = rollBlessingOffer(s);
    const b = rollBlessingOffer(s);
    expect(a).toEqual(b);
    const offer = a.offers;
    expect(offer?.kind).toBe('blessing');
    if (offer?.kind !== 'blessing') return;
    expect(new Set(offer.blessingIds).size).toBe(3);
    expect(offer.year).toBe(30);
    expect(a.endless!.lastBlessingYear).toBe(30);
    expect(a.rng.blessing).not.toBe(s.rng.blessing);
    expect({ ...a.rng, blessing: 0 }).toEqual({ ...s.rng, blessing: 0 });
    expect(cardOffer(a)).toBeNull();
    // Same milestone again: nothing new is queued.
    const again = rollBlessingOffer({ ...a, offers: null, phase: 'yearEnd' });
    expect(again.offers).toBeNull();
    expect(again.rng.blessing).toBe(a.rng.blessing);
  });

  it('queues reward → council → blessing after a won year-30 battle', () => {
    const s = run(fight(30), { type: 'battleResult', result: result(true) });
    expect(s.offers?.kind).toBe('reward');
    expect(s.pendingOffers.map((o) => o.kind)).toEqual(['council', 'blessing']);
  });

  it('a lost battle with lives left still gets the blessing; the last life does not', () => {
    const lost = run(fight(35, { lives: 2 }), { type: 'battleResult', result: result(false) });
    expect([lost.offers?.kind, ...lost.pendingOffers.map((o) => o.kind)]).toEqual(['council', 'blessing']);
    const dead = run(fight(35, { lives: 1 }), { type: 'battleResult', result: result(false) });
    expect(dead.phase).toBe('ended');
    expect(dead.endless!.lastBlessingYear).toBe(0);
  });
});

describe('picking a blessing', () => {
  const offered = (stacks: RunState['endless'] = null): RunState => {
    const base = fight(30, { phase: 'yearEnd' });
    const s = rollBlessingOffer(stacks ? { ...base, endless: stacks } : base);
    return s;
  };

  it('adds one stack and closes the offer (yearEnd when nothing else waits)', () => {
    const s = offered();
    expect(s.phase).toBe('blessing');
    const id = (s.offers as { blessingIds: string[] }).blessingIds[1]!;
    const next = run(s, { type: 'pickBlessing', index: 1 });
    expect(blessingStacks(next, id as never)).toBe(1);
    expect(next.offers).toBeNull();
    expect(next.phase).toBe('yearEnd');
  });

  it('refuses bad indices and the wrong phase without changing anything', () => {
    const s = offered();
    for (const index of [-1, 3, 1.5, Number.NaN]) {
      expect(applyCommand(s, { type: 'pickBlessing', index }, CONTENT)).toEqual({ error: 'badTarget' });
    }
    expect(pickBlessing({ ...s, phase: 'planning' }, 0)).toBe('wrongPhase');
    const picked = run(s, { type: 'pickBlessing', index: 0 });
    expect(applyCommand(picked, { type: 'pickBlessing', index: 0 }, CONTENT)).toEqual({ error: 'wrongPhase' });
  });

  it('a maxed blessing pays gold instead of a stack', () => {
    const s = offered();
    const id = (s.offers as { blessingIds: string[] }).blessingIds[0]! as (typeof ENDLESS_BLESSING_IDS)[number];
    const max = ENDLESS_BLESSINGS.find((b) => b.id === id)!.maxStacks;
    const full = { ...s, endless: { ...s.endless!, blessingStacks: { [id]: max } } };
    const next = run(full, { type: 'pickBlessing', index: 0 });
    expect(blessingStacks(next, id)).toBe(max);
    expect(next.gold).toBe(full.gold + ENDLESS_MAXED_BLESSING_GOLD);
    expect(next.stats.goldEarned).toBe(full.stats.goldEarned + ENDLESS_MAXED_BLESSING_GOLD);
  });
});
