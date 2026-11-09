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
  // Arcane (2026-11-09, missing-art plan Task 2; approved by Claude under the owner's delegation)
  apprentice: 'apprentice',
  frost_mage: 'frost_mage',
  archmage: 'archmage',
  construct: 'construct',
  // Grove, Tide, Forge (2026-11-09, same pipeline and approval)
  wolf: 'wolf',
  bear: 'bear',
  treant: 'treant',
  stag: 'stag',
  dryad: 'dryad',
  pirate: 'pirate',
  hookman: 'hookman',
  musketeer: 'musketeer',
  swordsman: 'swordsman',
  bombardier: 'bombardier',
  shieldbearer: 'shieldbearer',
  iron_drake: 'iron_drake',
  // Clock, Moon, Nomad and the neutral mercenary (2026-11-09, same pipeline and approval)
  tin_soldier: 'tin_soldier',
  spider: 'spider',
  gear_gunner: 'gear_gunner',
  colossus: 'colossus',
  skeleton: 'skeleton',
  wraith: 'wraith',
  vampire: 'vampire',
  moon_reaper: 'moon_reaper',
  rider: 'rider',
  horse_archer: 'horse_archer',
  khan_guard: 'khan_guard',
  mercenary: 'mercenary',
  // raiders, boss summons and the three bosses (2026-11-09; the Crownless King from its second drawing)
  bandit: 'bandit',
  bandit_archer: 'bandit_archer',
  boar_rider: 'boar_rider',
  ogre: 'ogre',
  frog: 'frog',
  hornet: 'hornet',
  boss_bog_ogre: 'boss_bog_ogre',
  boss_hornet_queen: 'boss_hornet_queen',
  boss_crownless_king: 'boss_crownless_king',
};

const POSE_INDEXES = [0, 1, 2, 3, 4, 5];

/**
 * Buildings drawn from image art: card id → file. The eight Wheat buildings (throne included) are the isometric
 * set (approved 2026-11-06) cut by `docs/art-review/iso-board/make_assets.py` into `iso/` at one shared scale (the
 * Reapers barn is 64 px wide); they replace the earlier 45-degree front-view set.
 */
/**
 * G5 isometric sets of the six new kings (`docs/art-review/g5`, cut by `docs/art-review/g5/make_assets.py`), one entry
 * per king whose whole group was approved: its throne and building cards (`iso/<cardId>`) and four plot skins
 * (`iso/plots/<king>_<state>`). Approved 2026-11-09 by Claude under the owner's delegation. Kings not listed keep the
 * code-drawn art.
 */
export const G5_ART_APPROVED: Readonly<Record<string, readonly string[]>> = {
  grove: [
    'grove_throne',
    'grove_bear_cave',
    'grove_sapling',
    'grove_spirit_stags',
    'grove_spring',
    'grove_thorn_tower',
    'grove_treant',
    'grove_wolf_den',
  ],
  tide: [
    'tide_throne',
    'tide_cannon',
    'tide_harbor',
    'tide_hookmen',
    'tide_kraken',
    'tide_pirates',
    'tide_treasure',
    'tide_wave_tower',
  ],
  forge: [
    'forge_throne',
    'forge_armory',
    'forge_blast_furnace',
    'forge_bombardiers',
    'forge_flame_tower',
    'forge_iron_drake',
    'forge_smithy',
    'forge_swordsmen',
  ],
  clock: [
    'clock_throne',
    'clock_bell_tower',
    'clock_colossus',
    'clock_gear_tower',
    'clock_spiders',
    'clock_spring_workshop',
    'clock_steam_cannon',
    'clock_windup_soldiers',
  ],
  moon: [
    'moon_throne',
    'moon_altar',
    'moon_crypt',
    'moon_reaper_shrine',
    'moon_shadow_spire',
    'moon_summoning_circle',
    'moon_vampires',
  ],
  stone: [
    'stone_throne',
    'stone_catapult',
    'stone_crystal',
    'stone_golem_forge',
    'stone_miners',
    'stone_mountain_heart',
    'stone_quarry',
    'stone_wall',
  ],
  arcane: [
    'arcane_throne',
    'arcane_apprentices',
    'arcane_archmage',
    'arcane_frost_mages',
    'arcane_library',
    'arcane_mage_tower',
    'arcane_ward',
  ],
  nomad: [
    'nomad_throne',
    'nomad_bazaar',
    'nomad_caravan',
    'nomad_horse_archers',
    'nomad_khan_guard',
    'nomad_riders',
    'nomad_stables',
    'nomad_watchtower',
  ],
};

