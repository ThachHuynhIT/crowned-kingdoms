import { describe, expect, it } from 'vitest';
import { BATTLE } from '../../data/battle';
import { attackStats, battleSetup, structure, unitStats } from '../testing/fixtures';
import type { StructureSetup, UnitStats } from './types';
import { allowsFoeStructureTarget, edgeDistance, inRange, nearestHittableAllyUnit, pickShotTarget, retarget } from './targeting';
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

/** Chân Ngai (fixture: plot 12) và chân tháp plot 2: tháp đứng ngay bắc Ngai, cách hai ô. */
const T = structureFoot(12);
const TW = structureFoot(2);

/** Tháp ở plot 2, tầm 60, closestToThrone. */
const tower = (over: Partial<StructureSetup> = {}): StructureSetup =>
  structure(2, {
    kind: 'tower',
    attack: attackStats({ range: 60 }),
    targeting: 'closestToThrone',
    ...over,
  });

describe('edgeDistance / inRange', () => {
  it('measures centre distance minus both radii', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 0, 0, { range: 2 });
    const b = unit(w, TEAM_FOE, 10, 0);
    expect(edgeDistance(w, a, b)).toBe(2);
    expect(inRange(w, a, b)).toBe(true);
    w.range[a] = 1.9;
    expect(inRange(w, a, b)).toBe(false);
    w.range[a] = 5;
    w.minRange[a] = 3;
    expect(inRange(w, a, b)).toBe(false);
    w.minRange[a] = 2;
    expect(inRange(w, a, b)).toBe(true);
  });
});

describe('retarget — allies', () => {
  it('picks the nearest foe', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 50, 350);
    const far = unit(w, TEAM_FOE, 50, 390);
    const near = unit(w, TEAM_FOE, 80, 350);
    retarget(w);
    expect(w.target[a]).toBe(near);
    expect(far).toBeGreaterThan(0);
  });

  it('breaks distance ties by the smaller id', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 50, 50);
    const first = unit(w, TEAM_FOE, 70, 50);
    unit(w, TEAM_FOE, 30, 50);
    retarget(w);
    expect(w.target[a]).toBe(first);
  });

  it('has no target when no foe is alive', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 50, 50);
    const f = unit(w, TEAM_FOE, 70, 50);
    w.alive[f] = 0;
    retarget(w);
    expect(w.target[a]).toBe(-1);
  });

  it('does not retarget structures or the throne', () => {
    const w = world([tower()]);
    unit(w, TEAM_FOE, 192, 100);
    retarget(w);
    expect(w.target[0]).toBe(-1);
    expect(w.target[1]).toBe(-1);
  });
});

describe('retarget — foes', () => {
  it('goes for one of our units anywhere on the field, far away too (spec 2026-11-08 §2)', () => {
    // far west of the throne
    const w = world();
    const f = unit(w, TEAM_FOE, 100, 300);
    const a = unit(w, TEAM_ALLY, 100, 300 + 8 + 80);
    retarget(w);
    expect(w.target[f]).toBe(a);

    const w2 = world();
    const f2 = unit(w2, TEAM_FOE, 100, 300);
    const far = unit(w2, TEAM_ALLY, 100, 300 + 8 + 500);
    retarget(w2);
    expect(w2.target[f2]).toBe(far);
  });

  it('with no unit of ours left, picks the nearest structure anywhere; the throne only when none is left (2026-11-09)', () => {
    const s = structureFoot(4); // id 1
    const w = world([structure(4)]);
    const f = unit(w, TEAM_FOE, s.x, s.y + 58);
    retarget(w);
    expect(w.target[f]).toBe(1);

    // far from every structure, nearer to the throne than to plot 4: still the structure
    const w2 = world([structure(4)]);
    const f2 = unit(w2, TEAM_FOE, 20, 380);
    retarget(w2);
    expect(w2.target[f2]).toBe(1);

    const w3 = world();
    const f3 = unit(w3, TEAM_FOE, 20, 380);
    retarget(w3);
    expect(w3.target[f3]).toBe(w3.throneId);
  });

  it('siege units go for our units first too, then any structure, then the throne', () => {
    const s = structureFoot(4);
    const w = world([structure(4)]);
    const f = unit(w, TEAM_FOE, s.x + 44, s.y - 38, { siege: true });
    const a = unit(w, TEAM_ALLY, s.x + 44, s.y + 300);
    retarget(w);
    expect(w.target[f]).toBe(a);

    const w2 = world([structure(4)]);
    const f2 = unit(w2, TEAM_FOE, 20, 380, { siege: true });
    retarget(w2);
    expect(w2.target[f2]).toBe(1);
  });

  it('during rage ignores our units but still breaks every structure before the throne (2026-11-09)', () => {
    const w = world([structure(4)]);
    const f = unit(w, TEAM_FOE, 300, 90);
    unit(w, TEAM_ALLY, 300, 98);
    w.tick = BATTLE.rageTick;
    retarget(w);
    expect(w.target[f]).toBe(1);

    const w2 = world();
    const f2 = unit(w2, TEAM_FOE, 300, 90);
    unit(w2, TEAM_ALLY, 300, 98);
    w2.tick = BATTLE.rageTick;
    retarget(w2);
    expect(w2.target[f2]).toBe(w2.throneId);

    const w3 = world([structure(4)]);
    const f3 = unit(w3, TEAM_FOE, 300, 90);
    const a3 = unit(w3, TEAM_ALLY, 300, 98);
    w3.tick = BATTLE.rageTick - 1;
    retarget(w3);
    expect(w3.target[f3]).toBe(a3);
  });

  it('switches from a living unit to a structure at rageTick', () => {
    const w = world([structure(4)]);
    const f = unit(w, TEAM_FOE, 300, 90);
    const a = unit(w, TEAM_ALLY, 300, 98);
    w.tick = BATTLE.rageTick - 1;
    retarget(w);
    expect(w.target[f]).toBe(a);
    w.tick = BATTLE.rageTick;
    retarget(w);
    expect(w.target[f]).toBe(1);
  });
});

