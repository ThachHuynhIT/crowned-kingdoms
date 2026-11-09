import { describe, expect, it } from 'vitest';
import { BATTLE, INTERVENTION } from './battle';
import { BOARD_ORIGIN, BOARD_SIDE, BUILDING_FOOT_OFFSET, DEPLOY_BOX, FIELD, PLOT, WALL_Y, cells } from './boardGeometry';
import { DECREE_RULES } from './decrees';
import { PULSE_RADIUS_BONUS, TOWER_RANGE } from './scaling';

describe('board geometry (64 px plots, spec 06/11/2026)', () => {
  it('doubles the plot and the field and keeps the board centred', () => {
    expect([PLOT, FIELD, BOARD_ORIGIN, WALL_Y]).toEqual([64, 768, 224, 176]);
    expect(BOARD_ORIGIN + (BOARD_SIDE * PLOT) / 2).toBe(FIELD / 2);
    expect([BATTLE.plot, BATTLE.field, BATTLE.boardOrigin, BATTLE.wallY]).toEqual([PLOT, FIELD, BOARD_ORIGIN, WALL_Y]);
    expect(cells(1.5)).toBe(96);
  });

  it('keeps spawn rows and the spatial grid at the same reach in plots', () => {
    expect([BATTLE.fieldClampMargin, BATTLE.spawnOutside, BATTLE.spawnSpacing, BATTLE.spawnRowGap]).toEqual([64, 24, 20, 20]);
    expect(BATTLE.edgeSpan).toBe(0.6);
    expect(Math.floor((BATTLE.edgeSpan * BATTLE.field) / BATTLE.spawnSpacing) + 1).toBe(24);
    expect(BATTLE.spatialCell).toBe(PLOT);
  });

  it('doubles every per-tick displacement cap, keeps bodies and the anti-air threshold', () => {
    expect([BATTLE.separationPushMax, BATTLE.separationPushCross]).toEqual([2, 0.4]);
    expect([BATTLE.structureRadius, BATTLE.throneRadius]).toEqual([12, 14]);
    expect(BATTLE.flyingHitMinRange).toBe(24);
    expect(BATTLE.tauntRadiusDefault).toBe(cells(1.25));
    expect([INTERVENTION.radius, INTERVENTION.knockback]).toEqual([48, 24]);
    expect([BATTLE.rageTick, BATTLE.hardLimitTick, BATTLE.rageSpeedPct]).toEqual([600, 900, 50]);
  });

  it('raises tower range by level by 50% and keeps the pulse bonus in plots', () => {
    expect([...TOWER_RANGE]).toEqual([0, 6, 12, 18, 24]);
    expect([...PULSE_RADIUS_BONUS]).toEqual([0, 8, 16, 24, 32]);
    expect(DECREE_RULES.archersRange).toBe(18);
    expect(DECREE_RULES.boulderRadius).toBe(16);
  });

  it('keeps the building body (32 px) clear of the deploy strip in front of its door (south), both inside the plot', () => {
    const half = PLOT / 2;
    const [north, south] = [BUILDING_FOOT_OFFSET.y - 16, BUILDING_FOOT_OFFSET.y + 16];
    expect(north).toBeGreaterThanOrEqual(-half);
    expect(south).toBeLessThan(DEPLOY_BOX.y0);
    expect(DEPLOY_BOX.y1).toBeLessThanOrEqual(half);
    expect([DEPLOY_BOX.x0, DEPLOY_BOX.x1].every((x) => Math.abs(x) <= half)).toBe(true);
  });
});
