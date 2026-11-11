import { describe, expect, it } from 'vitest';
import { INTERVENTION, INTERVENTION_POWERS } from '../../data/battle';
import type { KingId } from '../../data/types';
import { battleSetup, structure, throneSetup, unitStats } from '../testing/fixtures';
import { boulderPhase, tryIntervene } from './intervention';
import { TEAM_FOE, createBattle, drainEvents, spawnWave, structureFoot, type BattleWorld } from './world';

/** One still enemy 20 px from the drop point, and the boulder dropped and landed at once. */
const hit = (power?: KingId): { w: BattleWorld; foe: number } => {
  const still = { speed: 0, dmg: 0 };
  const w = createBattle(
    battleSetup({
      year: 5,
      ...(power ? { power } : {}),
      throne: throneSetup({ attack: null }),
      structures: [structure(0)],
      waves: [{ spawnTick: 0, spawns: [{ stats: unitStats({ unit: 'bandit', ...still, hp: 5000, armor: 0 }), edge: 'N' as const }] }],
    }),
  );
  spawnWave(w, 0);
  let foe = -1;
  for (let i = 0; i < w.count; i++) if (w.team[i] === TEAM_FOE) foe = i;
  const x = structureFoot(0).x;
  const y = structureFoot(0).y + 60;
  w.x[foe] = x + 20;
  w.y[foe] = y;
  drainEvents(w);
  w.tick = INTERVENTION.firstReadyTick;
  expect(tryIntervene(w, { tick: w.tick, x, y })).toBe(true);
  w.tick += INTERVENTION.delayTicks;
  boulderPhase(w);
  return { w, foe };
};

describe('Can Thiệp riêng của từng vua (10/11/2026)', () => {
  it('every king has a named power with a description', () => {
    for (const p of Object.values(INTERVENTION_POWERS)) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.text.length).toBeGreaterThan(0);
    }
    expect(Object.keys(INTERVENTION_POWERS)).toHaveLength(9);
  });

  it('no power keeps the plain boulder (no status)', () => {
    const { w, foe } = hit();
    expect([w.slowTicks[foe], w.stunTicks[foe], w.dots.length]).toEqual([0, 0, 0]);
  });

  it('wheat and grove slow, stone and clock stun, forge burns, moon poisons', () => {
    const slow = (k: KingId) => { const { w, foe } = hit(k); return [w.slowPct[foe], w.slowTicks[foe]]; };
    expect(slow('wheat')).toEqual([40, 40]);
    expect(slow('grove')).toEqual([60, 25]);
    expect(hit('stone').w.stunTicks[hit('stone').foe]).toBeGreaterThanOrEqual(10);
    const clock = hit('clock');
    expect(clock.w.stunTicks[clock.foe]).toBeGreaterThanOrEqual(18);
    expect(hit('forge').w.dots.map((d) => d.kind)).toEqual(['burn']);
    expect(hit('moon').w.dots.map((d) => d.kind)).toEqual(['poison']);
  });

  it('arcane hits harder, clock and nomad softer; nomad reaches further', () => {
    const base = createBattle(battleSetup({}));
    expect(createBattle(battleSetup({ power: 'arcane' })).boulderDmgPct).toBe(base.boulderDmgPct + 30);
    expect(createBattle(battleSetup({ power: 'clock' })).boulderDmgPct).toBe(base.boulderDmgPct - 10);
    expect(createBattle(battleSetup({ power: 'nomad' })).boulderRadius).toBeCloseTo(base.boulderRadius * 1.35);
  });

  it('tide pushes twice as far', () => {
    const a = hit();
    const b = hit('tide');
    expect(Math.abs(b.w.kbX[b.foe]!)).toBeCloseTo(Math.abs(a.w.kbX[a.foe]!) * 2);
  });

  it('a second drop refreshes the burn instead of stacking another entry', () => {
    const { w, foe } = hit('forge');
    w.tick = w.readyTick;
    expect(tryIntervene(w, { tick: w.tick, x: w.x[foe]!, y: w.y[foe]! })).toBe(true);
    w.tick += INTERVENTION.delayTicks;
    boulderPhase(w);
    expect(w.dots.filter((d) => d.victim === foe)).toHaveLength(1);
  });
});
