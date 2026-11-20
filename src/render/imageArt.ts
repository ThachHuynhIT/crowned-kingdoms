/**
 * Hand-picked image art (G3e, `ai-v1`): AI-assisted PNGs sliced by `docs/art-review/g3e/ai-v1/make_assets.py`.
 * Density is 2 art px per world unit, so these frames are drawn at scale 0.5 (camera zoom 2 → 1:1 screen pixels).
 * Files with an HD twin (`IMAGE_ART_HD_FILES`) may load at 4 art px per world unit instead, drawn at 0.25.
 * Anything not listed here keeps its generated art at scale 1.
 */
import type { KingId } from '../data/types';
import type { ArtTier } from './artQuality';
import type { UnitAnim } from './unitArt';

export const IMAGE_ART_DIR = 'assets/art/ai-v1/';
/** World units per art pixel. */
export const IMAGE_ART_SCALE = 0.5;

export const imageArtKey = (file: string): string => `imgart-${file}`;

/**
 * HiDPI art (11/11/2026, `.superpowers/art-hd-map.md`): the same approved sources re-exported at 4 art px per world
 * unit into `ai-v1-hd/` under the same file names, drawn at `IMAGE_ART_HD_SCALE` so every world size and anchor stays
 * identical (each HD file is exactly twice its `ai-v1` twin). Only files in `IMAGE_ART_HD_FILES` have an HD twin; they
 * are loaded instead of the `ai-v1` file when the display density is at least `HD_ART_MIN_DENSITY` (at density 1 the
 * extra pixels would only be dropped by nearest sampling). Unit poses, buildings and plots feed the `sprites` atlas,
 * which reads the density back from the texture key (`imageArtHdKey`). The world pictures drawn outside the atlas
 * (`IMAGE_ART_HD_WORLD`: wall, wilds, forest, portal, grass and terrain) find their texture through `imageArtTexture`
 * and halve their own scale when it is the HD twin.
 */
export const IMAGE_ART_HD_DIR = 'assets/art/ai-v1-hd/';
/** World units per art pixel of an HD file (4 art px per world unit). */
export const IMAGE_ART_HD_SCALE = 0.25;
export const HD_ART_MIN_DENSITY = 2;
export const imageArtHdKey = (file: string): string => `imgart-hd-${file}`;

/**
 * Close-up art (12/11/2026, spec `2026-11-12-close-up-art-design.md`): the same approved sources re-exported at 8 art
 * px per world unit into `ai-v1-uhd/` (each file exactly 4× its `ai-v1` twin), drawn at `IMAGE_ART_UHD_SCALE`. Loaded
 * only for the 'uhd' art tier (`artQuality.ts`: graphics 'high' on a desktop).
 */
export const IMAGE_ART_UHD_DIR = 'assets/art/ai-v1-uhd/';
/** World units per art pixel of a UHD file (8 art px per world unit). */
export const IMAGE_ART_UHD_SCALE = 0.125;
export const imageArtUhdKey = (file: string): string => `imgart-uhd-${file}`;
/**
 * Units with an HD twin (11/11/2026: every unit, enemy and boss with a pose source; `footman` since its pose source was
 * drawn 20/11/2026). Rollback of a group = remove its ids.
 */
export const IMAGE_ART_HD_UNITS: readonly string[] = [
  'militia', 'reaper', 'peasant', 'golem', 'miner', 'rubble', 'slinger', 'apprentice', 'frost_mage', 'archmage',
  'construct', 'wolf', 'bear', 'treant', 'stag', 'dryad', 'pirate', 'hookman', 'musketeer', 'swordsman',
  'bombardier', 'shieldbearer', 'iron_drake', 'tin_soldier', 'spider', 'gear_gunner', 'colossus', 'skeleton',
  'wraith', 'vampire', 'moon_reaper', 'rider', 'horse_archer', 'khan_guard', 'mercenary', 'bandit', 'bandit_archer',
  'boar_rider', 'ogre', 'frog', 'hornet', 'boss_bog_ogre', 'boss_hornet_queen', 'boss_crownless_king', 'footman',
];
/** Building cards with an HD twin of their base image and of each listed L2/L3 image (`IMAGE_BUILDING_LEVELS`). */
export const IMAGE_ART_HD_BUILDINGS: readonly string[] = [
  // wheat
  'wheat_throne', 'wheat_field', 'wheat_windmill', 'wheat_granary', 'wheat_peasant_horde', 'wheat_militia',
  'wheat_reapers', 'wheat_scarecrow',
  // stone
  'stone_throne', 'stone_catapult', 'stone_crystal', 'stone_golem_forge', 'stone_miners', 'stone_mountain_heart',
  'stone_quarry', 'stone_wall',
  // arcane
  'arcane_throne', 'arcane_apprentices', 'arcane_archmage', 'arcane_frost_mages', 'arcane_library',
  'arcane_mage_tower', 'arcane_ward',
  // grove
  'grove_throne', 'grove_bear_cave', 'grove_sapling', 'grove_spirit_stags', 'grove_spring', 'grove_thorn_tower',
  'grove_treant', 'grove_wolf_den',
  // tide
  'tide_throne', 'tide_cannon', 'tide_harbor', 'tide_hookmen', 'tide_kraken', 'tide_pirates', 'tide_treasure',
  'tide_wave_tower',
  // forge
  'forge_throne', 'forge_armory', 'forge_blast_furnace', 'forge_bombardiers', 'forge_flame_tower',
  'forge_iron_drake', 'forge_smithy', 'forge_swordsmen',
  // clock
  'clock_throne', 'clock_bell_tower', 'clock_colossus', 'clock_gear_tower', 'clock_spiders', 'clock_spring_workshop',
  'clock_steam_cannon', 'clock_windup_soldiers',
  // moon
  'moon_throne', 'moon_altar', 'moon_crypt', 'moon_reaper_shrine', 'moon_shadow_spire', 'moon_summoning_circle',
  'moon_vampires',
  // nomad
  'nomad_throne', 'nomad_bazaar', 'nomad_caravan', 'nomad_horse_archers', 'nomad_khan_guard', 'nomad_riders',
  'nomad_stables', 'nomad_watchtower',
  // neutral
  'neutral_barracks', 'neutral_archer_tower', 'neutral_well', 'neutral_mercenary_camp',
];
/** Kings whose four plot skins (`IMAGE_PLOTS`) have an HD twin. */
export const IMAGE_ART_HD_PLOTS: readonly string[] = [
  'wheat', 'stone', 'arcane', 'grove', 'tide', 'forge', 'clock', 'moon', 'nomad',
];

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
 * Units drawn in battle from the diagonal sheets (17/11/2026; raiders and bosses 20/11/2026, spec 2026-11-17-iso-unit-sheets-design.md): per team a
 * strip of `ISO_UNIT_FRAMES` equal cells for each of the two drawn directions, SE (facing the viewer, to the right) and
 * NW (back to the viewer, to the left); a horizontal flip gives SW and NE. Cut by
 * `docs/art-review/units-iso/make_review.py --export [--density 4|8]`; approved by Claude under the owner's delegation.
 * Their front-view poses load only pose 0 (the HUD picture); a unit not listed keeps its six front-view poses.
 */
export const ISO_UNITS: readonly string[] = [
  'militia', 'reaper', 'peasant', 'golem', 'miner', 'rubble', 'slinger', 'apprentice', 'frost_mage', 'archmage',
  'construct', 'wolf', 'bear', 'treant', 'stag', 'dryad', 'pirate', 'hookman', 'musketeer', 'swordsman',
  'bombardier', 'shieldbearer', 'iron_drake', 'tin_soldier', 'spider', 'gear_gunner', 'colossus', 'skeleton',
  'wraith', 'vampire', 'moon_reaper', 'rider', 'horse_archer', 'khan_guard', 'mercenary',
  // raiders, boss summons and the three bosses (20/11/2026)
  'bandit', 'bandit_archer', 'boar_rider', 'ogre', 'frog', 'hornet', 'boss_bog_ogre', 'boss_hornet_queen',
  'boss_crownless_king', 'footman',
];
/** Cells of an iso unit strip: idle 0–2, walk 3–6, attack 7–10. */
export const ISO_UNIT_FRAMES = 11;
export type IsoDir = 'se' | 'nw';
/** File of the iso strip of `unit` for `team` and direction `dir`. */
export const isoUnitFile = (unit: string, team: 'ally' | 'foe', dir: IsoDir): string =>
  `iso-units/${unit}_${team === 'foe' ? 'foe_' : ''}${dir}`;
const ISO_UNIT_SET: ReadonlySet<string> = new Set(ISO_UNITS);
/** Front-view pose files of image-art unit `unit` (ally and foe): pose 0 only for an iso unit. */
const unitPoseFiles = (unit: string): string[] => {
  const prefix = IMAGE_UNITS[unit];
  if (prefix === undefined) return [];
  const poses = ISO_UNIT_SET.has(unit) ? [0] : POSE_INDEXES;
  return [...poses.map((i) => `${prefix}_${i}`), ...poses.map((i) => `${prefix}_foe_${i}`)];
};
const isoUnitFiles = (unit: string): string[] =>
  (['ally', 'foe'] as const).flatMap((team) => (['se', 'nw'] as const).map((dir) => isoUnitFile(unit, team, dir)));

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
  // Neutral buildings, isometric (2026-11-09, docs/art-review/neutral-iso/review.md; the old 45° barracks retired).
  neutral_barracks: 'iso-neutral/neutral_barracks',
  neutral_archer_tower: 'iso-neutral/neutral_archer_tower',
  neutral_well: 'iso-neutral/neutral_well',
  neutral_mercenary_camp: 'iso-neutral/neutral_mercenary_camp',
};
/**
 * Architecture per building level (10/11/2026, P2 `building_<card>_l2/_l3`): level 1 shows the base image, level 2
 * its L2 and levels 3–5 its L3 (levels 4 and 5 are told apart by the stars). Only the levels listed here are loaded;
 * a missing level falls back to the next lower one, then to the base image. Files sit next to the base image.
 */
