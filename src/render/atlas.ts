import { CODE_FX } from './codeFx';
import { codeFxFrame } from './projectileFx';
import type Phaser from 'phaser';
import { BATTLE } from '../data/battle';
import type { RunMode } from '../data/rules';
import { fieldTextureKey } from './endlessBoardModel';
import { PALETTE } from '../data/palette';
import type { CardDef, CardId, KingId, UnitId } from '../data/types';
import { KING_THEMES } from '../data/uiPalette';
import type { Content } from '../game/cards/registry';
import { paintBuilding, paintThrone } from './buildingArt';
import { paintCardArt } from './cardArt';
import { paintField, paintGroundTile, paintRoadTail, type GroundTextures } from './fieldArt';
import { groundPatch, isoGroundTile } from './groundArt';
import { paintPortal } from './portalArt';
import {
  ARROW_DIRS,
  paintArrow,
  paintBoulder,
  paintBoulderShadow,
  paintPulse,
  paintShieldFx,
  paintSpark,
  paintStun,
} from './fxArt';
import { ICON_IDS, paintIcon, type IconId } from './iconArt';
import {
  GRASS_FILES,
  GROUND_TEXTURE_FILES,
  GROUND_TEXTURES_APPROVED,
  IMAGE_ART_HD_SCALE,
  IMAGE_ART_SCALE,
  IMAGE_BUILDINGS,
  IMAGE_BUILDING_LEVELS,
  buildingLevelFile,
  levelArt,
  IMAGE_FX,
  IMAGE_ICONS,
  IMAGE_PLOTS,
  IMAGE_UNITS,
  PLOT_STATES,
  imageArtHdKey,
  imageArtKey,
  unitPoseFile,
} from './imageArt';
import { ART_POLICY } from './artPolicy';
import { squareToIso } from './isoArt';
import { PixelCanvas } from './pixel';
import { paintPlot, type PlotState } from './plotArt';
import {
  UI_DECOR_IDS,
  UI_FRAME_IDS,
  UI_THEMED_FRAME_IDS,
  baseFrame,
  paintUiDecor,
  paintUiFrame,
  type AnyUiFrame,
  type UiFrame,
} from './uiArt';
import {
  KIT_COLOURS,
  UI_KIT_FILES,
  UI_KIT_FRAME,
  activateUiKitFrames,
  kitStatePal,
  kitSwaps,
  kitTextureKey,
  recolorKit,
  themeKitPal,
} from './uiKit';
import { UNIT_FRAME_COUNT, paintUnit, unitCloth, type UnitAnim, type UnitTeam } from './unitArt';

/**
 * Turns generated pixel art into Phaser textures. Scenes refer to frames by name only, so
 * an Aseprite atlas with the same frame names can replace any generated texture (spec
 * §11.4). World sprites live in one `sprites` texture made of several pages (sources), each side ≤ 4096; each
 * battle field is its own `field-<seed>` texture.
 */

// ---- Frame names (pure; the only way code refers to a sprite, spec §11.4) ----

export const unitFrame = (unit: UnitId, team: UnitTeam, anim: UnitAnim, n: number): string =>
  `unit_${unit}_${team}_${anim}${n}`;
/** Troop/tower building or the throne (the throne card id is its frame). */
export const buildingFrame = (cardId: CardId): string => `building_${cardId}`;
/** Frame of the L2/L3 architecture of a building (`IMAGE_BUILDING_LEVELS`). */
export const buildingLevelFrame = (cardId: CardId, art: 2 | 3): string => `building_${cardId}_l${art}`;

/**
 * The frame a building of `level` shows: its L3 / L2 architecture when that frame exists (`has`), else the next lower
 * one, else the base frame.
 */
export const pickBuildingFrame = (cardId: CardId, level: number, has: (frame: string) => boolean): string => {
  for (let art = levelArt(level); art >= 2; art--) {
    const f = buildingLevelFrame(cardId, art === 3 ? 3 : 2);
    if (has(f)) return f;
  }
  return buildingFrame(cardId);
};
export const plotFrame = (state: PlotState): string => `plot_${state}`;
/** The plot frame of `kingId`'s board: its own skin when `IMAGE_PLOTS` has one, else the shared plot. */
export const kingPlotFrame = (kingId: string, state: PlotState): string =>
  IMAGE_PLOTS[kingId] === undefined ? plotFrame(state) : `plot_${kingId}_${state}`;
