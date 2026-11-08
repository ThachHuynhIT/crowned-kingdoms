/**
 * Dữ liệu chế độ Vô tận (spec 2026-11-09-endless-mode-design.md). Chỉ giá trị và kiểu; luật nằm ở
 * `src/game/run/endless*.ts`.
 */

/** Mười hai phúc lành vĩnh viễn (spec §5), theo thứ tự cố định của pool. */
export const ENDLESS_BLESSING_IDS = [
  'harvest',
  'treasury',
  'vigor',
  'might',
  'haste',
  'tower_might',
  'tower_haste',
  'masonry',
  'vitality',
  'interest',
  'reroll',
  'survey',
] as const;
export type EndlessBlessingId = (typeof ENDLESS_BLESSING_IDS)[number];

/** Bốn biến thể thập niên (spec §6), theo thứ tự id cố định. */
export const ENDLESS_MODIFIER_IDS = ['elite', 'double_edge', 'famine', 'siege'] as const;
export type EndlessModifierId = (typeof ENDLESS_MODIFIER_IDS)[number];
