import { PERK_MASTERY } from '../../data/meta';
import type { KingId, PerkId } from '../../data/types';
import type { Content } from '../../game/cards/registry';
import { unlockedPerks, type MetaProfile } from '../../game/meta';

/** One row of the perk dialog. */
export interface PerkOption {
  id: PerkId;
  nameVi: string;
  textVi: string;
  /** Mastery reached: the perk can be chosen. */
  unlocked: boolean;
  /** "Thông thạo N" while locked; null when open. */
  note: string | null;
  selected: boolean;
}

/** The king's three perks, open or locked by mastery, with the current choice marked. */
export const perkOptions = (
  content: Content,
  profile: MetaProfile,
  king: KingId,
  chosen: PerkId | null,
): readonly PerkOption[] => {
  const open = unlockedPerks(profile, king);
  return content.king(king).perks.map((perk, i) => {
    const unlocked = open.includes(perk.id);
    return {
      id: perk.id,
      nameVi: perk.nameVi,
      textVi: perk.textVi,
      unlocked,
      note: unlocked ? null : `Thông thạo ${PERK_MASTERY[i] ?? '?'}`,
      selected: perk.id === chosen,
    };
  });
};

/** Choice after tapping `tapped`: at most one perk, tapping it again clears it, a locked one changes nothing. */
export const togglePerk = (profile: MetaProfile, king: KingId, chosen: PerkId | null, tapped: PerkId): PerkId | null => {
  if (!unlockedPerks(profile, king).includes(tapped)) return chosen;
  return tapped === chosen ? null : tapped;
};

/** Caption beside the perks button. */
export const perkButtonCaption = (content: Content, king: KingId, chosen: PerkId | null): string =>
  chosen === null ? 'Chưa chọn đặc quyền' : (content.king(king).perks.find((p) => p.id === chosen)?.nameVi ?? 'Chưa chọn đặc quyền');
