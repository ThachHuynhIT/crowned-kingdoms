/** Thương nhân (spec 2026-11-10-merchant-design): sau trận ở vài năm bày 3 thẻ, mua tối đa 1. Thuần. */
import { Rng } from '../../core/random';
import { REWARD, RUN, START_DECK_G1 } from '../../data/run';
import type { CardDef } from '../../data/types';
import type { Content } from '../cards/registry';
import { enqueueOffers } from './flow';
import { neutralRewardPool, rollOffers } from './rewards';
import type { IllegalReason, RunState } from './state';

/** Nguồn thẻ như thẻ thưởng: thẻ vua mình + thẻ trung lập đã mở (G1 chỉ thẻ G1). */
export const rewardPools = (
  state: Pick<RunState, 'kingId' | 'unlockedCards' | 'rules'>,
  content: Content,
): { king: readonly CardDef[]; neutral: readonly CardDef[] } => {
  const g1 = state.rules.calendar === 'raiders';
  const only = (cards: readonly CardDef[]): readonly CardDef[] =>
    g1 ? cards.filter((c) => START_DECK_G1.includes(c.id)) : cards;
  return {
    king: only(content.king(state.kingId).cards),
    neutral: only(neutralRewardPool(content.neutralPool(), state.unlockedCards)),
  };
};

/** Năm thương nhân ghé: các năm `RUN.merchantYears` trước năm cuối; Vô tận sau năm 30 cứ `RUN.merchantEvery` năm. */
export const isMerchantYear = (state: Pick<RunState, 'mode' | 'year' | 'rules'>): boolean => {
  if (state.mode === 'endless' && state.year > state.rules.years) return state.year % RUN.merchantEvery === 0;
  return (RUN.merchantYears as readonly number[]).includes(state.year) && state.year < state.rules.years;
};

/** Xếp bước thương nhân vào hàng đợi (luồng RNG `shop`, không đụng luồng thưởng). */
export const rollMerchantOffer = (state: RunState, content: Content): RunState => {
  if (!isMerchantYear(state) || state.phase === 'ended' || state.lives <= 0) return state;
  const rng = new Rng(state.rng.shop);
  const cardIds = rollOffers(rng, state.year, rewardPools(state, content), REWARD.choices);
  const next = { ...state, rng: { ...state.rng, shop: rng.getState() } };
  return enqueueOffers(next, [{ kind: 'merchant', cardIds, price: RUN.merchantPrice }]);
};

export const merchantPickIllegal = (state: Pick<RunState, 'gold'>, offer: { price?: number }): IllegalReason | null =>
  state.gold < (offer.price ?? RUN.merchantPrice) ? 'notEnoughGold' : null;
