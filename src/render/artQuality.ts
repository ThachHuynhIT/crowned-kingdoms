/**
 * Close-up art (owner 12/11/2026, spec `docs/superpowers/specs/2026-11-12-close-up-art-design.md`): which art density
 * the session loads, whether world art is sampled smoothly, and how far the realm camera may zoom. Chosen once at boot
 * from the graphics setting and the device, kept for the whole session (a changed setting applies after a reload).
 */
import type { GraphicsQuality } from '../data/settings';

/** Art px per world unit: 'sd' 2 (`ai-v1`), 'hd' 4 (`ai-v1-hd`), 'uhd' 8 (`ai-v1-uhd`). */
export type ArtTier = 'sd' | 'hd' | 'uhd';

export interface ArtQuality {
  readonly tier: ArtTier;
  /** Linear filtering with mipmaps for world art and card pictures (UI frames stay nearest). */
  readonly smooth: boolean;
  /** Highest realm camera zoom, or null for the layout's own limit. */
  readonly zoomMax: number | null;
}

/** Highest logical zoom of the close-up camera. */
export const CLOSE_UP_ZOOM_MAX = 6;
/** Display density from which the HD (density-4) art is worth loading without close-up. */
export const HD_TIER_MIN_DENSITY = 2;

/** The art quality before boot has chosen one (and in tests): the old behaviour. */
export const BASE_ART_QUALITY: ArtQuality = { tier: 'sd', smooth: false, zoomMax: null };

/**
 * 'high' on a desktop (fine pointer, wide screen): close-up — density-8 art, smooth sampling, zoom to
 * `CLOSE_UP_ZOOM_MAX`. 'high' elsewhere: smooth sampling with the density's art. 'balanced' / 'saver': the pixel look,
 * HD art from density 2.
 */
export const chooseArtQuality = (o: { graphics: GraphicsQuality; density: number; desktop: boolean }): ArtQuality => {
  if (o.graphics === 'high' && o.desktop) return { tier: 'uhd', smooth: true, zoomMax: CLOSE_UP_ZOOM_MAX };
  return { tier: o.density >= HD_TIER_MIN_DENSITY ? 'hd' : 'sd', smooth: o.graphics === 'high', zoomMax: null };
};

let current: ArtQuality = BASE_ART_QUALITY;

/** The session's art quality (set once by Boot). */
export const artQuality = (): ArtQuality => current;
export const setArtQuality = (q: ArtQuality): void => {
  current = q;
};

/** The smallest power of two ≥ `n` (WebGL1 mipmaps need power-of-two textures). */
export const nextPow2 = (n: number): number => {
  let p = 1;
  while (p < n) p *= 2;
  return p;
};