describe('retarget — foes kill our units before our buildings (spec 2026-11-08 §2)', () => {
  const S4 = structureFoot(4);

  it('foe_prefers_far_hittable_unit_over_near_structure', () => {
    const w = world([structure(4)]);
    const f = unit(w, TEAM_FOE, S4.x, S4.y + 20); // touching the structure
    const a = unit(w, TEAM_ALLY, S4.x + 300, S4.y + 300);
    retarget(w);
    expect(w.target[f]).toBe(a);
  });

  it('nearest_unit_edge_distance_ties_by_id', () => {
    const w = world();
    const f = unit(w, TEAM_FOE, 100, 300);
    const first = unit(w, TEAM_ALLY, 140, 300);
    unit(w, TEAM_ALLY, 60, 300);
    const big = unit(w, TEAM_ALLY, 100, 356, { radius: 20 }); // edge 56 − 4 − 20 = 32, same as `first` (40 − 8): tie → smaller id
    retarget(w);
    expect(w.target[f]).toBe(first);
    w.y[big] = 355; // edge 31: nearer by edge distance although its centre is farther than 40
    w.tick = BATTLE.retargetTicks;
    retarget(w);
    expect(w.target[f]).toBe(big);
  });

  it('only_unhittable_flyer_falls_back_to_structure, and a ranged foe pursues the flyer', () => {
    const w = world([structure(4)]);
    const melee = unit(w, TEAM_FOE, S4.x, S4.y + 58, { range: 4 });
    const archer = unit(w, TEAM_FOE, S4.x, S4.y + 60, { range: BATTLE.flyingHitMinRange });
    const flyer = unit(w, TEAM_ALLY, S4.x + 200, S4.y + 200, { tags: ['flying'] });
    retarget(w);
    expect(w.target[melee]).toBe(1);
    expect(w.target[archer]).toBe(flyer);
  });

  it('invalid_flying_target_retargets_before_periodic_tick', () => {
    const w = world([structure(4)]);
    const f = unit(w, TEAM_FOE, S4.x, S4.y + 58, { range: 4 });
    const a = unit(w, TEAM_ALLY, S4.x + 200, S4.y + 200);
    retarget(w);
    expect(w.target[f]).toBe(a);
    w.flying[a] = 1; // it takes off: our melee foe can no longer hit it
    w.tick = 1;
    retarget(w);
    expect(w.target[f]).toBe(1);
  });

  it('new_ally_replaces_structure_by_next_retarget', () => {
    const w = world([structure(4)]);
    const f = unit(w, TEAM_FOE, S4.x, S4.y + 58);
    retarget(w);
    expect(w.target[f]).toBe(1);
    const a = unit(w, TEAM_ALLY, S4.x + 200, S4.y + 200);
    w.tick = 1;
    retarget(w);
    expect(w.target[f]).toBe(1);
    w.tick = BATTLE.retargetTicks;
    retarget(w);
    expect(w.target[f]).toBe(a);
  });

  it('taunt_beats_units_and_in_the_rage_the_taunting_wall_is_still_a_structure_to_break', () => {
    const W6 = structureFoot(6);
    const w = world([structure(6, { taunt: 40 })]);
    unit(w, TEAM_ALLY, W6.x + 200, W6.y);
    const foe = unit(w, TEAM_FOE, W6.x + 30, W6.y);
    retarget(w);
    expect(w.target[foe]).toBe(1);
    w.tick = BATTLE.rageTick;
    retarget(w);
    expect(w.target[foe]).toBe(1);
  });

  it('dead_throne_with_no_targets_returns_minus_one', () => {
    const w = world();
    const f = unit(w, TEAM_FOE, 20, 380);
    w.alive[w.throneId] = 0;
    retarget(w);
    expect(w.target[f]).toBe(-1);
  });

  it('allowsFoeStructureTarget: only in the rage, under a taunt, or with no unit of ours it can hit', () => {
    const W6 = structureFoot(6);
    const w = world([structure(6, { taunt: 40 })]);
    const f = unit(w, TEAM_FOE, W6.x + 200, W6.y, { range: 4 });
    expect(allowsFoeStructureTarget(w, f)).toBe(true); // no unit of ours
    const a = unit(w, TEAM_ALLY, W6.x + 260, W6.y);
    expect(nearestHittableAllyUnit(w, f)).toBe(a);
    expect(allowsFoeStructureTarget(w, f)).toBe(false);
    w.flying[a] = 1;
    expect(allowsFoeStructureTarget(w, f)).toBe(true); // it cannot hit the flyer
    w.flying[a] = 0;
    w.x[f] = W6.x + 30; // inside the taunt
    expect(allowsFoeStructureTarget(w, f)).toBe(true);
    w.x[f] = W6.x + 200;
    w.tick = BATTLE.rageTick;
    expect(allowsFoeStructureTarget(w, f)).toBe(true);
  });
});

