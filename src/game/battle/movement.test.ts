import { describe, expect, it } from 'vitest';
import { NORMAL_GEOMETRY } from '../../data/boardGeometry';
import { BATTLE } from '../../data/battle';
import { battleSetup, structure, unitStats } from '../testing/fixtures';
import { moveEntities } from './movement';
import { edgeDistance } from './targeting';
import type { StructureSetup, UnitStats } from './types';
import { TEAM_ALLY, TEAM_FOE, addUnit, createBattle, structureFoot, type BattleWorld } from './world';

const world = (structures: StructureSetup[] = []): BattleWorld =>
  createBattle(battleSetup({ structures }));

const unit = (
  w: BattleWorld,
  team: number,
  x: number,
  y: number,
  over: Partial<UnitStats> = {},
): number => addUnit(w, unitStats(over), team, x, y, x, y, -1);

const EPS = 1e-9;

/** A row well south of the north wall (wallY + 104), so nothing here is clamped by it. */
const Y = BATTLE.wallY + 104;

/** Footman (range 2, r 4, speed 1) at (20, Y), south of the wall, aimed at a stationary foe (r 4) 100 px east. */
const approach = (over: Partial<UnitStats> = {}) => {
  const w = world();
  const a = unit(w, TEAM_ALLY, 20, Y, over);
  const f = unit(w, TEAM_FOE, 120, Y, { speed: 0 });
  w.target[a] = f;
  return { w, a, f };
};

describe('moveEntities — walking to a target', () => {
  it('closes to exactly edge distance = range, never more than speed per tick', () => {
    const { w, a, f } = approach();
    for (let t = 0; t < 120; t++) {
      const x0 = w.x[a]!;
      moveEntities(w);
      w.tick += 1;
      const step = w.x[a]! - x0;
      expect(step).toBeGreaterThanOrEqual(0);
      expect(step).toBeLessThanOrEqual(1 + EPS);
      expect(edgeDistance(w, a, f)).toBeGreaterThanOrEqual(2 - EPS);
    }
    expect(edgeDistance(w, a, f)).toBeCloseTo(2, 9);
    expect(w.y[a]).toBe(Y);
  });

  it('slowPct 50 halves the step', () => {
    const { w, a } = approach();
    w.slowPct[a] = 50;
    moveEntities(w);
    expect(w.x[a]).toBeCloseTo(20.5, 12);
  });

  it('stands still when already in range', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 20, Y);
    const f = unit(w, TEAM_FOE, 29, Y, { speed: 0 }); // edge 1 ≤ range 2
    w.target[a] = f;
    moveEntities(w);
    expect(w.x[a]).toBe(20);
    expect(w.y[a]).toBe(Y);
  });

  it('records the start-of-tick position in prevX/prevY', () => {
    const { w, a } = approach();
    moveEntities(w);
    expect(w.prevX[a]).toBe(20);
    moveEntities(w);
    expect(w.prevX[a]).toBe(21);
    expect(w.x[a]).toBe(22);
    expect(w.prevY[a]).toBe(Y);
  });

  it('uses start-of-tick positions: a later id sees the earlier id where it was', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 20, Y); // walks south towards g
    const f = unit(w, TEAM_FOE, 40, Y); // walks west towards a
    const g = unit(w, TEAM_FOE, 20, Y + 100, { speed: 0 });
    w.target[a] = g;
    w.target[f] = a;
    moveEntities(w);
    expect(w.x[a]).toBe(20);
    expect(w.y[a]).toBe(Y + 1);
    expect(w.x[f]).toBe(39);
    expect(w.y[f]).toBe(Y); // aimed at a's start-of-tick position (20, Y)
  });

  it('foes move 1.5× during rage, not before', () => {
    const w = world();
    const f = unit(w, TEAM_FOE, 20, Y);
    const a = unit(w, TEAM_ALLY, 120, Y, { speed: 0 });
    w.target[f] = a;
    w.tick = BATTLE.rageTick - 1;
    moveEntities(w);
    expect(w.x[f]).toBeCloseTo(21, 12);
    w.tick = BATTLE.rageTick;
    moveEntities(w);
    expect(w.x[f]).toBeCloseTo(22.5, 12);
  });

  it('allies are not sped up by rage', () => {
    const { w, a } = approach();
    w.tick = BATTLE.rageTick;
    moveEntities(w);
    expect(w.x[a]).toBeCloseTo(21, 12);
  });

  it('ignores a dead target and heads home instead', () => {
    const w = world();
    const a = addUnit(w, unitStats(), TEAM_ALLY, 60, 300, 50, 300, 1);
    const f = unit(w, TEAM_FOE, 100, 300, { speed: 0 });
    w.target[a] = f;
    w.alive[f] = 0;
    moveEntities(w);
    expect(w.x[a]).toBe(59);
  });
});