export const IMAGE_BUILDING_LEVELS: Readonly<Partial<Record<string, readonly (2 | 3)[]>>> = {
  arcane_apprentices: [2, 3],
  arcane_archmage: [2, 3],
  arcane_frost_mages: [2, 3],
  arcane_library: [2, 3],
  arcane_mage_tower: [2, 3],
  arcane_throne: [2, 3],
  arcane_ward: [2, 3],
  clock_bell_tower: [2, 3],
  clock_colossus: [2, 3],
  clock_gear_tower: [2, 3],
  clock_spiders: [2, 3],
  clock_spring_workshop: [2, 3],
  clock_steam_cannon: [2, 3],
  clock_throne: [2, 3],
  clock_windup_soldiers: [2, 3],
  forge_armory: [2, 3],
  forge_blast_furnace: [2, 3],
  forge_bombardiers: [2, 3],
  forge_flame_tower: [2, 3],
  forge_iron_drake: [2, 3],
  forge_smithy: [2, 3],
  forge_swordsmen: [2, 3],
  forge_throne: [2, 3],
  grove_bear_cave: [2, 3],
  grove_sapling: [2, 3],
  grove_spirit_stags: [2, 3],
  grove_spring: [2, 3],
  grove_thorn_tower: [2, 3],
  grove_throne: [2, 3],
  grove_treant: [2, 3],
  grove_wolf_den: [2, 3],
  moon_altar: [2, 3],
  moon_crypt: [2, 3],
  moon_reaper_shrine: [2, 3],
  moon_shadow_spire: [2, 3],
  moon_summoning_circle: [2, 3],
  moon_throne: [2, 3],
  moon_vampires: [2, 3],
  neutral_archer_tower: [2, 3],
  neutral_barracks: [2, 3],
  neutral_mercenary_camp: [2, 3],
  neutral_well: [2, 3],
  nomad_bazaar: [2, 3],
  nomad_caravan: [2, 3],
  nomad_horse_archers: [2, 3],
  nomad_khan_guard: [2, 3],
  nomad_riders: [2, 3],
  nomad_stables: [2, 3],
  nomad_throne: [2, 3],
  nomad_watchtower: [2, 3],
  stone_catapult: [2, 3],
  stone_crystal: [2, 3],
  stone_golem_forge: [2, 3],
  stone_miners: [2, 3],
  stone_mountain_heart: [2, 3],
  stone_quarry: [2, 3],
  stone_throne: [2, 3],
  stone_wall: [2, 3],
  tide_cannon: [2, 3],
  tide_harbor: [2, 3],
  tide_hookmen: [2, 3],
  tide_kraken: [2, 3],
  tide_pirates: [2, 3],
  tide_throne: [2, 3],
  tide_treasure: [2, 3],
  tide_wave_tower: [2, 3],
  wheat_field: [2, 3],
  wheat_granary: [2, 3],
  wheat_militia: [2, 3],
  wheat_peasant_horde: [2, 3],
  wheat_reapers: [2, 3],
  wheat_scarecrow: [2, 3],
  wheat_throne: [2, 3],
  wheat_windmill: [2, 3],
};

/** Which architecture a building level shows: 1 (base), 2 or 3. */
export const levelArt = (level: number): 1 | 2 | 3 => (level >= 3 ? 3 : level === 2 ? 2 : 1);

/** File of the L2/L3 image of `card` (base file + `_l2` / `_l3`). */
export const buildingLevelFile = (card: string, art: 2 | 3): string | null => {
  const base = IMAGE_BUILDINGS[card];
  return base === undefined ? null : `${base}_l${art}`;
};

/**
 * Building cards with an activity loop (20/11/2026, `docs/art-review/building-anim/`): three frames of the level-1
 * picture where only small parts move (flags, smoke, sparks, a catapult arm). Frame 0 is the approved picture, padded
 * like the others (frames may be larger than the base, feet anchor kept). Levels 2–3 stay still.
 */
