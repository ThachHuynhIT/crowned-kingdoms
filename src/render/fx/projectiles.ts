import { PALETTE as P } from '../../data/palette';
import { PixelCanvas, pixelHash } from '../pixel';
import type { CodeFxDef } from '../codeFx';

type Ramp = readonly [number, number, number, number];
type Stencil = readonly string[];
// Authored cardinal and diagonal pixel clusters, not resampled rotations.
type Shape = readonly Stencil[];
const shard: Shape = [
  ['........', '.....1..', '...1221.', '..123421', '...1221.', '.....1..', '........', '........'],
  ['........', '.....11.', '....241.', '...2331.', '..1221..', '..111...', '........', '........'],
  ['....1...', '...121..', '...242..', '..12321.', '..12321.', '...121..', '....1...', '........'],
  ['........', '.11.....', '.142....', '.1332...', '..1221..', '...111..', '........', '........'],
  ['........', '..1.....', '.1221...', '124321..', '.1221...', '..1.....', '........', '........'],
  ['........', '........', '...111..', '..1221..', '.1332...', '.142....', '.11.....', '........'],
  ['........', '....1...', '...121..', '..12321.', '..12321.', '...242..', '...121..', '....1...'],
  ['........', '........', '..111...', '..1221..', '...2331.', '....241.', '.....11.', '........'],
];
const bulletShape: Shape = [
  ['........', '........', '....111.', '.1.12431', '...12221', '....111.', '........', '........'],
  ['........', '....111.', '...1431.', '..12221.', '..111...', '.1......', '........', '........'],
  ['...11...', '..1431..', '..1221..', '..1221..', '...11...', '........', '...1....', '........'],
  ['........', '.111....', '.1341...', '.12221..', '...111..', '......1.', '........', '........'],
  ['........', '........', '.111....', '13421.1.', '12221...', '.111....', '........', '........'],
  ['........', '........', '......1.', '...111..', '.12221..', '.1341...', '.111....', '........'],
  ['........', '...1....', '........', '...11...', '..1221..', '..1221..', '..1431..', '...11...'],
  ['........', '........', '.1......', '..111...', '..12221.', '...1431.', '....111.', '........'],
];
const hookShape: Shape = [
  ['........', '....111.', '....1231', '.....131', '.1111121', '....121.', '....11..', '........'],
  ['........', '...1111.', '...1231.', '....131.', '...121..', '..11....', '.1......', '........'],
  ['...111..', '..12321.', '..13121.', '....121.', '....11..', '....1...', '....1...', '........'],
  ['........', '.1111...', '.1321...', '.131....', '..121...', '....11..', '......1.', '........'],
  ['........', '.111....', '1321....', '131.....', '1211111.', '.121....', '..11....', '........'],
  ['........', '......1.', '....11..', '..121...', '.131....', '.1321...', '.1111...', '........'],
  ['........', '....1...', '....1...', '....11..', '....121.', '..13121.', '..12321.', '...111..'],
  ['........', '.1......', '..11....', '...121..', '....131.', '...1231.', '...1111.', '........'],
];
const thornShape: Shape = [
  ['........', '....1...', '..1121..', '.1223321', '..1121..', '...11...', '........', '........'],
  ['........', '.....11.', '....231.', '..1121..', '..1211..', '.11.....', '........', '........'],
  ['....1...', '...121..', '..11211.', '...232..', '..12221.', '...121..', '...11...', '........'],
  ['........', '.11.....', '.132....', '..1211..', '..1121..', '.....11.', '........', '........'],
  ['........', '...1....', '..1211..', '1233221.', '..1211..', '...11...', '........', '........'],
  ['........', '........', '.....11.', '..1121..', '..1211..', '.132....', '.11.....', '........'],
  ['........', '...11...', '...121..', '..12221.', '...232..', '..11211.', '...121..', '....1...'],
  ['........', '........', '.11.....', '..1211..', '..1121..', '....231.', '.....11.', '........'],
];
const stingerShape: Shape = [
  ['........', '........', '..1111..', '.1231231', '..12111.', '...1....', '........', '........'],
  ['........', '.....11.', '...1121.', '..1231..', '..1211..', '...1....', '........', '........'],
  ['....1...', '...121..', '...131..', '..11211.', '..12321.', '...111..', '........', '........'],
  ['........', '.11.....', '.1211...', '..1321..', '..1121..', '....1...', '........', '........'],
  ['........', '........', '..1111..', '1321321.', '.11121..', '....1...', '........', '........'],
  ['........', '........', '....1...', '..1121..', '..1321..', '.1211...', '.11.....', '........'],
  ['........', '........', '...111..', '..12321.', '..11211.', '...131..', '...121..', '....1...'],
  ['........', '........', '...1....', '..1211..', '..1231..', '...1121.', '.....11.', '........'],
];

