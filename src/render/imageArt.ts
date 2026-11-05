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

/**
 * Units drawn from image art: unit id → file prefix of its six poses (`<prefix>_<i>`, `<prefix>_foe_<i>`).
 * The Wheat militia, reaper and peasant come from `docs/art-review/g3e/units/make_poses.py --export` (approved
 * 2026-11-06); they replace the first `spearman` sheet for the militia.
 */
export const IMAGE_UNITS: Readonly<Record<string, string>> = {
  militia: 'militia',
  reaper: 'reaper',
  peasant: 'peasant',
  footman: 'footman',
};

const POSE_INDEXES = [0, 1, 2, 3, 4, 5];

/** Every PNG of the set (file name without `.png`). */
export const IMAGE_ART_FILES: readonly string[] = [
  ...Object.values(IMAGE_UNITS).flatMap((prefix) => [
    ...POSE_INDEXES.map((i) => `${prefix}_${i}`),
    ...POSE_INDEXES.map((i) => `${prefix}_foe_${i}`),
  ]),
  'cottage',
  'barracks',
  'grass_0',
  'grass_1',
  'grass_2',
];
/** Buildings drawn from image art: card id → file. */
export const IMAGE_BUILDINGS: Readonly<Record<string, string>> = {
  wheat_militia: 'cottage',
  neutral_barracks: 'barracks',
};
export const GRASS_FILES: readonly string[] = ['grass_0', 'grass_1', 'grass_2'];

/** Pose index of each animation frame (the sheets are drawn idle0 idle1 walk0 walk1 attack0 attack1). */
export const POSES: Record<UnitAnim, readonly [number, number]> = {
  idle: [0, 1],
  walk: [2, 3],
  attack: [4, 5],
};

/** File of pose `n` (0/1) of `anim` for image-art unit `unit`. */
export const unitPoseFile = (unit: string, team: 'ally' | 'foe', anim: UnitAnim, n: number): string =>
  `${IMAGE_UNITS[unit]}_${team === 'foe' ? 'foe_' : ''}${POSES[anim][n === 0 ? 0 : 1]}`;