export const cardArtFrame = (cardId: CardId): string => `card_art_${cardId}`;
export const iconFrame = (id: IconId): string => `icon_${id}`;
/** `arrow_<dir>`, `boulder`, `boulder_shadow`, `spark`. */
export const fxFrame = (name: string): string => `fx_${name}`;
/** Texture key of the painted battle field for `seed`. */
export const fieldKey = fieldTextureKey;

/** UI frames (nine-slice sources) and decorations, named as in uiArt.ts. */
export const UI_KEY = 'ui';

export const toCanvas = (art: PixelCanvas): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = art.width;
  canvas.height = art.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.putImageData(new ImageData(art.data, art.width, art.height), 0, 0);
  return canvas;
};

/** Pack sprites left-to-right in shelves. Small and good enough for generated art. */
export const packShelves = (sprites: { name: string; art: PixelCanvas }[], maxWidth = 256) => {
  let x = 0;
  let y = 0;
  let shelf = 0;
  const placed = sprites.map((s) => {
    if (x + s.art.width > maxWidth) {
      x = 0;
      y += shelf + 1;
      shelf = 0;
    }
    const p = { ...s, x, y };
    x += s.art.width + 1;
    shelf = Math.max(shelf, s.art.height);
    return p;
  });
  return { placed, height: y + shelf };
};

/** Upload one generated canvas as its own texture (no-op if the key already exists). */
export const addPixelTexture = (
  textures: Phaser.Textures.TextureManager,
  key: string,
  art: PixelCanvas,
): void => {
  if (textures.exists(key)) return;
  if (!textures.addCanvas(key, toCanvas(art))) throw new Error(`Failed to create texture ${key}`);
};

/**
 * The UI atlas: every UI_FRAMES frame and UI_DECOR decoration under its own name, so the
 * HUD only ever refers to frames by name (swap for an Aseprite atlas with the same names).
 */
export const buildUiTexture = (textures: Phaser.Textures.TextureManager): void => {
  if (textures.exists(UI_KEY)) return;
  const kitFrames: AnyUiFrame[] = [];
  /** The loaded kit tile of base frame `id`, or null (missing, wrong size): the frame stays generated. */
  const kitArt = (id: UiFrame): PixelCanvas | null => {
    const key = kitTextureKey(id);
    if (!UI_KIT_FILES[id] || !textures.exists(key)) return null;
    const art = imageToPixelCanvas(
      textures.get(key).getSourceImage() as CanvasImageSource & {
        width: number;
        height: number;
      },
    );
    return art && art.width === UI_KIT_FRAME.w && art.height === UI_KIT_FRAME.h ? art : null;
  };
  const frameArt = (id: AnyUiFrame): PixelCanvas => {
    const base = baseFrame(id);
    const art = kitArt(base);
    if (art === null) return paintUiFrame(id);
    const at = id.indexOf('@');
    const pal = at >= 0 ? themeKitPal(KING_THEMES[id.slice(at + 1) as KingId]) : KIT_COLOURS;
    kitFrames.push(id);
    return recolorKit(art, kitSwaps(kitStatePal(base, pal)));
  };
  const sprites: { name: string; art: PixelCanvas }[] = [
    ...UI_FRAME_IDS.map((id) => ({ name: id, art: frameArt(id) })),
    ...UI_THEMED_FRAME_IDS.map((id) => ({ name: id, art: frameArt(id) })),
    ...UI_DECOR_IDS.map((id) => ({ name: id, art: paintUiDecor(id) })),
  ];
  const width = 128;
  const { placed, height } = packShelves(sprites, width);
  const sheet = new PixelCanvas(width, height);
  for (const p of placed) sheet.blit(p.art, p.x, p.y);
  const texture = textures.addCanvas(UI_KEY, toCanvas(sheet));
  if (!texture) throw new Error('Failed to create UI texture');
  for (const p of placed) texture.add(p.name, 0, p.x, p.y, p.art.width, p.art.height);
  activateUiKitFrames(kitFrames);
};

