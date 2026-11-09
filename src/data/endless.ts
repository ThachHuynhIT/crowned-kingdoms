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
  795, 914, 1051, 1209, 1390, 1599, 1839, 2115, 2432, 2797, 3217, 3700, 4255, 4893, 5627, 6471,
  7442, 8558, 9842, 11_318, 13_016, 14_968, 17_213, 19_795, 22_764, 26_179, 30_106, 34_622, 39_815,
  45_787, 52_655, 60_553, 69_636, 80_081, 92_093, 105_907, 121_793, 140_062, 161_071, 185_232,
  213_017, 244_970, 281_716, 323_973, 372_569, 428_454, 492_722, 566_630, 651_625, 749_369, 861_774,
  991_040, 1_000_000,
];
/** Trần ngân sách gốc và trần ngân sách cuối (sau slot, Gai và biến thể). */
export const ENDLESS_BASE_BUDGET_CAP = 1_000_000;
export const ENDLESS_FINAL_BUDGET_CAP = 3_000_000;

/**
 * Hệ số boss (basis points, 10000 = ×1) theo chu kỳ `floor((year − 1) / 30)`: mỗi chu kỳ ×1,25 làm
 * tròn, trần 100000 (×10). Tra bão hoà ở phần tử cuối.
 */
export const ENDLESS_BOSS_SCALE_BP: readonly number[] = [
  10_000, 12_500, 15_625, 19_531, 24_414, 30_518, 38_148, 47_685, 59_606, 74_508, 93_135, 100_000,
];
export const ENDLESS_BOSS_SCALE_CAP_BP = 100_000;

/** Độ dài mẫu lịch Vô tận (lặp `FULL_CALENDAR`). */
export const ENDLESS_CALENDAR_PERIOD = 30;
/** Hội đồng Vô tận: mọi bội số của 5 (5..25 như thường, rồi 30, 35, …). */
export const ENDLESS_COUNCIL_EVERY = 5;

/** Loại hiệu ứng của một phúc lành; `amount` là giá trị MỖI stack (spec §5). */
export type EndlessBlessingEffect =
  | 'taxFlat' // +vàng thuế đầu năm
  | 'battleGoldFlat' // +vàng thưởng thắng trận, sau hệ số vàng boss
  | 'unitHpPct'
  | 'unitDmgPct'
  | 'unitSpeedPct'
  | 'towerDmgPct'
  | 'towerAttackSpeedPct'
  | 'structureHpPct' // mọi công trình, gồm Ngai
  | 'maxLives' // +1 trần mạng và hồi ngay 1 mạng
  | 'interestPct' // % lãi trên số dư sau phí duy trì, tối đa `interestCapPerStack` mỗi stack
  | 'freeRerolls' // +lần đổi bài miễn phí mỗi đầu năm
  | 'plotDiscountPct'; // −% giá mua ô

export interface EndlessBlessingDef {
  readonly id: EndlessBlessingId;
  readonly name: string;
  readonly effect: EndlessBlessingEffect;
  readonly amount: number;
  readonly maxStacks: number;
}

/** Bảng phúc lành (spec §5), cùng thứ tự với `ENDLESS_BLESSING_IDS`. */
export const ENDLESS_BLESSINGS: readonly EndlessBlessingDef[] = [
  { id: 'harvest', name: 'Mùa màng', effect: 'taxFlat', amount: 2, maxStacks: 10 },
  { id: 'treasury', name: 'Kho bạc', effect: 'battleGoldFlat', amount: 2, maxStacks: 10 },
  { id: 'vigor', name: 'Sinh lực', effect: 'unitHpPct', amount: 10, maxStacks: 20 },
  { id: 'might', name: 'Sức mạnh', effect: 'unitDmgPct', amount: 10, maxStacks: 20 },
  { id: 'haste', name: 'Nhanh nhẹn', effect: 'unitSpeedPct', amount: 5, maxStacks: 10 },
  { id: 'tower_might', name: 'Hoả lực', effect: 'towerDmgPct', amount: 10, maxStacks: 20 },
  { id: 'tower_haste', name: 'Nhịp tháp', effect: 'towerAttackSpeedPct', amount: 5, maxStacks: 10 },
  { id: 'masonry', name: 'Thành vững', effect: 'structureHpPct', amount: 10, maxStacks: 20 },
  { id: 'vitality', name: 'Phúc thọ', effect: 'maxLives', amount: 1, maxStacks: 2 },
  { id: 'interest', name: 'Sinh lời', effect: 'interestPct', amount: 2, maxStacks: 5 },
  { id: 'reroll', name: 'Cơ hội', effect: 'freeRerolls', amount: 1, maxStacks: 3 },
  { id: 'survey', name: 'Khẩn đất', effect: 'plotDiscountPct', amount: 10, maxStacks: 5 },
];

