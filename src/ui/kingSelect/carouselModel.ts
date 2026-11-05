import type { CardId, KingId } from '../../data/types';
import { ALL_KINGS } from '../../data/rules';
import type { Content } from '../../game/cards/registry';
import { LOCKED_KING_TITLE, kingTitleParts, type KingTitleParts } from './kingTitle';

/** One card of the king carousel: a playable king with his nine cards, or a locked mystery. */
export interface KingChoice {
  id: KingId;
  nameVi: string;
  playable: boolean;
  /** The king's cards (empty for a locked king). */
  cards: readonly CardId[];
  /** Two-colour heading: "Vua của" + title, or "Vua của ?" while locked. */
  title: KingTitleParts;
  /** Shown on a locked card instead of an unlock condition (none exists yet); null when playable. */
  note: string | null;
}

export const LOCKED_NOTE = 'Sắp ra mắt';

/** The playable kings (registry order), then the other kings in `ALL_KINGS` order. */
export const kingChoices = (content: Content): readonly KingChoice[] => {
  const playable = content.kings();
  const playableIds = new Set<KingId>(playable.map((k) => k.id));
  const enemies = content.enemyKings();
  const open: KingChoice[] = playable.map((k) => ({
    id: k.id,
    nameVi: k.nameVi,
    playable: true,
    cards: k.cards.map((c) => c.id),
    title: kingTitleParts(k.nameVi),
    note: null,
  }));
  const locked: KingChoice[] = ALL_KINGS.filter((id) => !playableIds.has(id)).map((id) => ({
    id,
    nameVi: enemies.find((e) => e.id === id)?.nameVi ?? id,
    playable: false,
    cards: [],
    title: LOCKED_KING_TITLE,
    note: LOCKED_NOTE,
  }));
  return [...open, ...locked];
};

/** `index + delta` kept inside `0..count-1`; the list never wraps. */
export const nextIndex = (index: number, delta: number, count: number): number =>
  count <= 0 ? 0 : Math.max(0, Math.min(count - 1, index + delta));

/** A horizontal drag longer than this many px changes the king by one. */
export const SWIPE_PX = 40;

/** King shown after dragging `dx` px: dragging right reveals the previous king, left the next. */
export const swipeTarget = (index: number, dx: number, count: number): number =>
  dx > SWIPE_PX ? nextIndex(index, -1, count) : dx < -SWIPE_PX ? nextIndex(index, 1, count) : nextIndex(index, 0, count);