/** Pixels of a loaded image as a PixelCanvas; null when the 2D canvas is unavailable. */
const imageToPixelCanvas = (
  image: CanvasImageSource & { width: number; height: number },
): PixelCanvas | null => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const art = new PixelCanvas(canvas.width, canvas.height);
  art.data.set(data);
  return art;
};

/**
 * Every world sprite (units, buildings, plots, card pictures, icons, fx). One Phaser texture with several sources
 * ("pages", like a Phaser multi-atlas): every frame records the page it lives on, so callers keep asking for
 * `(SPRITES_KEY, frame)` and Phaser resolves the page (`Frame.sourceIndex`) when it draws, reads alpha or sizes it.
 */
export const SPRITES_KEY = 'sprites';
/** Width of a `sprites` page; its height grows up to `SPRITES_MAX_SIDE`, then a new page starts. */
export const SPRITES_PAGE_WIDTH = 2048;
/** Largest side of any atlas page (CLAUDE.md "each side ≤ 4096"). */
export const SPRITES_MAX_SIDE: number = ART_POLICY.maxAtlasSide;

/** Accent colour of a card: its king's colour, neutral cards blue. */
const cardAccent = (content: Content, def: CardDef): number => {
  if (def.owner === 'neutral') return PALETTE.blue;
  try {
    return PALETTE[content.king(def.owner).color];
  } catch {
    return PALETTE.blue; // king not in this content set
  }
};

/** Every named sprite of the `sprites` atlas. */
export const spriteList = (content: Content): { name: string; art: PixelCanvas }[] => {
  const out: { name: string; art: PixelCanvas }[] = [];
  const teams: UnitTeam[] = ['ally', 'foe'];
  const anims: UnitAnim[] = ['idle', 'walk', 'attack'];
  for (const def of content.allUnits()) {
    const cloth = unitCloth(def);
    for (const team of teams)
      for (const anim of anims)
        for (let n = 0; n < UNIT_FRAME_COUNT; n++)
          out.push({
            name: unitFrame(def.id, team, anim, n),
            art: paintUnit(def, team, anim, n === 0 ? 0 : 1, cloth),
          });
  }
  for (const def of content.allCards()) {
    const accent = cardAccent(content, def);
    if (def.kind === 'throne') out.push({ name: buildingFrame(def.id), art: paintThrone(accent) });
    else if (
      def.kind === 'troop' ||
      def.kind === 'tower' ||
      def.kind === 'economy' ||
      def.kind === 'support'
    )
      out.push({ name: buildingFrame(def.id), art: paintBuilding(def.kind, accent) });
    out.push({ name: cardArtFrame(def.id), art: paintCardArt(def, accent) });
  }
  for (const state of PLOT_STATES) out.push({ name: plotFrame(state), art: paintPlot(state) });
  // per-king plot skins: generated plot until `withImageArt` swaps in the king's image
  for (const king of Object.keys(IMAGE_PLOTS))
    for (const state of PLOT_STATES)
      out.push({ name: kingPlotFrame(king, state), art: paintPlot(state) });
  for (const id of ICON_IDS) out.push({ name: iconFrame(id), art: paintIcon(id) });
  for (const dir of ARROW_DIRS) out.push({ name: fxFrame(`arrow_${dir}`), art: paintArrow(dir) });
  out.push({ name: fxFrame('boulder'), art: paintBoulder() });
  out.push({ name: fxFrame('boulder_shadow'), art: paintBoulderShadow() });
  out.push({ name: fxFrame('spark'), art: paintSpark() });
  // Effects and projectiles drawn in code (`CODE_FX`, 10/11/2026), one frame per authored frame plus its glow layer.
  for (const def of CODE_FX)
    for (let i = 0; i < def.frames; i++) {
      out.push({ name: codeFxFrame(def.id, i), art: def.paint(i) });
      if (def.paintGlow) out.push({ name: codeFxFrame(def.id, i, true), art: def.paintGlow(i) });
    }
  out.push({ name: fxFrame('pulse'), art: paintPulse() });
  out.push({ name: fxFrame('shield'), art: paintShieldFx() });
  out.push({ name: fxFrame('stun'), art: paintStun() });
  return out;
};

