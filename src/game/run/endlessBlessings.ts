/**
 * Phúc lành vĩnh viễn của Vô tận (spec 2026-11-09 §5) và các luật kinh tế đi kèm: trần mạng, giá ô,
 * lãi. Thuần; ván thường luôn trả đúng số cũ.
 */
import { Rng } from '../../core/random';
import { NORMAL_GEOMETRY } from '../../data/boardGeometry';
import {
  ENDLESS_BLESSINGS,
  ENDLESS_BLESSING_EVERY,
  ENDLESS_BLESSING_FIRST_YEAR,
  ENDLESS_BLESSING_IDS,
  ENDLESS_BLESSING_PICKS,
  ENDLESS_INTEREST_CAP_PER_STACK,
  ENDLESS_LIVES_CAP,
  ENDLESS_MAXED_BLESSING_GOLD,
  ENDLESS_OUTER_PLOT_PRICE,
  type EndlessBlessingDef,
  type EndlessBlessingEffect,
  type EndlessBlessingId,
} from '../../data/endless';
import { RUN, unlockCost } from '../../data/run';
import { closeOffer, enqueueOffers } from './flow';
import type { IllegalReason, RunState } from './state';

const def = (id: EndlessBlessingId): EndlessBlessingDef => ENDLESS_BLESSINGS.find((b) => b.id === id)!;

/** Số stack hiện có của một phúc lành (0 ở ván thường). */
export const blessingStacks = (state: Pick<RunState, 'endless'>, id: EndlessBlessingId): number =>
  state.endless?.blessingStacks[id] ?? 0;

/** Tổng hiệu ứng (stack × amount) của mọi phúc lành cùng loại; 0 ở ván thường. */
export function blessingTotal(state: Pick<RunState, 'endless'>, effect: EndlessBlessingEffect): number {
  if (state.endless === null) return 0;
  let total = 0;
  for (const b of ENDLESS_BLESSINGS) if (b.effect === effect) total += blessingStacks(state, b.id) * b.amount;
  return total;
}

/** Mốc phúc lành: Vô tận, năm 30 rồi mỗi 5 năm. */
export const isBlessingYear = (state: Pick<RunState, 'mode' | 'year'>): boolean =>
  state.mode === 'endless' &&
  state.year >= ENDLESS_BLESSING_FIRST_YEAR &&
  state.year % ENDLESS_BLESSING_EVERY === 0;

/**
 * Tạo offer phúc lành của năm hiện tại đúng một lần (`lastBlessingYear` chặn lặp khi tải lại): rút 3 id
 * khác nhau bằng Fisher–Yates từng phần trên pool id sắp tăng, chỉ tiêu thụ luồng `blessing`.
 */
export function rollBlessingOffer(state: RunState): RunState {
  const endless = state.endless;
  if (endless === null || !isBlessingYear(state) || endless.lastBlessingYear >= state.year) return state;
  const pool = [...ENDLESS_BLESSING_IDS].sort();
  const rng = new Rng(state.rng.blessing);
  for (let i = 0; i < ENDLESS_BLESSING_PICKS; i++) {
    const j = rng.int(i, pool.length - 1);
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  const next: RunState = {
    ...state,
    endless: { ...endless, lastBlessingYear: state.year },
    rng: { ...state.rng, blessing: rng.getState() },
  };
  return enqueueOffers(next, [{ kind: 'blessing', blessingIds: pool.slice(0, ENDLESS_BLESSING_PICKS), year: state.year }]);
}

/** Trần mạng của ván: thường `RUN.maxLives`; Vô tận cộng mỗi stack Phúc thọ, tối đa 6. */
export const maxLivesForRun = (state: Pick<RunState, 'mode' | 'endless'>): number =>
  state.mode === 'endless' ? Math.min(ENDLESS_LIVES_CAP, RUN.maxLives + blessingTotal(state, 'maxLives')) : RUN.maxLives;

/**
 * Chọn phúc lành `index` của offer đang mở: +1 stack (đã đủ thì nhận vàng), Phúc thọ hồi ngay 1 mạng;
 * rồi mở bước kế trong hàng đợi. Sai pha / chỉ số thì trả lý do, không đổi gì.
 */
export function pickBlessing(state: RunState, index: number): RunState | IllegalReason {
  const offer = state.offers;
  if (state.phase !== 'blessing' || offer === null || offer.kind !== 'blessing' || state.endless === null) {
    return 'wrongPhase';
  }
  const id = Number.isInteger(index) ? offer.blessingIds[index] : undefined;
  if (id === undefined) return 'badTarget';
  const stacks = blessingStacks(state, id);
  let next: RunState;
  if (stacks >= def(id).maxStacks) {
    next = {
      ...state,
      gold: state.gold + ENDLESS_MAXED_BLESSING_GOLD,
      stats: { ...state.stats, goldEarned: state.stats.goldEarned + ENDLESS_MAXED_BLESSING_GOLD },
    };
  } else {
    next = {
      ...state,
      endless: { ...state.endless, blessingStacks: { ...state.endless.blessingStacks, [id]: stacks + 1 } },
    };
    if (def(id).effect === 'maxLives') next.lives = Math.min(maxLivesForRun(next), next.lives + def(id).amount);
  }
  return closeOffer(next);
}

/** Lãi đầu năm: `min(10 × stack, floor(max(0, số dư sau phí duy trì) × 2 × stack / 100))`. */
export function endlessInterest(state: Pick<RunState, 'endless'>, balanceAfterUpkeep: number): number {
  const stacks = blessingStacks(state, 'interest');
  if (stacks === 0) return 0;
  const pct = blessingTotal(state, 'interestPct');
  return Math.min(ENDLESS_INTEREST_CAP_PER_STACK * stacks, Math.floor((Math.max(0, balanceAfterUpkeep) * pct) / 100));
}

/**
 * Giá mua ô bằng vàng: bàn trong `unlockCost(purchasedPlots)`, vòng ngoài `20 + 2 × purchasedPlots`;
 * Khẩn đất giảm %, làm tròn xuống, tối thiểu 1. Ván thường trả đúng `unlockCost`.
 */
export function plotPurchasePrice(state: Pick<RunState, 'mode' | 'endless' | 'purchasedPlots'>, plot: number): number {
  const k = state.purchasedPlots;
  if (state.mode !== 'endless') return unlockCost(k);
  const base =
    plot >= NORMAL_GEOMETRY.plotCount ? ENDLESS_OUTER_PLOT_PRICE.base + ENDLESS_OUTER_PLOT_PRICE.step * k : unlockCost(k);
  const discount = blessingTotal(state, 'plotDiscountPct');
  return Math.max(1, Math.floor((base * (100 - discount)) / 100));
}
