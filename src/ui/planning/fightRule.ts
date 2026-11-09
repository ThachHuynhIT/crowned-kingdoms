import { canStartBattle } from '../../game/run/turn';
import type { RunState } from '../../game/run/state';

/**
 * Whether the "Ra trận" button is shown: battles start by hand (G2 rules) and the hand is down
 * to `RUN.battleHandMax` cards (owner 2026-11-10); the player may still play the cards left.
 */
export const canFight = (state: Pick<RunState, 'phase' | 'rules' | 'hand'>): boolean =>
  !state.rules.autoStart && canStartBattle(state);
