import { describe, expect, it } from 'vitest';
import { RUN } from '../../data/run';
import { CONTENT } from '../cards/registry';
import { runState } from '../testing/fixtures';
import { applyCommand } from './commands';
import { buyCardIllegal, shopPool, shopPrice } from './shop';
import type { RunState } from './state';
import { startYear } from './yearFlow';

const buy = (s: RunState): RunState => {
  const r = applyCommand(s, { type: 'buyCard' }, CONTENT);
  if ('error' in r) throw new Error(r.error);
  return r.state;
};

describe('Mua thẻ (owner 2026-11-10)', () => {
  it('shop_prices_are_five_eight_eleven', () => {
    expect([0, 1, 2].map((n) => shopPrice({ shopPurchasesThisYear: n }))).toEqual([5, 8, 11]);
    expect(RUN.shopBaseGold).toBe(5);
  });

  it('buy_card_appends_once_to_deck_and_hand, pays the price and never marks a play', () => {
    const s = runState({ gold: 20 });
    const after = buy(s);
    expect(after.gold).toBe(15);
    expect(after.hand).toHaveLength(s.hand.length + 1);
    expect(after.deck).toHaveLength(s.deck.length + 1);
    const card = after.hand[after.hand.length - 1]!;
    expect(after.deck[after.deck.length - 1]).toBe(card);
    expect(after.drawPile).toEqual(s.drawPile);
    expect(after.discardPile).toEqual(s.discardPile);
    expect(after.played).toBe(false);
    expect(after.stats.goldEarned).toBe(s.stats.goldEarned);
    expect(buy(after).gold).toBe(7);
  });

  it('shop_only_samples_sorted_own_king_cards, no throne', () => {
    const pool = shopPool({ kingId: 'wheat' }, CONTENT);
    expect(pool).toEqual([...pool].sort());
    expect(pool).not.toContain('wheat_throne');
    expect(pool.every((id) => id.startsWith('wheat_'))).toBe(true);
  });

  it('shop_advances_only_shop_stream and is deterministic', () => {
    const s = runState({ gold: 20 });
    const a = buy(s);
    const b = buy(s);
    expect(a.hand).toEqual(b.hand);
    const { shop: shopBefore, ...rest } = s.rng;
    const { shop: shopAfter, ...restAfter } = a.rng;
    expect(restAfter).toEqual(rest);
    expect(shopAfter).not.toBe(shopBefore);
  });

  it('failed_purchase_is_atomic: not enough gold or wrong phase changes nothing', () => {
    const poor = runState({ gold: 4 });
    expect(buyCardIllegal(poor, CONTENT)).toBe('notEnoughGold');
    const r = applyCommand(poor, { type: 'buyCard' }, CONTENT);
    expect('error' in r && r.error).toBe('notEnoughGold');
    expect(buyCardIllegal(runState({ gold: 20, phase: 'battle' }), CONTENT)).toBe('wrongPhase');
  });

  it('shop_counter_resets_only_at_start_year', () => {
    const twice = buy(buy(runState({ gold: 30 })));
    expect(shopPrice(twice)).toBe(11);
    const next = startYear({ ...twice, phase: 'yearEnd' }, CONTENT);
    expect(next.shopPurchasesThisYear).toBe(0);
  });
});