describe('moveEntities — idle units', () => {
  it('walk back to their home point, then stay exactly there', () => {
    const w = world();
    const a = addUnit(w, unitStats(), TEAM_ALLY, 60, 300, 50, 300, 1);
    for (let t = 0; t < 10; t++) moveEntities(w);
    expect(w.x[a]).toBe(50);
    expect(w.y[a]).toBe(300);
    moveEntities(w);
    expect(w.x[a]).toBe(50);
    expect(w.y[a]).toBe(300);
  });

  it('snap onto home when closer than 0.5 px (no jitter)', () => {
    const w = world();
    const a = addUnit(w, unitStats({ speed: 0.2 }), TEAM_ALLY, 50.3, 300, 50, 300, 1);
    moveEntities(w);
    expect(w.x[a]).toBe(50);
    expect(w.y[a]).toBe(300);
  });
});

describe('moveEntities — separation, knockback, clamp', () => {
  it('splits two coincident units along x, each by at most separationPushMax', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 50, 300);
    const b = unit(w, TEAM_ALLY, 50, 300);
    moveEntities(w);
    expect(w.x[a]).toBe(50 - BATTLE.separationPushMax);
    expect(w.x[b]).toBe(50 + BATTLE.separationPushMax);
    expect(w.y[a]).toBe(300);
    expect(w.y[b]).toBe(300);
    expect(Number.isNaN(w.x[a])).toBe(false);
  });

  it('never moves structures or the throne; they push every unit out of their square footprint fully', () => {
    // 2026-11-09: nobody walks through a building, our troops included; footprint half-side = radius 18.
    const s = structureFoot(0); // id 1
    const t = structureFoot(12); // the fixture throne
    const w = world([structure(0)]);
    const u = unit(w, TEAM_FOE, s.x + 2, s.y, { speed: 0 });
    const v = unit(w, TEAM_FOE, t.x, t.y - 12, { speed: 0 }); // inside the throne footprint
    const ally = unit(w, TEAM_ALLY, t.x + 2, t.y, { speed: 0 });
    moveEntities(w);
    expect(w.x[1]).toBe(s.x);
    expect(w.y[1]).toBe(s.y);
    expect(w.x[0]).toBe(t.x);
    expect(w.y[0]).toBe(t.y);
    expect(w.x[u]).toBeCloseTo(s.x + BATTLE.structureRadius + 4, 12);
    expect(w.y[v]).toBeCloseTo(t.y - BATTLE.throneRadius - 4, 12);
    expect([w.x[ally], w.y[ally]]).toEqual([t.x + BATTLE.throneRadius + 4, t.y]);
  });

  it('dead entities neither move nor push', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 50, 300);
    const b = unit(w, TEAM_ALLY, 50, 300);
    w.alive[b] = 0;
    moveEntities(w);
    expect(w.x[a]).toBe(50);
    expect(w.x[b]).toBe(50);
  });

  it('applies knockback kbX per tick for kbTicks ticks, then stops', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 100, 300, { speed: 0 });
    w.kbTicks[a] = 3;
    w.kbX[a] = 4;
    for (let t = 0; t < 3; t++) moveEntities(w);
    expect(w.x[a]).toBe(112);
    expect(w.kbTicks[a]).toBe(0);
    moveEntities(w);
    expect(w.x[a]).toBe(112);
    expect(w.y[a]).toBe(300);
  });

  it('does not knock back structures', () => {
    const w = world([structure(0)]);
    w.kbTicks[1] = 3;
    w.kbX[1] = 4;
    moveEntities(w);
    expect(w.x[1]).toBe(structureFoot(0).x);
  });

  it('clamps units to [−fieldClampMargin, field + fieldClampMargin]', () => {
    const w = world();
    const a = unit(w, TEAM_FOE, -100, Y, { speed: 0 });
    const b = unit(w, TEAM_FOE, 1000, 900, { speed: 0 });
    const lo = -BATTLE.fieldClampMargin;
    const hi = BATTLE.field + BATTLE.fieldClampMargin;
    moveEntities(w);
    expect(lo).toBe(-64);
    expect(hi).toBe(832);
    expect(w.x[a]).toBe(lo);
    expect(w.y[a]).toBe(Y);
    expect(w.x[b]).toBe(hi);
    expect(w.y[b]).toBe(hi);
  });
});

