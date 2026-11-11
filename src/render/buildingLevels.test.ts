import { describe, expect, it } from 'vitest';
import { buildingFrame, buildingLevelFrame, pickBuildingFrame } from './atlas';
import { IMAGE_ART_FILES, IMAGE_BUILDINGS, IMAGE_BUILDING_LEVELS, buildingLevelFile, levelArt } from './imageArt';

describe('building level architecture', () => {
  it('level 1 base, 2 → L2, 3–5 → L3', () => {
    expect([1, 2, 3, 4, 5].map(levelArt)).toEqual([1, 2, 3, 3, 3]);
  });

  it('falls back to the next lower architecture, then the base', () => {
    const card = 'wheat_militia';
    const only = (frames: string[]) => (f: string) => frames.includes(f);
    const l2 = buildingLevelFrame(card, 2);
    const l3 = buildingLevelFrame(card, 3);
    expect(pickBuildingFrame(card, 5, only([l2, l3]))).toBe(l3);
    expect(pickBuildingFrame(card, 4, only([l2]))).toBe(l2);
    expect(pickBuildingFrame(card, 2, only([l3]))).toBe(buildingFrame(card));
    expect(pickBuildingFrame(card, 1, only([l2, l3]))).toBe(buildingFrame(card));
  });

  it('every listed level has a base image and is loaded', () => {
    for (const [card, arts] of Object.entries(IMAGE_BUILDING_LEVELS)) {
      expect(IMAGE_BUILDINGS[card], card).toBeDefined();
      for (const art of arts ?? []) expect(IMAGE_ART_FILES).toContain(buildingLevelFile(card, art));
    }
  });
});