export const IMAGE_BUILDING_ANIMS: readonly string[] = [
  'arcane_apprentices',
  'arcane_archmage',
  'arcane_library',
  'arcane_mage_tower',
  'arcane_throne',
  'arcane_ward',
  'clock_bell_tower',
  'clock_gear_tower',
  'clock_spiders',
  'clock_spring_workshop',
  'clock_steam_cannon',
  'clock_throne',
  'clock_windup_soldiers',
  'forge_armory',
  'forge_blast_furnace',
  'forge_bombardiers',
  'forge_flame_tower',
  'forge_iron_drake',
  'forge_smithy',
  'forge_throne',
  'grove_spring',
  'grove_thorn_tower',
  'grove_throne',
  'grove_treant',
  'moon_shadow_spire',
  'moon_summoning_circle',
  'moon_throne',
  'moon_vampires',
  'neutral_archer_tower',
  'neutral_barracks',
  'neutral_mercenary_camp',
  'neutral_well',
  'nomad_bazaar',
  'nomad_caravan',
  'nomad_horse_archers',
  'nomad_khan_guard',
  'nomad_riders',
  'nomad_stables',
  'nomad_throne',
  'nomad_watchtower',
  'stone_catapult',
  'stone_crystal',
  'stone_golem_forge',
  'stone_mountain_heart',
  'stone_throne',
  'tide_cannon',
  'tide_kraken',
  'tide_throne',
  'tide_wave_tower',
  'wheat_scarecrow',
  'wheat_throne',
];
export const BUILDING_ANIM_FRAMES = 3;
/** File of frame `i` of the activity loop of `card` (base file + `_anim<i>`). */
export const buildingAnimFile = (card: string, i: number): string | null => {
  const base = IMAGE_BUILDINGS[card];
  return base === undefined ? null : `${base}_anim${i}`;
};
const buildingAnimFiles = (card: string): string[] =>
  Array.from({ length: BUILDING_ANIM_FRAMES }, (_, i) => buildingAnimFile(card, i)).flatMap((f) => (f ? [f] : []));

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
export const DECOR_CATALOG: readonly { id: string; tall: boolean; radius: number; flat?: boolean }[] = [
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
  // small farm decoration (P2, 10/11/2026, `docs/art-review/iso-board/decor`; Claude under the owner's delegation)
  { id: 'barrel', tall: false, radius: 7 },
  { id: 'haystack', tall: false, radius: 12 },
  { id: 'sign', tall: false, radius: 7 },
  { id: 'wheat_cart', tall: false, radius: 16 },
  // environment objects (20/11/2026, `docs/art-review/env/`, 254 drawn by Codex; Claude under the owner's delegation)
  { id: 'tree_birch', tall: true, radius: 16 },
  { id: 'tree_willow', tall: true, radius: 26 },
  { id: 'tree_cherry', tall: true, radius: 24 },
  { id: 'tree_young_oak', tall: true, radius: 16 },
  { id: 'tree_fir_small', tall: true, radius: 13 },
  { id: 'tree_dead', tall: true, radius: 18 },
  { id: 'tree_fruit', tall: true, radius: 22 },
  { id: 'tree_bushy', tall: true, radius: 26 },
  { id: 'tree_pair', tall: true, radius: 30 },
  { id: 'tree_poplar', tall: true, radius: 13 },
  { id: 'tree_maple_red', tall: true, radius: 24 },
  { id: 'tree_spruce_blue', tall: true, radius: 17 },
  { id: 'crag_tall', tall: true, radius: 26 },
  { id: 'standing_stone', tall: true, radius: 10 },
  { id: 'standing_stones_ring', tall: true, radius: 30 },
  { id: 'crag_mossy', tall: true, radius: 28 },
  { id: 'rock_spire', tall: true, radius: 16 },
  { id: 'boulders_grassy', tall: true, radius: 30 },
  { id: 'boulder_mossy_a', tall: false, radius: 14 },
  { id: 'boulder_mossy_b', tall: false, radius: 12 },
  { id: 'rock_cluster_a', tall: false, radius: 14 },
  { id: 'rock_cluster_b', tall: false, radius: 12 },
  { id: 'pebbles_a', tall: false, radius: 8 },
  { id: 'pebbles_b', tall: false, radius: 9 },
  { id: 'rock_flat', tall: false, radius: 13 },
  { id: 'rock_split', tall: false, radius: 13 },
  { id: 'bush_flower_pink', tall: false, radius: 10 },
  { id: 'bush_flower_white', tall: false, radius: 10 },
  { id: 'bush_flower_yellow', tall: false, radius: 10 },
  { id: 'fern', tall: false, radius: 9 },
  { id: 'bush_holly', tall: false, radius: 10 },
  { id: 'topiary_round', tall: false, radius: 9 },
  { id: 'bramble', tall: false, radius: 12 },
  { id: 'bush_lavender', tall: false, radius: 10 },
  { id: 'grass_tuft_a', tall: false, radius: 6 },
  { id: 'grass_tuft_b', tall: false, radius: 7 },
  { id: 'grass_tall', tall: false, radius: 8 },
  { id: 'reeds', tall: false, radius: 8 },
  { id: 'cattails', tall: false, radius: 8 },
  { id: 'grass_dry', tall: false, radius: 7 },
  { id: 'clover_patch', tall: false, radius: 9 },
  { id: 'dandelions', tall: false, radius: 7 },
  { id: 'flowers_red', tall: false, radius: 8 },
  { id: 'flowers_blue', tall: false, radius: 8 },
  { id: 'flowers_yellow', tall: false, radius: 8 },
  { id: 'flowers_white', tall: false, radius: 8 },
  { id: 'flowers_purple', tall: false, radius: 7 },
  { id: 'flowers_mixed', tall: false, radius: 9 },
  { id: 'sunflowers', tall: false, radius: 7 },
  { id: 'tulips_orange', tall: false, radius: 7 },
  { id: 'mushroom_single', tall: false, radius: 5 },
  { id: 'mushroom_ring', tall: false, radius: 14 },
  { id: 'mushroom_red', tall: false, radius: 6 },
  { id: 'mushroom_cluster', tall: false, radius: 7 },
  { id: 'stump_moss', tall: false, radius: 10 },
  { id: 'stump_axe', tall: false, radius: 10 },
  { id: 'woodpile', tall: false, radius: 14 },
  { id: 'leaf_pile', tall: false, radius: 10 },
  { id: 'log_mushrooms', tall: false, radius: 16 },
  { id: 'log_hollow', tall: false, radius: 16 },
  { id: 'branches_fallen', tall: false, radius: 12 },
  { id: 'stump_small', tall: false, radius: 8 },
  { id: 'leaves_red', tall: false, radius: 10 },
  { id: 'rabbit_hole', tall: false, radius: 9 },
  { id: 'anthill', tall: false, radius: 8 },
  { id: 'thistles', tall: false, radius: 8 },
  { id: 'well_old', tall: false, radius: 16 },
  { id: 'pillar_ruined', tall: true, radius: 10 },
  { id: 'statue_broken', tall: false, radius: 12 },
  { id: 'shrine_stone', tall: false, radius: 11 },
  { id: 'cart_wheel_broken', tall: false, radius: 10 },
  { id: 'column_fallen', tall: false, radius: 18 },
  { id: 'ruin_wall', tall: false, radius: 20 },
  { id: 'milestone', tall: false, radius: 6 },
  { id: 'crate', tall: false, radius: 8 },
  { id: 'crates_stack', tall: false, radius: 12 },
  { id: 'sack', tall: false, radius: 7 },
  { id: 'sacks_pile', tall: false, radius: 12 },
  { id: 'hay_bale', tall: false, radius: 12 },
  { id: 'hay_bales_stack', tall: false, radius: 14 },
  { id: 'scarecrow', tall: false, radius: 8 },
  { id: 'campfire_unlit', tall: false, radius: 9 },
  { id: 'tent', tall: false, radius: 18 },
  { id: 'signpost_double', tall: false, radius: 7 },
  { id: 'lantern_post', tall: false, radius: 6 },
  { id: 'beehive', tall: false, radius: 8 },
  { id: 'bird_bath', tall: false, radius: 8 },
  { id: 'footpath_stones', tall: false, radius: 16 },
  { id: 'stepping_stones', tall: false, radius: 12 },
  { id: 'water_trough', tall: false, radius: 14 },
  { id: 'wheelbarrow', tall: false, radius: 12 },
  { id: 'pumpkins', tall: false, radius: 10 },
  { id: 'flower_pots', tall: false, radius: 7 },
  { id: 'bench', tall: false, radius: 12 },
  { id: 'rain_barrel', tall: false, radius: 8 },
  { id: 'buckets', tall: false, radius: 8 },
  { id: 'basket_apples', tall: false, radius: 6 },
  { id: 'firewood_chopping', tall: false, radius: 10 },
  { id: 'tree_pine_cluster', tall: true, radius: 28 },
  { id: 'tree_oak_old', tall: true, radius: 30 },
  { id: 'tree_yellow', tall: true, radius: 24 },
  { id: 'tree_sapling', tall: true, radius: 8 },
  { id: 'tree_blossom_white', tall: true, radius: 22 },
  { id: 'tree_broken', tall: true, radius: 16 },
  { id: 'rock_sand', tall: false, radius: 11 },
  { id: 'rock_dark', tall: false, radius: 11 },
  { id: 'rock_ore', tall: false, radius: 11 },
  { id: 'rock_round_pair', tall: false, radius: 10 },
  { id: 'boulder_lichen', tall: false, radius: 15 },
  { id: 'rocks_grass', tall: false, radius: 11 },
  { id: 'stone_cairn', tall: false, radius: 7 },
  { id: 'rock_crystal', tall: false, radius: 9 },
  { id: 'bush_round_dark', tall: false, radius: 10 },
  { id: 'bush_autumn', tall: false, radius: 10 },
  { id: 'bush_hydrangea', tall: false, radius: 10 },
  { id: 'bush_rose', tall: false, radius: 10 },
  { id: 'bush_berry_blue', tall: false, radius: 10 },
  { id: 'bush_tall_grass', tall: false, radius: 9 },
  { id: 'bush_juniper', tall: false, radius: 12 },
  { id: 'bush_sprouts', tall: false, radius: 7 },
  { id: 'tree_pine_tall', tall: true, radius: 14 },
  { id: 'tree_copper_beech', tall: true, radius: 24 },
  { id: 'tree_rowan', tall: true, radius: 20 },
  { id: 'tree_larch_gold', tall: true, radius: 15 },
  { id: 'tree_olive', tall: true, radius: 22 },
  { id: 'stump_sprouting', tall: false, radius: 12 },
  { id: 'rock_arch', tall: true, radius: 28 },
  { id: 'crag_flat_top', tall: true, radius: 30 },
  { id: 'boulder_giant', tall: true, radius: 24 },
  { id: 'rock_pillars', tall: true, radius: 20 },
  { id: 'crag_tree', tall: true, radius: 26 },
  { id: 'cave_mouth', tall: true, radius: 30 },
  { id: 'pond_small', tall: false, radius: 20 },
  { id: 'puddle', tall: false, radius: 12 },
  { id: 'log_long', tall: false, radius: 24 },
  { id: 'roots_exposed', tall: false, radius: 12 },
  { id: 'moss_patch', tall: false, radius: 11 },
  { id: 'rock_vines', tall: false, radius: 12 },
  { id: 'fern_large', tall: false, radius: 12 },
  { id: 'mushroom_giant', tall: false, radius: 9 },
  { id: 'hitching_post', tall: false, radius: 12 },
  { id: 'grindstone', tall: false, radius: 9 },
  { id: 'millstone', tall: false, radius: 12 },
  { id: 'plough', tall: false, radius: 14 },
  { id: 'barrel_pair', tall: false, radius: 11 },
  { id: 'fence_broken', tall: false, radius: 14 },
  { id: 'washtub', tall: false, radius: 9 },
  { id: 'woodcart_small', tall: false, radius: 14 },
  { id: 'cosmos_pink', tall: false, radius: 8 },
  { id: 'foxgloves', tall: false, radius: 7 },
  { id: 'bluebells', tall: false, radius: 8 },
  { id: 'marigolds', tall: false, radius: 8 },
  { id: 'lilies_white', tall: false, radius: 8 },
  { id: 'heather', tall: false, radius: 10 },
  { id: 'forget_me_nots', tall: false, radius: 8 },
  { id: 'wild_garlic', tall: false, radius: 9 },
  { id: 'stone_bench', tall: false, radius: 12 },
  { id: 'arch_broken', tall: true, radius: 18 },
  { id: 'rune_stone', tall: false, radius: 8 },
  { id: 'stone_steps', tall: false, radius: 14 },
  { id: 'obelisk_small', tall: false, radius: 8 },
  { id: 'fountain_dry', tall: false, radius: 16 },
  { id: 'statue_lion', tall: false, radius: 10 },
  { id: 'stone_lantern', tall: false, radius: 7 },
  { id: 'tree_round_small', tall: true, radius: 16 },
  { id: 'tree_oak_orange', tall: true, radius: 24 },
  { id: 'tree_birch_twin', tall: true, radius: 18 },
  { id: 'tree_leaning', tall: true, radius: 22 },
  { id: 'tree_cypress', tall: true, radius: 11 },
  { id: 'tree_mossy_ancient', tall: true, radius: 26 },
  { id: 'crag_red', tall: true, radius: 26 },
  { id: 'crag_mossy_tall', tall: true, radius: 18 },
  { id: 'boulders_field', tall: true, radius: 32 },
  { id: 'rocky_hill', tall: true, radius: 32 },
  { id: 'crag_slate', tall: true, radius: 24 },
  { id: 'standing_stones_pair', tall: true, radius: 18 },
  { id: 'lily_pads', tall: false, radius: 10 },
  { id: 'driftwood', tall: false, radius: 13 },
  { id: 'rowboat', tall: false, radius: 20 },
  { id: 'fishing_basket', tall: false, radius: 7 },
  { id: 'mooring_post', tall: false, radius: 6 },
  { id: 'wet_stones', tall: false, radius: 11 },
  { id: 'reeds_wide', tall: false, radius: 12 },
  { id: 'marsh_grass', tall: false, radius: 10 },
  { id: 'hedge_segment', tall: false, radius: 16 },
  { id: 'bush_small_round', tall: false, radius: 8 },
  { id: 'bush_leafy_wide', tall: false, radius: 13 },
  { id: 'bush_flower_red', tall: false, radius: 10 },
  { id: 'bush_lilac', tall: false, radius: 11 },
  { id: 'bush_dead', tall: false, radius: 10 },
  { id: 'bush_gooseberry', tall: false, radius: 10 },
  { id: 'bush_rock', tall: false, radius: 12 },
  { id: 'grass_flowers_patch', tall: false, radius: 8 },
  { id: 'grass_clump_wide', tall: false, radius: 10 },
  { id: 'wheat_wild', tall: false, radius: 7 },
  { id: 'grass_seedheads', tall: false, radius: 7 },
  { id: 'grass_short_cluster', tall: false, radius: 9 },
  { id: 'sedge', tall: false, radius: 8 },
  { id: 'horsetail', tall: false, radius: 7 },
  { id: 'grass_bluish', tall: false, radius: 7 },
  { id: 'bedroll', tall: false, radius: 10 },
  { id: 'cooking_tripod', tall: false, radius: 10 },
  { id: 'log_seat', tall: false, radius: 12 },
  { id: 'banner_pole', tall: false, radius: 6 },
  { id: 'weapon_rack', tall: false, radius: 12 },
  { id: 'archery_target', tall: false, radius: 10 },
  { id: 'chest_small', tall: false, radius: 8 },
  { id: 'tent_green', tall: false, radius: 16 },
  { id: 'tree_pear', tall: true, radius: 22 },
  { id: 'tree_chestnut', tall: true, radius: 26 },
  { id: 'tree_hawthorn', tall: true, radius: 18 },
  { id: 'tree_elm', tall: true, radius: 24 },
  { id: 'tree_pine_pair', tall: true, radius: 20 },
  { id: 'tree_hollow', tall: true, radius: 22 },
  { id: 'rock_mossy_flat', tall: false, radius: 12 },
  { id: 'rock_pointed', tall: false, radius: 8 },
  { id: 'rocks_tiny_pair', tall: false, radius: 7 },
  { id: 'boulder_cracked', tall: false, radius: 13 },
  { id: 'rock_quartz', tall: false, radius: 10 },
  { id: 'rock_brown_round', tall: false, radius: 10 },
  { id: 'gravel_patch', tall: false, radius: 12 },
  { id: 'rocks_flowers', tall: false, radius: 11 },
  { id: 'cabbages', tall: false, radius: 12 },
  { id: 'milk_churns', tall: false, radius: 8 },
  { id: 'pitchfork_hay', tall: false, radius: 11 },
  { id: 'chicken_coop', tall: false, radius: 14 },
  { id: 'tools_leaning', tall: false, radius: 8 },
  { id: 'apple_crate', tall: false, radius: 9 },
  { id: 'wheat_sheaf', tall: false, radius: 7 },
  { id: 'feed_trough', tall: false, radius: 12 },
  { id: 'stumps_cluster', tall: false, radius: 13 },
  { id: 'sapling_small', tall: false, radius: 6 },
  { id: 'fern_mix', tall: false, radius: 10 },
  { id: 'hollyhocks', tall: false, radius: 8 },
  { id: 'wild_strawberries', tall: false, radius: 9 },
  { id: 'clover_flowers', tall: false, radius: 9 },
  { id: 'rock_flowers_purple', tall: false, radius: 11 },
  { id: 'log_small_mushroom', tall: false, radius: 10 },
  { id: 'wall_corner_ruin', tall: false, radius: 18 },
  { id: 'pillar_stump', tall: false, radius: 9 },
  { id: 'floor_tiles_broken', tall: false, radius: 16 },
  { id: 'stairs_ruin', tall: false, radius: 16 },
  { id: 'statue_head', tall: false, radius: 13 },
  { id: 'urn_broken', tall: false, radius: 9 },
  { id: 'gate_posts', tall: false, radius: 16 },
  { id: 'well_ruined', tall: false, radius: 14 },
  { id: 'signpost_left', tall: false, radius: 7 },
  { id: 'notice_board', tall: false, radius: 12 },
  { id: 'road_marker', tall: false, radius: 5 },
  { id: 'carved_pole', tall: false, radius: 6 },
  { id: 'lamp_stone', tall: false, radius: 6 },
  { id: 'flag_marker', tall: false, radius: 4 },
  { id: 'boundary_stones', tall: false, radius: 14 },
  { id: 'wishing_stones', tall: false, radius: 8 },
  // flat ground patches (20/11/2026, `docs/art-review/env/ground/`; Claude under the owner's delegation)
  { id: 'decal_dirt_round', tall: false, radius: 24, flat: true },
  { id: 'decal_dirt_oval', tall: false, radius: 27, flat: true },
  { id: 'decal_dirt_kidney', tall: false, radius: 24, flat: true },
  { id: 'decal_dirt_small', tall: false, radius: 12, flat: true },
  { id: 'decal_dirt_scatter', tall: false, radius: 24, flat: true },
  { id: 'decal_dirt_worn', tall: false, radius: 25, flat: true },
  { id: 'decal_dirt_dark', tall: false, radius: 24, flat: true },
  { id: 'decal_dirt_pebbly', tall: false, radius: 24, flat: true },
  { id: 'decal_dirt_mole', tall: false, radius: 18, flat: true },
  { id: 'decal_clover_a', tall: false, radius: 18, flat: true },
  { id: 'decal_clover_b', tall: false, radius: 21, flat: true },
  { id: 'decal_clover_c', tall: false, radius: 25, flat: true },
  { id: 'decal_clover_d', tall: false, radius: 13, flat: true },
  { id: 'decal_tufts_a', tall: false, radius: 20, flat: true },
  { id: 'decal_tufts_b', tall: false, radius: 23, flat: true },
  { id: 'decal_tufts_c', tall: false, radius: 16, flat: true },
  { id: 'decal_tufts_dry', tall: false, radius: 22, flat: true },
  { id: 'decal_weeds', tall: false, radius: 21, flat: true },
  { id: 'decal_flowers_white', tall: false, radius: 25, flat: true },
  { id: 'decal_flowers_yellow', tall: false, radius: 25, flat: true },
  { id: 'decal_flowers_pink', tall: false, radius: 24, flat: true },
  { id: 'decal_flowers_lilac', tall: false, radius: 24, flat: true },
  { id: 'decal_flowers_blue', tall: false, radius: 23, flat: true },
  { id: 'decal_flowers_red', tall: false, radius: 23, flat: true },
  { id: 'decal_flowers_orange', tall: false, radius: 23, flat: true },
  { id: 'decal_flowers_mixed', tall: false, radius: 29, flat: true },
  { id: 'decal_flowers_dandelion', tall: false, radius: 23, flat: true },
  { id: 'decal_pebbles_a', tall: false, radius: 23, flat: true },
  { id: 'decal_pebbles_b', tall: false, radius: 24, flat: true },
  { id: 'decal_pebbles_c', tall: false, radius: 11, flat: true },
  { id: 'decal_stepping', tall: false, radius: 26, flat: true },
  { id: 'decal_moss_a', tall: false, radius: 23, flat: true },
  { id: 'decal_moss_b', tall: false, radius: 26, flat: true },
  { id: 'decal_moss_c', tall: false, radius: 16, flat: true },
  { id: 'decal_moss_stone', tall: false, radius: 22, flat: true },
  { id: 'decal_lichen', tall: false, radius: 19, flat: true },
  { id: 'decal_leaves_orange', tall: false, radius: 24, flat: true },
  { id: 'decal_leaves_red', tall: false, radius: 22, flat: true },
  { id: 'decal_leaves_yellow', tall: false, radius: 22, flat: true },
  { id: 'decal_leaves_brown', tall: false, radius: 23, flat: true },
  { id: 'decal_puddle_a', tall: false, radius: 22, flat: true },
  { id: 'decal_puddle_b', tall: false, radius: 25, flat: true },
  { id: 'decal_puddle_c', tall: false, radius: 13, flat: true },
  { id: 'decal_mud', tall: false, radius: 24, flat: true },
  { id: 'decal_puddle_leaf', tall: false, radius: 18, flat: true },
  { id: 'decal_fairy_ring_a', tall: false, radius: 26, flat: true },
  { id: 'decal_fairy_ring_b', tall: false, radius: 27, flat: true },
  { id: 'decal_cracked_a', tall: false, radius: 27, flat: true },
  { id: 'decal_cracked_b', tall: false, radius: 18, flat: true },
  { id: 'decal_cracked_c', tall: false, radius: 29, flat: true },
  { id: 'decal_sand_a', tall: false, radius: 26, flat: true },
  { id: 'decal_sand_b', tall: false, radius: 26, flat: true },
  { id: 'decal_sand_c', tall: false, radius: 16, flat: true },
  { id: 'decal_scorched_a', tall: false, radius: 26, flat: true },
  { id: 'decal_footprints', tall: false, radius: 24, flat: true },
  { id: 'decal_hoofprints', tall: false, radius: 23, flat: true },
  { id: 'decal_pawprints', tall: false, radius: 20, flat: true },
  { id: 'decal_cart_tracks_a', tall: false, radius: 25, flat: true },
  { id: 'decal_cart_tracks_b', tall: false, radius: 25, flat: true },
  { id: 'decal_cart_tracks_c', tall: false, radius: 21, flat: true },
  { id: 'decal_scorched_b', tall: false, radius: 16, flat: true },
  { id: 'decal_scorched_c', tall: false, radius: 26, flat: true },
  { id: 'decal_campfire_ash', tall: false, radius: 19, flat: true },
  { id: 'decal_edge_dirt_a', tall: false, radius: 28, flat: true },
  { id: 'decal_edge_dirt_b', tall: false, radius: 28, flat: true },
  { id: 'decal_edge_dirt_c', tall: false, radius: 21, flat: true },
  { id: 'decal_edge_trampled', tall: false, radius: 28, flat: true },
  { id: 'decal_edge_burrow', tall: false, radius: 22, flat: true },
  { id: 'decal_edge_rootball', tall: false, radius: 28, flat: true },
  { id: 'decal_edge_gravel', tall: false, radius: 26, flat: true },
  { id: 'decal_edge_clay', tall: false, radius: 25, flat: true },
  { id: 'decal_edge_ashgrey', tall: false, radius: 23, flat: true },
  { id: 'decal_bloom_white_s', tall: false, radius: 18, flat: true },
  { id: 'decal_bloom_yellow_s', tall: false, radius: 20, flat: true },
  { id: 'decal_bloom_pink_s', tall: false, radius: 20, flat: true },
  { id: 'decal_bloom_violet_s', tall: false, radius: 19, flat: true },
  { id: 'decal_bloom_blue_s', tall: false, radius: 19, flat: true },
  { id: 'decal_bloom_red_s', tall: false, radius: 20, flat: true },
  { id: 'decal_bloom_line', tall: false, radius: 25, flat: true },
  { id: 'decal_bloom_ring', tall: false, radius: 22, flat: true },
  { id: 'decal_bloom_heather', tall: false, radius: 24, flat: true },
  { id: 'decal_twigs', tall: false, radius: 23, flat: true },
  { id: 'decal_straw', tall: false, radius: 24, flat: true },
  { id: 'decal_woodchips', tall: false, radius: 20, flat: true },
  { id: 'decal_acorns', tall: false, radius: 19, flat: true },
  { id: 'decal_pinecones', tall: false, radius: 22, flat: true },
  { id: 'decal_mushrooms_flat', tall: false, radius: 15, flat: true },
  { id: 'decal_seed_spill', tall: false, radius: 23, flat: true },
  { id: 'decal_shards', tall: false, radius: 20, flat: true },
  { id: 'decal_feathers', tall: false, radius: 20, flat: true },
  { id: 'decal_big_dirt', tall: false, radius: 27, flat: true },
  { id: 'decal_big_meadow', tall: false, radius: 26, flat: true },
  { id: 'decal_big_clover', tall: false, radius: 26, flat: true },
  { id: 'decal_big_sand', tall: false, radius: 27, flat: true },
  { id: 'decal_big_moss', tall: false, radius: 27, flat: true },
  { id: 'decal_big_leaves', tall: false, radius: 27, flat: true },
  { id: 'decal_big_gravel', tall: false, radius: 27, flat: true },
  { id: 'decal_big_mud', tall: false, radius: 27, flat: true },
  { id: 'decal_big_drygrass', tall: false, radius: 27, flat: true },
  { id: 'decal_path_stones', tall: false, radius: 26, flat: true },
  { id: 'decal_path_dirt_bend', tall: false, radius: 26, flat: true },
  { id: 'decal_path_flagstones', tall: false, radius: 26, flat: true },
  { id: 'decal_path_planks', tall: false, radius: 25, flat: true },
  { id: 'decal_path_cobbles', tall: false, radius: 24, flat: true },
  { id: 'decal_path_gravel', tall: false, radius: 26, flat: true },
  { id: 'decal_path_crossing', tall: false, radius: 24, flat: true },
  { id: 'decal_path_end', tall: false, radius: 24, flat: true },
  { id: 'decal_path_brick', tall: false, radius: 25, flat: true },
  { id: 'decal_glow_mushrooms', tall: false, radius: 20, flat: true },
  { id: 'decal_flower_circle', tall: false, radius: 26, flat: true },
  { id: 'decal_stone_circle', tall: false, radius: 25, flat: true },
  { id: 'decal_crop_circle', tall: false, radius: 25, flat: true },
  { id: 'decal_salt_ring', tall: false, radius: 26, flat: true },
  { id: 'decal_spilled_coins', tall: false, radius: 18, flat: true },
  { id: 'decal_old_well_cover', tall: false, radius: 21, flat: true },
  { id: 'decal_horseshoe', tall: false, radius: 19, flat: true },
  { id: 'decal_dirt_round_2', tall: false, radius: 27, flat: true },
  { id: 'decal_dirt_oval_2', tall: false, radius: 27, flat: true },
  { id: 'decal_dirt_kidney_2', tall: false, radius: 25, flat: true },
  { id: 'decal_dirt_small_2', tall: false, radius: 13, flat: true },
  { id: 'decal_dirt_scatter_2', tall: false, radius: 20, flat: true },
  { id: 'decal_dirt_worn_2', tall: false, radius: 26, flat: true },
  { id: 'decal_dirt_dark_2', tall: false, radius: 22, flat: true },
  { id: 'decal_dirt_pebbly_2', tall: false, radius: 24, flat: true },
  { id: 'decal_dirt_mole_2', tall: false, radius: 18, flat: true },
  { id: 'decal_clover_a_2', tall: false, radius: 23, flat: true },
  { id: 'decal_clover_b_2', tall: false, radius: 19, flat: true },
  { id: 'decal_clover_c_2', tall: false, radius: 27, flat: true },
  { id: 'decal_clover_d_2', tall: false, radius: 13, flat: true },
  { id: 'decal_tufts_a_2', tall: false, radius: 19, flat: true },
  { id: 'decal_tufts_b_2', tall: false, radius: 24, flat: true },
  { id: 'decal_tufts_c_2', tall: false, radius: 16, flat: true },
  { id: 'decal_tufts_dry_2', tall: false, radius: 23, flat: true },
  { id: 'decal_weeds_2', tall: false, radius: 23, flat: true },
  { id: 'decal_flowers_white_2', tall: false, radius: 25, flat: true },
  { id: 'decal_flowers_yellow_2', tall: false, radius: 24, flat: true },
  { id: 'decal_flowers_pink_2', tall: false, radius: 23, flat: true },
  { id: 'decal_flowers_lilac_2', tall: false, radius: 25, flat: true },
  { id: 'decal_flowers_blue_2', tall: false, radius: 21, flat: true },
  { id: 'decal_flowers_red_2', tall: false, radius: 23, flat: true },
  { id: 'decal_flowers_orange_2', tall: false, radius: 20, flat: true },
  { id: 'decal_flowers_mixed_2', tall: false, radius: 27, flat: true },
  { id: 'decal_flowers_dandelion_2', tall: false, radius: 23, flat: true },
  { id: 'decal_pebbles_a_2', tall: false, radius: 24, flat: true },
  { id: 'decal_pebbles_b_2', tall: false, radius: 23, flat: true },
  { id: 'decal_pebbles_c_2', tall: false, radius: 13, flat: true },
  { id: 'decal_stepping_2', tall: false, radius: 26, flat: true },
  { id: 'decal_moss_a_2', tall: false, radius: 23, flat: true },
  { id: 'decal_moss_b_2', tall: false, radius: 26, flat: true },
  { id: 'decal_moss_c_2', tall: false, radius: 14, flat: true },
  { id: 'decal_moss_stone_2', tall: false, radius: 23, flat: true },
  { id: 'decal_lichen_2', tall: false, radius: 23, flat: true },
  { id: 'decal_leaves_orange_2', tall: false, radius: 23, flat: true },
  { id: 'decal_leaves_red_2', tall: false, radius: 23, flat: true },
  { id: 'decal_leaves_yellow_2', tall: false, radius: 23, flat: true },
  { id: 'decal_leaves_brown_2', tall: false, radius: 24, flat: true },
  { id: 'decal_puddle_a_2', tall: false, radius: 23, flat: true },
  { id: 'decal_puddle_b_2', tall: false, radius: 26, flat: true },
  { id: 'decal_puddle_c_2', tall: false, radius: 11, flat: true },
  { id: 'decal_mud_2', tall: false, radius: 24, flat: true },
  { id: 'decal_puddle_leaf_2', tall: false, radius: 19, flat: true },
  { id: 'decal_fairy_ring_a_2', tall: false, radius: 28, flat: true },
  { id: 'decal_fairy_ring_b_2', tall: false, radius: 25, flat: true },
  { id: 'decal_cracked_a_2', tall: false, radius: 27, flat: true },
  { id: 'decal_cracked_b_2', tall: false, radius: 17, flat: true },
  { id: 'decal_cracked_c_2', tall: false, radius: 30, flat: true },
  { id: 'decal_sand_a_2', tall: false, radius: 23, flat: true },
  { id: 'decal_sand_b_2', tall: false, radius: 28, flat: true },
  { id: 'decal_sand_c_2', tall: false, radius: 16, flat: true },
  { id: 'decal_scorched_a_2', tall: false, radius: 28, flat: true },
  { id: 'decal_footprints_2', tall: false, radius: 21, flat: true },
  { id: 'decal_hoofprints_2', tall: false, radius: 21, flat: true },
  { id: 'decal_pawprints_2', tall: false, radius: 18, flat: true },
  { id: 'decal_cart_tracks_a_2', tall: false, radius: 23, flat: true },
  { id: 'decal_cart_tracks_b_2', tall: false, radius: 23, flat: true },
  { id: 'decal_cart_tracks_c_2', tall: false, radius: 19, flat: true },
  { id: 'decal_scorched_b_2', tall: false, radius: 14, flat: true },
  { id: 'decal_scorched_c_2', tall: false, radius: 25, flat: true },
  { id: 'decal_campfire_ash_2', tall: false, radius: 17, flat: true },
  { id: 'decal_edge_dirt_a_2', tall: false, radius: 28, flat: true },
  { id: 'decal_edge_dirt_b_2', tall: false, radius: 29, flat: true },
  { id: 'decal_edge_dirt_c_2', tall: false, radius: 21, flat: true },
  { id: 'decal_edge_trampled_2', tall: false, radius: 28, flat: true },
  { id: 'decal_edge_burrow_2', tall: false, radius: 21, flat: true },
  { id: 'decal_edge_rootball_2', tall: false, radius: 29, flat: true },
  { id: 'decal_edge_gravel_2', tall: false, radius: 28, flat: true },
  { id: 'decal_edge_clay_2', tall: false, radius: 25, flat: true },
  { id: 'decal_edge_ashgrey_2', tall: false, radius: 24, flat: true },
  { id: 'decal_bloom_white_s_2', tall: false, radius: 23, flat: true },
  { id: 'decal_bloom_yellow_s_2', tall: false, radius: 22, flat: true },
  { id: 'decal_bloom_pink_s_2', tall: false, radius: 21, flat: true },
  { id: 'decal_bloom_violet_s_2', tall: false, radius: 22, flat: true },
  { id: 'decal_bloom_blue_s_2', tall: false, radius: 21, flat: true },
  { id: 'decal_bloom_red_s_2', tall: false, radius: 22, flat: true },
  { id: 'decal_bloom_line_2', tall: false, radius: 25, flat: true },
  { id: 'decal_bloom_ring_2', tall: false, radius: 23, flat: true },
  { id: 'decal_bloom_heather_2', tall: false, radius: 24, flat: true },
  { id: 'decal_twigs_2', tall: false, radius: 22, flat: true },
  { id: 'decal_straw_2', tall: false, radius: 24, flat: true },
  { id: 'decal_woodchips_2', tall: false, radius: 22, flat: true },
  { id: 'decal_acorns_2', tall: false, radius: 19, flat: true },
  { id: 'decal_pinecones_2', tall: false, radius: 22, flat: true },
  { id: 'decal_mushrooms_flat_2', tall: false, radius: 13, flat: true },
  { id: 'decal_seed_spill_2', tall: false, radius: 19, flat: true },
  { id: 'decal_shards_2', tall: false, radius: 20, flat: true },
  { id: 'decal_feathers_2', tall: false, radius: 17, flat: true },
  { id: 'decal_big_dirt_2', tall: false, radius: 27, flat: true },
  { id: 'decal_big_meadow_2', tall: false, radius: 26, flat: true },
  { id: 'decal_big_clover_2', tall: false, radius: 26, flat: true },
  { id: 'decal_big_sand_2', tall: false, radius: 27, flat: true },
  { id: 'decal_big_moss_2', tall: false, radius: 26, flat: true },
  { id: 'decal_big_leaves_2', tall: false, radius: 27, flat: true },
  { id: 'decal_big_gravel_2', tall: false, radius: 27, flat: true },
  { id: 'decal_big_mud_2', tall: false, radius: 27, flat: true },
  { id: 'decal_big_drygrass_2', tall: false, radius: 27, flat: true },
  { id: 'decal_path_stones_2', tall: false, radius: 24, flat: true },
  { id: 'decal_path_dirt_bend_2', tall: false, radius: 24, flat: true },
  { id: 'decal_path_flagstones_2', tall: false, radius: 25, flat: true },
  { id: 'decal_path_planks_2', tall: false, radius: 25, flat: true },
  { id: 'decal_path_cobbles_2', tall: false, radius: 24, flat: true },
  { id: 'decal_path_gravel_2', tall: false, radius: 26, flat: true },
  { id: 'decal_path_crossing_2', tall: false, radius: 24, flat: true },
  { id: 'decal_path_end_2', tall: false, radius: 23, flat: true },
  { id: 'decal_path_brick_2', tall: false, radius: 23, flat: true },
  { id: 'decal_rune_circle_2', tall: false, radius: 24, flat: true },
  { id: 'decal_glow_mushrooms_2', tall: false, radius: 18, flat: true },
  { id: 'decal_flower_circle_2', tall: false, radius: 23, flat: true },
  { id: 'decal_stone_circle_2', tall: false, radius: 23, flat: true },
  { id: 'decal_crop_circle_2', tall: false, radius: 22, flat: true },
  { id: 'decal_salt_ring_2', tall: false, radius: 24, flat: true },
  { id: 'decal_spilled_coins_2', tall: false, radius: 17, flat: true },
  { id: 'decal_old_well_cover_2', tall: false, radius: 20, flat: true },
  { id: 'decal_horseshoe_2', tall: false, radius: 19, flat: true },
  { id: 'decal_dirt_round_3', tall: false, radius: 23, flat: true },
  { id: 'decal_dirt_oval_3', tall: false, radius: 27, flat: true },
  { id: 'decal_dirt_kidney_3', tall: false, radius: 24, flat: true },
  { id: 'decal_dirt_small_3', tall: false, radius: 13, flat: true },
  { id: 'decal_dirt_scatter_3', tall: false, radius: 24, flat: true },
  { id: 'decal_dirt_worn_3', tall: false, radius: 25, flat: true },
  { id: 'decal_dirt_dark_3', tall: false, radius: 22, flat: true },
  { id: 'decal_dirt_pebbly_3', tall: false, radius: 24, flat: true },
  { id: 'decal_dirt_mole_3', tall: false, radius: 17, flat: true },
  { id: 'decal_clover_a_3', tall: false, radius: 26, flat: true },
  { id: 'decal_clover_d_3', tall: false, radius: 16, flat: true },
  { id: 'decal_tufts_a_3', tall: false, radius: 20, flat: true },
  { id: 'decal_tufts_b_3', tall: false, radius: 25, flat: true },
  { id: 'decal_tufts_c_3', tall: false, radius: 14, flat: true },
  { id: 'decal_tufts_dry_3', tall: false, radius: 22, flat: true },
  { id: 'decal_weeds_3', tall: false, radius: 23, flat: true },
  { id: 'decal_flowers_white_3', tall: false, radius: 25, flat: true },
  { id: 'decal_flowers_yellow_3', tall: false, radius: 24, flat: true },
  { id: 'decal_flowers_pink_3', tall: false, radius: 23, flat: true },
  { id: 'decal_flowers_lilac_3', tall: false, radius: 25, flat: true },
  { id: 'decal_flowers_blue_3', tall: false, radius: 22, flat: true },
  { id: 'decal_flowers_red_3', tall: false, radius: 24, flat: true },
  { id: 'decal_flowers_orange_3', tall: false, radius: 22, flat: true },
  { id: 'decal_flowers_mixed_3', tall: false, radius: 28, flat: true },
  { id: 'decal_flowers_dandelion_3', tall: false, radius: 23, flat: true },
  { id: 'decal_pebbles_a_3', tall: false, radius: 23, flat: true },
  { id: 'decal_pebbles_b_3', tall: false, radius: 23, flat: true },
  { id: 'decal_pebbles_c_3', tall: false, radius: 9, flat: true },
  { id: 'decal_stepping_3', tall: false, radius: 22, flat: true },
  { id: 'decal_moss_a_3', tall: false, radius: 21, flat: true },
  { id: 'decal_moss_b_3', tall: false, radius: 24, flat: true },
  { id: 'decal_moss_c_3', tall: false, radius: 14, flat: true },
  { id: 'decal_moss_stone_3', tall: false, radius: 19, flat: true },
  { id: 'decal_lichen_3', tall: false, radius: 20, flat: true },
  { id: 'decal_leaves_orange_3', tall: false, radius: 25, flat: true },
  { id: 'decal_leaves_red_3', tall: false, radius: 23, flat: true },
  { id: 'decal_leaves_yellow_3', tall: false, radius: 24, flat: true },
  { id: 'decal_leaves_brown_3', tall: false, radius: 25, flat: true },
  { id: 'decal_puddle_a_3', tall: false, radius: 20, flat: true },
  { id: 'decal_puddle_b_3', tall: false, radius: 27, flat: true },
  { id: 'decal_puddle_c_3', tall: false, radius: 13, flat: true },
  { id: 'decal_mud_3', tall: false, radius: 25, flat: true },
  { id: 'decal_puddle_leaf_3', tall: false, radius: 18, flat: true },
  { id: 'decal_fairy_ring_a_3', tall: false, radius: 27, flat: true },
  { id: 'decal_fairy_ring_b_3', tall: false, radius: 23, flat: true },
  { id: 'decal_cracked_a_3', tall: false, radius: 28, flat: true },
  { id: 'decal_cracked_b_3', tall: false, radius: 17, flat: true },
  { id: 'decal_cracked_c_3', tall: false, radius: 29, flat: true },
  { id: 'decal_sand_a_3', tall: false, radius: 23, flat: true },
  { id: 'decal_sand_b_3', tall: false, radius: 27, flat: true },
  { id: 'decal_sand_c_3', tall: false, radius: 15, flat: true },
  { id: 'decal_scorched_a_3', tall: false, radius: 27, flat: true },
  { id: 'decal_footprints_3', tall: false, radius: 25, flat: true },
  { id: 'decal_hoofprints_3', tall: false, radius: 28, flat: true },
  { id: 'decal_pawprints_3', tall: false, radius: 22, flat: true },
  { id: 'decal_cart_tracks_a_3', tall: false, radius: 26, flat: true },
  { id: 'decal_cart_tracks_b_3', tall: false, radius: 25, flat: true },
  { id: 'decal_cart_tracks_c_3', tall: false, radius: 24, flat: true },
  { id: 'decal_scorched_b_3', tall: false, radius: 16, flat: true },
  { id: 'decal_scorched_c_3', tall: false, radius: 28, flat: true },
  { id: 'decal_campfire_ash_3', tall: false, radius: 21, flat: true },
  { id: 'decal_edge_dirt_a_3', tall: false, radius: 28, flat: true },
  { id: 'decal_edge_trampled_3', tall: false, radius: 27, flat: true },
  { id: 'decal_edge_burrow_3', tall: false, radius: 19, flat: true },
  { id: 'decal_edge_rootball_3', tall: false, radius: 28, flat: true },
  { id: 'decal_edge_gravel_3', tall: false, radius: 28, flat: true },
  { id: 'decal_edge_clay_3', tall: false, radius: 25, flat: true },
  { id: 'decal_edge_ashgrey_3', tall: false, radius: 23, flat: true },
  { id: 'decal_bloom_white_s_3', tall: false, radius: 17, flat: true },
  { id: 'decal_bloom_yellow_s_3', tall: false, radius: 17, flat: true },
  { id: 'decal_bloom_pink_s_3', tall: false, radius: 17, flat: true },
  { id: 'decal_bloom_violet_s_3', tall: false, radius: 18, flat: true },
  { id: 'decal_bloom_blue_s_3', tall: false, radius: 17, flat: true },
  { id: 'decal_bloom_red_s_3', tall: false, radius: 17, flat: true },
  { id: 'decal_bloom_line_3', tall: false, radius: 25, flat: true },
  { id: 'decal_bloom_ring_3', tall: false, radius: 20, flat: true },
  { id: 'decal_bloom_heather_3', tall: false, radius: 24, flat: true },
  { id: 'decal_twigs_3', tall: false, radius: 17, flat: true },
  { id: 'decal_straw_3', tall: false, radius: 22, flat: true },
  { id: 'decal_woodchips_3', tall: false, radius: 18, flat: true },
  { id: 'decal_acorns_3', tall: false, radius: 16, flat: true },
  { id: 'decal_pinecones_3', tall: false, radius: 15, flat: true },
  { id: 'decal_mushrooms_flat_3', tall: false, radius: 12, flat: true },
  { id: 'decal_seed_spill_3', tall: false, radius: 18, flat: true },
  { id: 'decal_shards_3', tall: false, radius: 17, flat: true },
  { id: 'decal_feathers_3', tall: false, radius: 16, flat: true },
  { id: 'decal_big_dirt_3', tall: false, radius: 26, flat: true },
  { id: 'decal_big_meadow_3', tall: false, radius: 27, flat: true },
  { id: 'decal_big_clover_3', tall: false, radius: 27, flat: true },
  { id: 'decal_big_sand_3', tall: false, radius: 27, flat: true },
  { id: 'decal_big_moss_3', tall: false, radius: 26, flat: true },
  { id: 'decal_big_leaves_3', tall: false, radius: 27, flat: true },
  { id: 'decal_big_gravel_3', tall: false, radius: 26, flat: true },
  { id: 'decal_big_mud_3', tall: false, radius: 26, flat: true },
  { id: 'decal_big_drygrass_3', tall: false, radius: 27, flat: true },
  { id: 'decal_path_stones_3', tall: false, radius: 23, flat: true },
  { id: 'decal_path_dirt_bend_3', tall: false, radius: 23, flat: true },
  { id: 'decal_path_flagstones_3', tall: false, radius: 22, flat: true },
  { id: 'decal_path_planks_3', tall: false, radius: 24, flat: true },
  { id: 'decal_path_cobbles_3', tall: false, radius: 23, flat: true },
  { id: 'decal_path_gravel_3', tall: false, radius: 22, flat: true },
  { id: 'decal_path_crossing_3', tall: false, radius: 22, flat: true },
  { id: 'decal_path_end_3', tall: false, radius: 23, flat: true },
  { id: 'decal_path_brick_3', tall: false, radius: 23, flat: true },
  { id: 'decal_glow_mushrooms_3', tall: false, radius: 16, flat: true },
  { id: 'decal_flower_circle_3', tall: false, radius: 23, flat: true },
  { id: 'decal_stone_circle_3', tall: false, radius: 23, flat: true },
  { id: 'decal_crop_circle_3', tall: false, radius: 25, flat: true },
  { id: 'decal_salt_ring_3', tall: false, radius: 25, flat: true },
  { id: 'decal_spilled_coins_3', tall: false, radius: 15, flat: true },
  { id: 'decal_old_well_cover_3', tall: false, radius: 22, flat: true },
  { id: 'decal_horseshoe_3', tall: false, radius: 17, flat: true },
];
/** Approved wild objects (the fifteen of 2026-11-06, the four farm pieces of 2026-11-10, the environment objects of 2026-11-20). */
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

