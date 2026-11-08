/**
 * Per-run statistics for the balance tool (G5, spec G5 §2.2). Pure: fed by `runHeadless`'s `onCommand` hook, never
 * stored in RunState or the save, no wall-clock time.
 *
 * - A card is *offered* once each time it appears in a reward / conquest / quest-reward offer that becomes the current
 *   offer; it is *picked* when `pickOffer` takes it (skipping counts nothing; drawing or playing is not a pick).
 * - A battle is *reached* in the year it is fought and *lost* when its result is a loss.
 */
import type { CardId, KingId } from '../../data/types';
import { cardOffer } from '../run/flow';
import type { RunCommand, RunState } from '../run/state';
import type { HeadlessResult } from './headless';

export interface RunStats {
  seed: number;
  kingId: KingId;
  difficulty: number;
  won: boolean;
  /** `state.year` at the end of the run. */
  yearReached: number;
  /** Years whose battle was fought (won or lost). */
  completedYears: number;
  commands: number;
  picks: Record<string, number>;
  offered: Record<string, number>;
  battlesReached: Record<number, number>;
  battlesLost: Record<number, number>;
}

export interface RunStatsCollector {
  observe(before: RunState, command: RunCommand, after: RunState): void;
  finish(result: HeadlessResult): RunStats;
}

const bump = <K extends string | number>(record: Record<K, number>, key: K): void => {
  record[key] = (record[key] ?? 0) + 1;
};

const sameOffer = (a: RunState, b: RunState): boolean => JSON.stringify(cardOffer(a)) === JSON.stringify(cardOffer(b));

export function createRunStats(seed: number, kingId: KingId, difficulty: number): RunStatsCollector {
  const picks: Record<string, number> = {};
  const offered: Record<string, number> = {};
  const battlesReached: Record<number, number> = {};
  const battlesLost: Record<number, number> = {};
  return {
    observe(before, command, after) {
      if (command.type === 'pickOffer' && command.index !== null) {
        const id: CardId | undefined = cardOffer(before)?.cardIds[command.index];
        if (id !== undefined) bump(picks, id);
      }
      if (command.type === 'battleResult') {
        bump(battlesReached, before.year);
        if (!command.result.won) bump(battlesLost, before.year);
      }
      const now = cardOffer(after);
      if (now !== null && !sameOffer(before, after)) for (const id of now.cardIds) bump(offered, id);
    },
    finish({ state, commands }) {
      return {
        seed,
        kingId,
        difficulty,
        won: state.won === true,
        yearReached: state.year,
        completedYears: Object.values(battlesReached).reduce((a, b) => a + b, 0),
        commands,
        picks,
        offered,
        battlesReached,
        battlesLost,
      };
    },
  };
}
