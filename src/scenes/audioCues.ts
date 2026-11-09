/**
 * Battle sounds from one frame's battle events (G5 Task 6). Pure: no Phaser, no WebAudio, never touches the world.
 * Each sound id plays at most once per frame (the AudioManager also caps voices per id).
 *
 * - hit on the throne → `throne_hit`; other hits → `hit_heavy` (≥ 50 damage) or `hit_light`
 * - the striker's weapon: magic → `magic`, fire → `fire`, a physical projectile → `arrow` (or `cannon` for cannon
 *   units), melee adds nothing more
 * - death → `death_pop`; royal boulder drop → `boulder_whoosh`, impact → `boulder_impact`
 */
import type { SfxId } from '../data/sfx';
import type { BattleEvent } from '../game/battle/types';
import type { RunState } from '../game/run/state';

export const HEAVY_HIT_MIN = 50;

export interface CueWorld {
  /** Entity id of our throne. */
  throneId: number;
  /** The striker fires projectiles (its attack has a projectile speed > 0). */
  shoots(id: number): boolean;
  /** The striker is a cannon (louder shot). */
  isCannon(id: number): boolean;
}

export function battleCues(events: readonly BattleEvent[], world: CueWorld): SfxId[] {
  const out = new Set<SfxId>();
  for (const e of events) {
    if (e.type === 'hit') {
      out.add(
        e.id === world.throneId ? 'throne_hit' : e.dmg >= HEAVY_HIT_MIN ? 'hit_heavy' : 'hit_light',
      );
      if (e.dmgType === 'magic') out.add('magic');
      else if (e.dmgType === 'fire') out.add('fire');
      else if (e.sourceId >= 0 && world.shoots(e.sourceId))
        out.add(world.isCannon(e.sourceId) ? 'cannon' : 'arrow');
    } else if (e.type === 'death') out.add('death_pop');
    else if (e.type === 'boulder')
      out.add(e.phase === 'drop' ? 'boulder_whoosh' : 'boulder_impact');
  }
  return [...out];
}

/**
 * Planning sounds from one accepted state change (a refused command changes nothing, so it plays nothing): card played,
 * cards drawn, reroll, gold gained, plot unlocked, building levelled.
 */
export function transitionCues(before: RunState, after: RunState): SfxId[] {
  if (before === after) return [];
  const out: SfxId[] = [];
  if (after.played && !before.played) out.push('card_play');
  if (after.hand.length > before.hand.length) out.push('card_draw');
  if (after.rerollsThisYear > before.rerollsThisYear) out.push('reroll');
  if (after.gold > before.gold) out.push('coin');
  const unlocked = (s: RunState): number => s.plots.filter((p) => p.unlocked).length;
  if (unlocked(after) > unlocked(before)) out.push('plot_unlock');
  const levels = (s: RunState): number => s.plots.reduce((n, p) => n + (p.building?.level ?? 0), 0);
  const sameBuildings = before.plots.every(
    (p, i) => (p.building?.uid ?? -1) === (after.plots[i]?.building?.uid ?? -1),
  );
  if (sameBuildings && levels(after) > levels(before)) out.push('level_up');
  return out;
}
