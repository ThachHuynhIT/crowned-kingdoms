import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/game/cards/registry';
import {
  SPRITES_MAX_SIDE,
  frameDensityFactor,
  imageFrameScale,
  isoPlots,
  packSpritePages,
  spriteList,
  withImageArtFrom,
} from '../src/render/atlas';
import {
  IMAGE_ART_FILES,
  IMAGE_ART_HD_FILES,
  IMAGE_ART_HD_FX,
  IMAGE_ART_HD_ICONS,
  IMAGE_ART_HD_SCALE,
  IMAGE_ART_SCALE,
  imageArtLoads,
} from '../src/render/imageArt';
import { PixelCanvas } from '../src/render/pixel';

/** Width and height of a PNG from its IHDR chunk. */
const pngSize = (path: string): { width: number; height: number } => {
  const b = readFileSync(path);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
};

/**
 * The `sprites` pages the game builds at display density 1 (`hd` false) or ≥ 2 (`hd` true), from the real file list
 * and the real PNG sizes (blank pixels of the right size: only the packing is under test).
 */
const pagesAt = (hd: boolean) => {
  const loads = imageArtLoads(hd);
  const url = new Map(IMAGE_ART_FILES.map((file, i) => [file, loads[i]!.url]));
  let hdFrames = 0;
  const list = isoPlots(
    withImageArtFrom((file) => {
      const u = url.get(file);
      if (u === undefined || !existsSync(`public/${u}`)) return null;
      const { width, height } = pngSize(`public/${u}`);
      const isHd = u.includes('ai-v1-hd/');
      if (isHd) hdFrames++;
      return { art: new PixelCanvas(width, height), scale: isHd ? IMAGE_ART_HD_SCALE : IMAGE_ART_SCALE };
    }, spriteList(CONTENT)),
  );
  return { list, pages: packSpritePages(list), hdFrames };
};

describe('the sprites texture with the real image art', () => {
  it.each([
    ['density 1 (ai-v1)', false],
    ['density 2 (ai-v1-hd twins)', true],
  ] as const)('%s: every page is at most 4096 px per side and holds each frame once', (_, hd) => {
    const { list, pages, hdFrames } = pagesAt(hd);
    for (const page of pages) {
      expect(page.width).toBeLessThanOrEqual(SPRITES_MAX_SIDE);
      expect(page.height).toBeLessThanOrEqual(SPRITES_MAX_SIDE);
    }
    expect(pages.flatMap((p) => p.placed.map((s) => s.name)).sort()).toEqual(list.map((s) => s.name).sort());
    if (hd) expect(hdFrames).toBeGreaterThan(0);
    else expect(hdFrames).toBe(0);
  });

  it('HD atlas icons and fx keep their size: frame px × frameDensityFactor = the ai-v1 frame px', () => {
    const sd = new Map(pagesAt(false).list.map((s) => [s.name, s.art]));
    const { list } = pagesAt(true);
    const hdFrames = new Set([...IMAGE_ART_HD_ICONS.map((i) => `icon_${i}`), ...IMAGE_ART_HD_FX.map((f) => `fx_${f}`)]);
    let checked = 0;
    for (const s of list) {
      if (!hdFrames.has(s.name)) continue;
      const base = sd.get(s.name)!;
      expect(s.art.width, s.name).toBe(base.width * 2);
      expect(s.art.height, s.name).toBe(base.height * 2);
      expect(frameDensityFactor(s.name), s.name).toBe(0.5);
      expect(imageFrameScale(s.name), s.name).toBe(IMAGE_ART_HD_SCALE);
      checked++;
    }
    expect(checked).toBe(hdFrames.size);
  });

  it('every HD twin listed in the runtime exists on disk', () => {
    for (const file of IMAGE_ART_HD_FILES)
      expect(existsSync(`public/assets/art/ai-v1-hd/${file}.png`), file).toBe(true);
  });
});
