import { KING_UNLOCK } from '../../data/meta';
import { ALL_KINGS } from '../../data/rules';
import type { CardId, KingId } from '../../data/types';
import type { Content } from '../../game/cards/registry';
import { canUnlockKing, isKingUnlocked, type MetaProfile } from '../../game/meta';
import { LOCKED_KING_TITLE, kingTitleParts, type KingTitleParts } from './kingTitle';

/** One card of the king carousel: an unlocked king with his nine cards, or a locked mystery. */
export interface KingChoice {
  id: KingId;
  nameVi: string;
  /** Unlocked in the meta profile: the detail page opens and the run can start. */
  playable: boolean;
  /** The king's cards (empty for a locked king). */
  cards: readonly CardId[];
  /** Two-colour heading: "Vua của" + title, or "Vua của ?" while locked. */
  title: KingTitleParts;
  /** What unlocks a locked king ("Cần 25 điểm Vương Miện"); null when playable. */
  note: string | null;
  /** Price of the unlock when the profile can pay for it right now; null otherwise. */
  unlockCost: number | null;
}

/** The kings that lead the carousel, in this order, when unlocked. */
const LEADING: readonly KingId[] = ['wheat', 'stone', 'arcane'];

/** "Cần 25 điểm Vương Miện", or "Cần 80 điểm và thắng 1 ván" when a win is needed too. */
export const lockNote = (id: KingId): string => {
  const rule = KING_UNLOCK[id];
  return rule.needsWin ? `Cần ${rule.cost} điểm và thắng 1 ván` : `Cần ${rule.cost} điểm Vương Miện`;
};

/** Label of the unlock button. */
export const unlockLabel = (cost: number): string => `Mở khoá (${cost})`;

/**
 * Unlocked kings first (wheat, stone, arcane, then the others in `ALL_KINGS` order), then the
 * locked ones in `ALL_KINGS` order. The lock state comes from the meta profile.
 */
export const kingChoices = (content: Content, profile: MetaProfile): readonly KingChoice[] => {
  const ordered = [...LEADING, ...ALL_KINGS.filter((id) => !LEADING.includes(id))];
  const open = ordered.filter((id) => isKingUnlocked(profile, id));
  const locked = ALL_KINGS.filter((id) => !isKingUnlocked(profile, id));
  const unlocked: KingChoice[] = open.map((id) => {
    const k = content.king(id);
    return {
      id,
      nameVi: k.nameVi,
      playable: true,
      cards: k.cards.map((c) => c.id),
      title: kingTitleParts(k.nameVi),
      note: null,
      unlockCost: null,
    };
  });
  const closed: KingChoice[] = locked.map((id) => ({
    id,
    nameVi: content.king(id).nameVi,
    playable: false,
    cards: [],
    title: LOCKED_KING_TITLE,
    note: lockNote(id),
    unlockCost: canUnlockKing(profile, id) ? KING_UNLOCK[id].cost : null,
  }));
  return [...unlocked, ...closed];
};

/** `index + delta` kept inside `0..count-1`; the list never wraps. */
export const nextIndex = (index: number, delta: number, count: number): number =>
  count <= 0 ? 0 : Math.max(0, Math.min(count - 1, index + delta));

/** A horizontal drag longer than this many px changes the king by one. */
export const SWIPE_PX = 40;

/** King shown after dragging `dx` px: dragging right reveals the previous king, left the next. */
export const swipeTarget = (index: number, dx: number, count: number): number =>
  dx > SWIPE_PX ? nextIndex(index, -1, count) : dx < -SWIPE_PX ? nextIndex(index, 1, count) : nextIndex(index, 0, count);
