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

/**
 * Ngân sách gốc EP từ năm 31 (spec §3): `B[y] = min(1_000_000, floor((B[y−1] × 115 + 50) / 100))`
 * bắt đầu từ `ENEMY_BUDGET[29] = 691`; phần tử đầu là năm 31. Lưu sẵn, dừng ở phần tử đầu đạt trần;
 * năm xa hơn tra phần tử cuối (không Math.pow, không vòng lặp theo năm).
 */
export const ENDLESS_BASE_BUDGET: readonly number[] = [
  795, 914, 1051, 1209, 1390, 1599, 1839, 2115,
  2432, 2797, 3217, 3700, 4255, 4893, 5627, 6471,
  7442, 8558, 9842, 11_318, 13_016, 14_968, 17_213, 19_795,
  22_764, 26_179, 30_106, 34_622, 39_815, 45_787, 52_655, 60_553,
  69_636, 80_081, 92_093, 105_907, 121_793, 140_062, 161_071, 185_232,
  213_017, 244_970, 281_716, 323_973, 372_569, 428_454, 492_722, 566_630,
  651_625, 749_369, 861_774, 991_040, 1_000_000,
];
/** Trần ngân sách gốc và trần ngân sách cuối (sau slot, Gai và biến thể). */
export const ENDLESS_BASE_BUDGET_CAP = 1_000_000;
export const ENDLESS_FINAL_BUDGET_CAP = 3_000_000;

/**
 * Hệ số boss (basis points, 10000 = ×1) theo chu kỳ `floor((year − 1) / 30)`: mỗi chu kỳ ×1,25 làm
 * tròn, trần 100000 (×10). Tra bão hoà ở phần tử cuối.
 */
export const ENDLESS_BOSS_SCALE_BP: readonly number[] = [
  10_000, 12_500, 15_625, 19_531, 24_414, 30_518, 38_148, 47_685,
  59_606, 74_508, 93_135, 100_000,
];
export const ENDLESS_BOSS_SCALE_CAP_BP = 100_000;

/** Độ dài mẫu lịch Vô tận (lặp `FULL_CALENDAR`). */
export const ENDLESS_CALENDAR_PERIOD = 30;
/** Hội đồng Vô tận: mọi bội số của 5 (5..25 như thường, rồi 30, 35, …). */
export const ENDLESS_COUNCIL_EVERY = 5;
