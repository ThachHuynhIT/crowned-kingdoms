import { battleHandTarget } from '../../game/run/turn';
import type { RunState } from '../../game/run/state';

/**
 * The "Ra trận" button is gone (owner 2026-11-10): the battle starts by itself once the hand is
 * down to its target, so the button never shows. Kept as one place to ask.
 */
export const canFight = (_state: Pick<RunState, 'phase' | 'rules' | 'hand'>): boolean => false;

/** What the planning hint says the player must do before the battle starts by itself. */
export const planningHint = (state: Pick<RunState, 'mode' | 'rules' | 'year'>): string => {
  const target = battleHandTarget(state);
  return target === 0
    ? 'Năm cuối: chơi hoặc bán hết bài, rồi trận tự bắt đầu.'
    : `Chơi hoặc bán bài tới khi còn ${target} lá, rồi trận tự bắt đầu.`;
};
