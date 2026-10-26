import { describe, expect, it } from 'vitest';
import { BATTLE } from '../../data/battle';
import { battleSetup, structure, unitStats } from '../testing/fixtures';
import { hashWorld } from './hash';
import { pickAutoTarget, tryIntervene } from './intervention';
import { moveEntities } from './movement';
import { stepBattle } from './step';
import type { BattleSetup } from './types';
import { TEAM_ALLY, TEAM_FOE, addUnit, createBattle, spawnWave, type BattleWorld } from './world';

const NORTH = (r: number): number => BATTLE.wallY + r;

const make = (over: Partial<BattleSetup> = {}): BattleWorld =>
  createBattle(battleSetup({ structures: [structure(12)], ...over }));

describe('north mountain wall', () => {
  it('wallY is 64', () => {
    expect(BATTLE.wallY).toBe(64);
  });

  it('addUnit clamps position, prev and home to the wall', () => {
    for (const y of [0, 63, 64]) {
      const w = make();
      const id = addUnit(w, unitStats({ radius: 4 }), TEAM_ALLY, 50, y, 50, 0, -1);
      expect(w.y[id]).toBeGreaterThanOrEqual(NORTH(4));
      expect(w.prevY[id]).toBeGreaterThanOrEqual(NORTH(4));
      expect(w.homeY[id]).toBeGreaterThanOrEqual(NORTH(4));
      expect(w.x[id]).toBe(50);
    }
  });

  it('knockback north of the wall is stopped and cleared', () => {
    const w = make();
    const id = addUnit(w, unitStats({ radius: 14, speed: 0 }), TEAM_FOE, 100, NORTH(14), 100, NORTH(14), -1);
    w.kbTicks[id] = 3;
    w.kbX[id] = 0;
    w.kbY[id] = -20;
    for (let t = 0; t < 4; t++) {
      moveEntities(w);
      expect(w.y[id]).toBeGreaterThanOrEqual(NORTH(14));
    }
    expect(w.kbTicks[id]).toBe(0);
    expect(w.kbY[id]).toBe(0);
  });

  it('units chasing a target at the north edge never cross the wall', () => {
    const w = make();
    const a = addUnit(w, unitStats({ radius: 4 }), TEAM_ALLY, 100, 100, 100, 100, -1);
    const f = addUnit(w, unitStats({ radius: 4, speed: 0 }), TEAM_FOE, 100, 64, 100, 64, -1);
    w.target[a] = f;
    for (let t = 0; t < 200; t++) {
      moveEntities(w);
      w.tick += 1;
      expect(w.y[a]).toBeGreaterThanOrEqual(NORTH(4));
      expect(w.y[f]).toBeGreaterThanOrEqual(NORTH(4));
    }
  });

  it('a unit north of the wall at hash time with a southern target recovers southward', () => {
    const w = make();
    const a = addUnit(w, unitStats({ radius: 4, speed: 1 }), TEAM_ALLY, 100, NORTH(4), 100, NORTH(4), -1);
    const f = addUnit(w, unitStats({ radius: 4, speed: 0 }), TEAM_FOE, 100, 200, 100, 200, -1);
    w.target[a] = f;
    const y0 = w.y[a]!;
    for (let t = 0; t < 20; t++) {
      moveEntities(w);
      w.tick += 1;
    }
    expect(w.y[a]!).toBeGreaterThan(y0 + 1);
  });

  it('ranged shots and splash points stay south of the wall', () => {
    const shooter = unitStats({ radius: 4, speed: 0, range: 80, projectileSpeed: 4, interval: 5, dmg: 1 });
    const w = make();
    const a = addUnit(w, shooter, TEAM_ALLY, 100, NORTH(4), 100, NORTH(4), -1);
    const f = addUnit(w, unitStats({ radius: 4, speed: 0, hp: 9999 }), TEAM_FOE, 140, NORTH(4), 140, NORTH(4), -1);
    w.target[a] = f;
    for (let t = 0; t < 60; t++) {
      stepBattle(w, []);
      for (let k = 0; k < w.projectileCount; k++) {
        expect(w.projectiles.py[k]).toBeGreaterThanOrEqual(BATTLE.wallY);
      }
    }
  });

  it('intervention north of the wall is clamped to it; invalid input still rejected', () => {
    const w = make();
    w.tick = 40;
    expect(tryIntervene(w, { tick: 40, x: 100, y: 0 })).toBe(true);
    expect(w.boulders[0]!.y).toBe(BATTLE.wallY);
    expect(w.inputs[0]).toMatchObject({ y: BATTLE.wallY });
    const w2 = make();
    w2.tick = 40;
    for (const y of [-1, Number.NaN, Number.POSITIVE_INFINITY, w2.maxY + 1]) {
      expect(tryIntervene(w2, { tick: 40, x: 100, y })).toBe(false);
    }
    expect(w2.boulders.length).toBe(0);
  });

  it('boulder_reaches_deep_southern_rows: manual and auto-fire may target below the field line', () => {
    const spawn = () => ({ edge: 'S' as const, stats: unitStats({ speed: 0 }) });
    const wave = { spawnTick: 0, spawns: Array.from({ length: 120 }, spawn), formationRows: 7 };
    const w = make({ waves: [wave] });
    w.tick = 40;
    const deep = BATTLE.field + 60; // inside the deepest rank, below the field line
    expect(deep).toBeLessThanOrEqual(w.maxY);
    expect(tryIntervene(w, { tick: 40, x: 192, y: deep })).toBe(true);
    expect(w.boulders[0]!.y).toBe(deep);
    const w2 = make({ waves: [wave] });
    spawnWave(w2, 0);
    const t = pickAutoTarget(w2);
    expect(t).not.toBeNull();
    expect(t!.y).toBeGreaterThan(BATTLE.field); // the densest cluster is in the ranks below the field
  });

  it('auto-fire never targets a point north of the wall', () => {
    const w = make();
    addUnit(w, unitStats({ radius: 4, speed: 0 }), TEAM_FOE, 100, NORTH(4), 100, NORTH(4), -1);
    const t = pickAutoTarget(w);
    expect(t).not.toBeNull();
    expect(t!.y).toBeGreaterThanOrEqual(BATTLE.wallY);
  });

  it('wall_invariant_all_phases: a boulder impact cannot push anyone through it', () => {
    const w = make();
    const id = addUnit(w, unitStats({ radius: 4, speed: 0 }), TEAM_FOE, 100, NORTH(4), 100, NORTH(4), -1);
    w.tick = 40;
    tryIntervene(w, { tick: 40, x: 100, y: 120 });
    for (let t = 0; t < 30; t++) {
      stepBattle(w, []);
      expect(w.y[id]).toBeGreaterThanOrEqual(NORTH(4));
      expect(w.prevY[id]).toBeGreaterThanOrEqual(NORTH(4));
    }
  });

  it('maxY is part of the hash', () => {
    const a = make();
    const b = make();
    b.maxY += 10;
    expect(hashWorld(a)).not.toBe(hashWorld(b));
  });

  it('maxY covers the deepest southern spawn row', () => {
    const spawn = () => ({ edge: 'S' as const, stats: unitStats() });
    const wave = { spawnTick: 0, spawns: Array.from({ length: 120 }, () => spawn()) };
    const w = make({ waves: [wave] });
    expect(w.maxY).toBeGreaterThanOrEqual(BATTLE.field + BATTLE.spawnOutside + 4 * BATTLE.spawnRowGap);
  });
});
