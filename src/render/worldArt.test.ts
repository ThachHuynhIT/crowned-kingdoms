import { describe, expect, it } from 'vitest';
import { PALETTE } from '../data/palette';
import { CONTENT } from '../game/cards/registry';
import { checkArtFrame } from './artPolicy';
import { BUILDING_SIZE, THRONE_SIZE, paintBuilding, paintThrone } from './buildingArt';
import { CARD_ART, paintCardArt } from './cardArt';
import {
  FIELD_TERRAINS,
  generateField,
  paintField,
  paintFieldTile,
  paintGroundTile,
} from './fieldArt';
import {
  ARROW_DIRS,
  arrowDir,
  paintArrow,
  paintBoulder,
  paintBoulderShadow,
  paintPulse,
  paintShieldFx,
  paintSpark,
  paintStun,
} from './fxArt';
import { ICON_IDS, paintIcon } from './iconArt';
import type { PixelCanvas } from './pixel';
import { PLOT_SIZE, paintPlot } from './plotArt';
import { paintPortrait, PORTRAIT_SIZE } from './portraitArt';
import { UNIT_CLOTH, paintUnit, unitCloth, type UnitAnim, type UnitTeam } from './unitArt';

const colorAt = (c: PixelCanvas, x: number, y: number): number => {
  const i = (y * c.width + x) * 4;
  return (c.data[i]! << 16) | (c.data[i + 1]! << 8) | c.data[i + 2]!;
};

/** Edge problems of a frame (soft alpha; alpha 128 is the declared ground shadow); any RGB is fine under the G3e art contract. */
const foreign = (c: PixelCanvas, shadow = true): readonly string[] =>
  checkArtFrame('frame', c, { w: c.width, h: c.height }, shadow);

const count = (c: PixelCanvas, color: number): number => {
  let n = 0;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++) if (c.alphaAt(x, y) > 0 && colorAt(c, x, y) === color) n++;
  return n;
};

const same = (a: PixelCanvas, b: PixelCanvas): boolean =>
  a.width === b.width && a.height === b.height && a.data.every((v, i) => v === b.data[i]);

describe('unit art', () => {
  const teams: UnitTeam[] = ['ally', 'foe'];
  const anims: UnitAnim[] = ['idle', 'walk', 'attack'];

  it('paints every unit at its sprite size with team outlines', () => {
    for (const def of CONTENT.allUnits()) {
      const cloth = unitCloth(def);
      for (const team of teams)
        for (const anim of anims)
          for (const frame of [0, 1] as const) {
            const art = paintUnit(def, team, anim, frame, cloth);
            const tag = `${def.id} ${team} ${anim} ${frame}`;
            expect([art.width, art.height], tag).toEqual([def.sprite.w, def.sprite.h]);
            expect(foreign(art), tag).toEqual([]);
            if (team === 'ally') {
              expect(count(art, PALETTE.outline), tag).toBeGreaterThan(0);
              expect(count(art, PALETTE.redDark), tag).toBe(0);
            } else {
              expect(count(art, PALETTE.redDark), tag).toBeGreaterThan(0);
              expect(count(art, PALETTE.red), tag).toBe(1);
            }
          }
    }
  });

  it('animates, tells teams apart and casts a shadow at the feet', () => {
    for (const def of CONTENT.allUnits()) {
      const cloth = unitCloth(def);
      const a0 = paintUnit(def, 'ally', 'idle', 0, cloth);
      const a1 = paintUnit(def, 'ally', 'idle', 1, cloth);
      expect(same(a0, a1), def.id).toBe(false);
      expect(same(a0, paintUnit(def, 'foe', 'idle', 0, cloth)), def.id).toBe(false);
      const w0 = paintUnit(def, 'ally', 'walk', 0, cloth);
      expect(same(w0, paintUnit(def, 'ally', 'walk', 1, cloth)), def.id).toBe(false);
      const k0 = paintUnit(def, 'ally', 'attack', 0, cloth);
      expect(same(k0, paintUnit(def, 'ally', 'attack', 1, cloth)), def.id).toBe(false);
      let shadow = 0;
      for (let x = 0; x < a0.width; x++) shadow += a0.alphaAt(x, a0.height - 1) > 0 ? 1 : 0;
      expect(shadow, def.id).toBeGreaterThan(0);
    }
  });

  it('gives different unit kinds different pictures and cloth', () => {
    const militia = paintUnit(CONTENT.unit('militia'), 'ally', 'idle', 0, PALETTE.wheat);
    const footman = paintUnit(CONTENT.unit('footman'), 'ally', 'idle', 0, PALETTE.blue);
    expect(same(militia, footman)).toBe(false);
    expect(unitCloth(CONTENT.unit('militia'))).toBe(PALETTE.wheat);
    expect(unitCloth(CONTENT.unit('footman'))).toBe(PALETTE.blue);
    expect(unitCloth(CONTENT.unit('bandit'))).toBe(PALETTE.soil);
  });
});

