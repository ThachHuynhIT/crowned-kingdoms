import { describe, expect, it } from 'vitest';
import { BATTLE, ENEMY_PORTAL, INTERVENTION } from './battle';
import {
  BOARD_ORIGIN,
  BOARD_SIDE,
  BUILDING_FOOT_OFFSET,
  DEPLOY_BOX,
  ENDLESS_GEOMETRY,
  FIELD,
  NORMAL_GEOMETRY,
  PLOT,
  PORTAL,
  PORTAL_DISTANCE_MULT,
  WALL_Y,
  cells,
} from './boardGeometry';
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
    expect([BATTLE.structureRadius, BATTLE.throneRadius]).toEqual([18, 18]); // square footprints, 2026-11-09
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

describe('enemy portal 1.5x farther (owner 2026-11-09)', () => {
  it('stands 1.5x its old distance (248 px) south of the board, the same point in every mode and in the battle data', () => {
    expect(PORTAL_DISTANCE_MULT).toBe(1.5);
    expect(PORTAL.y - NORMAL_GEOMETRY.boardMax).toBe(248 * 1.5);
    expect(PORTAL).toEqual({ x: FIELD / 2, y: 916 });
    expect(NORMAL_GEOMETRY.portal).toEqual(PORTAL);
    expect(ENDLESS_GEOMETRY.portal).toEqual(PORTAL);
    expect([ENEMY_PORTAL.x, ENEMY_PORTAL.y]).toEqual([PORTAL.x, PORTAL.y]);
  });
});
