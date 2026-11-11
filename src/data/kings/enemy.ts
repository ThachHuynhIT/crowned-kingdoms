import type { EnemyKingDef, KingDef } from '../types';

/** Phần kẻ địch của một vua chơi được: thẻ chinh phục là mọi thẻ của vua (không gồm Ngai). */
export const enemyFromKing = (k: KingDef): EnemyKingDef => ({
  id: k.id,
  nameVi: k.nameVi,
  name: k.name,
  color: k.color,
  units: k.units,
  enemyRoster: k.enemyRoster,
  banner: k.banner,
  conquestCards: k.cards,
});
