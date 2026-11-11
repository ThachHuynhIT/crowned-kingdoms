import { describe, expect, it } from 'vitest';
import { Rng } from '../../core/random';
import { REWARD, RUN } from '../../data/run';
import { RULES_ENDLESS, RULES_FULL, RULES_G2 } from '../../data/rules';
import { CONTENT } from '../cards/registry';
import { runState } from '../testing/fixtures';
import { applyCommand } from './commands';
import { isMerchantYear, rewardPools, rollMerchantOffer } from './merchant';
import { rollOffers } from './rewards';
import type { RunState } from './state';

const merchantState = (over: Partial<RunState> = {}): RunState => {
  const base = runState({ rules: RULES_FULL, year: 6, gold: 10, ...over });
  return {
    ...base,
    phase: 'reward',
    offers: { kind: 'merchant', cardIds: ['wheat_field', 'wheat_militia', 'wheat_granary'], price: RUN.merchantPrice },
    pendingOffers: [],
  };
};

describe('Thương nhân (spec 2026-11-10-merchant-design)', () => {
  it('merchant_schedule_boundaries', () => {
    const at = (year: number, rules = RULES_FULL, mode: RunState['mode'] = 'normal'): boolean =>
      isMerchantYear({ year, rules, mode });
    expect([5, 6, 12, 18, 24, 29, 30].map((y) => at(y))).toEqual([false, true, true, true, true, false, false]);
    expect([30, 31, 36, 42, 60].map((y) => at(y, RULES_ENDLESS, 'endless'))).toEqual([false, false, true, true, true]);
    expect(at(6, RULES_ENDLESS, 'endless')).toBe(true);
    expect(at(12, RULES_G2)).toBe(true); // G2 has 15 years
  });

  it('merchant_matches_reward_sampler_without_reward_rng: three cards from the shop stream only', () => {
    const s = { ...runState({ rules: RULES_FULL, year: 12 }), phase: 'reward' as const, offers: null, pendingOffers: [] };
    const after = rollMerchantOffer(s, CONTENT);
    const rng = new Rng(s.rng.shop);
    const expected = rollOffers(rng, 12, rewardPools(s, CONTENT), REWARD.choices);
    expect(after.offers).toEqual({ kind: 'merchant', cardIds: expected, price: RUN.merchantPrice });
    expect(after.rng.shop).toBe(rng.getState());
    expect({ ...after.rng, shop: 0 }).toEqual({ ...s.rng, shop: 0 });
    expect(new Set(expected).size).toBe(expected.length);
  });

  it('merchant_payment_skip_and_invalid_index_are_atomic', () => {
    const poor = merchantState({ gold: 2 });
    const refused = applyCommand(poor, { type: 'pickOffer', index: 0 }, CONTENT);
    expect('error' in refused && refused.error).toBe('notEnoughGold');

    const s = merchantState({ gold: 3 });
    const bought = applyCommand(s, { type: 'pickOffer', index: 1 }, CONTENT);
    if ('error' in bought) throw new Error(bought.error);
    expect(bought.state.gold).toBe(0);
    expect(bought.state.deck).toEqual([...s.deck, 'wheat_militia']);
    expect(bought.state.drawPile[0]).toBe('wheat_militia');
    expect(bought.state.stats.goldEarned).toBe(s.stats.goldEarned);
    expect(bought.state.shopPurchasesThisYear).toBe(s.shopPurchasesThisYear);

    const skipped = applyCommand(s, { type: 'pickOffer', index: null }, CONTENT);
    if ('error' in skipped) throw new Error(skipped.error);
    expect(skipped.state.gold).toBe(3); // skipping is free, no reward-skip gold
    expect(skipped.state.deck).toEqual(s.deck);

    for (const index of [-1, 3, 0.5]) {
      const r = applyCommand(s, { type: 'pickOffer', index }, CONTENT);
      expect('error' in r && r.error).toBe('badTarget');
    }
  });

  it('a reward skip still pays RUN.skipRewardGold', () => {
    const s = { ...merchantState({ gold: 3 }), offers: { kind: 'reward' as const, cardIds: ['wheat_field' as const] } };
    const r = applyCommand(s, { type: 'pickOffer', index: null }, CONTENT);
    if ('error' in r) throw new Error(r.error);
    expect(r.state.gold).toBe(3 + RUN.skipRewardGold);
  });
});