function stencil(rows: Stencil, ramp: Ramp, size: number): PixelCanvas {
  const c = new PixelCanvas(size, size), offset = (size - 8) / 2;
  rows.forEach((row, y) => Array.from(row).forEach((value, x) => {
    const color = ramp[Number(value) - 1];
    if (value !== '.' && color !== undefined)
      c.set(offset + x, offset + y, color);
  }));
  return c;
}
function directed(id: string, label: string, note: string, ramp: Ramp, shape: Shape, size = 16): CodeFxDef {
  return {
    id, label, note, kind: 'projectile', covers: [id], directional: true,
    size: { w: size, h: size }, frames: 8, frameMs: Array.from({ length: 8 }, () => 150), loop: false, anchor: 'centre',
    paint(i) {
      return stencil(shape[i] ?? [], ramp, size);
    },
  };
}

export const bullet = directed('fx_bullet', 'Viên chì', 'Viên chì của Lính Hoả Mai (Vua Thuỷ Triều), kèm vệt khói ngắn.', [P.outline, P.stoneDark, P.stoneLight, P.cream], bulletShape, 8);
export const crystal = directed('fx_crystal', 'Tinh thể', 'Tinh thể nhọn của Tháp Pha Lê (Vua Đá Núi).', [P.plum, P.purple, P.cream, P.white], shard);
export const hook = directed('fx_hook', 'Móc sắt', 'Móc kéo của Lính Móc Câu (Vua Thuỷ Triều), kèm đoạn dây.', [P.outline, P.stoneDark, P.stoneLight, P.sand], hookShape);
export const iceShard = directed('fx_ice_shard', 'Mảnh băng', 'Mảnh băng của Pháp Sư Băng và Tháp Băng Sư (Vua Phép Thuật).', [P.waterDeep, P.water, P.waterLight, P.white], shard);
export const thorn = directed('fx_thorn', 'Gai gỗ', 'Gai gỗ của Tháp Gai (Vua Rừng Xanh).', [P.soilDark, P.leafDark, P.leaf, P.sand], thornShape);
export const stinger = directed('fx_stinger', 'Ngòi ong', 'Ngòi vàng đen của trùm Nữ Hoàng Ong.', [P.outline, P.wheat, P.wheatLight, P.white], stingerShape);