describe('buildings and plots', () => {
  it('paints troop, tower and throne at their sizes', () => {
    const troop = paintBuilding('troop', PALETTE.red);
    const tower = paintBuilding('tower', PALETTE.blue);
    const throne = paintThrone(PALETTE.gold);
    expect([troop.width, troop.height]).toEqual([BUILDING_SIZE.w, BUILDING_SIZE.h]);
    expect([tower.width, tower.height]).toEqual([32, 40]);
    expect([throne.width, throne.height]).toEqual([THRONE_SIZE.w, THRONE_SIZE.h]);
    expect([THRONE_SIZE.w, THRONE_SIZE.h]).toEqual([32, 48]);
    for (const art of [troop, tower, throne]) expect(foreign(art)).toEqual([]);
    expect(same(troop, tower)).toBe(false);
  });

  it('paints three plot states at 32x32, open different from locked', () => {
    const open = paintPlot('open');
    const locked = paintPlot('locked');
    const throne = paintPlot('throne');
    for (const art of [open, locked, throne]) {
      expect([art.width, art.height]).toEqual([PLOT_SIZE, PLOT_SIZE]);
      expect(foreign(art)).toEqual([]);
    }
    expect(PLOT_SIZE).toBe(32);
    expect(same(open, locked)).toBe(false);
  });
});

