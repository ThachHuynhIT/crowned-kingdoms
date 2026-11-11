/** Mua thẻ (chủ dự án 10/11/2026): một thẻ ngẫu nhiên của vua mình, vào tay và bộ bài. Thuần. */
import { RUN } from '../../data/run';
import type { CardId } from '../../data/types';
import type { Content } from '../cards/registry';
import type { IllegalReason, RunState } from './state';

/** Giá lần mua kế trong năm: 5, 8, 11… */
export const shopPrice = (state: Pick<RunState, 'shopPurchasesThisYear'>): number =>
  RUN.shopBaseGold + RUN.shopStepGold * state.shopPurchasesThisYear;

/** Thẻ có thể mua: thẻ của vua mình (không Ngai), sắp theo id để kết quả không phụ thuộc thứ tự registry. */
export const shopPool = (state: Pick<RunState, 'kingId'>, content: Content): CardId[] => {
  const king = content.king(state.kingId);
  return king.cards
    .map((c) => c.id)
    .filter((id) => id !== king.throne.id)
    .sort();
};

export const buyCardIllegal = (state: RunState, content: Content): IllegalReason | null => {
  if (state.phase !== 'planning') return 'wrongPhase';
  if (shopPool(state, content).length === 0) return 'noShopCards';
  if (state.gold < shopPrice(state)) return 'notEnoughGold';
  return null;
};
