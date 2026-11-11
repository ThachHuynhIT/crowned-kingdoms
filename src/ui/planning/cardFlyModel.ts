/**
 * Card fly (juice §11.5): when a card is played onto the board (any number per year since 2026-11-10), a card flies from its hand slot to the
 * plot it changed. Pure: which plot changed between two accepted states (a new building, a level, a new enchant
 * stack); null when nothing on the board changed (a sold card, a tome with no board effect) or no card was played.
 */
import type { RunState } from '../../game/run/state';

const stacks = (s: RunState, plot: number): number =>
  (s.plots[plot]?.building?.enchants ?? []).reduce((n, e) => n + e.stacks, 0);

export function playedPlot(before: RunState, after: RunState): number | null {
  if (before.year !== after.year || after.hand.length >= before.hand.length) return null;
  for (let plot = 0; plot < after.plots.length; plot++) {
    const a = before.plots[plot]?.building ?? null;
    const b = after.plots[plot]?.building ?? null;
    if (b === null) continue;
    if (
      a === null ||
      a.uid !== b.uid ||
      b.level > a.level ||
      stacks(after, plot) > stacks(before, plot)
    )
      return plot;
  }
  return null;
}
