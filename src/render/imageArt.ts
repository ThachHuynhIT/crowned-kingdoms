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
  ...[0, 1, 2, 3, 4, 5].map((i) => `footman_${i}`),
  ...[0, 1, 2, 3, 4, 5].map((i) => `footman_foe_${i}`),
  'cottage',
  'barracks',
  'grass_0',
  'grass_1',
  'grass_2',
];

/** Units drawn from image art: unit id → file prefix of its six poses (`<prefix>_<i>`, `<prefix>_foe_<i>`). */
export const IMAGE_UNITS: Readonly<Record<string, string>> = { militia: 'spearman', footman: 'footman' };
/** Buildings drawn from image art: card id → file. */
export const IMAGE_BUILDINGS: Readonly<Record<string, string>> = {
  wheat_militia: 'cottage',
  neutral_barracks: 'barracks',
};
export const GRASS_FILES: readonly string[] = ['grass_0', 'grass_1', 'grass_2'];

/** Pose of the spearman sheet for each animation and frame. */
export const POSES: Record<UnitAnim, readonly [number, number]> = {
  idle: [0, 1],
  walk: [2, 3],
  attack: [4, 5],
};

/** File of pose `n` (0/1) of `anim` for image-art unit `unit`. */
export const unitPoseFile = (unit: string, team: 'ally' | 'foe', anim: UnitAnim, n: number): string =>
  `${IMAGE_UNITS[unit]}_${team === 'foe' ? 'foe_' : ''}${POSES[anim][n === 0 ? 0 : 1]}`;
