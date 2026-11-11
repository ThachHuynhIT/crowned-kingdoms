import { CUSTOM_TOME_GUARDS } from '../cards/custom';
import type { Content } from '../cards/registry';
import type { CardDef, CardId } from '../../data/types';
import { hasAnyTarget } from './board';
import { maxEnchantStacks } from './perks';
import type { IllegalReason, RunState } from './state';

/**
 * Lý do run state (ngoài bàn cờ: mạng, cấp Ngai…) từ chối `card`, hoặc null. `applyCommand` và
 * `canPlayCard` cùng dùng hàm này, nên một lá bị lệnh chơi từ chối thì cũng không tính là chơi được.
 */
export function stateRefusal(state: RunState, card: CardDef): IllegalReason | null {
  if (card.kind !== 'tome') return null;
  for (const action of card.actions) {
    if (action.type !== 'custom') continue;
    const refused = CUSTOM_TOME_GUARDS[action.id]?.(state, action.params ?? {}) ?? null;
    if (refused !== null) return refused;
  }
  return null;
}

/** Lá `cardId` chơi được lúc này: run state không từ chối và có mục tiêu hợp lệ trên bàn cờ. */
export function canPlayCard(state: RunState, content: Content, cardId: CardId): boolean {
  const card = content.card(cardId);
  return stateRefusal(state, card) === null && hasAnyTarget(state.plots, card, content, maxEnchantStacks(state, content));
}

/** Có ít nhất một thẻ trên tay chơi được (spec §4.4). */
export function hasPlayableCard(state: RunState, content: Content): boolean {
  return state.hand.some((id) => canPlayCard(state, content, id));
}
