/** Biên thế giới của trận: tường núi phía bắc và biên nam đủ chứa mọi hàng xuất quân. */
import { BATTLE } from '../../data/battle';
import type { RunMode } from '../../data/rules';
import { geometryFor } from '../run/boardGeometry';
import { portalPositions, rowCapacity } from './spawnLayout';
import type { BattleSetup } from './types';

/** Đơn vị bán kính `radius` không bao giờ vượt lên bắc đường chân tường của bàn `mode` (thường 176, Vô tận 112). */
export const clampNorthY = (y: number, radius: number, mode: RunMode = 'normal'): number =>
  Math.max(geometryFor(mode).wallY + radius, y);

/** Biên nam: ít nhất field + fieldClampMargin; lớn hơn nếu một ô cổng (quân xuất từ mép nam) nằm xa hơn. */
export const spawnMaxY = (setup: BattleSetup): number => {
  let maxY = BATTLE.field + BATTLE.fieldClampMargin;
  const waves = setup.waves;
  for (const wave of waves) {
    const perEdge = { N: 0, E: 0, S: 0, W: 0 };
    for (const s of wave.spawns) perEdge[s.edge] += 1;
    for (const p of portalPositions(perEdge.S)) maxY = Math.max(maxY, p.y);
  }
  return maxY;
};

/**
 * Số hàng dàn quân của một đợt `count` lính: hàng tự nhiên + (số nhóm − 1), nhóm = 1 (hoặc 2 từ năm
 * `formationDualYear`) + số cờ extraEdge, tối đa `formationMaxRows`; không quá số lính, 0 khi không có lính.
 */
export const formationRowsFor = (year: number, extraEdges: number, count: number): number => {
  if (count <= 0) return 0;
  const base = year >= BATTLE.formationDualYear ? BATTLE.formationLateRows : BATTLE.formationBaseRows;
  const groups = Math.min(BATTLE.formationMaxRows, base + extraEdges);
  const natural = Math.ceil(count / rowCapacity());
  return Math.min(count, natural + groups - 1);
};
