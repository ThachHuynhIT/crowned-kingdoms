import type { KingId } from '../../data/types';

/**
 * King badges on the year calendar (G3e): a 32 px and a 16 px copy made by
 * docs/art-review/g3e/icons/make_assets.py. Kings without one keep their colour square.
 */
const BADGE_DIR = 'assets/art/ai-v1/icons/';
// Wheat since 2026-11-06; the other eight since 2026-11-09 (same shield, approved by Claude under the owner's delegation).
const KINGS_WITH_BADGE: readonly KingId[] = ['wheat', 'stone', 'arcane', 'grove', 'tide', 'forge', 'clock', 'moon', 'nomad'];
const SIZES = [32, 16] as const;

/** Every badge file to load (texture key and URL). */
export const KING_BADGE_FILES: readonly { key: string; url: string }[] = KINGS_WITH_BADGE.flatMap((king) =>
  SIZES.map((size) => ({
    key: `badge-${king}-${size}`,
    url: `${BADGE_DIR}icon_king_${king}${size === 32 ? '' : `-${size}`}.png`,
  })),
);

/**
 * The badge of `king` for a box `box` px wide: the largest copy that fits at scale 1, the 16 px
 * one when none fits (never a fractional scale); null when the king has no badge.
 */
export const kingBadge = (king: KingId, box: number): { key: string; size: number } | null => {
  if (!KINGS_WITH_BADGE.includes(king)) return null;
  const size = SIZES.find((s) => s <= box) ?? SIZES[SIZES.length - 1]!;
  return { key: `badge-${king}-${size}`, size };
};