describe('field art', () => {
  it('generates a 48x48 field (768 px of 16 px cells) with a clear board area', () => {
    const f = generateField(1);
    expect(f.length).toBe(48 * 48);
    for (const v of f) expect(v).toBeLessThan(FIELD_TERRAINS.length);
    for (let row = 14; row <= 33; row++)
      for (let col = 14; col <= 33; col++) expect([0, 1]).toContain(f[row * 48 + col]);
  });

  it('keeps a single road: south of the board only, nothing north, east or west (spec 06/11/2026, G)', () => {
    const PATH = FIELD_TERRAINS.indexOf('path');
    for (let seed = 1; seed <= 12; seed++) {
      const f = generateField(seed);
      const at = (col: number, row: number): number => f[row * 48 + col]!;
      // The road: the two middle columns from the board's south edge (row 34) to the field edge.
      for (let row = 34; row < 48; row++) for (const col of [23, 24]) expect(at(col, row), `seed ${seed} ${col},${row}`).toBe(PATH);
      // No path anywhere else: not north of the board, not in the west or east strips.
      for (let row = 0; row < 48; row++)
        for (let col = 0; col < 48; col++) {
          if (row >= 34 && (col === 23 || col === 24)) continue;
          expect(at(col, row), `seed ${seed} ${col},${row}`).not.toBe(PATH);
        }
    }
  });

  it('runs a river from the west edge to the south edge, never on the board or the road (P4)', () => {
    const WATER = FIELD_TERRAINS.indexOf('water');
    const PATH = FIELD_TERRAINS.indexOf('path');
    for (let seed = 1; seed <= 12; seed++) {
      const f = generateField(seed);
      const at = (col: number, row: number): number => f[row * 48 + col]!;
      // water reaches the west edge and the south edge
      expect(Array.from({ length: 48 }, (_, r) => at(0, r)).includes(WATER), `seed ${seed} west`).toBe(true);
      expect(Array.from({ length: 48 }, (_, c) => at(c, 47)).includes(WATER), `seed ${seed} south`).toBe(true);
      // and the water cells connect them (4-neighbour flood from the west edge reaches the south edge)
      const seen = new Set<number>();
      const queue: number[] = [];
      for (let r = 0; r < 48; r++) if (at(0, r) === WATER) queue.push(r * 48);
      while (queue.length) {
        const i = queue.pop()!;
        if (seen.has(i)) continue;
        seen.add(i);
        const c = i % 48;
        const r = (i - c) / 48;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nc = c + dc;
          const nr = r + dr;
          if (nc >= 0 && nc < 48 && nr >= 0 && nr < 48 && at(nc, nr) === WATER) queue.push(nr * 48 + nc);
        }
      }
      expect([...seen].some((i) => i >= 47 * 48), `seed ${seed} connected`).toBe(true);
      // never on the board, and the road stays a road
      for (let r = 14; r <= 33; r++) for (let c = 14; c <= 33; c++) expect(at(c, r)).not.toBe(WATER);
      for (let r = 34; r < 48; r++) for (const c of [23, 24]) expect(at(c, r)).toBe(PATH);
    }
  });

  it('is deterministic per seed and varies between seeds', () => {
    expect(generateField(7)).toEqual(generateField(7));
    const base = generateField(1);
    let differing = 0;
    for (let s = 2; s <= 11; s++) if (generateField(s).some((v, i) => v !== base[i])) differing++;
    expect(differing).toBeGreaterThan(0);
  });

  it('paints every terrain and mask tile at 16x16', () => {
    for (let t = 0; t < FIELD_TERRAINS.length; t++)
      for (let mask = 0; mask <= 15; mask++) {
        const tile = paintFieldTile(t, mask, 3);
        expect([tile.width, tile.height]).toEqual([16, 16]);
        expect(foreign(tile), `${t}/${mask}`).toEqual([]);
      }
  });

  it('paints the plain grass ground tile fully opaque', () => {
    const t = paintGroundTile();
    expect([t.width, t.height]).toEqual([16, 16]);
    expect(foreign(t)).toEqual([]);
    for (let i = 3; i < t.data.length; i += 4) if (t.data[i] !== 255) throw new Error(`hole at ${i}`);
    expect(same(t, paintGroundTile())).toBe(true);
  });

  it('paints the whole field opaque at 768x768, deterministically', () => {
    const f = paintField(1);
    expect([f.width, f.height]).toEqual([768, 768]);
    expect(foreign(f)).toEqual([]);
    for (let i = 3; i < f.data.length; i += 4) if (f.data[i] !== 255) throw new Error(`hole at ${i}`);
    expect(same(f, paintField(1))).toBe(true);
  });
});

describe('icons and fx', () => {
  it('paints 7 icons at 16x16', () => {
    expect(ICON_IDS.length).toBe(14);
    for (const id of ICON_IDS) {
      const art = paintIcon(id);
      expect([art.width, art.height], id).toEqual([16, 16]);
      expect(foreign(art), id).toEqual([]);
    }
  });

  it('paints the pulse burst, shield bubble and stun stars', () => {
    const arts = {
      pulse: paintPulse(),
      shield: paintShieldFx(),
      stun: paintStun(),
    };
    expect([arts.pulse.width, arts.pulse.height]).toEqual([16, 16]);
    expect([arts.shield.width, arts.shield.height]).toEqual([16, 16]);
    expect([arts.stun.width, arts.stun.height]).toEqual([8, 8]);
    // pulse and shield are translucent on purpose (declared in E6c); only the stun stars must be crisp
    expect(foreign(arts.stun)).toEqual([]);
    expect(same(arts.pulse, arts.shield)).toBe(false);
  });

  it('paints 8 distinct arrows at 8x8', () => {
    const arts = ARROW_DIRS.map((d) => paintArrow(d));
    for (const art of arts) {
      expect([art.width, art.height]).toEqual([8, 8]);
      expect(foreign(art)).toEqual([]);
    }
    for (let i = 0; i < arts.length; i++)
      for (let j = i + 1; j < arts.length; j++)
        expect(same(arts[i]!, arts[j]!), `${i}/${j}`).toBe(false);
  });

  it('picks the arrow direction on a screen with y down', () => {
    expect(arrowDir(1, 0)).toBe('e');
    expect(arrowDir(0, -1)).toBe('n');
    expect(arrowDir(1, -1)).toBe('ne');
    expect(arrowDir(-1, 1)).toBe('sw');
    expect(arrowDir(0, 1)).toBe('s');
    expect(arrowDir(1, 0.3)).toBe('e');
    expect(arrowDir(0.3, 1)).toBe('s');
    expect(arrowDir(0, 0)).toBe('e');
    expect(arrowDir(-1, 0)).toBe('w');
    expect(arrowDir(-1, -1)).toBe('nw');
    expect(arrowDir(1, 1)).toBe('se');
  });

  it('paints boulder, shadow and spark', () => {
    const b = paintBoulder();
    const s = paintBoulderShadow();
    const k = paintSpark();
    expect([b.width, b.height]).toEqual([16, 16]);
    expect([s.width, s.height]).toEqual([24, 8]);
    expect([k.width, k.height]).toEqual([4, 4]);
    for (const art of [b, s, k]) expect(foreign(art)).toEqual([]);
  });
});

