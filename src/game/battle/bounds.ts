/** Biên thế giới của trận: tường núi phía bắc và biên nam đủ chứa mọi hàng xuất quân. */
import { BATTLE } from '../../data/battle';
import { edgePositions } from './spawnLayout';
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
    for (const p of edgePositions('S', perEdge.S)) maxY = Math.max(maxY, p.y);
  }
  return maxY;
};
