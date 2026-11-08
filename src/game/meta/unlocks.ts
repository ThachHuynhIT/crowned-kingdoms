import { CARD_UNLOCK, KING_UNLOCK, PERK_MASTERY } from '../../data/meta';
import { RUN } from '../../data/run';
import type { CardId, KingId, PerkId } from '../../data/types';
import { CONTENT } from '../cards/registry';
import type { MetaProfile } from './profile';

const sortedWith = <T extends string>(list: readonly T[], item: T): T[] => [...list, item].sort();

export const totalWins = (p: MetaProfile): number => {
  let n = 0;
  for (const k of Object.keys(p.wins).sort()) n += p.wins[k as KingId];
  return n;
};

export const isKingUnlocked = (p: MetaProfile, k: KingId): boolean => p.unlockedKings.includes(k);

export const canUnlockKing = (p: MetaProfile, k: KingId): boolean => {
  if (isKingUnlocked(p, k)) return false;
  const rule = KING_UNLOCK[k];
  if (p.crownPoints < rule.cost) return false;
  return !rule.needsWin || totalWins(p) >= 1;
};

/** Không đủ điều kiện → trả nguyên `p`. */
export const unlockKing = (p: MetaProfile, k: KingId): MetaProfile => {
  if (!canUnlockKing(p, k)) return p;
  return {
    ...p,
    crownPoints: p.crownPoints - KING_UNLOCK[k].cost,
    unlockedKings: sortedWith(p.unlockedKings, k),
  };
};

export const canUnlockCard = (p: MetaProfile, c: CardId): boolean => {
  const cost = CARD_UNLOCK[c];
  return cost !== undefined && !p.unlockedCards.includes(c) && p.crownPoints >= cost;
};

/** Không đủ điều kiện → trả nguyên `p`. */
export const unlockCard = (p: MetaProfile, c: CardId): MetaProfile => {
  if (!canUnlockCard(p, c)) return p;
  return {
    ...p,
    crownPoints: p.crownPoints - (CARD_UNLOCK[c] ?? 0),
    unlockedCards: sortedWith(p.unlockedCards, c),
  };
};

/** Perk i của vua mở khi thông thạo ≥ `PERK_MASTERY[i]`. */
export const unlockedPerks = (p: MetaProfile, k: KingId): PerkId[] => {
  const perks = CONTENT.king(k).perks;
  const out: PerkId[] = [];
  perks.forEach((perk, i) => {
    if (p.mastery[k] >= (PERK_MASTERY[i] ?? Infinity)) out.push(perk.id);
  });
  return out;
};

/** [0 .. highestDifficultyWon + 1], kẹp ở Gai tối đa. */
export const availableDifficulties = (p: MetaProfile): number[] => {
  const top = Math.min(p.highestDifficultyWon + 1, RUN.difficultyLevels);
  const out: number[] = [];
  for (let d = 0; d <= top; d++) out.push(d);
  return out;
};
