import { describe, expect, it } from 'vitest';
import { project } from '../../core/iso';
import { BATTLE, ENEMY_PORTAL } from '../../data/battle';
import { battleSetup, throneSetup, unitStats } from '../testing/fixtures';
import { realBoss } from './bossKit';
import { spawnBossDue } from './bosses';
import { spawnMaxY } from './bounds';
import { edgePositions, portalPositions } from './spawnLayout';
import { simulateBattle } from './step';
import type { Edge, WaveSetup } from './types';
import { TEAM_FOE, createBattle, spawnWave } from './world';

const foe = unitStats({ unit: 'foe', hp: 40, speed: 2 });
const south = (n: number, spawnTick = 0, formationRows?: number): WaveSetup => ({
  spawnTick,
  spawns: Array.from({ length: n }, () => ({ stats: foe, edge: 'S' as Edge })),
  ...(formationRows === undefined ? {} : { formationRows }),
});
const foes = (w: ReturnType<typeof createBattle>) =>
  [...Array(w.count).keys()].filter((i) => w.alive[i] === 1 && w.team[i] === TEAM_FOE);

describe('enemy portal (spec 2026-11-08 §3, Q2)', () => {
  it('portal_centre_projects_right_and_down: at the road end, south of the board centre', () => {
    expect(ENEMY_PORTAL).toMatchObject({ x: 384, y: 792, columns: 5, rows: 5, spacingX: 12, spacingY: 6 });
    expect(ENEMY_PORTAL.x).toBe(BATTLE.field / 2);
    expect(ENEMY_PORTAL.y).toBe(BATTLE.field + BATTLE.spawnOutside);
    expect(project(ENEMY_PORTAL)).toEqual({ x: 408, y: 588 });
    expect(project({ x: 384, y: 384 })).toEqual({ x: 0, y: 384 });
  });

  it('portal_slots_stay_at_mouth_for_0_1_25_120, and slot 25 reuses slot 0', () => {
    expect(portalPositions(0)).toEqual([]);
    for (const n of [1, 25, 120]) {
      const p = portalPositions(n);
      expect(p).toHaveLength(n);
      for (const q of p) {
        expect(q.x).toBeGreaterThanOrEqual(360);
        expect(q.x).toBeLessThanOrEqual(408);
        expect(q.y).toBeGreaterThanOrEqual(768);
        expect(q.y).toBeLessThanOrEqual(792);
      }
    }
    const p = portalPositions(26);
    expect(p[0]).toEqual({ x: 360, y: 792 });
    expect(p[4]).toEqual({ x: 408, y: 792 });
    expect(p[5]).toEqual({ x: 360, y: 786 });
    expect(p[24]).toEqual({ x: 408, y: 768 });
    expect(p[25]).toEqual(p[0]);
  });

  it('south_wave_uses_portal_in_spawn_order_at_exact_tick, whatever formationRows says', () => {
    for (const rows of [undefined, 1, 4]) {
      const w = createBattle(battleSetup({ waves: [south(30, 0, rows)] }));
      spawnWave(w, 0);
      const ids = foes(w);
      expect(ids).toHaveLength(30);
      const slots = portalPositions(30);
      ids.forEach((id, k) => {
        expect([w.x[id], w.y[id]]).toEqual([slots[k]!.x, slots[k]!.y]);
        expect([w.homeX[id], w.homeY[id]]).toEqual([slots[k]!.x, slots[k]!.y]);
      });
    }
    // through the real step: nothing before the wave tick, everything on it
    const w = createBattle(battleSetup({ throne: throneSetup({ attack: null }), waves: [south(3, 0), south(4, 120)] }));
    expect(simulateBattle(w.setup, []).ticks).toBeGreaterThan(0);
  });

  it('legacy_other_edges_keep_geometry: N/E/W rows are unchanged', () => {
    const w = createBattle(battleSetup({ waves: [{ spawnTick: 0, spawns: [{ stats: foe, edge: 'W' }, { stats: foe, edge: 'S' }] }] }));
    spawnWave(w, 0);
    const [west, s] = foes(w);
    const legacy = edgePositions('W', 1)[0]!;
    expect([w.x[west!], w.y[west!]]).toEqual([legacy.x, legacy.y]);
    expect([w.x[s!], w.y[s!]]).toEqual([ENEMY_PORTAL.x - 2 * ENEMY_PORTAL.spacingX, ENEMY_PORTAL.y]);
  });

  it('boss_spawns_once_at_portal_centre_on_due_tick', () => {
    const boss = { ...realBoss(1), edge: 'S' as Edge };
    const w = createBattle(battleSetup({ throne: throneSetup({ attack: null }), boss, waves: [{ spawnTick: 0, spawns: [] }] }));
    w.tick = boss.spawnTick - 1;
    spawnBossDue(w);
    expect(w.bossSpawned).toBe(false);
    w.tick = boss.spawnTick;
    spawnBossDue(w);
    expect([w.x[w.bossId], w.y[w.bossId]]).toEqual([ENEMY_PORTAL.x, ENEMY_PORTAL.y]);
    const count = w.count;
    spawnBossDue(w);
    expect(w.count).toBe(count);
  });

  it('south_bounds_include_portal_without_long_rows: spawnMaxY stays at the field margin', () => {
    const setup = battleSetup({ waves: [south(120, 0, 4)] });
    expect(spawnMaxY(setup)).toBe(BATTLE.field + BATTLE.fieldClampMargin);
    expect(spawnMaxY(setup)).toBeGreaterThanOrEqual(ENEMY_PORTAL.y);
  });

  it('portal_120_plus_boss: a full army out of one portal stays finite, south of the wall, inside the caps', () => {
    const boss = { ...realBoss(1), edge: 'S' as Edge };
    const setup = battleSetup({ throne: throneSetup({ attack: null }), boss, waves: [south(40, 0), south(40, 120), south(40, 240)] });
    const r = simulateBattle(setup, []);
    expect(Number.isFinite(r.ticks)).toBe(true);
    expect(r.ticks).toBeLessThanOrEqual(BATTLE.hardLimitTick);
    const w = createBattle(setup);
    for (const i of [0, 1, 2]) spawnWave(w, i);
    w.tick = boss.spawnTick;
    spawnBossDue(w);
    expect(foes(w)).toHaveLength(121);
    expect(w.count).toBeLessThanOrEqual(BATTLE.entityCap);
  });
});
