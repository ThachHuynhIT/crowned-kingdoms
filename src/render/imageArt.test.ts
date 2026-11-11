import { describe, expect, it } from 'vitest';
import { FIELD_TERRAINS, ROAD_TAIL, generateField, paintField, paintRoadTail } from './fieldArt';
import { DECOR_APPROVED, FOREST_APPROVED, GROUND_TEXTURES_APPROVED, GROUND_TEXTURE_FILES, PORTAL_ART, decorFile, forestFile, imageArtScale, imageArtTexture, GRASS_FILES, IMAGE_ART_DIR, IMAGE_ART_FILES, IMAGE_ART_HD_DIR, IMAGE_ART_HD_BUILDINGS, IMAGE_ART_HD_FILES, IMAGE_ART_HD_PLOTS, IMAGE_ART_HD_SCALE, IMAGE_ART_HD_UNITS, IMAGE_ART_SCALE, IMAGE_BUILDINGS, IMAGE_PLOTS, IMAGE_UNITS, MENU_IMAGE_LAYERS, POSES, WALL_FILE, imageArtHdKey, imageArtKey, imageArtLoads, menuImageLayers, unitPoseFile, useHdArt } from './imageArt';
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

describe('HD image art (4 art px per world unit)', () => {
  it('is drawn at half the standard scale, so world sizes stay the same', () => {
    expect(IMAGE_ART_HD_SCALE * 2).toBe(IMAGE_ART_SCALE);
  });

  it('covers every unit but footman, every image building with its levels, and every king plot skin', () => {
    expect([...IMAGE_ART_HD_UNITS].sort()).toEqual(Object.keys(IMAGE_UNITS).filter((u) => u !== 'footman').sort());
    expect([...IMAGE_ART_HD_BUILDINGS].sort()).toEqual(Object.keys(IMAGE_BUILDINGS).sort());
    expect([...IMAGE_ART_HD_PLOTS].sort()).toEqual(Object.keys(IMAGE_PLOTS).sort());
    expect(IMAGE_ART_HD_FILES).toContain('militia_foe_5');
    expect(IMAGE_ART_HD_FILES).toContain('boss_crownless_king_5');
    expect(IMAGE_ART_HD_FILES).toContain('iso/wheat_throne_l3');
    expect(IMAGE_ART_HD_FILES).toContain('iso-neutral/neutral_well');
    expect(IMAGE_ART_HD_FILES).toContain('iso/plots/nomad_built');
    expect(IMAGE_ART_HD_FILES).not.toContain('footman_0');
    for (const file of IMAGE_ART_HD_FILES) expect(IMAGE_ART_FILES).toContain(file);
  });

  it('loads HD twins under their own key only when asked, every other file from ai-v1', () => {
    const sd = imageArtLoads(false);
    const hd = imageArtLoads(true);
    expect(sd.length).toBe(IMAGE_ART_FILES.length);
    expect(hd.length).toBe(IMAGE_ART_FILES.length);
    expect(sd.every((l) => l.url.startsWith(IMAGE_ART_DIR))).toBe(true);
    expect(hd).toContainEqual({ key: imageArtHdKey('militia_0'), url: `${IMAGE_ART_HD_DIR}militia_0.png` });
    expect(hd).toContainEqual({ key: imageArtKey('footman_0'), url: `${IMAGE_ART_DIR}footman_0.png` });
    expect(hd).toContainEqual({ key: imageArtHdKey(WALL_FILE), url: `${IMAGE_ART_HD_DIR}${WALL_FILE}.png` });
    expect(hd).toContainEqual({ key: imageArtKey('icons/icon_gold-16'), url: `${IMAGE_ART_DIR}icons/icon_gold-16.png` });
    expect(hd.filter((l) => l.url.startsWith(IMAGE_ART_HD_DIR)).length).toBe(IMAGE_ART_HD_FILES.size);
  });

  it('has HD twins of the world pictures drawn outside the atlas (wall, wilds, forest, portal, grass, terrain)', () => {
    const world = [
      WALL_FILE,
      PORTAL_ART.file,
      ...GRASS_FILES,
      ...DECOR_APPROVED.map(decorFile),
      ...FOREST_APPROVED.map(forestFile),
      ...GROUND_TEXTURES_APPROVED.map((t) => GROUND_TEXTURE_FILES[t]),
    ];
    for (const file of world) expect(IMAGE_ART_HD_FILES, file).toContain(file);
  });

  it('finds a world picture under its HD key first, then its ai-v1 key; the HD twin draws at half scale', () => {
    const file = decorFile('log');
    expect(imageArtTexture(() => true, file)).toEqual({ key: imageArtHdKey(file), hd: true });
    expect(imageArtTexture((k) => k === imageArtKey(file), file)).toEqual({ key: imageArtKey(file), hd: false });
    expect(imageArtTexture(() => false, file)).toBeNull();
    expect(imageArtScale(1, false)).toBe(1);
    expect(imageArtScale(1, true)).toBe(0.5);
    expect(imageArtScale(IMAGE_ART_SCALE, true)).toBe(IMAGE_ART_HD_SCALE);
  });

  it('switches on from display density 2', () => {
    expect(useHdArt(1)).toBe(false);
    expect(useHdArt(1.5)).toBe(false);
    expect(useHdArt(2)).toBe(true);
    expect(useHdArt(3)).toBe(true);
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

describe('paintField with HD grass art (4 art px per world unit, 11/11/2026)', () => {
  const grass = (n: number) =>
    [0x112233, 0x223344, 0x334455].map((c) => {
      const t = new PixelCanvas(n, n);
      t.fillRect(0, 0, n, n, c);
      return t;
    });

  it('is four times as dense as the plain field and lays every cell exactly where the density-2 field does', () => {
    const sd = paintField(2, grass(32));
    const hd = paintField(2, grass(64));
    expect([hd.width, hd.height]).toEqual([sd.width * 2, sd.height * 2]);
    // the 64 px grass tiles are the 32 px ones twice as dense: the field downsampled 2× is the density-2 field
    for (let y = 0; y < sd.height; y += 5)
      for (let x = 0; x < sd.width; x += 5) {
        const i = (y * sd.width + x) * 4;
        const j = (2 * y * hd.width + 2 * x) * 4;
        expect([hd.data[j], hd.data[j + 1], hd.data[j + 2], hd.data[j + 3]]).toEqual([sd.data[i], sd.data[i + 1], sd.data[i + 2], sd.data[i + 3]]);
      }
  });

  it('paints the road tail at the same density', () => {
    const sd = paintRoadTail(2);
    const hd = paintRoadTail(4);
    expect([hd.width, hd.height]).toEqual([sd.width * 2, sd.height * 2]);
    for (const [x, y] of [[0, 0], [17, 5], [40, 33], [63, 63]] as const)
      expect(hd.data[(2 * y * hd.width + 2 * x) * 4]).toBe(sd.data[(y * sd.width + x) * 4]);
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

  it('fills road and flower cells from their textures at their world position (G5)', () => {
    const f = paintField(4, grass, { water, sand, path: tex(0xc0), flowers: tex(0xd0) });
    for (const tag of [0xc0, 0xd0]) {
      let textured = 0;
      for (let py = 0; py < f.height; py++)
        for (let px = 0; px < f.width; px++) {
          const i = (py * f.width + px) * 4;
          if (f.data[i] !== tag) continue;
          expect([f.data[i + 1], f.data[i + 2]]).toEqual([px % 40, py % 24]);
          textured++;
        }
      expect(textured, tag.toString(16)).toBeGreaterThan(500);
    }
  });

  it('the road tail reads the road texture at its world position, so it continues the road', () => {
    const path = tex(0xc0);
    const tail = paintRoadTail(2, path);
    for (const [x, y] of [[0, 0], [17, 5], [40, 33], [63, 63]] as const) {
      const i = (y * tail.width + x) * 4;
      const wx = ROAD_TAIL.x * 2 + x;
      const wy = ROAD_TAIL.y * 2 + y;
      expect([tail.data[i], tail.data[i + 1], tail.data[i + 2]]).toEqual([0xc0, wx % 40, wy % 24]);
    }
    expect(paintRoadTail(2).data).not.toEqual(tail.data);
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