describe('card art', () => {
  it('paints every card picture at 32x24', () => {
    const cards = CONTENT.allCards();
    expect(cards.length).toBeGreaterThanOrEqual(7);
    for (const def of cards) {
      const art = paintCardArt(def, PALETTE.red);
      expect([art.width, art.height], def.id).toEqual([CARD_ART.w, CARD_ART.h]);
      expect(foreign(art), def.id).toEqual([]);
    }
  });
});

describe('G2 art', () => {
  it('gives every unit of the content an explicit cloth colour', () => {
    for (const def of CONTENT.allUnits()) expect(UNIT_CLOTH, def.id).toHaveProperty(def.id);
  });

  it('paints economy and support buildings at the building size', () => {
    const economy = paintBuilding('economy', PALETTE.wheat);
    const support = paintBuilding('support', PALETTE.stone);
    for (const art of [economy, support]) {
      expect([art.width, art.height]).toEqual([BUILDING_SIZE.w, BUILDING_SIZE.h]);
      expect(foreign(art)).toEqual([]);
    }
    expect(same(economy, support)).toBe(false);
    expect(same(economy, paintBuilding('troop', PALETTE.wheat))).toBe(false);
    expect(same(support, paintBuilding('tower', PALETTE.stone))).toBe(false);
  });

  it('adds the G2 icons at 16x16', () => {
    for (const id of ['gold', 'level', 'enchant', 'reroll', 'sell', 'lock', 'conquer'] as const) {
      expect(ICON_IDS).toContain(id);
      const art = paintIcon(id);
      expect([art.width, art.height], id).toEqual([16, 16]);
      expect(foreign(art), id).toEqual([]);
    }
  });

  it('paints a different card picture for every card of the same kind', () => {
    const byKind = new Map<string, PixelCanvas[]>();
    const names = new Map<string, string[]>();
    for (const def of CONTENT.allCards()) {
      const art = paintCardArt(def, PALETTE.red);
      byKind.set(def.kind, [...(byKind.get(def.kind) ?? []), art]);
      names.set(def.kind, [...(names.get(def.kind) ?? []), def.id]);
    }
    for (const [kind, arts] of byKind)
      for (let i = 0; i < arts.length; i++)
        for (let j = i + 1; j < arts.length; j++)
          expect(same(arts[i]!, arts[j]!), `${kind}: ${names.get(kind)![i]} vs ${names.get(kind)![j]}`).toBe(false);
  });

  it('paints a king portrait per king', () => {
    const arts: PixelCanvas[] = [];
    for (const king of CONTENT.kings()) {
      const art = paintPortrait(king);
      expect([art.width, art.height]).toEqual([PORTRAIT_SIZE, PORTRAIT_SIZE]);
      expect(foreign(art), king.id).toEqual([]);
      arts.push(art);
    }
    expect(arts.length).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < arts.length; i++)
      for (let j = i + 1; j < arts.length; j++) expect(same(arts[i]!, arts[j]!)).toBe(false);
  });
});
