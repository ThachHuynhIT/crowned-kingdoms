import type { CardId } from '../../data/types';
import { SPRITES_KEY, cardArtFrame } from '../../render/atlas';
import { CARD_ART } from '../../render/cardArt';

/** A card picture: texture key, frame name and native size in px. */
export interface CardImageRef {
  key: string;
  frame: string;
  w: number;
  h: number;
}

/**
 * The picture of `cardId`: the new vertical art when one is registered in `vertical`, else the
 * 32×24 picture of the sprites atlas. Replacing a card's art is only a new entry in `vertical`;
 * the card layout does not change.
 */
export const resolveCardImage = (
  cardId: CardId,
  vertical: Readonly<Partial<Record<CardId, CardImageRef>>>,
): CardImageRef =>
  vertical[cardId] ?? { key: SPRITES_KEY, frame: cardArtFrame(cardId), w: CARD_ART.w, h: CARD_ART.h };

/** Vertical card pictures drawn so far. Empty until the new card art lands (a separate art project). */
export const VERTICAL_CARD_ART: Readonly<Partial<Record<CardId, CardImageRef>>> = {};
