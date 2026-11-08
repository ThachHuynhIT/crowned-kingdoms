/**
 * Luật số của Vô tận (spec 2026-11-09 §3): ngân sách địch bão hoà và hệ số boss theo chu kỳ. Chỉ tra
 * bảng lưu sẵn ở `src/data/endless.ts` và số học + − × ÷; O(1) với mọi năm.
 */
import { ENEMY_BUDGET } from '../../data/battle';
import {
  ENDLESS_BASE_BUDGET,
  ENDLESS_BOSS_SCALE_BP,
  ENDLESS_CALENDAR_PERIOD,
  ENDLESS_COUNCIL_EVERY,
  ENDLESS_FINAL_BUDGET_CAP,
} from '../../data/endless';
import { RUN } from '../../data/run';
import type { RunState } from './state';

/** Ngân sách gốc EP của năm: 1..30 là bảng thường, sau đó bảng Vô tận (tra bão hoà ở phần tử cuối). */
export function endlessBaseBudget(year: number): number {
  const y = Math.max(1, Math.floor(year));
  if (y <= ENEMY_BUDGET.length) return ENEMY_BUDGET[y - 1]!;
  const idx = Math.min(y - ENEMY_BUDGET.length, ENDLESS_BASE_BUDGET.length) - 1;
  return ENDLESS_BASE_BUDGET[idx]!;
}

/**
 * Ngân sách cuối = min(trần, round(B[y] × slot × (1 + bước Gai × Gai) × hệ số biến thể)); trần áp sau
 * cùng. Năm 1..30 với hệ số 1 trùng `armyBudget` của ván thường.
 */
export function endlessArmyBudget(year: number, slotMult: number, difficulty: number, modifierBudgetMult: number): number {
  const raw = Math.round(
    endlessBaseBudget(year) * slotMult * (1 + RUN.difficultyBudgetStep * difficulty) * modifierBudgetMult,
  );
  return Math.min(ENDLESS_FINAL_BUDGET_CAP, raw);
}

/** Hệ số boss (×) theo chu kỳ 30 năm: 1 ở năm 1..30, ×1,25 mỗi chu kỳ, trần ×10. */
export function endlessBossScale(year: number): number {
  const cycle = Math.floor((Math.max(1, Math.floor(year)) - 1) / ENDLESS_CALENDAR_PERIOD);
  const idx = Math.min(cycle, ENDLESS_BOSS_SCALE_BP.length - 1);
  return ENDLESS_BOSS_SCALE_BP[idx]! / 10_000;
}

/** Năm cuối của ván: thường là `rules.years`; Vô tận không có năm cuối (chỉ hết mạng mới kết thúc). */
export const isFinalYear = (state: Pick<RunState, 'mode' | 'year' | 'rules'>): boolean =>
  state.mode !== 'endless' && state.year >= state.rules.years;

/**
 * Năm có hội đồng: ván đầy đủ ở `RUN.councilYears` (trừ năm cuối); Vô tận ở mọi bội số của 5, kể cả
 * 30 và sau đó.
 */
export function isCouncilYear(state: Pick<RunState, 'mode' | 'year' | 'rules'>): boolean {
  if (state.mode === 'endless') return state.year >= 1 && state.year % ENDLESS_COUNCIL_EVERY === 0;
  return (
    state.rules.calendar === 'full' &&
    !isFinalYear(state) &&
    (RUN.councilYears as readonly number[]).includes(state.year)
  );
}
