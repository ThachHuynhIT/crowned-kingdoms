import { DEFAULT_VOLUME, META_SAVE_VERSION, STARTING_KINGS } from '../../data/meta';
import { ALL_KINGS } from '../../data/rules';
import type { CardId, KingId } from '../../data/types';

export interface MetaProfile {
  version: number;
  /** Số dư Điểm Vương Miện. */
  crownPoints: number;
  /** Thông thạo từng vua; không bao giờ giảm. */
  mastery: Record<KingId, number>;
  /** Sắp theo id; gồm ba vua mở sẵn. */
  unlockedKings: KingId[];
  /** Sắp theo id. */
  unlockedCards: CardId[];
  wins: Record<KingId, number>;
  /** -1 = chưa thắng ván nào. */
  highestDifficultyWon: number;
  settings: { master: number; music: number; sfx: number };
  /** Khoá các ván đã chấm điểm, tối đa 20 mục gần nhất. */
  settledRuns: string[];
}

export const perKing = (value: number): Record<KingId, number> => {
  const out = {} as Record<KingId, number>;
  for (const k of ALL_KINGS) out[k] = value;
  return out;
};

export const defaultProfile = (): MetaProfile => ({
  version: META_SAVE_VERSION,
  crownPoints: 0,
  mastery: perKing(0),
  unlockedKings: [...STARTING_KINGS].sort(),
  unlockedCards: [],
  wins: perKing(0),
  highestDifficultyWon: -1,
  settings: { master: DEFAULT_VOLUME, music: DEFAULT_VOLUME, sfx: DEFAULT_VOLUME },
  settledRuns: [],
});
