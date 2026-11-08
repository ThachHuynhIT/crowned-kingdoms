import type { EnemyKingDef, KingDef } from '../types';
import { ARCANE } from './arcane';
import { enemyFromKing } from './enemy';
import { CLOCK, CLOCK_ENEMY } from './clock';
import { FORGE, FORGE_ENEMY } from './forge';
import { GROVE, GROVE_ENEMY } from './grove';
import { MOON, MOON_ENEMY } from './moon';
import { NOMAD, NOMAD_ENEMY } from './nomad';
import { STONE } from './stone';
import { TIDE, TIDE_ENEMY } from './tide';
import { WHEAT } from './wheat';

export { enemyFromKing };
export { CLOCK_ENEMY, FORGE_ENEMY, GROVE_ENEMY, MOON_ENEMY, NOMAD_ENEMY, TIDE_ENEMY };

/** Các vua chơi được trong G1. */
export const KINGS_G1: readonly KingDef[] = [WHEAT];

/** Các vua có nội dung đầy đủ cho G2 (thêm vua mới ở đây khi nội dung của họ xong). */
export const KINGS_G2: readonly KingDef[] = [WHEAT, STONE, ARCANE];

const byId = (a: EnemyKingDef, b: EnemyKingDef): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Cả chín vua chơi được, theo thứ tự `ALL_KINGS` (id); kho nội dung dùng danh sách này. */
export const PLAYABLE_KINGS: readonly KingDef[] = [ARCANE, CLOCK, FORGE, GROVE, MOON, NOMAD, STONE, TIDE, WHEAT];

/** Cả 9 vua dưới dạng kẻ địch, sắp theo id để thứ tự bốc ngẫu nhiên ổn định. */
export const ENEMY_KINGS: readonly EnemyKingDef[] = [
  ...KINGS_G2.map(enemyFromKing),
  GROVE_ENEMY,
  TIDE_ENEMY,
  FORGE_ENEMY,
  CLOCK_ENEMY,
  MOON_ENEMY,
  NOMAD_ENEMY,
].sort(byId);
