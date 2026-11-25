import { describe, expect, it } from 'vitest';
import { BASE_ART_QUALITY, CLOSE_UP_ZOOM_MAX, chooseArtQuality } from './artQuality';

describe('chooseArtQuality (close-up art, 12/11/2026)', () => {
  it("'high' on a desktop: density-8 art, smooth sampling, zoom to 6 — at any display density", () => {
    for (const density of [1, 1.25, 2, 3])
      expect(chooseArtQuality({ graphics: 'high', density, desktop: true })).toEqual({ tier: 'uhd', smooth: true, zoomMax: CLOSE_UP_ZOOM_MAX });
  });
  it("'high' off a desktop: smooth with the density's art, the layout's zoom", () => {
    expect(chooseArtQuality({ graphics: 'high', density: 1, desktop: false })).toEqual({ tier: 'sd', smooth: true, zoomMax: null });
    expect(chooseArtQuality({ graphics: 'high', density: 3, desktop: false })).toEqual({ tier: 'hd', smooth: true, zoomMax: null });
  });
  it("'balanced' and 'saver' keep the pixel look (HD art from density 2)", () => {
    expect(chooseArtQuality({ graphics: 'balanced', density: 2, desktop: true })).toEqual({ tier: 'hd', smooth: false, zoomMax: null });
    expect(chooseArtQuality({ graphics: 'saver', density: 1, desktop: true })).toEqual(BASE_ART_QUALITY);
  });
});
