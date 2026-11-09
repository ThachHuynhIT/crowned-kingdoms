import { describe, expect, it } from 'vitest';
import { BATTLE, ENEMY_PORTAL } from '../../data/battle';
import { DEPLOY_BOX, ENDLESS_GEOMETRY, NORMAL_GEOMETRY, PLOT } from '../../data/boardGeometry';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import { CONTENT } from '../cards/registry';
import { buildBattleSetup } from '../run/battleSetup';
import { newRun, startYear } from '../run/yearFlow';
import { battleSetup, structure, throneSetup, unitStats } from '../testing/fixtures';
import { clampNorthY, spawnMaxY } from './bounds';
import { deploymentPosition } from './deployment';
import { hashWorld } from './hash';
import { pickAutoTarget, tryIntervene } from './intervention';
import { moveEntities } from './movement';
import { portalPositions } from './spawnLayout';
import { stepBattle } from './step';
import { respawnPhase } from './structures';
import type { BattleSetup } from './types';
import { TEAM_ALLY, TEAM_FOE, addUnit, createBattle, plotCenter, spawnWave, structureFoot, type BattleWorld } from './world';

const endlessSetup = (over: Partial<BattleSetup> = {}): BattleSetup =>
  battleSetup({ throne: throneSetup({ plot: 2 }), geometry: 'endless', ...over });

