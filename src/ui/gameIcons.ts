import type Phaser from 'phaser';
import { UI_PALETTE } from '../data/uiPalette';

/**
 * Vector menu icons from game-icons.net (CC BY 3.0 — Lorc, Delapouite, Guard13007; owner 12/11/2026: "bộ icon hiện đại
 * hơn, không cần phong cách pixel"). White shapes fetched by tools/fetch_game_icons.py, rasterised once at
 * `GAME_ICON_SOURCE` px and sampled smoothly, tinted to the colour of the surface they sit on.
 */
export const GAME_ICON_IDS = [
  'settings', 'help', 'continue', 'new_run', 'load', 'crowns', 'back', 'exit', 'sound', 'music', 'mute', 'graphics',
  'speed', 'trophy', 'lock', 'unlock', 'book', 'castle', 'dice', 'coins', 'trash', 'swap', 'pause', 'fast', 'scroll',
  'banner',
] as const;
export type GameIconId = (typeof GAME_ICON_IDS)[number];

/** In-game credit line the CC BY licence asks for (shown in the main menu footer; CREDITS.md has the full entry). */
export const GAME_ICONS_CREDIT = 'Icon: game-icons.net — Lorc, Delapouite, Guard13007 (CC BY 3.0)';

/** Rasterised size (power of two, so WebGL1 can mipmap it). */
export const GAME_ICON_SOURCE = 128;
export const GAME_ICON_DIR = 'assets/icons/game-icons/';
export const gameIconKey = (id: GameIconId): string => `gi-${id}`;

/** Queue every icon on a loader. */
export const queueGameIcons = (load: Phaser.Loader.LoaderPlugin): void => {
  for (const id of GAME_ICON_IDS)
    load.svg(gameIconKey(id), `${GAME_ICON_DIR}${id}.svg`, { width: GAME_ICON_SOURCE, height: GAME_ICON_SOURCE });
};

/** Button icon option for `createButton`: `size` logical px, dark ink by default; undefined when not loaded. */
export const gameIcon = (
  scene: Phaser.Scene,
  id: GameIconId,
  size = 26,
  tint: number = UI_PALETTE.text,
  side: 'left' | 'top' = 'left',
): { key: string; frame: string; scale: number; side: 'left' | 'top'; tint: number } | undefined =>
  scene.textures.exists(gameIconKey(id))
    ? { key: gameIconKey(id), frame: '__BASE', scale: size / GAME_ICON_SOURCE, side, tint }
    : undefined;
