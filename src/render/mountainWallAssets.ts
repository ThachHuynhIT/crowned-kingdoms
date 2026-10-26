import type Phaser from 'phaser';
import type { KingId } from '../data/types';
import { addPixelTexture } from './atlas';
import { paintMountainWall } from './mountainWallArt';

/** A piece of one wall asset: its own texture, offset inside the asset (in source px). */
export interface WallPart {
  id: string;
  texture: string;
  frame: string;
  sourceX: number;
  sourceY: number;
  w: number;
  h: number;
}

/**
 * One logical wall piece (a middle segment, an end cap, a foot strip …). `baseline` is the y of the
 * wall foot inside the source image; `imageScale` is world px per source px (0.5 for 2×-density art,
 * 1 for the code placeholders). A source image too wide for the GPU is split into several parts.
 */
export interface WallAsset {
  id: string;
  role: 'middle' | 'left' | 'right' | 'foot' | 'far' | 'attachment';
  w: number;
  h: number;
  baseline: number;
  imageScale: number;
  parts: readonly WallPart[];
}

export const wallTextureKey = (id: string): string => `wall_${id}`;
/** Each wall texture is one canvas, so it only has Phaser's default frame; split sources give each part its own frame name. */
export const WHOLE_TEXTURE_FRAME = '__BASE';
export const wallFrame = (): string => WHOLE_TEXTURE_FRAME;

interface PlaceholderSpec {
  id: string;
  role: WallAsset['role'];
  w: number;
  h: number;
  /** Source px of the piece that hang below the wall line (rubble onto the grass). */
  overhang: number;
}

/** The code placeholders: four middle faces, two caps, three foot strips (spec 26/10/2026 §6). */
const PLACEHOLDERS: readonly PlaceholderSpec[] = [
  { id: 'middle_a', role: 'middle', w: 128, h: 96, overhang: 0 },
  { id: 'middle_b', role: 'middle', w: 128, h: 96, overhang: 0 },
  { id: 'middle_c', role: 'middle', w: 128, h: 96, overhang: 0 },
  { id: 'middle_d', role: 'middle', w: 128, h: 96, overhang: 0 },
  { id: 'left', role: 'left', w: 48, h: 96, overhang: 0 },
  { id: 'right', role: 'right', w: 48, h: 96, overhang: 0 },
  { id: 'foot_a', role: 'foot', w: 128, h: 16, overhang: 4 },
  { id: 'foot_b', role: 'foot', w: 128, h: 16, overhang: 4 },
  { id: 'foot_c', role: 'foot', w: 128, h: 16, overhang: 4 },
];

const toAsset = (s: PlaceholderSpec): WallAsset => ({
  id: s.id,
  role: s.role,
  w: s.w,
  h: s.h,
  baseline: s.h - s.overhang,
  imageScale: 1,
  parts: [{ id: s.id, texture: wallTextureKey(s.id), frame: wallFrame(), sourceX: 0, sourceY: 0, w: s.w, h: s.h }],
});

/** Folder (under the site root) of the approved wall PNGs, and the world units per art px of those images. */
export const WALL_IMAGE_DIR = 'assets/art/ai-v1/mountain-wall/';
export const WALL_IMAGE_SCALE = 0.5;

/** An approved wall image (docs/art-review/oblique-wall/catalog.json): size and baseline are in art px. */
export interface WallImageSpec {
  id: string;
  role: WallAsset['role'];
  /** King whose backdrop it is (middle segments only). */
  king?: KingId;
  w: number;
  h: number;
  baseline: number;
}

/** Every approved image; keep in sync with the catalog (wallImages.test.ts checks it). */
export const WALL_IMAGES: readonly WallImageSpec[] = (
  ['wheat', 'stone', 'arcane', 'grove', 'tide', 'forge', 'clock', 'moon', 'nomad'] as const
).map((king) => ({ id: `terrain_mountain_wall_mid_${king}`, role: 'middle', king, w: 384, h: 192, baseline: 192 }));

export const wallImageKey = (id: string): string => `wallimg-${id}`;

const imageAsset = (s: WallImageSpec): WallAsset => ({
  id: s.id,
  role: s.role,
  w: s.w,
  h: s.h,
  baseline: s.baseline,
  imageScale: WALL_IMAGE_SCALE,
  parts: [{ id: s.id, texture: wallImageKey(s.id), frame: wallFrame(), sourceX: 0, sourceY: 0, w: s.w, h: s.h }],
});

/**
 * The wall pieces for `kingId`: the king's approved middle image when it has loaded, else the code
 * placeholders. Approved feet and caps are used when loaded; the placeholder feet and caps only go with the
 * placeholder middles (grey rubble would clash with the painted cliffs). Placeholder textures are uploaded
 * lazily, shared by every scene and never removed.
 */
export const ensureMountainWallTextures = (
  textures: Phaser.Textures.TextureManager,
  kingId?: KingId,
): readonly WallAsset[] => {
  const loaded = WALL_IMAGES.filter((s) => textures.exists(wallImageKey(s.id)));
  const middle = loaded.find((s) => s.role === 'middle' && s.king === kingId);
  if (middle !== undefined) {
    return [middle, ...loaded.filter((s) => s.role !== 'middle')].map(imageAsset);
  }
  for (const s of PLACEHOLDERS) addPixelTexture(textures, wallTextureKey(s.id), paintMountainWall(s.id, s.w, s.h));
  return PLACEHOLDERS.map(toAsset);
};

/** Pure description of the placeholder pieces (no textures), for layout tests. */
export const placeholderWallAssets = (): readonly WallAsset[] => PLACEHOLDERS.map(toAsset);