/** Số phúc lành mỗi lần chọn, năm đầu có phúc lành và chu kỳ (30, 35, 40, …). */
export const ENDLESS_BLESSING_PICKS = 3;
export const ENDLESS_BLESSING_FIRST_YEAR = 30;
export const ENDLESS_BLESSING_EVERY = 5;
/** Chọn phúc lành đã đủ stack: nhận vàng thay vì stack. */
export const ENDLESS_MAXED_BLESSING_GOLD = 25;
/** Lãi tối đa mỗi stack mỗi năm (vàng). */
export const ENDLESS_INTEREST_CAP_PER_STACK = 10;
/** Trần mạng tuyệt đối của Vô tận (RUN.maxLives + vitality). */
export const ENDLESS_LIVES_CAP = 6;
/** Giá ô vòng ngoài trước giảm: `base + step × purchasedPlots`. */
export const ENDLESS_OUTER_PLOT_PRICE = { base: 20, step: 2 } as const;

/** Một biến thể thập niên (spec §6); mọi giá trị là %, áp một lần khi dựng trận / đầu năm. */
export interface EndlessModifierDef {
  readonly id: EndlessModifierId;
  readonly name: string;
  /** Địch (gồm boss, summon, mirror): +% HP, +% sát thương. */
  readonly foeHpPct: number;
  readonly foeDmgPct: number;
  /** Lính và tháp của mình: +% sát thương. */
  readonly allyDmgPct: number;
  /** Thuế đầu năm cộng thêm (âm = giảm, thuế không dưới 0). */
  readonly taxFlat: number;
  /** Vàng thưởng thắng trận cộng thêm, sau hệ số vàng boss. */
  readonly battleGoldFlat: number;
  /** Hệ số ngân sách EP (%, 100 = giữ nguyên), áp trước trần cuối. */
  readonly budgetPct: number;
  /** Công trình mình (gồm Ngai): +% HP. */
  readonly structureHpPct: number;
}

/** Bốn biến thể theo thứ tự id cố định (spec §6). */
export const ENDLESS_MODIFIERS: readonly EndlessModifierDef[] = [
  {
    id: 'elite',
    name: 'Tinh nhuệ',
    foeHpPct: 25,
    foeDmgPct: 10,
    allyDmgPct: 0,
    taxFlat: 0,
    battleGoldFlat: 0,
    budgetPct: 100,
    structureHpPct: 0,
  },
  {
    id: 'double_edge',
    name: 'Hai lưỡi',
    foeHpPct: 0,
    foeDmgPct: 25,
    allyDmgPct: 25,
    taxFlat: 0,
    battleGoldFlat: 0,
    budgetPct: 100,
    structureHpPct: 0,
  },
  {
    id: 'famine',
    name: 'Khó mùa',
    foeHpPct: 0,
    foeDmgPct: 0,
    allyDmgPct: 0,
    taxFlat: -2,
    battleGoldFlat: 3,
    budgetPct: 100,
    structureHpPct: 0,
  },
  {
    id: 'siege',
    name: 'Công thành',
    foeHpPct: 0,
    foeDmgPct: 0,
    allyDmgPct: 0,
    taxFlat: 0,
    battleGoldFlat: 0,
    budgetPct: 120,
    structureHpPct: 20,
  },
];
/** Năm đầu có biến thể và độ dài một thập niên. */
export const ENDLESS_MODIFIER_FIRST_YEAR = 31;
export const ENDLESS_MODIFIER_SPAN = 10;

/** Điểm Vương Miện của Vô tận (spec §8): năm và boss tính điểm có trần; số liệu thật không bị cắt. */
export const ENDLESS_SCORED_YEARS_CAP = 60;
export const ENDLESS_SCORED_BOSSES_CAP = 3;
/** Thông báo khi một ván thắng 30 năm mở Vô tận. */
export const ENDLESS_UNLOCK_TEXT = 'Đã mở chế độ Vô tận';

/** Version of the Endless definitions above (blessings, modifiers, tables): bump it when any of them changes meaning. */
export const ENDLESS_DATA_VERSION = 1;
