/** Trạng thái ván G1 (spec §5.1) — JSON thuần, không hàm, không Map/Set. */
import type { EndlessBlessingId, EndlessModifierId } from '../../data/endless';
import type { RunMode, Rules } from '../../data/rules';
import type { BossId, CardId, DecreeId, KingId, Level, PerkId, QuestId, StatKey } from '../../data/types';
import type { ArmyPlan, BattleResult } from '../battle/types';

export const RUN_SAVE_VERSION = 10;

export interface BuildingState {
  uid: number;
  cardId: CardId;
  level: Level;
  /** Bùa đang gắn, theo thứ tự gắn lần đầu (spec §4.3). */
  enchants: { cardId: CardId; stacks: number }[];
  placedYear: number;
  /** % vĩnh viễn từ sách phép (Khắc Ấn Núi…). */
  permanent: Partial<Record<StatKey, number>>;
  /** Tuổi cộng thêm (thẻ Rừng Xanh…); cộng vào số năm kể từ `placedYear`. */
  ageBonus: number;
  /** Bộ đếm theo từng công trình do các thẻ G3 ghi (id tự do, số nguyên). */
  counters: Record<string, number>;
  /** Năm công trình được dời gần nhất; `null` nếu chưa dời. */
  movedYear: number | null;
}

export interface PlotState {
  unlocked: boolean;
  building: BuildingState | null;
}

export type RunPhase =
  | 'planning'
  | 'battle'
  | 'reward'
  | 'conquest'
  | 'council'
  | 'quest'
  | 'yearEnd'
  | 'blessing'
  | 'ended';
export type RngStream = 'draw' | 'reward' | 'calendar' | 'council' | 'quest' | 'blessing' | 'shop';

/** Trạng thái riêng của Vô tận (spec 2026-11-09 §5, §6); ván thường giữ `null`. */
export interface EndlessState {
  /** Số stack mỗi phúc lành đã nhận (chỉ có khoá khi > 0). */
  blessingStacks: Partial<Record<EndlessBlessingId, number>>;
  /** Mốc năm gần nhất đã TẠO offer phúc lành (0 = chưa có); chống enqueue lặp khi tải lại. */
  lastBlessingYear: number;
  modifierId: EndlessModifierId | null;
  modifierStartYear: number;
}

/** Số lần một vua địch đã tấn công và kết cục (spec §3.7). */
export interface EnemyKingState {
  attacks: number;
  status: 'pending' | 'conquered' | 'fled';
}

/** Chọn 1 thẻ: thưởng thường, chinh phục hoặc thưởng nhiệm vụ. */
export interface CardOfferState {
  kind: 'reward' | 'conquest' | 'questReward' | 'merchant';
  cardIds: CardId[];
  /** Giá mỗi thẻ (chỉ có ở `merchant`, 10/11/2026). */
  price?: number;
  /** Vua bại trận (chỉ có ở `conquest`). */
  king?: KingId;
  /** Nhiệm vụ trả thưởng (chỉ có ở `questReward`). */
  questId?: QuestId;
}

/** Lựa chọn phụ của sắc lệnh: ô, thẻ hoặc chỉ số bản bài (spec §7.1). */
export interface CouncilSelection {
  plots: number[];
  cardId: CardId | null;
  deckIndices: number[];
}

/** Một bước chờ người chơi: chọn thẻ, hội đồng hoặc đề nghị nhiệm vụ. */
export type OfferState =
  | CardOfferState
  | { kind: 'council'; decreeIds: DecreeId[]; selected: DecreeId | null; selection: CouncilSelection }
  | { kind: 'quest'; questId: QuestId }
  /** Phúc lành Vô tận (spec 2026-11-09 §5): ba id khác nhau, mốc năm đã tạo offer. */
  | { kind: 'blessing'; blessingIds: EndlessBlessingId[]; year: number };

export interface QuestState {
  id: QuestId;
  offeredYear: number;
  deadlineYear: number;
  status: 'active' | 'completed' | 'failed';
  progress: Record<string, number>;
}

export interface RunStats {
  kills: number;
  battlesWon: number;
  battlesLost: number;
  goldEarned: number;
  conquered: number;
  /** Số trận boss thắng; chỉ boss thật sự bị hạ mới tính (G3). */
  bossesWon: number;
  bossesDefeated: BossId[];
  /** Số trận đã quyết kết quả hợp lệ. */
  completedYears: number;
}

