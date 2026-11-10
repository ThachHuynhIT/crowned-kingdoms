/**
 * Which code effect to show, read from state (render only, 10/11/2026). Pure: no Phaser, never writes the world or
 * the run.
 *
 * - `statusFxFor`: the one looping status effect over a living entity, most important first (disabled tower, burn,
 *   poison, slow). Stun is left out: `UnitRenderer` already draws its stars.
 * - `boardFxCues`: effects for one accepted planning change: a new building (place), a building that changed plot
 *   (move) and a building whose level went up on the same plot (upgrade).
 */
import type { BattleWorld } from '../game/battle/world';
import type { RunState } from '../game/run/state';

export type StatusWorld = Pick<
  BattleWorld,
  'tick' | 'alive' | 'disabledUntil' | 'burnTicks' | 'poisonTicks' | 'slowTicks'
>;

export const statusFxFor = (w: StatusWorld, id: number): string | null => {
  if (w.alive[id] === 0) return null;
  if (w.disabledUntil[id]! > w.tick) return 'fx_disable';
  if (w.burnTicks[id]! > 0) return 'fx_burn';
  if (w.poisonTicks[id]! > 0) return 'fx_poison';
  if (w.slowTicks[id]! > 0) return 'fx_slow';
  return null;
};

export interface BoardFxCue {
  readonly fx: 'fx_place' | 'fx_move' | 'fx_upgrade';
  readonly plot: number;
}

export const boardFxCues = (before: Pick<RunState, 'plots'>, after: Pick<RunState, 'plots'>): BoardFxCue[] => {
  if (before === after) return [];
  const was = new Map<number, { plot: number; level: number }>();
  before.plots.forEach((p, plot) => {
    if (p.building) was.set(p.building.uid, { plot, level: p.building.level });
  });
  const out: BoardFxCue[] = [];
  after.plots.forEach((p, plot) => {
    const b = p.building;
    if (!b) return;
    const old = was.get(b.uid);
    if (old === undefined) out.push({ fx: 'fx_place', plot });
    else if (old.plot !== plot) out.push({ fx: 'fx_move', plot });
    else if (b.level > old.level) out.push({ fx: 'fx_upgrade', plot });
  });
  return out;
};
