import { freeMoveIllegal, freeMovesAllowed } from '../../game/cards/custom/nomad';
import type { Content } from '../../game/cards/registry';
import { THRONE_PLOT, neighbours } from '../../game/run/board';
import type { IllegalReason, RunCommand, RunState } from '../../game/run/state';
import type { PlotHighlight } from '../../render/BoardRenderer';
import { illegalText } from '../realm/calendarModel';

/**
 * The Nomad King's free relocation ("Dời trại") being picked on the board: the building to move
 * (`from`), then the adjacent plot it goes to (`to`; a building there swaps). Every legality check
 * is the game rule `freeMoveIllegal` (src/game/cards/custom/nomad.ts); this module only chooses
 * which pair to ask about.
 */
export interface FreeMovePick {
  from: number | null;
  to: number | null;
}

/** The first step: nothing picked yet. */
export const START_FREE_MOVE: FreeMovePick = { from: null, to: null };

/** The button is shown for the Nomad King during planning only. */
export const showFreeMove = (state: Pick<RunState, 'kingId' | 'phase'>): boolean =>
  state.kingId === 'nomad' && state.phase === 'planning';

/** Free moves left this year (read from the state, so it survives a reload). */
export const freeMovesLeft = (state: RunState, content: Content): number =>
  Math.max(0, freeMovesAllowed(state, content) - state.freeMovesUsed);

/** "Dời trại (N)" (two lines on a phone); while a move is being picked the button cancels it. */
export const freeMoveLabel = (left: number, desktop: boolean, picking: boolean): string => {
  if (picking) return desktop ? '✕ Huỷ dời' : '✕\nHuỷ dời';
  return desktop ? `Dời trại (${left})` : `Dời trại\n${left}`;
};

/**
 * Why `plot` cannot be the building to move, or null when it has at least one legal destination.
 * The reason is the rule's answer for an open, non-throne neighbour when there is one, so it speaks
 * about the plot itself (no building, the throne, locked, no move left…).
 */
export const sourceIllegal = (state: RunState, content: Content, plot: number): IllegalReason | null => {
  const around = neighbours(plot, state.mode);
  if (around.some((to) => freeMoveIllegal(state, content, plot, to) === null)) return null;
  const open = around.find((n) => n !== THRONE_PLOT && state.plots[n]?.unlocked === true);
  return freeMoveIllegal(state, content, plot, open ?? around[0] ?? plot);
};

/** Why `plot` cannot be the next pick, or null when it is legal or already picked. */
export const freeMoveReason = (
  state: RunState,
  content: Content,
  pick: FreeMovePick,
  plot: number,
): IllegalReason | null => {
  if (pick.from === null) return sourceIllegal(state, content, plot);
  if (plot === pick.from || plot === pick.to) return null;
  return freeMoveIllegal(state, content, pick.from, plot);
};

/** Outline of every plot: picked plots `selected`, the rest `good`/`bad` for the next pick. */
export const freeMoveHighlights = (
  state: RunState,
  content: Content,
  pick: FreeMovePick,
): Map<number, PlotHighlight> => {
  const map = new Map<number, PlotHighlight>();
  for (let plot = 0; plot < state.plots.length; plot++) {
    map.set(plot, freeMoveReason(state, content, pick, plot) === null ? 'good' : 'bad');
  }
  if (pick.from !== null) map.set(pick.from, 'selected');
  if (pick.to !== null) map.set(pick.to, 'selected');
  return map;
};

export type FreeMoveTap = { next: FreeMovePick } | { reject: IllegalReason };

/**
 * A tap on `plot` while picking: choose the building, then its destination (a new legal destination
 * replaces the last). Tapping the chosen building again goes back to the first step; tapping another
 * building that can move makes it the new source; anything else is refused with the rule's reason.
 */
export const tapFreeMove = (state: RunState, content: Content, pick: FreeMovePick, plot: number): FreeMoveTap => {
  if (pick.from === null) {
    const reason = sourceIllegal(state, content, plot);
    return reason === null ? { next: { from: plot, to: null } } : { reject: reason };
  }
  if (plot === pick.from) return { next: START_FREE_MOVE };
  if (plot === pick.to) return { next: pick };
  const reason = freeMoveIllegal(state, content, pick.from, plot);
  if (reason === null) return { next: { from: pick.from, to: plot } };
  if (sourceIllegal(state, content, plot) === null) return { next: { from: plot, to: null } };
  return { reject: reason };
};

export const freeMoveReady = (pick: FreeMovePick): boolean => pick.from !== null && pick.to !== null;

/** The command ✓ sends, or null before both plots are picked. */
export const freeMoveCommand = (pick: FreeMovePick): RunCommand | null =>
  pick.from !== null && pick.to !== null ? { type: 'freeMove', from: pick.from, to: pick.to } : null;

/** The guide line of the hint box for each step. */
export const freeMoveHint = (pick: FreeMovePick, desktop: boolean): string => {
  if (freeMoveReady(pick)) return desktop ? 'Bấm ✓ để dời, ✕ để huỷ.' : 'Bấm ✓ hoặc ✕.';
  if (pick.from === null) return 'Chọn công trình muốn dời (viền xanh).';
  return 'Chọn ô kề để dời tới (có công trình thì đổi chỗ).';
};

/** Reasons whose shared text is about placing a card, said the way a relocation needs. */
const MOVE_TEXT: Partial<Record<IllegalReason, string>> = {
  notAdjacent: 'Chỉ dời sang ô kề công trình đang chọn.',
  throne: 'Không thể dời Ngai hay dời lên Ngai.',
  badTarget: 'Chọn một ô khác.',
};

/** Why a free-move pick is refused, in Vietnamese. */
export const freeMoveReasonText = (reason: IllegalReason): string => MOVE_TEXT[reason] ?? illegalText(reason);
