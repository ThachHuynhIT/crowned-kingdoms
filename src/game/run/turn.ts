import { RUN } from '../../data/run';
import type { RunState } from './state';

/**
 * Ra trận chỉ được khi đang chuẩn bị và trên tay còn ≤ `RUN.battleHandMax` lá (chủ dự án
 * 10/11/2026): mỗi năm chơi hoặc bán bao nhiêu lá cũng được, rồi tự bấm Ra trận.
 */
export const canStartBattle = (state: Pick<RunState, 'phase' | 'hand'>): boolean =>
  state.phase === 'planning' && state.hand.length <= RUN.battleHandMax;
