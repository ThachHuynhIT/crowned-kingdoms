import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../game/battle/types';
import { RULES_FULL } from '../data/rules';
import { CONTENT } from '../game/cards/registry';
import type { RunState } from '../game/run/state';
import { newRun } from '../game/run/yearFlow';
import { battleCues, transitionCues, type CueWorld } from './audioCues';

const world: CueWorld = {
  throneId: 0,
  shoots: (id) => id === 5 || id === 6,
  isCannon: (id) => id === 6,
};
const hit = (
  id: number,
  dmg: number,
  sourceId: number,
  dmgType: 'physical' | 'fire' | 'magic' = 'physical',
): BattleEvent => ({
  type: 'hit',
  id,
  dmg,
  sourceId,
  dmgType,
});

describe('battleCues', () => {
  it('light and heavy hits split at 50 damage; a hit on the throne is throne_hit instead', () => {
    expect(battleCues([hit(3, 49.9, 2)], world)).toEqual(['hit_light']);
    expect(battleCues([hit(3, 50, 2)], world)).toEqual(['hit_heavy']);
    expect(battleCues([hit(0, 80, 2)], world)).toEqual(['throne_hit']);
  });

  it('adds the weapon: magic, fire, arrow for shooters, cannon for cannons, nothing for melee or no source', () => {
    expect(battleCues([hit(3, 5, 2, 'magic')], world)).toEqual(['hit_light', 'magic']);
    expect(battleCues([hit(3, 5, 2, 'fire')], world)).toEqual(['hit_light', 'fire']);
    expect(battleCues([hit(3, 5, 5)], world)).toEqual(['hit_light', 'arrow']);
    expect(battleCues([hit(3, 5, 6)], world)).toEqual(['hit_light', 'cannon']);
    expect(battleCues([hit(3, 5, 2)], world)).toEqual(['hit_light']);
    expect(battleCues([hit(3, 5, -1)], world)).toEqual(['hit_light']);
  });

  it('deaths and the royal boulder, each sound once per frame', () => {
    const cues = battleCues(
      [
        { type: 'death', id: 3 },
        { type: 'death', id: 4 },
        { type: 'boulder', phase: 'drop', x: 1, y: 1 },
        { type: 'boulder', phase: 'impact', x: 1, y: 1 },
        hit(3, 5, 5),
        hit(4, 5, 5),
      ],
      world,
    );
    expect(cues.sort()).toEqual([
      'arrow',
      'boulder_impact',
      'boulder_whoosh',
      'death_pop',
      'hit_light',
    ]);
  });

  it('ignores other events', () => {
    expect(battleCues([{ type: 'spawn', id: 1 }, { type: 'rage' }], world)).toEqual([]);
  });
});

describe('transitionCues', () => {
  const base = (): RunState => newRun(1, 'wheat', CONTENT, RULES_FULL);
  it('nothing for the same state (an illegal command changes nothing)', () => {
    const s = base();
    expect(transitionCues(s, s)).toEqual([]);
  });
  it('play, draw, reroll, coin, plot unlock and level up from what changed', () => {
    const s = base();
    expect(transitionCues(s, { ...s, played: true, hand: s.hand.slice(1) })).toContain('card_play');
    expect(transitionCues(s, { ...s, played: true })).not.toContain('card_play');
    expect(transitionCues(s, { ...s, hand: [...s.hand, s.hand[0]!] })).toContain('card_draw');
    expect(transitionCues(s, { ...s, rerollsThisYear: s.rerollsThisYear + 1 })).toContain('reroll');
    expect(transitionCues(s, { ...s, gold: s.gold + 3 })).toContain('coin');
    expect(transitionCues(s, { ...s, gold: s.gold - 3 })).not.toContain('coin');
    const unlocked = s.plots.map((p, i) => (i === 0 ? { ...p, unlocked: true } : p));
    expect(transitionCues(s, { ...s, plots: unlocked })).toContain('plot_unlock');
    const levelled = s.plots.map((p) =>
      p.building ? { ...p, building: { ...p.building, level: 2 as const } } : p,
    );
    expect(transitionCues(s, { ...s, plots: levelled })).toContain('level_up');
  });
});