export const IMAGE_BUILDINGS: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    Object.values(G5_ART_APPROVED).flatMap((cards) => cards.map((card) => [card, `iso/${card}`])),
  ),
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
export const IMAGE_PLOTS: Readonly<Record<string, string>> = {
  wheat: 'iso/plots/wheat',
  ...Object.fromEntries(Object.keys(G5_ART_APPROVED).map((king) => [king, `iso/plots/${king}`])),
};
export const PLOT_STATES = ['open', 'locked', 'throne', 'built'] as const;

/** The isometric mountain cliff segment (approved 2026-11-06, foot sheared to 2:1), tiled along the north edge. */
export const WALL_FILE = 'iso/wall_cliff';

/**
 * The wild objects of `docs/art-review/g3e/batch-06-wilds` cut by `docs/art-review/iso-board/wilds/make_wilds.py`
 * (spec 2026-11-06 §5): tall ones stand outside the field, low ones inside it; `radius` is their world footprint.
 * Only the ids in `DECOR_APPROVED` (each approved by the owner) are loaded and drawn.
 */
export const DECOR_CATALOG: readonly { id: string; tall: boolean; radius: number }[] = [
  { id: 'tree_pine_dark', tall: true, radius: 18 },
  { id: 'tree_pine_light', tall: true, radius: 18 },
  { id: 'tree_oak', tall: true, radius: 24 },
  { id: 'tree_autumn', tall: true, radius: 24 },
  { id: 'mountain_snow', tall: true, radius: 32 },
  { id: 'cliff_mossy', tall: true, radius: 30 },
  { id: 'boulders_big', tall: true, radius: 32 },
  { id: 'bush_green', tall: false, radius: 10 },
  { id: 'bush_berry', tall: false, radius: 10 },
  { id: 'bush_dry', tall: false, radius: 10 },
  { id: 'rock_large', tall: false, radius: 13 },
  { id: 'rock_medium', tall: false, radius: 9 },
  { id: 'rock_small', tall: false, radius: 7 },
  { id: 'stump', tall: false, radius: 10 },
  { id: 'log', tall: false, radius: 16 },
];
/** Owner-approved wild objects (all fifteen, 2026-11-06). */
export const DECOR_APPROVED: readonly string[] = DECOR_CATALOG.map((d) => d.id);
/** File of an approved wild object. */
export const decorFile = (id: string): string => `iso/wilds/${id}`;

/**
 * Seamless ground textures that colour the river and its sand banks (`docs/art-review/iso-board/terrain`,
 * 128 px, density 2). Only the terrains in `GROUND_TEXTURES_APPROVED` are loaded (water and sand: owner, 2026-11-06; path and flowers: Claude under the owner's delegation, 2026-11-09).
 */
export const GROUND_TEXTURE_FILES = {
  water: 'iso/terrain/water',
  sand: 'iso/terrain/sand',
  path: 'iso/terrain/path',
  flowers: 'iso/terrain/flowers',
} as const;
export const GROUND_TEXTURES_APPROVED: readonly (keyof typeof GROUND_TEXTURE_FILES)[] = [
  'water',
  'sand',
  'path',
  'flowers',
];

/**
 * The forest behind the mountain cliff (spec 2026-11-08 §6, Q5): drawn by `docs/art-review/iso-board/polish`, each kind
 * approved by the owner from one sample first. Only the ids in `FOREST_APPROVED` are loaded and drawn.
 */
export const FOREST_CATALOG: readonly { id: string; tall: boolean; radius: number }[] = [
  { id: 'forest_pine_a', tall: true, radius: 20 },
  { id: 'forest_pine_b', tall: true, radius: 18 },
  { id: 'forest_rock', tall: true, radius: 24 },
];
/** Owner-approved forest objects (the pine sample approved 2026-11-08, pine_b and the rock 2026-11-09). */
export const FOREST_APPROVED: readonly string[] = ['forest_pine_a', 'forest_pine_b', 'forest_rock'];
/** File of an approved forest object. */
export const forestFile = (id: string): string => `iso/polish/${id}`;

