import type { CardId } from '../../data/types';
import { SPRITES_KEY, cardArtFrame } from '../../render/atlas';
import { CARD_ART } from '../../render/cardArt';

/** A card picture: texture key, frame name and native size in px. */
export interface CardImageRef {
  key: string;
  frame: string;
  w: number;
  h: number;
  /** A smaller copy for picture windows narrower than `w` (cards never scale by a fraction). */
  small?: CardImageRef;
}

/**
 * The largest copy of `ref` that fits `area` at scale 1 (the picture window of small cards is
 * narrower than a 96×72 illustration); the smallest copy when none fits.
 */
export const pickCardImage = (area: { w: number; h: number }, ref: CardImageRef): CardImageRef =>
  (ref.w <= area.w && ref.h <= area.h) || ref.small === undefined
    ? ref
    : pickCardImage(area, ref.small);

/**
 * The picture of `cardId`: the new vertical art when one is registered in `vertical`, else the
 * 32×24 picture of the sprites atlas. Replacing a card's art is only a new entry in `vertical`;
 * the card layout does not change.
 */
export const resolveCardImage = (
  cardId: CardId,
  vertical: Readonly<Partial<Record<CardId, CardImageRef>>>,
): CardImageRef =>
  vertical[cardId] ?? {
    key: SPRITES_KEY,
    frame: cardArtFrame(cardId),
    w: CARD_ART.w,
    h: CARD_ART.h,
  };

/** Folder of the 96×72 card illustrations (and their `-48` copies), made by docs/art-review/g3e/cards/make_assets.py. */
export const CARD_ART_DIR = 'assets/art/ai-v1/cards/';

/** Cards with a new illustration (approved 2026-10-29): the whole Wheat king set, wired 2026-11-06. */
const ILLUSTRATED: readonly CardId[] = [
  'wheat_throne',
  'wheat_field',
  'wheat_fertilizer',
  'wheat_windmill',
  'wheat_harvest_festival',
  'wheat_granary',
  'wheat_peasant_horde',
  'wheat_militia',
  'wheat_reapers',
  'wheat_scarecrow',
  // G5 (2026-11-09, approved by Claude under the owner's delegation; docs/art-review/g3e/cards/review-g5.md)
  'arcane_apprentices',
  'arcane_archmage',
  'arcane_frost_mages',
  'arcane_haste_rune',
  'arcane_library',
  'arcane_mage_tower',
  'arcane_mirror',
  'arcane_spark_rune',
  'arcane_throne',
  'arcane_ward',
  'forge_armory',
  'forge_blast_furnace',
  'forge_bombardiers',
  'forge_ember_rune',
  'forge_flame_tower',
  'forge_iron_drake',
  'forge_master_hammer',
  'forge_smithy',
  'forge_swordsmen',
  'grove_bear_cave',
  'grove_deep_roots',
  'grove_sapling',
  'grove_spirit_stags',
  'grove_spring',
  'grove_spring_rain',
  'grove_thorn_tower',
  'grove_treant',
  'grove_wolf_den',
  'stone_catapult',
  'stone_crystal',
  'stone_golem_forge',
  'stone_miners',
  'stone_mountain_heart',
  'stone_quarry',
  'stone_rune_carving',
  'stone_stoneskin',
  'stone_throne',
  'stone_wall',
  'tide_cannon',
  'tide_harbor',
  'tide_hookmen',
  'tide_kraken',
  'tide_pirates',
  'tide_privateers',
  'tide_treasure',
  'tide_undertow_rune',
  'tide_wave_tower',
];

const illustration = (id: CardId): CardImageRef => ({
  key: `cardart-${id}`,
  frame: '__BASE',
  w: 96,
  h: 72,
  small: { key: `cardart-${id}-48`, frame: '__BASE', w: 48, h: 36 },
});

/** New card pictures by card id; the other cards keep the 32×24 atlas picture. */
export const VERTICAL_CARD_ART: Readonly<Partial<Record<CardId, CardImageRef>>> =
  Object.fromEntries(ILLUSTRATED.map((id) => [id, illustration(id)]));

/** Every illustration file to load (texture key and URL), both sizes. */
export const CARD_ART_FILES: readonly { key: string; url: string }[] = ILLUSTRATED.flatMap((id) => [
  { key: `cardart-${id}`, url: `${CARD_ART_DIR}${id}.png` },
  { key: `cardart-${id}-48`, url: `${CARD_ART_DIR}${id}-48.png` },
]);