describe('battle geometry per instance (spec 2026-11-09 §4)', () => {
  it('plot centres: inner plots identical in both modes, outer ring around them', () => {
    expect(plotCenter(2)).toEqual({ x: 384, y: 256 });
    expect(plotCenter(2, 'endless')).toEqual({ x: 384, y: 256 });
    for (let p = 0; p < 25; p++) expect(plotCenter(p, 'endless')).toEqual(plotCenter(p));
    expect(plotCenter(25, 'endless')).toEqual({ x: 192, y: 192 });
    expect(plotCenter(31, 'endless')).toEqual({ x: 576, y: 192 });
    expect(plotCenter(32, 'endless')).toEqual({ x: 192, y: 256 });
    expect(plotCenter(48, 'endless')).toEqual({ x: 576, y: 576 });
    expect(structureFoot(48, 'endless')).toEqual({ x: 576, y: 576 });
    expect(() => plotCenter(25)).toThrow();
    expect(() => plotCenter(49, 'endless')).toThrow();
  });

  it('every one of the 49 deploy boxes lies inside its plot; 160 soldiers are placed deterministically', () => {
    for (let plot = 0; plot < ENDLESS_GEOMETRY.plotCount; plot++) {
      const c = plotCenter(plot, 'endless');
      const all = Array.from({ length: 160 }, (_, k) => deploymentPosition(plot, k, 160, 4, 'endless'));
      expect(Array.from({ length: 160 }, (_, k) => deploymentPosition(plot, k, 160, 4, 'endless'))).toEqual(all);
      for (const p of all) {
        expect(p.x).toBeGreaterThanOrEqual(c.x + DEPLOY_BOX.x0);
        expect(p.x).toBeLessThanOrEqual(c.x + DEPLOY_BOX.x1);
        expect(p.y).toBeGreaterThanOrEqual(c.y + DEPLOY_BOX.y0);
        expect(p.y).toBeLessThanOrEqual(c.y + DEPLOY_BOX.y1);
        expect(p.x).toBeGreaterThan(c.x - PLOT / 2);
        expect(p.x).toBeLessThan(c.x + PLOT / 2);
        expect(p.y).toBeGreaterThan(c.y - PLOT / 2);
        expect(p.y).toBeLessThan(c.y + PLOT / 2);
      }
    }
    expect(() => deploymentPosition(25, 0, 1, 4)).toThrow(RangeError);
    expect(() => deploymentPosition(49, 0, 1, 4, 'endless')).toThrow(RangeError);
  });

  it('north clamp: 176 + r in a normal battle, 112 + r in an Endless one', () => {
    expect(clampNorthY(0, 4)).toBe(NORMAL_GEOMETRY.wallY + 4);
    expect(clampNorthY(0, 4, 'endless')).toBe(ENDLESS_GEOMETRY.wallY + 4);
    expect(ENDLESS_GEOMETRY.wallY).toBe(112);

    const n = createBattle(battleSetup());
    const e = createBattle(endlessSetup());
    expect(n.geometry).toBe('normal');
    expect(e.geometry).toBe('endless');
    for (const [w, wall] of [
      [n, 176],
      [e, 112],
    ] as const) {
      const unit = addUnit(w, unitStats({ radius: 4 }), TEAM_ALLY, 100, 0, 100, 0, -1);
      expect([w.y[unit], w.prevY[unit], w.homeY[unit]]).toEqual([wall + 4, wall + 4, wall + 4]);
      const flyer = addUnit(w, unitStats({ radius: 6, tags: ['flying'] }), TEAM_FOE, 200, 0, 200, 0, -1);
      expect(w.y[flyer]).toBe(wall + 6);
      const boss = addUnit(w, unitStats({ radius: 20, speed: 0, tags: ['boss'] }), TEAM_FOE, 300, 0, 300, 0, -1);
      expect(w.y[boss]).toBe(wall + 20);
      // knockback north into the wall stops at the wall line
      const kb = addUnit(w, unitStats({ radius: 14, speed: 0 }), TEAM_FOE, 500, wall + 14, 500, wall + 14, -1);
      w.kbTicks[kb] = 3;
      w.kbY[kb] = -30;
      for (let t = 0; t < 4; t++) {
        moveEntities(w);
        expect(w.y[kb]).toBe(wall + 14);
        expect(w.y[unit]).toBeGreaterThanOrEqual(wall + 4);
        expect(w.y[flyer]).toBeGreaterThanOrEqual(wall + 6);
        expect(w.y[boss]).toBeGreaterThanOrEqual(wall + 20);
      }
    }
  });

  it('intervention and auto-fire clamp to the wall of the battle', () => {
    for (const [setup, wall] of [
      [battleSetup(), 176],
      [endlessSetup(), 112],
    ] as const) {
      const w = createBattle(setup);
      w.tick = 40;
      expect(tryIntervene(w, { tick: 40, x: 100, y: 0 })).toBe(true);
      expect(w.boulders[0]!.y).toBe(wall);
      const w2 = createBattle(setup);
      const f = addUnit(w2, unitStats({ radius: 0, speed: 0 }), TEAM_FOE, 100, 0, 100, 0, -1);
      expect(w2.y[f]).toBe(wall);
      expect(pickAutoTarget(w2)!.y).toBe(wall);
    }
  });

  it('structures, troops and throne mercenaries stand on the Endless plots', () => {
    const merc = unitStats({ unit: 'merc', radius: 4 });
    const troop = unitStats({ unit: 'troop', radius: 4 });
    const w = createBattle(
      endlessSetup({
        throne: throneSetup({ plot: 2, spawnAtThrone: { stats: merc, count: 3 } }),
        structures: [structure(48, { uid: 2 }), structure(25, { uid: 1, kind: 'troop', spawn: { stats: troop, count: 2 } })],
      }),
    );
    expect([w.x[w.throneId], w.y[w.throneId]]).toEqual([384, 256]);
    // structures by plot: 25 then 48
    expect([w.x[1], w.y[1]]).toEqual([192, 192]);
    expect([w.x[2], w.y[2]]).toEqual([576, 576]);
    for (let k = 0; k < 2; k++) {
      const p = deploymentPosition(25, k, 2, 4, 'endless');
      expect([w.x[3 + k], w.y[3 + k]]).toEqual([p.x, p.y]);
    }
    for (let k = 0; k < 3; k++) {
      const p = deploymentPosition(2, k, 3, 4, 'endless');
      expect([w.x[5 + k], w.y[5 + k]]).toEqual([p.x, p.y]);
    }
  });

  it('respawns appear in the deploy box of an outer plot', () => {
    const spider = unitStats({ unit: 'spider', radius: 4 });
    const w = createBattle(endlessSetup({ structures: [structure(48, { uid: 1, respawn: { everyTicks: 1, count: 1, stats: spider } })] }));
    w.tick = 1;
    respawnPhase(w);
    const id = [...Array(w.count).keys()].find((i) => w.label[i] === 'spider');
    expect(id).toBeDefined();
    const p = deploymentPosition(48, 0, 1, 4, 'endless');
    expect([w.x[id!], w.y[id!]]).toEqual([p.x, p.y]);
  });

  it('two worlds of different modes stepped in turn do not affect each other', () => {
    const wave = { spawnTick: 0, spawns: Array.from({ length: 10 }, () => ({ edge: 'S' as const, stats: unitStats({ speed: 2 }) })) };
    const normalSetup = battleSetup({ throne: throneSetup({ plot: 2 }), structures: [structure(12, { uid: 1 })], waves: [wave] });
    const eSetup = endlessSetup({ structures: [structure(12, { uid: 1 }), structure(30, { uid: 2 })], waves: [wave] });
    const run = (setups: BattleSetup[], ticks: number): number[][] => {
      const worlds = setups.map((s) => createBattle(s));
      const hashes: number[][] = worlds.map(() => []);
      for (let t = 0; t < ticks; t++) {
        worlds.forEach((w: BattleWorld, i) => {
          stepBattle(w, []);
          hashes[i]!.push(hashWorld(w));
        });
      }
      return hashes;
    };
    const [aloneN] = run([normalSetup], 150);
    const [aloneE] = run([eSetup], 150);
    const [mixN, mixE] = run([normalSetup, eSetup], 150);
    expect(mixN).toEqual(aloneN);
    expect(mixE).toEqual(aloneE);
  });

  it('the portal and the southern bound are the same in both modes', () => {
    const wave = { spawnTick: 0, spawns: Array.from({ length: 120 }, () => ({ edge: 'S' as const, stats: unitStats() })), formationRows: 7 };
    expect(ENDLESS_GEOMETRY.portal).toEqual({ x: ENEMY_PORTAL.x, y: ENEMY_PORTAL.y });
    expect(spawnMaxY(endlessSetup({ waves: [wave] }))).toBe(spawnMaxY(battleSetup({ waves: [wave] })));
    expect(createBattle(endlessSetup()).maxY).toBe(BATTLE.field + BATTLE.fieldClampMargin);
    const n = createBattle(battleSetup({ waves: [wave] }));
    const e = createBattle(endlessSetup({ waves: [wave] }));
    spawnWave(n, 0);
    spawnWave(e, 0);
    const foes = (w: BattleWorld) => [...Array(w.count).keys()].filter((i) => w.team[i] === TEAM_FOE).map((i) => [w.x[i], w.y[i]]);
    expect(foes(e)).toEqual(foes(n));
    expect(foes(e)).toEqual(portalPositions(120).map((p) => [p.x, p.y]));
  });

  it('buildBattleSetup marks only Endless battles; normal setups have no geometry key', () => {
    const normal = buildBattleSetup(startYear({ ...newRun(3, 'wheat', CONTENT, RULES_FULL), phase: 'yearEnd', year: 0 }, CONTENT), CONTENT);
    expect('geometry' in normal).toBe(false);
    const endless = buildBattleSetup(startYear({ ...newRun(3, 'wheat', CONTENT, RULES_ENDLESS), phase: 'yearEnd', year: 0 }, CONTENT), CONTENT);
    expect(endless.geometry).toBe('endless');
    expect(createBattle(endless).geometry).toBe('endless');
  });
});
