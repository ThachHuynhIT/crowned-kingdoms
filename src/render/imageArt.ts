/**
 * Hand-picked image art (G3e, `ai-v1`): AI-assisted PNGs sliced by `docs/art-review/g3e/ai-v1/make_assets.py`.
 * Density is 2 art px per world unit, so these frames are drawn at scale 0.5 (camera zoom 2 → 1:1 screen pixels).
 * Anything not listed here keeps its generated art at scale 1.
 */
import type { UnitAnim } from './unitArt';

export const IMAGE_ART_DIR = 'assets/art/ai-v1/';
/** World units per art pixel. */
export const IMAGE_ART_SCALE = 0.5;

export const imageArtKey = (file: string): string => `imgart-${file}`;

/** Every PNG of the set (file name without `.png`). */
export const IMAGE_ART_FILES: readonly string[] = [
  ...[0, 1, 2, 3, 4, 5].map((i) => `spearman_${i}`),
  ...[0, 1, 2, 3, 4, 5].map((i) => `spearman_foe_${i}`),
  'cottage',
  'grass_0',
  'grass_1',
  'grass_2',
];

/** Units drawn with the spearman poses (frame i of idle/walk/attack). */
export const IMAGE_UNITS: readonly string[] = ['militia'];
/** Buildings drawn with the cottage. */
export const IMAGE_BUILDINGS: readonly string[] = ['wheat_militia'];
export const GRASS_FILES: readonly string[] = ['grass_0', 'grass_1', 'grass_2'];

/** Pose of the spearman sheet for each animation and frame. */
export const POSES: Record<UnitAnim, readonly [number, number]> = {
  idle: [0, 1],
  walk: [2, 3],
  attack: [4, 5],
};

export const spearmanFile = (team: 'ally' | 'foe', anim: UnitAnim, n: number): string =>
  `${team === 'foe' ? 'spearman_foe_' : 'spearman_'}${POSES[anim][n === 0 ? 0 : 1]}`;
