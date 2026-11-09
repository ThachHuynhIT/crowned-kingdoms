import { NORMAL_GEOMETRY } from '../../data/boardGeometry';
import { describe, expect, it } from 'vitest';
import { BUILDING_FOOT_OFFSET, DEPLOY_BOX, PLOT } from '../../data/boardGeometry';
import { battleSetup, structure, throneSetup, unitStats } from '../testing/fixtures';
import { deploySlot, deploymentPosition } from './deployment';
import { stepBattle } from './step';
import { KIND_STRUCTURE, KIND_UNIT, TEAM_FOE, addUnit, createBattle, plotCenter } from './world';

describe('deploy boxes (spec 06/11/2026, C)', () => {
  const inBox = (plot: number, p: { x: number; y: number }, r: number): boolean => {
    const c = plotCenter(plot);
    return (
      p.x >= c.x + DEPLOY_BOX.x0 + r - 1e-9 &&
      p.x <= c.x + DEPLOY_BOX.x1 - r + 1e-9 &&
      p.y >= c.y + DEPLOY_BOX.y0 + r - 1e-9 &&
      p.y <= c.y + DEPLOY_BOX.y1 - r + 1e-9
    );
  };

  it('puts a lone unit in the middle of the box', () => {
    const c = plotCenter(7);
    expect(deploymentPosition(7, 0, 1, 4)).toEqual({ x: c.x + (DEPLOY_BOX.x0 + DEPLOY_BOX.x1) / 2, y: c.y + (DEPLOY_BOX.y0 + DEPLOY_BOX.y1) / 2 });
  });

  it('keeps 1, 16, 40 and 160 units inside their own plot box, no NaN, repeatable', () => {
    for (const count of [1, 16, 40, 160]) {
      const all = Array.from({ length: count }, (_, i) => deploymentPosition(12, i, count, 4));
      for (const p of all) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
        expect(inBox(12, p, 4)).toBe(true);
      }
      expect(Array.from({ length: count }, (_, i) => deploymentPosition(12, i, count, 4))).toEqual(all);
    }
  });

  it('spreads a small squad over distinct slots, row by row', () => {
    const four = [0, 1, 2, 3].map((i) => deploymentPosition(6, i, 4, 4));
    expect(new Set(four.map((p) => `${p.x},${p.y}`)).size).toBe(4);
    expect(four[0]!.y).toBeLessThanOrEqual(four[3]!.y);
  });

  it('shrinks to the box middle for a body wider than the box', () => {
    const c = plotCenter(6);
    const p = deploymentPosition(6, 0, 3, PLOT);
    expect(p.x).toBe(c.x + (DEPLOY_BOX.x0 + DEPLOY_BOX.x1) / 2);
  });

  it('works from a plot centre too (respawns read it back from the structure foot)', () => {
    const c = plotCenter(18);
    expect(deploySlot(c.x, c.y, 2, 5, 4)).toEqual(deploymentPosition(18, 2, 5, 4));
  });

  it('rejects bad arguments', () => {
    expect(() => deploymentPosition(25, 0, 1, 4)).toThrow(RangeError);
    expect(() => deploymentPosition(6, 1, 1, 4)).toThrow(RangeError);
    expect(() => deploymentPosition(6, 0, 0, 4)).toThrow(RangeError);
    expect(() => deploymentPosition(6, 0, 1, -1)).toThrow(RangeError);
  });
});

describe('battles deploy into the boxes', () => {
  const troops = (count: number) => ({ stats: unitStats({ radius: 4 }), count });
  const unitsOf = (w: ReturnType<typeof createBattle>, uid: number) =>
    Array.from({ length: w.count }, (_, i) => i).filter((i) => w.kind[i] === KIND_UNIT && w.sourceUid[i] === uid);

  it('starts barracks troops, start summons and the Ngai mercenaries in their own boxes; home = a formation slot', () => {
    const w = createBattle(
      battleSetup({
        throne: throneSetup({ plot: 2, spawnAtThrone: troops(3) }),
        structures: [structure(7, { spawn: troops(5) }), structure(12, { startSummon: troops(2) })],
      }),
    );
    for (const [uid, plot, count] of [[8, 7, 5], [13, 12, 2], [0, 2, 3]] as const) {
      const ids = unitsOf(w, uid);
      expect(ids).toHaveLength(count);
      ids.forEach((id, k) => {
        const slot = deploymentPosition(plot, k, count, 4);
        expect([w.x[id], w.y[id]]).toEqual([slot.x, slot.y]);
        expect(w.homeY[id]).toBeGreaterThan(NORMAL_GEOMETRY.boardMax); // 2026-11-09: they line up in front of the board
      });
    }
  });

  it('puts every structure at its foot (the plot centre), clear of its box', () => {
    const w = createBattle(battleSetup({ structures: [structure(7)] }));
    const id = Array.from({ length: w.count }, (_, i) => i).find((i) => w.kind[i] === KIND_STRUCTURE)!;
    expect([w.x[id], w.y[id]]).toEqual([plotCenter(7).x + BUILDING_FOOT_OFFSET.x, plotCenter(7).y]);
  });

  it('respawns a fallen trooper back into its box', () => {
    const w = createBattle(battleSetup({ structures: [structure(7, { respawn: { everyTicks: 10, stats: unitStats({ radius: 4 }), count: 2 } })] }));
    addUnit(w, unitStats({ speed: 0, dmg: 0, interval: 0 }), TEAM_FOE, 740, 740, 740, 740, -1); // keeps the battle going
    for (let i = 0; i < 11; i++) stepBattle(w, []);
    const ids = unitsOf(w, 8);
    expect(ids.length).toBeGreaterThan(0);
    const first = deploymentPosition(7, 0, 2, 4);
    expect([w.homeX[ids[0]!], w.homeY[ids[0]!]]).toEqual([first.x, first.y]);
  });
});
