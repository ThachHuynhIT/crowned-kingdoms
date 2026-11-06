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
 * The Wheat (militia, reaper, peasant) and Stone (golem, miner, rubble, slinger) units come from
 * `docs/art-review/g3e/units/make_poses.py --export` (approved 2026-11-06); the militia's replace the first
 * `spearman` sheet.
 */
export const IMAGE_UNITS: Readonly<Record<string, string>> = {
  militia: 'militia',
  reaper: 'reaper',
  peasant: 'peasant',
  golem: 'golem',
  miner: 'miner',
  rubble: 'rubble',
  slinger: 'slinger',
  footman: 'footman',
};

const POSE_INDEXES = [0, 1, 2, 3, 4, 5];

/**
 * Buildings drawn from image art: card id → file. The eight Wheat buildings (throne included) are the isometric
 * set (approved 2026-11-06) cut by `docs/art-review/iso-board/make_assets.py` into `iso/` at one shared scale (the
 * Reapers barn is 64 px wide); they replace the earlier 45-degree front-view set.
 */
export const IMAGE_BUILDINGS: Readonly<Record<string, string>> = {
  wheat_throne: 'iso/wheat_throne',
  wheat_field: 'iso/wheat_field',
  wheat_windmill: 'iso/wheat_windmill',
  wheat_granary: 'iso/wheat_granary',
  wheat_peasant_horde: 'iso/wheat_peasant_horde',
  wheat_militia: 'iso/wheat_militia',
  wheat_reapers: 'iso/wheat_reapers',
  wheat_scarecrow: 'iso/wheat_scarecrow',
  neutral_barracks: 'barracks',
};
export const GRASS_FILES: readonly string[] = ['grass_0', 'grass_1', 'grass_2'];

/**
 * Plot skins per king: king id → file prefix of its `_open`, `_locked`, `_throne`, `_built` plots. Wheat's are the
 * isometric diamonds (approved 2026-11-06), 128 px wide with the diamond's centre on the middle row
 * (`docs/art-review/iso-board/make_assets.py`). Kings not listed keep the shared plots (resampled into diamonds).
 */
export const IMAGE_PLOTS: Readonly<Record<string, string>> = { wheat: 'iso/plots/wheat' };
export const PLOT_STATES = ['open', 'locked', 'throne', 'built'] as const;

/** The isometric mountain cliff segment (approved 2026-11-06, foot sheared to 2:1), tiled along the north edge. */
export const WALL_FILE = 'iso/wall_cliff';

/** Every PNG of the set (file name without `.png`). */
export const IMAGE_ART_FILES: readonly string[] = [
  ...Object.values(IMAGE_UNITS).flatMap((prefix) => [
    ...POSE_INDEXES.map((i) => `${prefix}_${i}`),
    ...POSE_INDEXES.map((i) => `${prefix}_foe_${i}`),
  ]),
  ...Object.values(IMAGE_BUILDINGS),
  ...Object.values(IMAGE_PLOTS).flatMap((prefix) => PLOT_STATES.map((s) => `${prefix}_${s}`)),
  ...GRASS_FILES,
  WALL_FILE,
];

/** Pose index of each animation frame (the sheets are drawn idle0 idle1 walk0 walk1 attack0 attack1). */
export const POSES: Record<UnitAnim, readonly [number, number]> = {
  idle: [0, 1],
  walk: [2, 3],
  attack: [4, 5],
};

/** File of pose `n` (0/1) of `anim` for image-art unit `unit`. */
export const unitPoseFile = (unit: string, team: 'ally' | 'foe', anim: UnitAnim, n: number): string =>
  `${IMAGE_UNITS[unit]}_${team === 'foe' ? 'foe_' : ''}${POSES[anim][n === 0 ? 0 : 1]}`;