// Four separate tooth poses, in integer pixel coordinates.
const gearTeeth: readonly (readonly (readonly [number, number])[])[] = [
  [[6, 2], [11, 5], [8, 11], [2, 8]],
  [[8, 2], [11, 7], [6, 11], [2, 6]],
  [[10, 3], [10, 10], [3, 10], [3, 3]],
  [[11, 4], [9, 11], [2, 9], [4, 2]],
];
function animated(id: string, label: string, note: string, ramp: Ramp, mode: 'fire' | 'gear' | 'orb', glow = false): CodeFxDef {
  const def: CodeFxDef = {
    id, label, note, kind: 'projectile', covers: [id], size: { w: 16, h: 16 },
    frames: 4, frameMs: [100, 100, 100, 100], loop: true, anchor: 'centre',
    paint(i) {
      const c = new PixelCanvas(16, 16), r = i % 2 === 0 ? 4 : 3;
      if (mode === 'fire') {
        for (let x = 2; x < 7; x++) for (let y = 5; y < 11; y++)
          if (pixelHash(x, y, i + 71) > (7 - x) / 7) c.set(x, y, ramp[1]);
      }
      if (mode === 'gear') for (const [x, y] of gearTeeth[i] ?? []) {
        c.fillRect(x, y, 3, 3, ramp[0]); c.set(x + 1, y + 1, ramp[2]);
      }
      c.fillEllipse(8, 8, mode === 'gear' ? 4 : r, 4, ramp[0]);
      c.fillEllipse(8, 8, 3, 3, ramp[1]);
      c.fillEllipse(7, 7, 2, 2, ramp[2]);
      c.set(6 + i % 2, 6, ramp[3]);
      if (mode === 'gear') { c.fillRect(7, 7, 2, 2, ramp[0]); c.set(8, 6 + i % 3, ramp[3]); }
      else c.set(9 + i % 2, 8 + Math.floor(i / 2), ramp[3]);
      return c;
    },
  };
  if (!glow) return def;
  return { ...def, paintGlow(i) {
    const c = new PixelCanvas(16, 16);
    for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) {
      const d2 = (x + 0.5 - 8) ** 2 + (y + 0.5 - 8) ** 2;
      if (d2 <= 16 || (d2 <= 25 && (x + y + i) % 2 === 0)) c.set(x, y, ramp[2]);
    }
    return c;
  } };
}
export const fireball = animated('fx_fireball', 'Cầu lửa', 'Cầu lửa của Tháp Phun Lửa và Lính Ném Lửa (Vua Lò Rèn).', [P.redDark, P.orange, P.gold, P.white], 'fire', true);
export const gear = animated('fx_gear', 'Bánh răng', 'Bánh răng của Tháp Bánh Răng và Xạ Thủ Bánh Răng (Vua Đồng Hồ).', [P.soilDark, P.soil, P.path, P.wheatLight], 'gear');
export const magicOrb = animated('fx_magic_orb', 'Cầu phép', 'Cầu phép của Tháp Pháp Sư (Vua Phép Thuật).', [P.plum, P.purple, P.cream, P.white], 'orb', true);
export const shadowOrb = animated('fx_shadow_orb', 'Cầu bóng tối', 'Cầu bóng tối của Tháp Bóng Đêm (Vua Ánh Trăng).', [P.outline, P.plum, P.purple, P.stoneLight], 'orb', true);
function still(id: string, label: string, note: string, ramp: Ramp, mode: 'ball' | 'stone' | 'seed' | 'mud'): CodeFxDef {
  const size = mode === 'seed' ? 8 : 16;
  return { id, label, note, kind: 'projectile', covers: [id], size: { w: size, h: size }, frames: 1,
    frameMs: [150], loop: false, anchor: 'centre', paint() {
      const c = new PixelCanvas(size, size), m = size / 2, r = mode === 'seed' ? 2.5 : 4.5;
      c.fillEllipse(m, m, r, mode === 'mud' ? 3.5 : r, ramp[0]);
      c.fillEllipse(m, m, r - 1, mode === 'mud' ? 2.5 : r - 1, ramp[1]);
      c.fillEllipse(m - 1, m - 1, mode === 'seed' ? 1 : 2, 1.5, ramp[2]);
      c.set(m - 1, m - 2, ramp[3]);
      if (mode === 'stone') { c.set(10, 7, ramp[0]); c.set(7, 10, ramp[0]); }
      if (mode === 'mud') { c.fillRect(3, 8, 3, 2, ramp[0]); c.set(10, 9, ramp[2]); }
      return c;
    } };
}
export const cannonball = still('fx_cannonball', 'Đạn pháo', 'Bi sắt của Pháo Đài Biển (Vua Thuỷ Triều) và Pháo Hơi Nước (Vua Đồng Hồ).', [P.outline, P.stoneDark, P.stone, P.stoneLight], 'ball');
export const stone = still('fx_stone', 'Đá ném', 'Đá ném của quân và công trình vương quốc Đá.', [P.stoneDark, P.stone, P.stoneLight, P.cream], 'stone');
export const seed = still('fx_seed', 'Hạt giống', 'Đạn hạt giống của vương quốc Rừng.', [P.soilDark, P.soil, P.sand, P.cream], 'seed');
export const mud = still('fx_mud', 'Cục bùn', 'Bùn của trùm Ếch Đầm Lầy.', [P.outline, P.soilDark, P.soil, P.path], 'mud');
export const PROJECTILES: readonly CodeFxDef[] = [bullet, crystal, hook, iceShard, thorn, stinger, fireball, gear, magicOrb, shadowOrb, cannonball, stone, seed, mud];