describe('retarget cadence', () => {
  it('only re-picks every retargetTicks ticks unless the target died', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 50, 50);
    const f1 = unit(w, TEAM_FOE, 80, 50);
    w.tick = 0;
    retarget(w);
    expect(w.target[a]).toBe(f1);

    const f2 = unit(w, TEAM_FOE, 60, 50); // nearer, appears later
    w.tick = 1;
    retarget(w);
    expect(w.target[a]).toBe(f1);
    w.tick = BATTLE.retargetTicks - 1;
    retarget(w);
    expect(w.target[a]).toBe(f1);

    w.tick = BATTLE.retargetTicks;
    retarget(w);
    expect(w.target[a]).toBe(f2);

    w.tick = BATTLE.retargetTicks + 1;
    w.alive[f2] = 0;
    retarget(w);
    expect(w.target[a]).toBe(f1);
  });

  it('skips dead units', () => {
    const w = world();
    const a = unit(w, TEAM_ALLY, 50, 50);
    unit(w, TEAM_FOE, 80, 50);
    w.alive[a] = 0;
    retarget(w);
    expect(w.target[a]).toBe(-1);
  });
});

describe('pickShotTarget', () => {
  it('closestToThrone tower picks the in-range foe nearest the throne', () => {
    const w = world([tower()]);
    const nearTower = unit(w, TEAM_FOE, TW.x, TW.y - 28); // tower 28, throne 156
    const nearThrone = unit(w, TEAM_FOE, TW.x, TW.y + 60); // tower 60 (edge 44), throne 68
    expect(nearTower).toBeLessThan(nearThrone);
    expect(pickShotTarget(w, 1)).toBe(nearThrone);
  });

  it('nearest throne picks the in-range foe nearest itself, ignoring allies', () => {
    const w = world();
    unit(w, TEAM_ALLY, T.x, T.y - 12);
    unit(w, TEAM_FOE, T.x, T.y + 58); // 58
    const d = unit(w, TEAM_FOE, T.x, T.y - 52); // 52
    unit(w, TEAM_FOE, T.x, T.y + 108); // edge 90 > 72
    expect(pickShotTarget(w, w.throneId)).toBe(d);
  });

  it('breaks ties by the smaller id', () => {
    const w = world();
    const first = unit(w, TEAM_FOE, T.x - 42, T.y);
    unit(w, TEAM_FOE, T.x + 42, T.y);
    expect(pickShotTarget(w, w.throneId)).toBe(first);

    const w2 = world([tower()]);
    const t1 = unit(w2, TEAM_FOE, TW.x - 20, TW.y + 32); // throne: (−20, −96)
    unit(w2, TEAM_FOE, TW.x + 20, TW.y + 32); // throne: (20, −96)
    expect(pickShotTarget(w2, 1)).toBe(t1);
  });

  it('lowestHp / highestHp pick by hp, ties by id', () => {
    const w = world([tower({ targeting: 'lowestHp' })]);
    const a = unit(w, TEAM_FOE, TW.x, TW.y - 28);
    const b = unit(w, TEAM_FOE, TW.x + 8, TW.y - 28);
    const c = unit(w, TEAM_FOE, TW.x - 8, TW.y - 28);
    w.hp[a] = 30;
    w.hp[b] = 10;
    w.hp[c] = 10;
    expect(pickShotTarget(w, 1)).toBe(b);
    w.targeting[1] = 3;
    w.hp[c] = 30;
    expect(pickShotTarget(w, 1)).toBe(a);
  });

  it('returns −1 with no foe in range, for dead shooters and for structures without attack', () => {
    const w = world([tower(), structure(22)]);
    unit(w, TEAM_FOE, 20, 20);
    expect(pickShotTarget(w, 1)).toBe(-1);
    expect(pickShotTarget(w, w.throneId)).toBe(-1);

    // ids by plot: structure(1) → id 1 (attack null), tower (plot 2) → id 2
    const w2 = world([tower(), structure(1)]);
    const f = unit(w2, TEAM_FOE, structureFoot(1).x + 5, structureFoot(1).y); // tower 59 (edge 43)
    expect(pickShotTarget(w2, 2)).toBe(f);
    expect(pickShotTarget(w2, 1)).toBe(-1);
    w2.alive[2] = 0;
    expect(pickShotTarget(w2, 2)).toBe(-1);
  });

  it('ignores dead foes', () => {
    const w = world();
    const d = unit(w, TEAM_FOE, T.x, T.y - 52);
    const e = unit(w, TEAM_FOE, T.x, T.y + 58);
    w.alive[d] = 0;
    expect(pickShotTarget(w, w.throneId)).toBe(e);
  });
});

