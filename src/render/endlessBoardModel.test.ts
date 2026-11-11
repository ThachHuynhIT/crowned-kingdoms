import { describe, expect, it } from 'vitest';
import { project, unproject } from '../core/iso';
import { geometryFor } from '../game/run/boardGeometry';
import { boardPlotCenter, boardTerrain, fieldTextureKey, plotAtWorld } from './endlessBoardModel';
import { FIELD_TERRAINS, fieldTerrainAt, generateField } from './fieldArt';
import { layoutDecorations } from './decorationModel';

describe('board geometry for drawing and picking', () => {
  it('separates field caches by seed and mode', () => {
    expect(fieldTextureKey(7)).toBe(fieldTextureKey(7, 'normal'));
    expect(fieldTextureKey(7)).not.toBe(fieldTextureKey(7, 'endless'));
    expect(fieldTextureKey(8, 'endless')).not.toBe(fieldTextureKey(7, 'endless'));
    expect(generateField(7)).toEqual(generateField(7, 'normal'));
  });
  for (const mode of ['normal', 'endless'] as const) {
    it(`${mode}: all plot centres round trip through the projection`, () => {
      const g = geometryFor(mode);
      for (let id = 0; id < g.plotCount; id++) {
        const p = unproject(project(boardPlotCenter(id, mode)));
        expect(plotAtWorld(p.x, p.y, mode)).toBe(id);
      }
      expect(plotAtWorld(g.boardMax, g.boardMin, mode)).toBeNull();
      expect(plotAtWorld(g.boardMin, g.boardMax, mode)).toBeNull();
      expect(plotAtWorld(g.boardMin - 1, g.boardMin, mode)).toBeNull();
      expect(plotAtWorld(Number.NaN, g.boardMin, mode)).toBeNull();
    });

    it(`${mode}: road starts at the south edge and board terrain stays clear`, () => {
      const g = geometryFor(mode);
      const terrain = boardTerrain(mode);
      expect(terrain).toEqual({
        wallY: mode === 'endless' ? 112 : 176,
        road: { x: 384, y0: mode === 'endless' ? 608 : 544, y1: 768 },
        portal: { x: 384, y: 916 },
      });
      const field = generateField(7, mode);
      const path = FIELD_TERRAINS.indexOf('path');
      for (let y = g.roadStartY; y < g.field; y += 16) {
        expect(fieldTerrainAt(field, 376, y)).toBe(path);
        expect(fieldTerrainAt(field, 392, y)).toBe(path);
      }
      expect(fieldTerrainAt(field, 384, g.roadStartY - 1)).not.toBe(path);
      for (let y = g.boardMin; y < g.boardMax; y += 16)
        for (let x = g.boardMin; x < g.boardMax; x += 16)
          expect(fieldTerrainAt(field, x, y)).toBeLessThanOrEqual(1);
    });

    it(`${mode}: seeded decoration footprints avoid the board and road`, () => {
      const assets = [{ id: 'low', tall: false, radius: 8 }];
      const placed = layoutDecorations(7, assets, mode);
      expect(placed).toEqual(layoutDecorations(7, assets, mode));
      const g = geometryFor(mode);
      for (const p of placed) {
        expect(
          p.x + 8 <= g.boardMin ||
            p.x - 8 >= g.boardMax ||
            p.y + 8 <= g.boardMin ||
            p.y - 8 >= g.boardMax,
        ).toBe(true);
        expect(p.y + 8 <= g.roadStartY || Math.abs(p.x - 384) >= 24).toBe(true);
      }
    });
  }

  it('keeps inner ids fixed and refuses outer centres in normal mode', () => {
    for (let id = 0; id < 25; id++)
      expect(boardPlotCenter(id, 'endless')).toEqual(boardPlotCenter(id));
    for (let id = 25; id < 49; id++) {
      const p = boardPlotCenter(id, 'endless');
      expect(plotAtWorld(p.x, p.y)).toBeNull();
    }
    expect(boardPlotCenter(25, 'endless')).toEqual({ x: 192, y: 192 });
    expect(boardPlotCenter(48, 'endless')).toEqual({ x: 576, y: 576 });
  });
});
