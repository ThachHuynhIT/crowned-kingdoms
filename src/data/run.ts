import type { CardId } from './types';

/** Hằng số ván (spec §3.1); giá trị tinh chỉnh ban đầu. */
export const RUN = {
  startLives: 2,
  maxLives: 4, // chỉ vượt 3 nhờ sắc lệnh/perk
  startGold: 5,
  taxPerYear: 3, // thu nhập cố định đầu mỗi năm
  handSize: 5, // số lá năm 1; cũng là số lá tối thiểu Thanh Lọc phải giữ lại
  yearDraw: 1, // từ năm 2 mỗi năm rút thêm chừng này lá, giữ bài cũ (chủ dự án 10/11/2026)
  bonusYearDraw: 2, // năm hội đồng và năm ngay sau trận boss rút chừng này lá
  battleHandMax: 2, // chơi/bán tới khi tay còn đúng chừng này lá thì trận tự bắt đầu
  merchantYears: [6, 12, 18, 24], // Thương nhân ghé sau trận (10/11/2026); Vô tận sau năm 30: mỗi `merchantEvery` năm
  merchantEvery: 6,
  merchantPrice: 3, // giá mỗi thẻ của thương nhân, mua tối đa 1
  shopBaseGold: 5, // Mua thẻ: giá lần đầu trong năm (10/11/2026)
  shopStepGold: 3, // mỗi lần mua thêm trong năm đắt thêm chừng này (đề xuất, chủ dự án duyệt sau)
  skipPlayGold: 2, // bán/bỏ một thẻ thay cho việc chơi thẻ
  skipRewardGold: 3, // bỏ qua thẻ thưởng
  conquestGold: 5,
  maxLevel: 5,
  maxEnchantStacks: 4,
  councilYears: [5, 10, 15, 20, 25], // năm có hội đồng (§3.1)
  questYears: [3, 7, 12, 17, 22, 27], // năm có thể đề nghị nhiệm vụ
  bossYears: [10, 20, 30],
  maxActiveQuests: 2,
  bossGoldMult: 2, // vàng thắng trận boss nhân đôi
  difficultyLevels: 5, // Gai 0–5
  difficultyBudgetStep: 0.1, // ngân sách/HP boss × (1 + step × gai)
  difficultyCrownStep: 0.2, // Điểm Vương Miện × (1 + step × gai)
} as const;

/** Vàng khi thắng trận năm y (trước nhân boss). */
export const battleGold = (year: number): number => 2 + Math.ceil(year / 3);
/** Giá lần đổi bài thứ n (n = 1, 2, …) trong cùng một năm: 1, 2, 4, 8, … (không dùng `**`). */
export const rerollCost = (n: number): number => {
  let cost = 1;
  for (let i = 1; i < n; i++) cost *= 2;
  return cost;
};
/** Giá mở ô thứ k+1 bằng vàng (k = số ô đã MUA bằng vàng trước đó): 4, 6, 8, … 34. */
export const unlockCost = (k: number): number => 4 + 2 * k;

/** Bộ bài khởi đầu cố định G1 (11 bản). */
export const START_DECK_G1: readonly CardId[] = [
  'wheat_militia',
  'wheat_militia',
  'wheat_scarecrow',
  'wheat_scarecrow',
  'wheat_reapers',
  'neutral_barracks',
  'neutral_barracks',
  'neutral_archer_tower',
  'neutral_archer_tower',
  'neutral_clear_land',
  'neutral_move',
];

export const REWARD = { choices: 3, kingShare: 0.65 } as const;

/** Trọng số độ hiếm (thường, vừa, hiếm) theo năm (§3.8); mỗi bộ cộng 100. */
export function rewardRarityWeights(year: number): readonly [number, number, number] {
  if (year < 10) return [60, 30, 10];
  if (year < 20) return [45, 35, 20];
  return [30, 40, 30];
}
