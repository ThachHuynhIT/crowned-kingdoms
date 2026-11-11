import { CARD_ART_FILES } from '../ui/cards/cardImage';
import { KING_BADGE_FILES } from '../ui/realm/kingBadge';
import {
  HD_ART_MIN_DENSITY,
  IMAGE_ART_DIR,
  KING_CARDS_APPROVED,
  MENU_IMAGE_LAYERS,
  MENU_SKY_FILE,
  STAT_ICONS,
  imageArtKey,
  kingCardFile,
} from './imageArt';
import { ALL_KINGS } from '../data/rules';
import { PORTRAIT_ASSETS, PORTRAIT_DIR, portraitLargeTextureKey, portraitTextureKey } from './portraitAssets';

/**
 * HiDPI twins of the HUD pictures (11/11/2026): card illustrations, king portraits, king-card backgrounds, the main-menu
 * sky and hills, the inspection stat icons and the calendar king badges. Each twin is the same approved source
 * re-exported at exactly twice the pixels (`--density 2` of its export script) into `ai-v1-hd/` under the same relative
 * name. At display density ≥ `HD_ART_MIN_DENSITY` it is loaded beside its `ai-v1` file under `hudArtHdKey(key)`; a HUD
 * site that finds it (`hudTexture`) draws it at half its usual scale, so every logical size stays identical. A twin
 * that is missing (not loaded yet, failed, density 1) leaves the `ai-v1` texture in place.
 */
export const HUD_ART_HD_DIR = 'assets/art/ai-v1-hd/';

/** Texture key of the HD twin of the HUD texture `key`. */
export const hudArtHdKey = (key: string): string => `hudhd-${key}`;

/** Path of an `ai-v1` URL relative to its folder (`cards/wheat_field.png`). */
const relative = (url: string): string => {
  if (!url.startsWith(IMAGE_ART_DIR)) throw new Error(`not an ai-v1 file: ${url}`);
  return url.slice(IMAGE_ART_DIR.length);
};

/** Every HUD texture with an HD twin: its usual key and its URL in `ai-v1`. */
const HUD_BASE_FILES: readonly { key: string; url: string }[] = [
  ...CARD_ART_FILES,
  ...ALL_KINGS.flatMap((id) => [
    { key: portraitTextureKey(id), url: `${PORTRAIT_DIR}${PORTRAIT_ASSETS[id].file}` },
    { key: portraitLargeTextureKey(id), url: `${PORTRAIT_DIR}${PORTRAIT_ASSETS[id].large.file}` },
  ]),
  ...KING_BADGE_FILES,
  ...Object.values(STAT_ICONS).map((file) => ({ key: imageArtKey(file), url: `${IMAGE_ART_DIR}${file}.png` })),
  ...KING_CARDS_APPROVED.map(kingCardFile).map((file) => ({ key: imageArtKey(file), url: `${IMAGE_ART_DIR}${file}.png` })),
  ...[...MENU_IMAGE_LAYERS.map((layer) => layer.file), ...(MENU_SKY_FILE ? [MENU_SKY_FILE] : [])].map((file) => ({
    key: imageArtKey(file),
    url: `${IMAGE_ART_DIR}${file}.png`,
  })),
];

/** Every HD twin to load: its key and URL in `ai-v1-hd` (same relative path as its `ai-v1` file). */
export const HUD_ART_HD_FILES: readonly { key: string; url: string; base: string }[] = HUD_BASE_FILES.map((f) => ({
  key: hudArtHdKey(f.key),
  url: `${HUD_ART_HD_DIR}${relative(f.url)}`,
  base: f.key,
}));

/** Whether the HUD uses HD twins at display density `density`. */
export const useHudArtHd = (density: number): boolean => density >= HD_ART_MIN_DENSITY;

/** Queue the HD twins of the HUD pictures on `load` (nothing at density < 2). Call from `PreloadScene.preload`. */
export const queueHudArtHd = (load: { image: (key: string, url: string) => unknown }, density: number): void => {
  if (!useHudArtHd(density)) return;
  for (const f of HUD_ART_HD_FILES) load.image(f.key, f.url);
};

/**
 * The texture a HUD site draws for `key`: its HD twin with `factor` 2 when the display density is ≥ 2 and the twin
 * loaded, else `key` itself with `factor` 1. Draw at (usual scale ÷ factor), crop and size in texture px × factor.
 */
export const hudTexture = (
  textures: { exists: (key: string) => boolean },
  key: string,
  density: number,
): { key: string; factor: 1 | 2 } => {
  const hd = hudArtHdKey(key);
  return useHudArtHd(density) && textures.exists(hd) ? { key: hd, factor: 2 } : { key, factor: 1 };
};