/** Inspection stat icons, loaded as separate native 16×16 textures. */
export const STAT_ICONS: Readonly<Record<string, string>> = {
  life: 'icons/icon_life-16',
  attack: 'icons/icon_attack-16',
  range: 'icons/icon_range-16',
  speed: 'icons/icon_speed-16',
  cooldown: 'icons/icon_cooldown-16',
  armor: 'icons/icon_armor-16',
  shield: 'icons/icon_shield-16',
  heal: 'icons/icon_heal-16',
  burn: 'icons/icon_burn-16',
  poison: 'icons/icon_poison-16',
  slow: 'icons/icon_slow-16',
  stun: 'icons/icon_stun-16',
  flying: 'icons/icon_flying-16',
  disabled: 'icons/icon_disabled-16',
  revive: 'icons/icon_revive-16',
  sacrifice: 'icons/icon_sacrifice-16',
  move: 'icons/icon_move-16',
  upgrade: 'icons/icon_upgrade-16',
  unlock: 'icons/icon_unlock-16',
  quest: 'icons/icon_quest-16',
  decree: 'icons/icon_decree-16',
  pause: 'icons/icon_pause-16',
  save: 'icons/icon_save-16',
  economy: 'icons/icon_economy-16',
  enchantment: 'icons/icon_enchantment-16',
  soul: 'icons/icon_soul-16',
  support: 'icons/icon_support-16',
};

