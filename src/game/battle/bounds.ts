/** Biên thế giới của trận: tường núi phía bắc và biên nam đủ chứa mọi hàng xuất quân. */
import { BATTLE } from '../../data/battle';
import { edgePositions, rowCapacity } from './spawnLayout';
import type { BattleSetup } from './types';

/** Đơn vị bán kính `radius` không bao giờ vượt lên bắc đường chân tường (`BATTLE.wallY`). */
export const clampNorthY = (y: number, radius: number): number => Math.max(BATTLE.wallY + radius, y);

/** Biên nam: ít nhất field + fieldClampMargin; lớn hơn khi hàng xuất quân S nằm xa hơn. */
export const spawnMaxY = (setup: BattleSetup): number => {
  let maxY = BATTLE.field + BATTLE.fieldClampMargin;
  const waves = setup.waves;
  for (const wave of waves) {
    const perEdge = { N: 0, E: 0, S: 0, W: 0 };
    for (const s of wave.spawns) perEdge[s.edge] += 1;
    for (const p of edgePositions('S', perEdge.S, wave.formationRows)) maxY = Math.max(maxY, p.y);
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