/** One page of the `sprites` texture: its frames' positions and the page size. */
export interface SpritePage<T extends { art: { width: number; height: number } }> {
  placed: (T & { x: number; y: number })[];
  width: number;
  height: number;
}

/**
 * Shelf-pack `sprites` onto as many pages as needed, each at most `width` × `maxSide` (tallest first, ties in list
 * order, so the packing is deterministic and shelves waste little). Throws if one sprite cannot fit a page.
 */
export const packSpritePages = <T extends { name: string; art: { width: number; height: number } }>(
  sprites: readonly T[],
  width = SPRITES_PAGE_WIDTH,
  maxSide = SPRITES_MAX_SIDE,
): SpritePage<T>[] => {
  const order = sprites.map((s, i) => ({ s, i })).sort((a, b) => b.s.art.height - a.s.art.height || a.i - b.i);
  const pages: SpritePage<T>[] = [];
  let page: SpritePage<T> | null = null;
  let x = 0;
  let y = 0;
  let shelf = 0;
  for (const { s } of order) {
    const { width: w, height: h } = s.art;
    if (w > width || h > maxSide) throw new Error(`Sprite ${s.name} (${w}×${h}) does not fit a ${width}×${maxSide} page`);
    if (page !== null && x + w > width) {
      x = 0;
      y += shelf + 1;
      shelf = 0;
    }
    if (page === null || y + h > maxSide) {
      page = { placed: [], width, height: 0 };
      pages.push(page);
      x = 0;
      y = 0;
      shelf = 0;
    }
    page.placed.push({ ...s, x, y });
    x += w + 1;
    shelf = Math.max(shelf, h);
    page.height = Math.max(page.height, y + h);
  }
  return pages;
};

/** Frames whose art came from `imageArt` → their display scale (0.5, or 0.25 for HD art); filled by `withImageArt`. */
const IMAGE_FRAMES = new Map<string, number>();

/** Display scale of a sprite frame: 0.5 for image art (0.25 for its HD twin), 1 for generated art. */
export const imageFrameScale = (frame: string): number => IMAGE_FRAMES.get(frame) ?? 1;

/**
 * Frame px → px of the frame's standard (`ai-v1`, density-2) export: 0.5 for an HD frame, else 1. HUD code that sizes
 * a sprite frame by its pixel size multiplies by this so an HD frame shows at the same size as before.
 */
export const frameDensityFactor = (frame: string): number =>
  IMAGE_FRAMES.get(frame) === IMAGE_ART_HD_SCALE ? IMAGE_ART_HD_SCALE / IMAGE_ART_SCALE : 1;

/** Pixels of a loaded image texture by file name, or null when it did not load. */
export const imageFile = (textures: Phaser.Textures.TextureManager, file: string): PixelCanvas | null =>
  textureArt(textures, imageArtKey(file));

/**
 * Pixels of a loaded image-art file with the display scale of its density: the HD twin (`imageArtHdKey`, 4 art px per
 * world unit) when that loaded, else the `ai-v1` file (2 art px per world unit); null when neither loaded.
 */
export const imageFileScaled = (
  textures: Phaser.Textures.TextureManager,
  file: string,
): { art: PixelCanvas; scale: number } | null => {
  const hd = textureArt(textures, imageArtHdKey(file));
  if (hd !== null) return { art: hd, scale: IMAGE_ART_HD_SCALE };
  const art = imageFile(textures, file);
  return art === null ? null : { art, scale: IMAGE_ART_SCALE };
};

