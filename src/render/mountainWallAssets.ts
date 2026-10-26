import type Phaser from 'phaser';
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

/** Upload any missing placeholder texture (shared by every scene, never removed) and describe the wall pieces. */
export const ensureMountainWallTextures = (textures: Phaser.Textures.TextureManager): readonly WallAsset[] => {
  for (const s of PLACEHOLDERS) addPixelTexture(textures, wallTextureKey(s.id), paintMountainWall(s.id, s.w, s.h));
  return PLACEHOLDERS.map(toAsset);
};

/** Pure description of the placeholder pieces (no textures), for layout tests. */
export const placeholderWallAssets = (): readonly WallAsset[] => PLACEHOLDERS.map(toAsset);