/**
 * Per-rule icons (20/11/2026, `docs/art-review/g3e/icons/review-2026-11-20.md`): one 16 px atlas icon per decree, quest
 * and king perk, frame `icon_<id>` (decree and quest ids as in `src/data`, perks as `perk_<perkId>`). A site that draws
 * one falls back to the shared icon when the frame is missing. HD twins are 32 px, like the HD atlas icons.
 */
export const RULE_ICONS: readonly string[] = [
  'decree_academy',
  'decree_amnesty',
  'decree_bigger_boulder',
  'decree_expand_borders',
  'decree_fourth_hand',
  'decree_harvest_tax',
  'decree_merchant_guild',
  'decree_moat',
  'decree_mobilize',
  'decree_new_armor',
  'decree_purge',
  'decree_quick_reflex',
  'decree_recast_crown',
  'decree_royal_archers',
  'decree_royal_armory',
  'decree_rune_festival',
  'decree_trade',
  'decree_treasury',
  'perk_arcane_p1',
  'perk_arcane_p2',
  'perk_arcane_p3',
  'perk_clock_p1',
  'perk_clock_p2',
  'perk_clock_p3',
  'perk_forge_p1',
  'perk_forge_p2',
  'perk_forge_p3',
  'perk_grove_p1',
  'perk_grove_p2',
  'perk_grove_p3',
  'perk_moon_p1',
  'perk_moon_p2',
  'perk_moon_p3',
  'perk_nomad_p1',
  'perk_nomad_p2',
  'perk_nomad_p3',
  'perk_stone_p1',
  'perk_stone_p2',
  'perk_stone_p3',
  'perk_tide_p1',
  'perk_tide_p2',
  'perk_tide_p3',
  'perk_wheat_p1',
  'perk_wheat_p2',
  'perk_wheat_p3',
  'quest_blitz',
  'quest_diversity',
  'quest_double_rune',
  'quest_hoard',
  'quest_land_grab',
  'quest_master_builder',
  'quest_no_help',
  'quest_no_reroll',
  'quest_offering',
  'quest_slaughter',
  'quest_three_barracks',
  'quest_untouched',
  'quest_wager',
];
/** File of the 16 px rule icon `id`. */
export const ruleIconFile = (id: string): string => `icons/icon_${id}-16`;

