import { describe, expect, it } from 'vitest';
import { TEAM_ALLY, TEAM_FOE, addUnit, createBattle, drainEvents } from './world';
import { hashWorld } from './hash';
import { stepBattle } from './step';
import { battleSetup, throneSetup, unitStats } from '../testing/fixtures';

/** G5 Task 6: hit events carry who struck and the damage type, for sounds only (never the simulation). */
const duel = () => {
  const w = createBattle(battleSetup({ throne: throneSetup({ attack: null, hp: 9999 }) }));
  const archer = addUnit(
    w,
    unitStats({
      hp: 500,
      dmg: 7,
      dmgType: 'magic',
      range: 200,
      projectileSpeed: 0,
      interval: 5,
      speed: 0,
    }),
    TEAM_ALLY,
    300,
    400,
    300,
    400,
    -1,
  );
  const dummy = addUnit(
    w,
    unitStats({ hp: 500, dmg: 0, interval: 0, speed: 0 }),
    TEAM_FOE,
    360,
    400,
    360,
    400,
    -1,
  );
  return { w, archer, dummy };
};

describe('presentation data on battle events', () => {
  it('a hit names its source and damage type', () => {
    const { w, archer, dummy } = duel();
    let hits: { id: number; sourceId?: number; dmgType?: string }[] = [];
    for (let t = 0; t < 30 && hits.length === 0; t++) {
      stepBattle(w, []);
      hits = drainEvents(w).filter((e) => e.type === 'hit') as typeof hits;
    }
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]).toMatchObject({ id: dummy, sourceId: archer, dmgType: 'magic' });
  });

  it('draining events or not never changes the per-tick hash', () => {
    const a = duel().w;
    const b = duel().w;
    for (let t = 0; t < 60; t++) {
      stepBattle(a, []);
      stepBattle(b, []);
      drainEvents(a);
      expect(hashWorld(a)).toBe(hashWorld(b));
    }
  });
});
