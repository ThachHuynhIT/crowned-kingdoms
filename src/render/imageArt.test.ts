import { describe, expect, it } from 'vitest';
import { FIELD_TERRAINS, generateField, paintField } from './fieldArt';
import { GRASS_FILES, IMAGE_ART_FILES, IMAGE_ART_SCALE, IMAGE_BUILDINGS, IMAGE_PLOTS, IMAGE_UNITS, MENU_IMAGE_LAYERS, POSES, WALL_FILE, menuImageLayers, unitPoseFile } from './imageArt';
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

  it('the Wheat and Stone units use their own posed art (G3e unit poses, 2026-11-06)', () => {
    for (const unit of ['militia', 'reaper', 'peasant', 'golem', 'miner', 'rubble', 'slinger']) {
      expect(IMAGE_UNITS[unit]).toBe(unit);
      expect(unitPoseFile(unit, 'foe', 'attack', 1)).toBe(`${unit}_foe_5`);
    }
    expect(IMAGE_ART_FILES.some((f) => f.startsWith('spearman'))).toBe(false);
  });

  it('every Wheat building card, throne included, uses the approved isometric image (2026-11-06)', () => {
    for (const card of ['throne', 'field', 'windmill', 'granary', 'peasant_horde', 'militia', 'reapers', 'scarecrow'])
      expect(IMAGE_BUILDINGS[`wheat_${card}`]).toBe(`iso/wheat_${card}`);
    expect(IMAGE_ART_FILES).not.toContain('cottage');
  });

  it('loads the four isometric Wheat plot skins, the paved built plot included, and the cliff', () => {
    expect(IMAGE_PLOTS.wheat).toBe('iso/plots/wheat');
    for (const state of ['open', 'locked', 'throne', 'built']) expect(IMAGE_ART_FILES).toContain(`iso/plots/wheat_${state}`);
    expect(IMAGE_ART_FILES).toContain(WALL_FILE);
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

describe('paintField with ground textures (river and sand join up, 2026-11-06)', () => {
  const grass = [0x112233, 0x223344, 0x334455].map((c) => {
    const t = new PixelCanvas(32, 32);
    t.fillRect(0, 0, 32, 32, c);
    return t;
  });
  // A 40×24 texture whose colour encodes its own pixel position: (x << 8) | y, blue-ish so it is never grass.
  const tex = (tag: number): PixelCanvas => {
    const t = new PixelCanvas(40, 24);
    for (let y = 0; y < 24; y++) for (let x = 0; x < 40; x++) t.set(x, y, (tag << 16) | (x << 8) | y);
    return t;
  };
  const water = tex(0xa0);
  const sand = tex(0xb0);

  it('fills water and sand from the textures at their world position, so neighbouring tiles join without a seam', () => {
    const f = paintField(4, grass, { water, sand });
    const field = generateField(4);
    const WATER = FIELD_TERRAINS.indexOf('water');
    let checked = 0;
    // Every art pixel of a water cell surrounded by water reads the texture at (x mod 40, y mod 24).
    for (let row = 1; row < 47; row++)
      for (let col = 1; col < 47; col++) {
        const all = [-1, 0, 1].every((dr) => [-1, 0, 1].every((dc) => field[(row + dr) * 48 + col + dc] === WATER));
        if (!all) continue;
        for (let py = row * 32; py < row * 32 + 32; py += 7)
          for (let px = col * 32; px < col * 32 + 32; px += 7) {
            const i = (py * f.width + px) * 4;
            expect([f.data[i], f.data[i + 1], f.data[i + 2]]).toEqual([0xa0, px % 40, py % 24]);
            checked++;
          }
      }
    expect(checked).toBeGreaterThan(20);
  });

  it('keeps the river and bank shapes of the data (the textures only colour them)', () => {
    const plainShape = paintField(4, grass);
    const textured = paintField(4, grass, { water, sand });
    expect([textured.width, textured.height]).toEqual([plainShape.width, plainShape.height]);
    let holes = 0;
    for (let i = 3; i < textured.data.length; i += 4) if (textured.data[i] !== 255) holes++;
    expect(holes).toBe(0);
  });
});

describe('menu picture strips (G5)', () => {
  it('uses the pictures only when every strip loaded', () => {
    expect(menuImageLayers(() => true)).toBe(MENU_IMAGE_LAYERS);
    expect(menuImageLayers((file) => file !== 'menu/hills_far')).toBeNull();
  });

  it('loads every strip with the rest of the image art, far drifting slower than near', () => {
    for (const layer of MENU_IMAGE_LAYERS) expect(IMAGE_ART_FILES).toContain(layer.file);
    const speeds = MENU_IMAGE_LAYERS.map((layer) => layer.parallax);
    expect([...speeds].sort((a, b) => a - b)).toEqual(speeds);
  });
});