/**
 * Battle effects drawn as pictures (G5, `docs/art-review/g5/fx/review.md`): fx id → file, at 2 art px per world px like
 * units. The eight arrows come from one sheet with each direction drawn separately (sprites never rotate); only the
 * boulder's translucent shadow stays painted in code.
 */
export const IMAGE_FX: Readonly<Record<string, string>> = {
  boulder: 'fx/fx_boulder',
  pulse: 'fx/fx_pulse',
  shield: 'fx/fx_shield',
  stun: 'fx/fx_stun',
  spark: 'fx/fx_spark',
  // eight arrows, each drawn for its own direction on one sheet (sprites never rotate)
  arrow_e: 'fx/fx_arrow_e',
  arrow_ne: 'fx/fx_arrow_ne',
  arrow_n: 'fx/fx_arrow_n',
  arrow_nw: 'fx/fx_arrow_nw',
  arrow_w: 'fx/fx_arrow_w',
  arrow_sw: 'fx/fx_arrow_sw',
  arrow_s: 'fx/fx_arrow_s',
  arrow_se: 'fx/fx_arrow_se',
};

/**
 * King-select card backgrounds drawn as pictures (G5, `docs/art-review/g5/king-cards/`), 66×96 each; only the kings
 * listed here are loaded, the others keep the painted card. The portrait window and the corner glyphs are always
 * drawn over the picture (`paintKingCard`).
 */
