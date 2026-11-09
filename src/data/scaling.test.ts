import { describe, expect, it } from 'vitest';
import {
  STRUCT_HP,
  STRUCT_STD,
  THRONE_STD,
  PULSE_RADIUS_BONUS,
  TOWER_RANGE,
  TOWER_RANGE_MULT,
  TOWER_STD,
  TROOP_STD,
  levelMult,
  towerRange,
} from './scaling';

describe('level scaling profiles (spec §5.2)', () => {
  it('has the standard tables, one value per level', () => {
    expect([...TROOP_STD]).toEqual([1, 1.25, 1.5, 1.75, 2]);
    expect([...TOWER_STD]).toEqual([1, 1.35, 1.7, 2.05, 2.4]);
    expect([...STRUCT_STD]).toEqual([1, 1.25, 1.5, 1.75, 2]);
    expect([...THRONE_STD]).toEqual([1, 1.25, 1.5, 1.75, 2]);
    expect([...TOWER_RANGE]).toEqual([0, 6, 12, 18, 24]); // +50% (spec 06/11/2026)
    expect([...PULSE_RADIUS_BONUS]).toEqual([0, 8, 16, 24, 32]);
  });

  it('levelMult picks the value of the level', () => {
    expect(levelMult(TROOP_STD, 1)).toBe(1);
    expect(levelMult(TROOP_STD, 3)).toBe(1.5);
    expect(levelMult(TOWER_STD, 5)).toBe(2.4);
    expect(TOWER_RANGE[4]).toBe(24);
  });

  it('keeps the default structure HP per kind', () => {
    expect(STRUCT_HP).toEqual({ troop: 150, tower: 220, economy: 120, support: 160 });
  });
});

describe('towerRange (x3, owner 2026-11-09)', () => {
  const bow = { dmg: 8, type: 'physical' as const, range: 108, interval: 10, projectileSpeed: 16 };
  it('triples the base range plus the level bonus', () => {
    expect(towerRange(bow, 1)).toBe(108 * TOWER_RANGE_MULT);
    expect(towerRange(bow, 5)).toBe((108 + TOWER_RANGE[4]!) * TOWER_RANGE_MULT);
    expect(TOWER_RANGE_MULT).toBe(3);
  });
  it('keeps the old range for a tower that pushes units back', () => {
    const cannon = { ...bow, onHit: [{ type: 'knockback' as const, px: 32 }] };
    expect(towerRange(cannon, 3)).toBe(108 + TOWER_RANGE[2]!);
  });
  it('keeps the old range for a fire cone', () => {
    expect(towerRange({ ...bow, range: 60, cone: { range: 60, halfAngleCos: 0.9 } }, 1)).toBe(60);
  });
});
