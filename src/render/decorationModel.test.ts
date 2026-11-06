import { describe, expect, it } from 'vitest';
import { BATTLE } from '../data/battle';
import { FIELD_DECOR } from '../data/fieldDecoration';
import { layoutDecorations, type DecorAsset } from './decorationModel';
import { FIELD_TERRAINS, fieldTerrainAt, generateField } from './fieldArt';

const ASSETS: DecorAsset[] = [
  { id: 'tree_oak', tall: true, radius: 18 },
  { id: 'tree_pine_dark', tall: true, radius: 14 },
  { id: 'bush_green', tall: false, radius: 8 },
  { id: 'rock_small', tall: false, radius: 6 },
];
const WATER = FIELD_TERRAINS.indexOf('water');
const PATH = FIELD_TERRAINS.indexOf('path');
const BOARD = { lo: BATTLE.boardOrigin, hi: BATTLE.boardOrigin + 5 * BATTLE.plot };
const insideField = (x: number, y: number) => x >= 0 && y >= 0 && x < BATTLE.field && y < BATTLE.field;

describe('layoutDecorations (P4, spec 2026-11-06 §5)', () => {
  it('same_seed_same_decorations: deterministic per seed, varies between seeds, independent of asset order', () => {
    const a = layoutDecorations(7, ASSETS);
    expect(layoutDecorations(7, [...ASSETS].reverse())).toEqual(a);
    expect(layoutDecorations(8, ASSETS)).not.toEqual(a);
    expect(a.length).toBeGreaterThan(10);
  });

  it('keeps tall objects (and their whole footprint) outside the field', () => {
    for (let seed = 1; seed <= 10; seed++)
      for (const p of layoutDecorations(seed, ASSETS).filter((d) => d.tall)) {
        const r = ASSETS.find((x) => x.id === p.assetId)!.radius;
        for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [0, 0]])
          expect(insideField(p.x + dx!, p.y + dy!), `${seed} ${p.assetId} ${p.x},${p.y}`).toBe(false);
        expect(p.y).toBeGreaterThanOrEqual(FIELD_DECOR.northLimit);
      }
  });

  it('keeps low objects inside the field, off the board, the road and the water', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const field = generateField(seed);
      for (const p of layoutDecorations(seed, ASSETS).filter((d) => !d.tall)) {
        expect(insideField(p.x, p.y)).toBe(true);
        const r = ASSETS.find((x) => x.id === p.assetId)!.radius;
        const onBoard = p.x + r > BOARD.lo - FIELD_DECOR.low.boardPad && p.x - r < BOARD.hi + FIELD_DECOR.low.boardPad &&
          p.y + r > BOARD.lo - FIELD_DECOR.low.boardPad && p.y - r < BOARD.hi + FIELD_DECOR.low.boardPad;
        expect(onBoard, `${seed} ${p.x},${p.y}`).toBe(false);
        for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [0, 0]]) {
          const t = fieldTerrainAt(field, p.x + dx!, p.y + dy!);
          expect(t === WATER || t === PATH, `${seed} ${p.assetId} ${p.x},${p.y} on ${t}`).toBe(false);
        }
        expect(p.y).toBeGreaterThanOrEqual(FIELD_DECOR.northLimit);
      }
    }
  });

  it('never overlaps two decorations', () => {
    const list = layoutDecorations(3, ASSETS);
    const r = (id: string) => ASSETS.find((x) => x.id === id)!.radius;
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        expect(d).toBeGreaterThanOrEqual(r(a.assetId) + r(b.assetId));
      }
  });

  it('rejected_assets_never_appear: an empty pool gives no decoration, a low-only pool no tall one', () => {
    expect(layoutDecorations(5, [])).toEqual([]);
    const low = layoutDecorations(5, ASSETS.filter((a) => !a.tall));
    expect(low.length).toBeGreaterThan(0);
    expect(low.every((d) => !d.tall)).toBe(true);
  });
});