export interface RunState {
  version: number;
  rules: Rules;
  /** Chế độ chơi, suy từ `rules` lúc tạo ván (spec 2026-11-09 §3); quyết định bàn 25 hay 49 ô. */
  mode: RunMode;
  /** Trạng thái Vô tận; `null` ở ván thường. */
  endless: EndlessState | null;
  seed: number;
  kingId: KingId;
  year: number;
  phase: RunPhase;
  lives: number;
  plots: PlotState[];
  throneLevel: Level;
  /** Mọi thẻ đang sở hữu; `hand ∪ drawPile ∪ discardPile` luôn bằng `deck` (spec §3.4). */
  deck: CardId[];
  hand: CardId[];
  drawPile: CardId[];
  discardPile: CardId[];
  /** Đá Tảng tự bắn (spec §7.4); giữ qua các trận và các năm. */
  autoFire: boolean;
  gold: number;
  rerollsThisYear: number;
  /** Số lần đổi bài ĐÃ TRẢ phí trong năm (giá lần kế); `rerollsThisYear` đếm cả lần miễn phí. */
  paidRerollsThisYear: number;
  /** Số lần Mua thẻ trong năm (giá lần kế, 10/11/2026); về 0 đầu năm. */
  shopPurchasesThisYear: number;
  /** Số ô đã MUA bằng vàng (giá ô kế tiếp, spec §3.11). */
  purchasedPlots: number;
  /** Uid công trình không trả được phí duy trì năm nay; tính lại mỗi `startYear`. */
  idleUids: number[];
  /** Hai vua địch K1, K2 (G2); rỗng ở lịch toàn Thổ Phỉ. */
  enemyKings: KingId[];
  enemies: Partial<Record<KingId, EnemyKingState>>;
  /** Vua vừa bị chinh phục, chờ bước chinh phục sau bước thưởng (spec §3.2). */
  pendingConquest: KingId | null;
  played: boolean;
  army: ArmyPlan | null;
  /** Bước đang mở; các bước kế đứng trong `pendingOffers` theo thứ tự (không roll lại khi tải). */
  offers: OfferState | null;
  pendingOffers: OfferState[];
  decrees: DecreeId[];
  quests: QuestState[];
  offeredQuestIds: QuestId[];
  /** Lần đổi bài miễn phí còn lại trong năm (sắc lệnh Phường Hội Thương Nhân). */
  freeRerollsLeft: number;
  /** % sát thương Can Thiệp vĩnh viễn từ nhiệm vụ. */
  interventionDmgPct: number;
  /** Độ khó Gai 0–5; G3 luôn 0. */
  difficulty: number;
  /** Perk đã chọn lúc bắt đầu ván (thuộc vua của ván), hoặc không có. */
  perk: PerkId | null;
  /** Thẻ meta đã mở lúc bắt đầu ván, theo id; vào kho thẻ thưởng của ván. */
  unlockedCards: CardId[];
  /** Số lượt dời công trình miễn phí đã dùng trong năm (vua Du Mục); về 0 mỗi đầu năm. */
  freeMovesUsed: number;
  /** Đầu năm đã chuẩn bị nhưng chưa rút bài (đợi bước nhiệm vụ). */
  yearStartPendingDraw: boolean;
  rng: Record<RngStream, number>;
  stats: RunStats;
  /**
   * Sát thương mỗi công trình (theo uid, điểm nguyên) trong trận gần nhất, từ `BattleResult.damageBySource`;
   * `null` trước trận đầu. Ghi đè ở mỗi `battleResult`, được lưu nên còn sau khi tải lại (state 10).
   */
  lastBattleDamage: Record<number, number> | null;
  nextUid: number;
  won: boolean | null;
}

export type IllegalReason =
  | 'locked'
  | 'throne'
  | 'occupied'
  | 'noBuilding'
  | 'noTarget'
  | 'notAdjacent'
  | 'wrongPhase'
  | 'alreadyPlayed'
  | 'handTooBig'
  | 'notEnoughGold'
  | 'maxLevel'
  | 'wrongKind'
  | 'stacksFull'
  | 'badTarget'
  | 'lastLife'
  | 'noFreeMove'
  | 'wrongKing'
  | 'noShopCards';

export type PlayTarget =
  | { kind: 'none' }
  | { kind: 'plot'; plot: number }
  | { kind: 'two'; first: number; second: number };

export type RunCommand =
  | { type: 'play'; handIndex: number; target: PlayTarget }
  /** Bán/bỏ đúng một thẻ thay cho việc chơi thẻ. */
  | { type: 'discard'; handIndex: number }
  /** Bỏ cả tay và rút lại, trả `rerollCost` vàng. */
  | { type: 'reroll' }
  /** Mua một thẻ ngẫu nhiên của vua mình vào tay và bộ bài (10/11/2026). */
  | { type: 'buyCard' }
  /** Mua một ô khoá kề ô đã mở bằng vàng (spec §3.11). */
  | { type: 'unlockPlot'; plot: number }
  /** Lều Di Động (Vua Du Mục): dời/đổi chỗ công trình sang ô kề, miễn phí, không cần chơi thẻ. */
  | { type: 'freeMove'; from: number; to: number }
  | { type: 'setAutoFire'; on: boolean }
  | { type: 'startBattle' }
  | { type: 'battleResult'; result: BattleResult }
  | { type: 'pickOffer'; index: number | null }
  | { type: 'chooseDecree'; index: number }
  | { type: 'setCouncilSelection'; selection: CouncilSelection }
  | { type: 'enactDecree' }
  | { type: 'answerQuest'; accept: boolean }
  /** Chọn phúc lành `index` (0..2) của offer đang mở (Vô tận). */
  | { type: 'pickBlessing'; index: number }
  | { type: 'advance' };