describe('retarget — taunt (spec §8.4)', () => {
  /** Wall at plot 6 taunting within 40 px; a foe `dx` east of it, a unit of ours next to the foe. */
  const W6 = structureFoot(6);
  const scene = (dx: number, over: Partial<StructureSetup> = {}) => {
    const w = world([structure(6, { taunt: 40, ...over })]);
    const friend = unit(w, TEAM_ALLY, W6.x + dx + 10, W6.y);
    const foe = unit(w, TEAM_FOE, W6.x + dx, W6.y);
    return { w, friend, foe, wall: 1 };
  };

  it('a foe within the taunt radius must go for the wall even if one of our units is nearer', () => {
    const { w, foe, wall } = scene(30);
    retarget(w);
    expect(w.target[foe]).toBe(wall);
  });

  it('a foe outside the radius ignores the taunt', () => {
    const { w, friend, foe, wall } = scene(70);
    retarget(w);
    expect(w.target[foe]).toBe(friend);
    expect(w.target[foe]).not.toBe(wall);
  });

  it('picks the nearest of two taunting structures, the lower id on a tie', () => {
    // plots 6 and 8 are two cells apart; both taunt that far, so a foe between them is in both
    const reach = 2 * BATTLE.plot;
    const w = world([structure(6, { uid: 60, taunt: reach }), structure(8, { uid: 80, taunt: reach })]);
    const foe = unit(w, TEAM_FOE, W6.x + 16, W6.y); // 16 from plot 6, 112 from plot 8
    retarget(w);
    expect(w.target[foe]).toBe(1);
    const tie = unit(w, TEAM_FOE, W6.x + BATTLE.plot, W6.y); // one cell from each
    retarget(w);
    expect(w.target[tie]).toBe(1);
  });

  it('ignores a destroyed taunting structure; in the rage it is a structure to break like any other', () => {
    const { w, friend, foe, wall } = scene(30);
    w.alive[wall] = 0;
    retarget(w);
    expect(w.target[foe]).toBe(friend);
    w.alive[wall] = 1;
    w.tick = BATTLE.rageTick;
    retarget(w);
    expect(w.target[foe]).toBe(wall);
  });

  it('does not make structures without taunt special', () => {
    const { w, friend, foe } = scene(30, { taunt: 0 });
    retarget(w);
    expect(w.target[foe]).toBe(friend);
  });
});