/**
 * The enemy portal art (spec 2026-11-08 §3/§6), cut by `docs/art-review/iso-board/polish/make_polish_assets.py`; `foot`
 * is the centre of its base diamond (where `ENEMY_PORTAL` stands) in native px. Loaded and drawn only once the owner
 * approved it (`PORTAL_APPROVED`); until then the code-drawn portal stands there.
 */
export const PORTAL_ART = {
  file: 'iso/polish/enemy_portal',
  width: 112,
  height: 99,
  foot: { x: 58, y: 71.5 },
} as const;
/** Approved by the owner 2026-11-08. */
export const PORTAL_APPROVED = true;

/**
 * In-game icons drawn from image art (G5, 2026-11-09): icon id → 16 px cut of an approved icon source
 * (`docs/art-review/g3e/icons/make_assets.py` writes `icons/icon_<name>-16.png`). The frames stay 16×16, so every
 * place that draws an icon keeps its size; icons not listed keep the generated art.
 */
export const IMAGE_ICONS: Readonly<Record<string, string>> = {
  troop: 'icons/icon_troop-16',
  tower: 'icons/icon_tower-16',
  tome: 'icons/icon_tome-16',
  throne: 'icons/icon_throne-16',
  gold: 'icons/icon_gold-16',
  level: 'icons/icon_level-16',
  enchant: 'icons/icon_enchant_stack-16',
  crown: 'icons/icon_crown-16',
  boulder: 'icons/icon_boulder-16',
  skull: 'icons/icon_skull-16',
  reroll: 'icons/icon_reroll-16',
  sell: 'icons/icon_sell-16',
  lock: 'icons/icon_lock-16',
  conquer: 'icons/icon_conquer-16',
};

/**
 * Main-menu backdrop drawn as pictures (G5, `docs/art-review/g5/menu/`): strips far → near, each repeating
 * left-to-right in front of the code sky, drifting at `parallax` screen px per second. The middle strip is a whole
 * countryside down to the screen's bottom edge, so it replaces both nearer code hill layers.
 */
export const MENU_IMAGE_LAYERS: readonly { readonly file: string; readonly parallax: number }[] = [
  { file: 'menu/hills_far', parallax: 4 },
  { file: 'menu/hills_mid', parallax: 10 },
];

/** The picture strips when every one of them loaded, else null (the menu keeps its painted hills). */
export const menuImageLayers = (
  loaded: (file: string) => boolean,
): readonly { readonly file: string; readonly parallax: number }[] | null =>
  MENU_IMAGE_LAYERS.every((layer) => loaded(layer.file)) ? MENU_IMAGE_LAYERS : null;

/** Every PNG of the set (file name without `.png`). */
export const IMAGE_ART_FILES: readonly string[] = [
  ...Object.values(IMAGE_UNITS).flatMap((prefix) => [
    ...POSE_INDEXES.map((i) => `${prefix}_${i}`),
    ...POSE_INDEXES.map((i) => `${prefix}_foe_${i}`),
  ]),
  ...Object.values(IMAGE_BUILDINGS),
  ...Object.values(IMAGE_ICONS),
  ...MENU_IMAGE_LAYERS.map((layer) => layer.file),
  ...Object.values(IMAGE_PLOTS).flatMap((prefix) => PLOT_STATES.map((s) => `${prefix}_${s}`)),
  ...GRASS_FILES,
  WALL_FILE,
  ...DECOR_APPROVED.map(decorFile),
  ...FOREST_APPROVED.map(forestFile),
  ...(PORTAL_APPROVED ? [PORTAL_ART.file] : []),
  ...GROUND_TEXTURES_APPROVED.map((t) => GROUND_TEXTURE_FILES[t]),
];

/** Pose index of each animation frame (the sheets are drawn idle0 idle1 walk0 walk1 attack0 attack1). */
export const POSES: Record<UnitAnim, readonly [number, number]> = {
  idle: [0, 1],
  walk: [2, 3],
  attack: [4, 5],
};

/** File of pose `n` (0/1) of `anim` for image-art unit `unit`. */
export const unitPoseFile = (
  unit: string,
  team: 'ally' | 'foe',
  anim: UnitAnim,
  n: number,
): string => `${IMAGE_UNITS[unit]}_${team === 'foe' ? 'foe_' : ''}${POSES[anim][n === 0 ? 0 : 1]}`;