export const KING_CARDS_APPROVED: readonly KingId[] = ['wheat', 'stone', 'arcane', 'grove', 'tide', 'forge', 'clock', 'moon', 'nomad'];
export const kingCardFile = (king: KingId): string => `king-cards/${king}`;

/**
 * Main-menu backdrop drawn as pictures (G5, `docs/art-review/g5/menu/`): strips far → near, each repeating
 * left-to-right in front of the code sky, drifting at `parallax` screen px per second. The middle strip is a whole
 * countryside down to the screen's bottom edge, so it replaces both nearer code hill layers.
 */
export const MENU_IMAGE_LAYERS: readonly { readonly file: string; readonly parallax: number }[] = [
  { file: 'menu/hills_far', parallax: 4 },
  { file: 'menu/hills_mid', parallax: 10 },
  // low grass, flowers and fence in front (20/11/2026; stays low so the fields of the middle strip still show)
  { file: 'menu/hills_near', parallax: 16 },
];

/** The dusk sky behind the strips as a picture (384×256, repeats left to right); null keeps the painted bands. */
export const MENU_SKY_FILE: string | null = 'menu/sky';

/** The main-menu logo picture (256×171, 20/11/2026): the title is written on its blank ribbon; null keeps the board. */
export const MENU_LOGO_FILE: string | null = 'menu/logo';
/** The blank ribbon of the logo in its art px (centre and writing band), where the title goes. */
export const MENU_LOGO_RIBBON = { cx: 128, cy: 126, w: 176, h: 20 } as const;
/** Run-end backdrops (384×256, 20/11/2026): the castle at sunrise when won, ruined at night when lost. */
export const RUN_END_FILES: Readonly<Record<'won' | 'lost', string>> = { won: 'menu/win', lost: 'menu/lose' };
/** Every picture of the screens outside the game: menu strips, sky, logo and run-end backdrops. */
export const MENU_PICTURE_FILES: readonly string[] = [
  ...MENU_IMAGE_LAYERS.map((layer) => layer.file),
  ...(MENU_SKY_FILE ? [MENU_SKY_FILE] : []),
  ...(MENU_LOGO_FILE ? [MENU_LOGO_FILE] : []),
  RUN_END_FILES.won,
  RUN_END_FILES.lost,
];

/** The picture strips when every one of them loaded, else null (the menu keeps its painted hills). */
export const menuImageLayers = (
  loaded: (file: string) => boolean,
): readonly { readonly file: string; readonly parallax: number }[] | null =>
  MENU_IMAGE_LAYERS.every((layer) => loaded(layer.file)) ? MENU_IMAGE_LAYERS : null;

/**
 * World pictures drawn outside the atlas that have an HD twin (11/11/2026), by group: `wall` the cliff segment
 * (`IsoWallRenderer`), `decor` the approved wild objects (`DecorationRenderer`), `forest` the forest behind the cliff
 * (`ForestRenderer`), `portal` the enemy portal (`EnemyPortalRenderer`), `ground` the three grass tiles and the
 * approved terrain textures, painted into the field and the ground around it at 4 art px per world unit
 * (`ensureFieldTexture`, `ensureGroundTexture`, `ensureRoadTailTexture`). Rollback of a group = remove it.
 */
