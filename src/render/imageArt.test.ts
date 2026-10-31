import { describe, expect, it } from 'vitest';
import { generateField, paintField } from './fieldArt';
import { GRASS_FILES, IMAGE_ART_FILES, IMAGE_ART_SCALE, IMAGE_BUILDINGS, IMAGE_UNITS, POSES, unitPoseFile } from './imageArt';
import { PixelCanvas, upscale } from './pixel';

describe('image art mapping', () => {
  it('density is 2 art px per world unit', () => {
    expect(IMAGE_ART_SCALE).toBe(0.5);
  });

  it('every pose of every animation maps to a listed file, ally and foe', () => {
    for (const unit of Object.keys(IMAGE_UNITS))
      for (const team of ['ally', 'foe'] as const)
        for (const anim of ['idle', 'walk', 'attack'] as const)
          for (const n of [0, 1])
            expect(IMAGE_ART_FILES, `${unit} ${team} ${anim} ${n}`).toContain(unitPoseFile(unit, team, anim, n));
    for (const file of Object.values(IMAGE_BUILDINGS)) expect(IMAGE_ART_FILES).toContain(file);
  });

  it('idle, walk and attack use six different poses', () => {
    const all = Object.values(POSES).flat();
    expect(new Set(all).size).toBe(6);
  });

  it('lists the three grass tiles and has no duplicate files', () => {
    for (const g of GRASS_FILES) expect(IMAGE_ART_FILES).toContain(g);
    expect(new Set(IMAGE_ART_FILES).size).toBe(IMAGE_ART_FILES.length);
  });
});

describe('upscale', () => {
  it('turns each pixel into a k × k block', () => {
    const a = new PixelCanvas(2, 1);
    a.set(0, 0, 0xff0000);
    a.set(1, 0, 0x00ff00);
    const b = upscale(a, 2);
    expect([b.width, b.height]).toEqual([4, 2]);
    expect(b.data[0]).toBe(0xff);
    expect(b.data[(1 * 4 + 1) * 4]).toBe(0xff); // row 1, x 1 still the first pixel
    expect(b.data[(0 * 4 + 2) * 4 + 1]).toBe(0xff); // x 2 is the second pixel's green
  });
});

describe('paintField with grass art', () => {
  it('is twice as dense and takes its grass from the art, same seed geometry', () => {
    const grass = [0x112233, 0x223344, 0x334455].map((c) => {
      const t = new PixelCanvas(32, 32);
      t.fillRect(0, 0, 32, 32, c);
      return t;
    });
    const plain = paintField(1);
    const hd = paintField(1, grass);
    expect([hd.width, hd.height]).toEqual([plain.width * 2, plain.height * 2]);
    expect(generateField(1)).toEqual(generateField(1));
    let artPixels = 0;
    for (let i = 0; i < hd.data.length; i += 4) {
      const c = (hd.data[i]! << 16) | (hd.data[i + 1]! << 8) | hd.data[i + 2]!;
      if (c === 0x112233 || c === 0x223344 || c === 0x334455) artPixels++;
    }
    expect(artPixels).toBeGreaterThan(1000);
  });
});
