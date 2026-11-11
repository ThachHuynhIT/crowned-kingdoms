import type { CardId, KingId } from './types';

/** Phiên bản hồ sơ meta (spec §9.2). */
export const META_SAVE_VERSION = 2;

/** Ba vua mở sẵn. */
export const STARTING_KINGS: readonly KingId[] = ['arcane', 'stone', 'wheat'];

/** Giá mở vua bằng Điểm Vương Miện (spec §9.1); `needsWin`: cần ít nhất một ván thắng. */
export const KING_UNLOCK: Record<KingId, { cost: number; needsWin?: boolean }> = {
  wheat: { cost: 0 },
  stone: { cost: 0 },
  arcane: { cost: 0 },
  grove: { cost: 25 },
  tide: { cost: 25 },
  forge: { cost: 40 },
  clock: { cost: 40 },
  moon: { cost: 60 },
  nomad: { cost: 80, needsWin: true },
};

/** Perk 1/2/3 mở khi thông thạo vua đạt mốc này. */
export const PERK_MASTERY = [10, 30, 60] as const;

/** Giá mở thẻ meta. */
export const CARD_UNLOCK: Partial<Record<CardId, number>> = {
  neutral_duplicate: 15,
  neutral_royal_seal: 20,
};

/** Số khoá ván đã chấm điểm được nhớ (chống cộng điểm hai lần). */
export const SETTLED_RUNS_KEPT = 20;

/** Âm lượng mặc định (G5 dùng). */
export const DEFAULT_VOLUME = 100;
