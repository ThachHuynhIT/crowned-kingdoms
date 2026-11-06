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

  it('keeps aggro, spawn rows and the spatial grid at the same reach in plots', () => {
    expect([BATTLE.enemyAggro, BATTLE.siegeAggro]).toEqual([cells(1.5), cells(3)]);
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

  it('keeps the building sprite (32 wide) clear of the deploy box, both inside the plot', () => {
    const half = PLOT / 2;
    const [left, right] = [BUILDING_FOOT_OFFSET.x - 16, BUILDING_FOOT_OFFSET.x + 16];
    expect(left).toBeGreaterThanOrEqual(-half);
    expect(right).toBeLessThan(DEPLOY_BOX.x0);
    expect(DEPLOY_BOX.x1).toBeLessThanOrEqual(half);
    expect([DEPLOY_BOX.y0, DEPLOY_BOX.y1].every((y) => Math.abs(y) <= half)).toBe(true);
  });
});