describe('moveEntities — holding ground against a crowd', () => {
  it('a soldier in contact with its target is not shoved away by the enemies crowding it', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 100, Y);
    const target = unit(w, TEAM_FOE, 110, Y, { speed: 0 }); // edge gap 2 = range: in contact
    w.target[a] = target;
    unit(w, TEAM_FOE, 104, Y + 3, { speed: 0 });
    unit(w, TEAM_FOE, 96, Y - 3, { speed: 0 });
    unit(w, TEAM_FOE, 101, Y + 6, { speed: 0 });
    moveEntities(w);
    // Anchored by its target in range: the three overlapping enemies do not move it at all.
    expect(w.x[a]).toBe(100);
    expect(w.y[a]).toBe(Y);
  });

  it('a lone enemy overlapping a soldier is eased away slowly, not thrown', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 100, Y, { speed: 0 });
    const f = unit(w, TEAM_FOE, 102, Y, { speed: 0 });
    moveEntities(w);
    expect(Math.abs(w.x[a]! - 100)).toBeLessThanOrEqual(BATTLE.separationPushCross + EPS);
    expect(Math.abs(w.x[f]! - 102)).toBeLessThanOrEqual(BATTLE.separationPushCross + EPS);
  });
});

describe('moveEntities — stun', () => {
  it('a stunned unit does not walk', () => {
    const { w, a } = approach();
    w.stunTicks[a] = 3;
    moveEntities(w);
    expect(w.x[a]).toBe(20);
    w.stunTicks[a] = 0;
    moveEntities(w);
    expect(w.x[a]).toBeCloseTo(21, 12);
  });
});

describe('moveEntities — walking round buildings (2026-11-09)', () => {
  const inside = (w: BattleWorld, u: number, s: number): boolean =>
    Math.abs(w.x[u]! - w.x[s]!) < w.radius[s]! + w.radius[u]! - 0.5 &&
    Math.abs(w.y[u]! - w.y[s]!) < w.radius[s]! + w.radius[u]! - 0.5;

  for (const team of [TEAM_ALLY, TEAM_FOE]) {
    it(`a ${team === TEAM_ALLY ? 'unit of ours' : 'foe'} whose straight line crosses a building goes round it and arrives`, () => {
      const s = structureFoot(12); // id 1, the middle plot
      const w = world([structure(12)]);
      const goal = { x: s.x + 3, y: s.y + 60 };
      const u = addUnit(w, unitStats({ speed: 1 }), team, s.x - 2, s.y - 60, goal.x, goal.y, -1);
      for (let t = 0; t < 400; t++) {
        moveEntities(w);
        expect(inside(w, u, 1), `tick ${t}`).toBe(false);
      }
      expect(Math.abs(w.x[u]! - goal.x) + Math.abs(w.y[u]! - goal.y)).toBeLessThan(1);
    });
  }

  it('a flying unit flies straight over', () => {
    const s = structureFoot(12);
    const w = world([structure(12)]);
    const u = addUnit(w, unitStats({ speed: 1, tags: ['flying'] }), TEAM_FOE, s.x, s.y - 60, s.x, s.y + 60, -1);
    for (let t = 0; t < 60; t++) moveEntities(w);
    expect(w.x[u]).toBeCloseTo(s.x, 9);
  });

  it('keeps our units inside the board plus allyLeashPlots plots', () => {
    const w = world();
    const far = NORMAL_GEOMETRY.boardMax + BATTLE.allyLeashPlots * BATTLE.plot;
    const u = addUnit(w, unitStats({ speed: 4 }), TEAM_ALLY, far - 2, 400, far + 200, 400, -1);
    for (let t = 0; t < 20; t++) moveEntities(w);
    expect(w.x[u]).toBe(far);
    const f = addUnit(w, unitStats({ speed: 4 }), TEAM_FOE, far - 2, 300, far + 200, 300, -1);
    for (let t = 0; t < 20; t++) moveEntities(w);
    expect(w.x[f]).toBeGreaterThan(far + 20); // foes are not leashed
  });
});
