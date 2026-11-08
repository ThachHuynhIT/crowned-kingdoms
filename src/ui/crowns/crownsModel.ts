import { CARD_UNLOCK, KING_UNLOCK, PERK_MASTERY } from '../../data/meta';
import type { CardId, KingId } from '../../data/types';
import type { Content } from '../../game/cards/registry';
import { canUnlockCard, canUnlockKing, isKingUnlocked, unlockedPerks, type MetaProfile } from '../../game/meta';
import { unlockLabel } from '../kingSelect/carouselModel';
import { DIFFICULTY_OPTIONS } from '../kingSelect/difficulty';

/** Kings on the Crowns screen: the three free ones, then by price (spec §9.2 table order). */
export const CROWNS_KING_ORDER: readonly KingId[] = ['wheat', 'stone', 'arcane', 'grove', 'tide', 'forge', 'clock', 'moon', 'nomad'];

/** Meta cards for sale, cheapest first. */
const META_CARDS: readonly CardId[] = (Object.keys(CARD_UNLOCK) as CardId[]).sort(
  (a, b) => (CARD_UNLOCK[a] ?? 0) - (CARD_UNLOCK[b] ?? 0) || a.localeCompare(b),
);

export const OWNED_TEXT = 'Đã mở';

/** `1.4` → `"1,4"` (Vietnamese decimal comma, at most two places). */
export const decimalVi = (n: number): string => String(Math.round(n * 100) / 100).replace('.', ',');

export interface MasteryMark {
  value: number;
  /** Position on the bar, 0..1. */
  at: number;
  reached: boolean;
}

interface ShopRow {
  nameVi: string;
  unlocked: boolean;
  /** "Đã mở", or the price (and condition) while locked. */
  status: string;
  /** "Mở khoá (N)" while locked (the button is shown), null once owned. */
  unlockLabel: string | null;
  /** The profile can pay (and meets the condition) right now: the button is live. */
  canUnlock: boolean;
}

export interface CrownKingRow extends ShopRow {
  id: KingId;
  mastery: number;
  /** Bar fill, 0..1: full at the last perk mark. */
  masteryFraction: number;
  masteryLabel: string;
  marks: MasteryMark[];
}

export interface CrownCardRow extends ShopRow {
  id: CardId;
}

export interface CrownsModel {
  balance: number;
  balanceLabel: string;
  kings: CrownKingRow[];
  cards: CrownCardRow[];
  highestLabel: string;
}

const LAST_MARK = PERK_MASTERY[PERK_MASTERY.length - 1]!;

const kingRow = (content: Content, p: MetaProfile, id: KingId): CrownKingRow => {
  const rule = KING_UNLOCK[id];
  const unlocked = isKingUnlocked(p, id);
  const mastery = p.mastery[id];
  const perks = content.king(id).perks.length;
  return {
    id,
    nameVi: content.king(id).nameVi,
    unlocked,
    status: unlocked ? OWNED_TEXT : rule.needsWin ? `${rule.cost} điểm · cần thắng 1 ván` : `${rule.cost} điểm`,
    unlockLabel: unlocked ? null : unlockLabel(rule.cost),
    canUnlock: canUnlockKing(p, id),
    mastery,
    masteryFraction: Math.min(1, mastery / LAST_MARK),
    masteryLabel: `Thông thạo ${mastery} · ${unlockedPerks(p, id).length}/${perks} đặc quyền`,
    marks: PERK_MASTERY.map((value) => ({ value, at: value / LAST_MARK, reached: mastery >= value })),
  };
};

const cardRow = (content: Content, p: MetaProfile, id: CardId): CrownCardRow => {
  const cost = CARD_UNLOCK[id] ?? 0;
  const unlocked = p.unlockedCards.includes(id);
  return {
    id,
    nameVi: content.card(id).nameVi,
    unlocked,
    status: unlocked ? OWNED_TEXT : `${cost} điểm`,
    unlockLabel: unlocked ? null : unlockLabel(cost),
    canUnlock: canUnlockCard(p, id),
  };
};

const highestLabel = (p: MetaProfile): string => {
  const won = DIFFICULTY_OPTIONS.find((o) => o.thorn === p.highestDifficultyWon);
  return `Độ khó cao nhất đã thắng: ${won ? won.labelVi : 'chưa thắng'}`;
};

/** Everything the Crowns screen (§10.9) shows, from the meta profile; never changes the profile. */
export const crownsModel = (content: Content, p: MetaProfile): CrownsModel => ({
  balance: p.crownPoints,
  balanceLabel: `Điểm Vương Miện: ${p.crownPoints}`,
  kings: CROWNS_KING_ORDER.map((id) => kingRow(content, p, id)),
  cards: META_CARDS.map((id) => cardRow(content, p, id)),
  highestLabel: highestLabel(p),
});