/** Pixels of the texture under `key` (its source image), or null when there is no such texture. */
export const textureArt = (textures: Phaser.Textures.TextureManager, key: string): PixelCanvas | null => {
  if (!textures.exists(key)) return null;
  return imageToPixelCanvas(
    textures.get(key).getSourceImage() as CanvasImageSource & { width: number; height: number },
  );
};

/** `list` with the frames of `imageArt` replaced by their PNGs (those that loaded; the rest keep generated art). */
export const withImageArt = (
  textures: Phaser.Textures.TextureManager,
  list: { name: string; art: PixelCanvas }[],
): { name: string; art: PixelCanvas }[] => withImageArtFrom((file) => imageFileScaled(textures, file), list);

/** `withImageArt` over any file lookup (pixels and display scale of a loaded file, or null): pure, so tests can size it. */
export const withImageArtFrom = (
  lookup: (file: string) => { art: PixelCanvas; scale: number } | null,
  list: { name: string; art: PixelCanvas }[],
): { name: string; art: PixelCanvas }[] => {
  IMAGE_FRAMES.clear();
  const wanted = new Map<string, string>();
  for (const unit of Object.keys(IMAGE_UNITS))
    for (const team of ['ally', 'foe'] as const)
      for (const anim of ['idle', 'walk', 'attack'] as const)
        for (let n = 0; n < UNIT_FRAME_COUNT; n++)
          wanted.set(unitFrame(unit, team, anim, n), unitPoseFile(unit, team, anim, n));
  for (const [card, file] of Object.entries(IMAGE_BUILDINGS))
    wanted.set(buildingFrame(card as CardId), file);
  for (const [icon, file] of Object.entries(IMAGE_ICONS))
    wanted.set(iconFrame(icon as IconId), file);
  for (const [fx, file] of Object.entries(IMAGE_FX)) wanted.set(fxFrame(fx), file);
  for (const [king, prefix] of Object.entries(IMAGE_PLOTS))
    for (const state of PLOT_STATES) wanted.set(kingPlotFrame(king, state), `${prefix}_${state}`);
  const out = list.map((s) => {
    const file = wanted.get(s.name);
    const image = file === undefined ? null : lookup(file);
    if (image === null) return s;
    IMAGE_FRAMES.set(s.name, image.scale);
    return { name: s.name, art: image.art };
  });
  // Level architecture has no generated fallback: a frame exists only when its image loaded.
  for (const [card, arts] of Object.entries(IMAGE_BUILDING_LEVELS))
    for (const lv of arts ?? []) {
      const file = buildingLevelFile(card, lv);
      const image = file === null ? null : lookup(file);
      if (image === null) continue;
      const name = buildingLevelFrame(card as CardId, lv);
      IMAGE_FRAMES.set(name, image.scale);
      out.push({ name, art: image.art });
    }
  return out;
};

/** The three grass PNGs as pixels, or null unless all loaded. */
export const grassArt = (textures: Phaser.Textures.TextureManager): PixelCanvas[] | null => {
  const tiles = GRASS_FILES.map((f) => imageFile(textures, f));
  return tiles.every((t) => t !== null) ? (tiles as PixelCanvas[]) : null;
};

/** The approved, loaded ground textures (a missing one keeps the generated look). */
export const groundTextures = (textures: Phaser.Textures.TextureManager): GroundTextures => {
  const out: { -readonly [K in keyof GroundTextures]: GroundTextures[K] } = {};
  for (const t of GROUND_TEXTURES_APPROVED) {
    const art = imageFile(textures, GROUND_TEXTURE_FILES[t]);
    if (art) out[t] = art;
  }
  return out;
};

/**
 * Plot frames laid onto the isometric ground (spec 2026-11-06): each square plot picture becomes
 * a 2:1 diamond (`squareToIso`) until isometric plot art replaces it (Task 11).
 */
export const isoPlots = (
  list: { name: string; art: PixelCanvas }[],
): { name: string; art: PixelCanvas }[] =>
  list.map((s) =>
    s.name.startsWith('plot_') && s.art.width === s.art.height
      ? { name: s.name, art: squareToIso(s.art) }
      : s,
  );

