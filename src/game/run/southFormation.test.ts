import { describe, expect, it } from 'vitest';
import { BATTLE } from '../../data/battle';
import { RULES_FULL } from '../../data/rules';
import { composeArmy } from '../battle/compose';
import { formationRowsFor } from '../battle/bounds';
import { edgePositions } from '../battle/spawnLayout';
import { stepBattle } from '../battle/step';
import { createBattle, spawnWave } from '../battle/world';
import { battleSetup, unitStats } from '../testing/fixtures';
import { CONTENT } from '../cards/registry';
import { bossEdge, buildBattleSetup } from './battleSetup';
import { buildYearArmy } from './enemyArmy';
import type { RunState } from './state';
import { newRun } from './yearFlow';

const roster = [{ unit: 'u', weight: 1, enemyCost: 1 }];

describe('south-only deployment', () => {
  it('every composed spawn comes from the south edge, with or without extra edges', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const year of [1, 9, 10, 20, 30]) {
        for (const extraEdges of [0, 1]) {
          const plan = composeArmy(roster, 80, year, seed, { extraEdges });
          const edges = new Set(plan.waves.flatMap((w) => w.units.map((u) => u.edge)));
          expect([...edges].every((e) => e === 'S')).toBe(true);
        }
      }
    }
  });

  it('keeps the wave split, budget and unit order of the old composer', () => {
    const plan = composeArmy(roster, 20, 5, 3, {});
    expect(plan.waves.map((w) => w.units.length)).toEqual([8, 7, 5]);
    expect(plan.waves.map((w) => w.spawnTick)).toEqual([0, 120, 240]);
  });

  it('the boss comes in from the south whatever the saved army says', () => {
    const army = {
      waves: [
        { spawnTick: 0, units: [{ unit: 'u', edge: 'N' as const }] },
        { spawnTick: 120, units: [{ unit: 'u', edge: 'W' as const }] },
      ],
    } as unknown as NonNullable<RunState['army']>;
    expect(bossEdge(army)).toBe('S');
    expect(bossEdge({ waves: [] } as unknown as NonNullable<RunState['army']>)).toBe('S');
  });

  it('buildBattleSetup normalizes edges of a legacy army to the south', () => {
    const base = newRun(5, 'wheat', CONTENT, RULES_FULL);
    const army = buildYearArmy({ ...base, year: 1 }, CONTENT);
    const legacy = {
      ...army,
      waves: army.waves.map((w) => ({ ...w, units: w.units.map((u) => ({ ...u, edge: 'N' as const })) })),
    };
    const setup = buildBattleSetup({ ...base, year: 1, phase: 'battle', army: legacy }, CONTENT);
    const edges = setup.waves.flatMap((w) => w.spawns.map((s) => s.edge));
    expect(edges.length).toBeGreaterThan(0);
    expect(edges.every((e) => e === 'S')).toBe(true);
  });
});

describe('extra_edge_becomes_rows', () => {
  it('formationRowsFor adds rows for extra edges and for year 10+, never past the headcount', () => {
    expect(formationRowsFor(9, 0, 8)).toBe(1);
    expect(formationRowsFor(9, 1, 8)).toBe(2);
    expect(formationRowsFor(10, 0, 8)).toBe(2);
    expect(formationRowsFor(10, 1, 8)).toBe(3);
    expect(formationRowsFor(30, 9, 8)).toBe(4); // groups capped at 4 → 1 + 4 - 1
    expect(formationRowsFor(9, 1, 1)).toBe(1);
    expect(formationRowsFor(9, 1, 0)).toBe(0);
    // many units: the flag still adds a row on top of the natural rows (120 units = 5 rows)
    expect(formationRowsFor(9, 0, 120)).toBe(5);
    expect(formationRowsFor(9, 1, 120)).toBe(6);
    expect(formationRowsFor(10, 1, 120)).toBe(7);
  });

  it('edgePositions with 1 row is unchanged; 2 rows split 4/4 at depths 12 and 22', () => {
    expect(edgePositions('N', 25).map((p) => p.y).slice(23)).toEqual([-12, -22]);
    const two = edgePositions('S', 8, 2);
    expect(two.map((p) => p.y)).toEqual([396, 396, 396, 396, 406, 406, 406, 406]);
    expect(edgePositions('S', 0, 3)).toEqual([]);
    expect(edgePositions('S', 1, 4)).toHaveLength(1);
    expect(edgePositions('S', 2, 4)).toHaveLength(2);
  });

  it('120 units get natural rows 5, one more with the flag', () => {
    const depth = (rows: number): number => Math.max(...edgePositions('S', 120, rows).map((p) => p.y));
    expect(depth(1)).toBe(BATTLE.field + BATTLE.spawnOutside + 4 * BATTLE.spawnRowGap);
    expect(depth(6)).toBe(BATTLE.field + BATTLE.spawnOutside + 5 * BATTLE.spawnRowGap);
    expect(edgePositions('S', 120, 6)).toHaveLength(120);
  });
});

describe('south_spawn_progress', () => {
  const spawn = () => ({ edge: 'S' as const, stats: unitStats({ speed: 1 }) });

  it('a 120-unit south wave keeps every row (no collapse into one y) and advances', () => {
    const wave = { spawnTick: 0, spawns: Array.from({ length: 120 }, spawn), formationRows: 6 };
    const w = createBattle(battleSetup({ waves: [wave] }));
    spawnWave(w, 0);
    const ys = new Set<number>();
    for (let i = 0; i < w.count; i++) if (w.team[i] === 1) ys.add(w.y[i]!);
    expect(ys.size).toBe(6);
    expect(Math.max(...ys)).toBeLessThanOrEqual(w.maxY);
    const y0 = Math.min(...ys);
    for (let t = 0; t < 30; t++) stepBattle(w, []);
    let front = Infinity;
    let back = -Infinity;
    for (let i = 0; i < w.count; i++) {
      if (w.team[i] !== 1) continue;
      front = Math.min(front, w.y[i]!);
      back = Math.max(back, w.y[i]!);
    }
    expect(front).toBeLessThan(y0); // they advance instead of piling against the clamp
    expect(back - front).toBeGreaterThan(30); // the ranks are still spread out after walking (they started 50 apart)
  });

  it('spawnWave honours formationRows', () => {
    const wave = { spawnTick: 0, spawns: Array.from({ length: 8 }, spawn), formationRows: 2 };
    const w = createBattle(battleSetup({ waves: [wave] }));
    spawnWave(w, 0);
    const ys = new Set<number>();
    for (let i = 0; i < w.count; i++) if (w.team[i] === 1) ys.add(w.y[i]!);
    expect([...ys].sort((a, b) => a - b)).toEqual([396, 406]);
  });
});
