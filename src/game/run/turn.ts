import { RULES_FULL } from '../../data/rules';
import { RUN } from '../../data/run';
import type { RunState } from './state';

/**
 * Số lá phải còn trên tay khi trận tự bắt đầu (chủ dự án 10/11/2026): `RUN.battleHandMax` (2),
 * riêng năm cuối của ván 30 năm thường (lịch 'full') phải dùng hết bài (0). Vô tận luôn 2.
 */
export const battleHandTarget = (state: Pick<RunState, 'mode' | 'rules' | 'year'>): number =>
  state.mode === 'normal' &&
  state.rules.calendar === RULES_FULL.calendar &&
  state.rules.years === RULES_FULL.years &&
  state.year === RULES_FULL.years
    ? 0
    : RUN.battleHandMax;

/**
 * Trận bắt đầu (bắt buộc, tự động) khi đang chuẩn bị, đã rút xong, không còn bước chọn nào chờ và
 * tay còn ≤ `battleHandTarget` lá. Controller và headless vào trận ngay lúc đó (không chờ người chơi).
 */
export const canStartBattle = (
  state: Pick<RunState, 'mode' | 'rules' | 'year' | 'phase' | 'hand' | 'yearStartPendingDraw' | 'offers' | 'pendingOffers'>,
): boolean =>
  state.phase === 'planning' &&
  !state.yearStartPendingDraw &&
  state.offers === null &&
  state.pendingOffers.length === 0 &&
  state.hand.length <= battleHandTarget(state);