/** Build the `sprites` texture once (no-op if it already exists): one source per page of `packSpritePages`. */
export const buildSpritesTexture = (
  textures: Phaser.Textures.TextureManager,
  content: Content,
): void => {
  if (textures.exists(SPRITES_KEY)) return;
  const pages = packSpritePages(isoPlots(withImageArt(textures, spriteList(content))));
  const canvases = pages.map((page) => {
    const sheet = new PixelCanvas(page.width, Math.max(1, page.height));
    for (const p of page.placed) sheet.blit(p.art, p.x, p.y);
    return toCanvas(sheet);
  });
  const texture = textures.create(SPRITES_KEY, canvases);
  if (!texture) throw new Error('Failed to create sprites texture');
  const first = canvases[0];
  if (first) texture.add('__BASE', 0, 0, 0, first.width, first.height);
  pages.forEach((page, source) => {
    for (const p of page.placed) texture.add(p.name, source, p.x, p.y, p.art.width, p.art.height);
  });
};

/** Texture key of the code-drawn enemy portal (spec 2026-11-08 §3). */
export const PORTAL_KEY = 'enemy-portal';

/** The enemy portal texture (painted once, never removed); the approved art replaces it in Q5. */
export const ensurePortalTexture = (textures: Phaser.Textures.TextureManager): string => {
  if (!textures.exists(PORTAL_KEY)) addPixelTexture(textures, PORTAL_KEY, paintPortal());
  return PORTAL_KEY;
};

export const GROUND_KEY = 'field-ground';

/**
 * The tiling grass ground under and around every field (painted once, never removed): one screen period of the
 * projected periodic grass patch (`groundArt.ts`), from the same grass tiles as the field (the grass art, else the
 * generated tile), so the ground beyond the field matches it (spec 2026-11-08 §5).
 */
export const ensureGroundTexture = (textures: Phaser.Textures.TextureManager): string => {
  if (!textures.exists(GROUND_KEY))
    addPixelTexture(
      textures,
      GROUND_KEY,
      isoGroundTile(groundPatch(grassArt(textures) ?? [paintGroundTile()])),
    );
  return GROUND_KEY;
};

export const ROAD_TAIL_KEY = 'field-road-tail';

/** The road's last stretch to the portal, laid onto the iso ground (painted once, never removed). */
export const ensureRoadTailTexture = (textures: Phaser.Textures.TextureManager): string => {
  if (!textures.exists(ROAD_TAIL_KEY))
    addPixelTexture(
      textures,
      ROAD_TAIL_KEY,
      squareToIso(paintRoadTail(grassArt(textures) ? 2 : 1, groundTextures(textures).path)),
    );
  return ROAD_TAIL_KEY;
};

/**
 * Display scale of the painted field (`field-<seed>`), an isometric diamond 2 × field wide at
 * zoom 1: 0.5 when it was painted from the 2×-density grass art.
 */
export const fieldTextureScale = (textures: Phaser.Textures.TextureManager, key: string): number =>
  textures.get(key).getSourceImage().width > 2 * BATTLE.field ? IMAGE_ART_SCALE : 1;

/** Display scale of the tiling ground: 0.5 when it is the grass art. */
export const groundTextureScale = (textures: Phaser.Textures.TextureManager): number =>
  grassArt(textures) === null ? 1 : IMAGE_ART_SCALE;

/**
 * Make sure the painted field for `seed` exists (painted only if missing) and return its
 * key. It never removes textures: the owner (FieldRenderer.destroy) removes its own
 * `field-<seed>` texture once no image uses it.
 */
export const ensureFieldTexture = (
  textures: Phaser.Textures.TextureManager,
  seed: number,
  mode: RunMode = 'normal',
): string => {
  const key = fieldKey(seed, mode);
  // The square field laid onto the isometric ground (spec 2026-11-06): a diamond, top corner = world (0, 0).
  if (!textures.exists(key)) {
    const field = paintField(seed, grassArt(textures) ?? undefined, groundTextures(textures), mode);
    addPixelTexture(textures, key, squareToIso(field));
  }
  return key;
};