export const IMAGE_ART_HD_WORLD: readonly ('wall' | 'decor' | 'forest' | 'portal' | 'ground')[] = [
  'wall', 'decor', 'forest', 'portal', 'ground',
];
const HD_WORLD_FILES: Readonly<Record<(typeof IMAGE_ART_HD_WORLD)[number], readonly string[]>> = {
  wall: [WALL_FILE],
  decor: DECOR_APPROVED.map(decorFile),
  forest: FOREST_APPROVED.map(forestFile),
  portal: PORTAL_APPROVED ? [PORTAL_ART.file] : [],
  ground: [...GRASS_FILES, ...GROUND_TEXTURES_APPROVED.map((t) => GROUND_TEXTURE_FILES[t])],
};

/**
 * Atlas icons with an HD twin (11/11/2026): the `IMAGE_ICONS` ids whose 16 px frame was re-exported at 32 px
 * (`docs/art-review/g3e/icons/make_assets.py --density 2`). Every site that draws an icon frame multiplies its scale by
 * `frameDensityFactor`, so the icon keeps its size. Rollback = remove ids.
 */
export const IMAGE_ART_HD_ICONS: readonly string[] = [
  'troop', 'tower', 'tome', 'throne', 'gold', 'level', 'enchant', 'crown', 'boulder', 'skull', 'reroll', 'sell', 'lock',
  'conquer',
];
/**
 * Battle effects with an HD twin (11/11/2026): the `IMAGE_FX` ids re-exported at twice the pixels
 * (`docs/art-review/g5/fx/make_assets.py --density 2`, `make_arrows.py --density 2`), drawn at half the scale through
 * `imageFrameScale` / `frameDensityFactor`. Rollback = remove ids.
 */
export const IMAGE_ART_HD_FX: readonly string[] = [
  'boulder', 'pulse', 'shield', 'stun', 'spark', 'arrow_e', 'arrow_ne', 'arrow_n', 'arrow_nw', 'arrow_w', 'arrow_sw',
  'arrow_s', 'arrow_se',
];

/** Every PNG of the set (file name without `.png`). */
export const IMAGE_ART_FILES: readonly string[] = [
  ...Object.keys(IMAGE_UNITS).flatMap(unitPoseFiles),
  ...ISO_UNITS.flatMap(isoUnitFiles),
  ...Object.values(IMAGE_BUILDINGS),
  ...Object.entries(IMAGE_BUILDING_LEVELS).flatMap(([card, arts]) =>
    (arts ?? []).flatMap((art) => {
      const file = buildingLevelFile(card, art);
      return file === null ? [] : [file];
    }),
  ),
  ...IMAGE_BUILDING_ANIMS.flatMap(buildingAnimFiles),
  ...Object.values(IMAGE_ICONS),
  ...RULE_ICONS.map(ruleIconFile),
  ...Object.values(STAT_ICONS),
  ...MENU_PICTURE_FILES,
  ...Object.values(IMAGE_FX),
  ...KING_CARDS_APPROVED.map(kingCardFile),
  ...Object.values(IMAGE_PLOTS).flatMap((prefix) => PLOT_STATES.map((s) => `${prefix}_${s}`)),
  ...GRASS_FILES,
  WALL_FILE,
  ...DECOR_APPROVED.map(decorFile),
  ...FOREST_APPROVED.map(forestFile),
  ...(PORTAL_APPROVED ? [PORTAL_ART.file] : []),
  ...GROUND_TEXTURES_APPROVED.map((t) => GROUND_TEXTURE_FILES[t]),
];

/**
 * Files with an HD twin in `IMAGE_ART_HD_DIR`: the twelve poses of each HD unit, each HD building's base, L2 and L3, the
 * four plot skins of each HD king, the world pictures of each `IMAGE_ART_HD_WORLD` group, the HD atlas icons and fx.
 */
export const IMAGE_ART_HD_FILES: ReadonlySet<string> = new Set([
  ...IMAGE_ART_HD_UNITS.flatMap(unitPoseFiles),
  ...ISO_UNITS.flatMap(isoUnitFiles),
  ...IMAGE_ART_HD_BUILDINGS.flatMap((card) => {
    const base = IMAGE_BUILDINGS[card];
    if (base === undefined) return [];
    return [
      base,
      ...(IMAGE_BUILDING_LEVELS[card] ?? []).flatMap((art) => buildingLevelFile(card, art) ?? []),
      ...(IMAGE_BUILDING_ANIMS.includes(card) ? buildingAnimFiles(card) : []),
    ];
  }),
  ...IMAGE_ART_HD_PLOTS.flatMap((king) => {
    const prefix = IMAGE_PLOTS[king];
    return prefix === undefined ? [] : PLOT_STATES.map((s) => `${prefix}_${s}`);
  }),
  ...IMAGE_ART_HD_WORLD.flatMap((group) => HD_WORLD_FILES[group]),
  ...IMAGE_ART_HD_ICONS.flatMap((icon) => IMAGE_ICONS[icon] ?? []),
  ...RULE_ICONS.map(ruleIconFile),
  ...IMAGE_ART_HD_FX.flatMap((fx) => IMAGE_FX[fx] ?? []),
]);

/** The world pictures drawn whole outside the atlas (wall, wilds, forest, portal): smooth sampling mipmaps them. */
export const WORLD_PICTURE_FILES: readonly string[] = [
  ...HD_WORLD_FILES.wall,
  ...HD_WORLD_FILES.decor,
  ...HD_WORLD_FILES.forest,
  ...HD_WORLD_FILES.portal,
];

/**
 * Files with a UHD twin in `IMAGE_ART_UHD_DIR`: every HD unit pose, building (base, L2, L3) and plot skin, and the wall,
 * wilds, forest and portal. Not the ground (the painted field would pass the 4096 px texture limit at 8 art px per
 * world unit, so it stays at density 4), nor the HUD-sized atlas icons and effects.
 */
export const IMAGE_ART_UHD_FILES: ReadonlySet<string> = new Set(
  [...IMAGE_ART_HD_FILES].filter(
    (file) =>
      !HD_WORLD_FILES.ground.includes(file) &&
      !IMAGE_ART_HD_ICONS.some((icon) => IMAGE_ICONS[icon] === file) &&
      !file.startsWith('icons/icon_') &&
      !IMAGE_ART_HD_FX.some((fx) => IMAGE_FX[fx] === file),
  ),
);

/**
 * The loaded texture of a world picture drawn outside the atlas: its UHD or HD twin when that loaded, else the `ai-v1`
 * file; null when none loaded. `factor` is the twin's scale against the `ai-v1` file (1, 0.5 for HD, 0.25 for UHD).
 */
export const imageArtTexture = (
  exists: (key: string) => boolean,
  file: string,
): { readonly key: string; readonly factor: number } | null => {
  if (exists(imageArtUhdKey(file))) return { key: imageArtUhdKey(file), factor: IMAGE_ART_UHD_SCALE / IMAGE_ART_SCALE };
  if (exists(imageArtHdKey(file))) return { key: imageArtHdKey(file), factor: IMAGE_ART_HD_SCALE / IMAGE_ART_SCALE };
  return exists(imageArtKey(file)) ? { key: imageArtKey(file), factor: 1 } : null;
};

/** Display scale of a world picture drawn at `scale` from its `ai-v1` file, for a twin of scale `factor`. */
export const imageArtScale = (scale: number, factor: number): number => scale * factor;

/** The art tier of a display density without close-up: HD from `HD_ART_MIN_DENSITY`. */
export const densityArtTier = (density: number): ArtTier => (density >= HD_ART_MIN_DENSITY ? 'hd' : 'sd');

/**
 * What to load for every image-art file at art tier `tier`: its UHD twin ('uhd' and it has one), else its HD twin
 * ('hd' or 'uhd' and it has one), else the `ai-v1` file; each under its own key.
 */
export const imageArtLoads = (tier: ArtTier): readonly { key: string; url: string }[] =>
  IMAGE_ART_FILES.map((file) => {
    if (tier === 'uhd' && IMAGE_ART_UHD_FILES.has(file)) return { key: imageArtUhdKey(file), url: `${IMAGE_ART_UHD_DIR}${file}.png` };
    if (tier !== 'sd' && IMAGE_ART_HD_FILES.has(file)) return { key: imageArtHdKey(file), url: `${IMAGE_ART_HD_DIR}${file}.png` };
    return { key: imageArtKey(file), url: `${IMAGE_ART_DIR}${file}.png` };
  });

/**
 * Close-up art streamed after start-up (13/11/2026): with the 'uhd' tier, Preload loads only the art of the display
 * density (`densityArtTier`) so the menu shows sooner; the close-up twins load in the background
 * (`streamedArtLoads`, `scenes/ArtStreamScene.ts`) and replace the start-up art at the next scene change.
 */
export const startupArtTier = (tier: ArtTier, density: number): ArtTier => (tier === 'uhd' ? densityArtTier(density) : tier);

/** The loads of `tier` that start-up (`startupArtTier`) leaves out, paired with the start-up load each one replaces. */
const streamedPairs = (tier: ArtTier, density: number): { start: { key: string; url: string }; streamed: { key: string; url: string } }[] => {
  const start = imageArtLoads(startupArtTier(tier, density));
  return imageArtLoads(tier).flatMap((streamed, i) => (streamed.key === start[i]!.key ? [] : [{ start: start[i]!, streamed }]));
};

/** What to load in the background after start-up: empty unless `tier` is 'uhd'. */
export const streamedArtLoads = (tier: ArtTier, density: number): readonly { key: string; url: string }[] =>
  streamedPairs(tier, density).map((p) => p.streamed);

/** Start-up texture keys a streamed load replaces: removed once the streamed art is in use. */
export const supersededArtKeys = (tier: ArtTier, density: number): readonly string[] =>
  streamedPairs(tier, density).map((p) => p.start.key);

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
