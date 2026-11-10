import { describe, expect, it } from 'vitest';
import { BattleWorld } from '../game/battle/world';
import { battleSetup, runState } from '../game/testing/fixtures';
import type { BuildingState, RunState } from '../game/run/state';
import { CODE_FX } from './codeFx';
import { boardFxCues, statusFxFor } from './fxCues';

describe('statusFxFor', () => {
  const world = (): BattleWorld => {
    const w = new BattleWorld(battleSetup());
    w.count = 1;
    w.alive[0] = 1;
    return w;
  };
  it('shows nothing without a status, and nothing on the dead', () => {
    const w = world();
    expect(statusFxFor(w, 0)).toBeNull();
    w.burnTicks[0] = 5;
    w.alive[0] = 0;
    expect(statusFxFor(w, 0)).toBeNull();
  });
  it('picks the most important status', () => {
    const w = world();
    w.slowTicks[0] = 3;
    expect(statusFxFor(w, 0)).toBe('fx_slow');
    w.poisonTicks[0] = 3;
    expect(statusFxFor(w, 0)).toBe('fx_poison');
    w.burnTicks[0] = 3;
    expect(statusFxFor(w, 0)).toBe('fx_burn');
    w.disabledUntil[0] = w.tick + 10;
    expect(statusFxFor(w, 0)).toBe('fx_disable');
    w.stunTicks[0] = 2;
    expect(statusFxFor(w, 0)).toBe('fx_stun');
  });
  it('every status effect exists as a looping code effect', () => {
    for (const id of ['fx_stun', 'fx_disable', 'fx_burn', 'fx_poison', 'fx_slow']) {
      const def = CODE_FX.find((d) => d.id === id);
      expect(def?.loop, id).toBe(true);
    }
  });
});

describe('boardFxCues', () => {
  const b = (uid: number, level: BuildingState['level'] = 1): BuildingState => ({
    uid, cardId: 'wheat_field', level, enchants: [], placedYear: 1, permanent: {}, ageBonus: 0, counters: {}, movedYear: null,
  });
  const withPlots = (s: RunState, set: Record<number, BuildingState | null>): RunState => ({
    ...s,
    plots: s.plots.map((p, i) => (i in set ? { ...p, unlocked: true, building: set[i] ?? null } : p)),
  });
  const base = runState();
  it('a new building is placed', () => {
    const after = withPlots(base, { 7: b(900) });
    expect(boardFxCues(base, after)).toEqual([{ fx: 'fx_place', plot: 7 }]);
  });
  it('a building that changed plot moved; a level-up upgrades', () => {
    const before = withPlots(base, { 7: b(900), 8: b(901, 1) });
    const after = withPlots(base, { 7: null, 12: b(900), 8: b(901, 2) });
    expect(boardFxCues(before, after)).toEqual([
      { fx: 'fx_upgrade', plot: 8 },
      { fx: 'fx_move', plot: 12 },
    ]);
  });
  it('the same state gives nothing', () => {
    expect(boardFxCues(base, base)).toEqual([]);
  });
  it('every board effect exists', () => {
    for (const id of ['fx_place', 'fx_move', 'fx_upgrade']) expect(CODE_FX.some((d) => d.id === id), id).toBe(true);
  });
});
