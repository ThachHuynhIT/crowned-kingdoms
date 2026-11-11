import { PALETTE } from '../../data/palette';
import { INTERVENTION_POWERS } from '../../data/battle';
import type { CodeFxDef } from '../codeFx';
import { PixelCanvas } from '../pixel';

const P = PALETTE;

type Ramp = readonly [number, number, number, number];
type King = keyof typeof INTERVENTION_POWERS;
const RAMPS: Readonly<Record<King, Ramp>> = {
  wheat: [P.soilDark, P.wheat, P.wheatLight, P.cream],
  stone: [P.stoneDark, P.stone, P.stoneLight, P.gold],
  arcane: [P.plum, P.purple, P.stoneLight, P.white],
  grove: [P.soilDark, P.leafDark, P.leaf, P.grassLight],
  tide: [P.waterDeep, P.water, P.waterLight, P.white],
  forge: [P.redDark, P.orange, P.gold, P.white],
  clock: [P.soilDark, P.path, P.gold, P.waterLight],
  moon: [P.plum, P.purple, P.stoneLight, P.grassLight],
  nomad: [P.shadow, P.soil, P.sand, P.cream],
};

function stroke(c: PixelCanvas, x: number, y: number, ex: number, ey: number, color: number, width = 1): void {
  const steps = Math.max(Math.abs(ex - x), Math.abs(ey - y), 1);
  for (let s = 0; s <= steps; s++)
    c.fillRect(Math.round(x + (ex - x) * s / steps), Math.round(y + (ey - y) * s / steps), width, width, color);
}

function cluster(c: PixelCanvas, x: number, y: number, rx: number, ry: number, r: Ramp): void {
  c.fillEllipse(x, y, rx, ry, r[0]);
  c.fillEllipse(x, y, Math.max(1, rx - 1), Math.max(1, ry - 1), r[1]);
  c.fillEllipse(x - 1, y - 1, Math.max(1, rx - 2), Math.max(1, ry - 2), r[2]);
  c.set(x - 1, y - 2, r[3]);
}

/** Ground-space circles are compressed vertically by exactly one half. */
function ring(c: PixelCanvas, x: number, y: number, radius: number, r: Ramp): void {
  for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
    const d = Math.sqrt((px + 0.5 - x) ** 2 + ((py + 0.5 - y) * 2) ** 2);
    if (d <= radius && d >= radius - 3)
      c.set(px, py, d > radius - 1 ? r[0] : py < y ? r[2] : r[1]);
  }
}

function star(c: PixelCanvas, x: number, y: number, r: Ramp): void {
  c.fillRect(x - 1, y - 3, 3, 7, r[0]); c.fillRect(x - 3, y - 1, 7, 3, r[0]);
  c.fillRect(x, y - 2, 1, 5, r[3]); c.fillRect(x - 2, y, 5, 1, r[3]);
}

function gear(c: PixelCanvas, x: number, y: number, radius: number, r: Ramp): void {
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    if (dx === undefined || dy === undefined) continue;
    c.fillRect(x + dx * (radius - 1) - 1, y + dy * (radius - 1) - 1, 3, 3, r[0]);
  }
  cluster(c, x, y, radius, radius, r);
  c.fillRect(x - 1, y - 1, 2, 2, r[0]);
}

function arrow(c: PixelCanvas, x: number, y: number, r: Ramp): void {
  c.fillRect(x - 1, y - 10, 3, 10, r[0]); c.fillRect(x, y - 9, 1, 8, r[1]);
  stroke(c, x - 3, y - 10, x, y - 7, r[2]); stroke(c, x + 3, y - 10, x, y - 7, r[2]);
  stroke(c, x - 3, y - 3, x, y, r[0]); stroke(c, x + 3, y - 3, x, y, r[0]);
  stroke(c, x - 2, y - 3, x, y - 1, r[3]); stroke(c, x + 2, y - 3, x, y - 1, r[3]);
}

function drop(king: King, i: number): PixelCanvas {
  const c = new PixelCanvas(24, 24), r = RAMPS[king], y = 12 + i;
  switch (king) {
    case 'wheat':
      for (let k = 0; k < 5; k++) {
        const x = 6 + k * 3;
        stroke(c, x, 5 + k % 2, 12 + (k - 2), 20, r[0], 2);
        stroke(c, x, 6 + k % 2, 12 + (k - 2), 19, r[1]);
        cluster(c, x, 6 + k % 2 + i, 2, 4, r);
      }
      c.fillRect(8, 13, 9, 3, r[0]); c.fillRect(9, 14, 7, 1, r[2]); break;
    case 'arcane':
      stroke(c, 13 + i, 2, 9, 12, r[0], 4); stroke(c, 9, 12, 14, 11, r[0], 4);
      stroke(c, 14, 11, 10 + i, 21, r[0], 4);
      stroke(c, 14 + i, 3, 10, 12, r[1], 2); stroke(c, 10, 12, 15, 11, r[2], 2);
      stroke(c, 15, 11, 11 + i, 21, r[3]); break;
    case 'clock': gear(c, 12, y, 7, r); break;
    case 'moon':
      for (let py = 3; py < 22; py++) for (let px = 3; px < 21; px++) {
        const d = (px - 12) ** 2 + (py - y) ** 2;
        const cut = (px - 16) ** 2 + (py - y + 3 + i) ** 2;
        if (d <= 81 && cut >= 49) c.set(px, py, d > 60 || cut < 64 ? r[0] : px < 10 ? r[2] : r[1]);
      }
      break;
    case 'nomad': for (let k = 0; k < 3; k++) arrow(c, 6 + k * 6, 18 + k % 2 * 3 + i, r); break;
    case 'forge':
      c.fillRect(5, 6 + i, 14, 13, r[0]); c.fillRect(6, 7 + i, 12, 10, r[1]);
      c.fillRect(7, 7 + i, 10, 3, r[2]); c.fillRect(7, 7 + i, 5, 1, r[3]);
      stroke(c, 13, 11 + i, 10, 16 + i, r[0]); break;
    default:
      cluster(c, 12, y, king === 'grove' ? 6 : 8, king === 'grove' ? 9 : 7, r);
      if (king === 'stone') { stroke(c, 14, y - 3, 12, y, r[0]); stroke(c, 12, y, 15, y + 3, r[0]); }
      if (king === 'grove') stroke(c, 12, y - 6, 14, y + 5, r[0]);
  }
  return c;
}

function impact(king: King, i: number): PixelCanvas {
  const w = king === 'nomad' ? 56 : 48, c = new PixelCanvas(w, king === 'nomad' ? 32 : 40), x = w / 2, y = 20, r = RAMPS[king];
  const radius = Math.min(w / 2 - 2, 9 + i * 3);
  if (i < 2) {
    cluster(c, x, y - 2, 10 - i * 2, 8 - i, r);
    star(c, x, y - 7, r);
  }
  if (king !== 'grove' && king !== 'moon' && king !== 'nomad' && i < 7) ring(c, x, y, radius, r);
  switch (king) {
    case 'wheat':
      if (i > 0 && i < 7) ring(c, x, y + 1, Math.max(7, radius - 4), r);
      for (let k = 0; k < (i === 7 ? 2 : 8); k++) {
        const px = x - 17 + k * 5, py = y - 5 + k % 3 * 4;
        stroke(c, px, py, px + 3, py - 3 - i % 2, r[0], 2);
        stroke(c, px, py, px + 3, py - 3 - i % 2, r[2]);
      } break;
    case 'stone':
      for (let k = 0; k < (i === 7 ? 2 : 6); k++) cluster(c, x - 16 + k * 6, y + k % 2 * 5 - 3, i === 7 ? 2 : 4, i === 7 ? 2 : 3, r);
      if (i >= 2 && i <= 5) { star(c, x - 12, 8 + i % 2, r); star(c, x + 12, 10 - i % 2, r); } break;
    case 'arcane':
      for (let k = 0; k < (i === 7 ? 1 : 5); k++) {
        const px = x - 18 + k * 9, py = 13 + k % 2 * 10;
        stroke(c, px, py, px + 3, py - 5, r[0], 3); stroke(c, px + 3, py - 5, px + 5, py - 1, r[2], 2);
        c.set(px + 3, py - 4, r[3]);
      } break;
    case 'grove': {
      const reach = i < 4 ? 6 + i * 5 : 6 + (7 - i) * 5;
      for (const side of [-1, 1]) for (let k = 0; k < (i === 7 ? 1 : 3); k++) {
        const ex = x + side * reach, ey = y - 5 + k * 5;
        stroke(c, x, y, ex - side * 5, ey + 2, r[0], 3);
        stroke(c, ex - side * 5, ey + 2, ex, ey - 2, r[0], 3);
        stroke(c, x, y, ex - side * 5, ey + 2, r[1], 2);
        stroke(c, ex - side * 5, ey + 2, ex, ey - 2, r[2]); c.set(ex, ey - 2, r[3]);
      } break;
    }
    case 'tide':
      if (i < 6) ring(c, x, y, Math.max(5, radius - 5), r);
      for (let k = 0; k < (i === 7 ? 2 : 7); k++) {
        const px = x - 18 + k * 6, py = y - 4 + k % 2 * 7;
        cluster(c, px, py - (i < 4 ? i : 7 - i), 2, 3, r); c.set(px, py - 2, r[3]);
      } break;
    case 'forge':
      if (i < 7) cluster(c, x, y, radius - 2, Math.floor((radius - 2) / 2), r);
      for (let k = 0; k < (i === 7 ? 2 : 7); k++) {
        const px = x - 18 + k * 6, py = y - 3 - (k % 3) * 3 - i % 3;
        stroke(c, px, py + 3, px + 1, py - 2, r[0], 3); stroke(c, px + 1, py + 2, px + 1, py - 1, r[2]);
        c.set(px + 1, py - 2, r[3]);
      } break;
    case 'clock':
      if (i < 7) {
        stroke(c, x, y, x, y - 7, r[0], 3); stroke(c, x, y, x + 9, y + 2, r[0], 3);
        stroke(c, x + 1, y, x + 1, y - 6, r[3]); stroke(c, x, y, x + 8, y + 2, r[2]);
      }
      for (let k = 0; k < (i === 7 ? 1 : 3); k++) gear(c, x - 15 + k * 15, 9 + k % 2 * 20, i === 7 ? 2 : 3, r);
      break;
    case 'moon':
      for (let k = 0; k < (i === 7 ? 1 : 5); k++) cluster(c, x - 14 + k * 7, y + k % 2 * 4 - Math.floor(i / 2), i === 7 ? 3 : 6, i === 7 ? 2 : 5, r);
      if (i >= 2 && i < 6) {
        cluster(c, x, y - 6, 5, 5, r); c.fillRect(x - 3, y - 7, 2, 2, r[0]); c.fillRect(x + 1, y - 7, 2, 2, r[0]);
        c.fillRect(x - 2, y - 2, 5, 2, r[2]); c.set(x, y - 2, r[0]);
      } break;
    case 'nomad':
      for (let k = 0; k < (i === 7 ? 2 : 9); k++) {
        const px = 6 + k * 5, py = 18 + k % 3 * 5;
        if (i < 5) cluster(c, px, py, 4, 2, r);
        arrow(c, px, py - (i < 2 ? 3 - i : 0), r);
      } break;
  }
  // Only the dissolution poses use dither; the material interiors stay solid earlier.
  if (i >= 6) for (let py = 0; py < c.height; py++) for (let px = 0; px < w; px++)
    if ((px + py * 3) % (i === 7 ? 2 : 4) === 0) c.set(px, py, r[0], 0);
  return c;
}

function powerPair(king: King): readonly CodeFxDef[] {
  const power = INTERVENTION_POWERS[king], r = RAMPS[king];
  const falling: CodeFxDef = {
    id: `power_${king}_drop`, kind: 'projectile', group: 'Can Thiệp', label: `${power.name} · Rơi`,
    size: { w: 24, h: 24 }, frames: 2, frameMs: [90, 90], loop: true, anchor: 'centre',
    note: `Vật rơi thẳng xuống điểm chọn. ${power.text}`, paint: (i) => drop(king, i),
  };
  const burst: CodeFxDef = {
    id: `power_${king}_impact`, kind: 'effect', group: 'Can Thiệp', label: `${power.name} · Chạm đất`,
    size: { w: king === 'nomad' ? 56 : 48, h: king === 'nomad' ? 32 : 40 }, frames: 8,
    frameMs: [55, 45, 50, 55, 65, 75, 80, 95], loop: false, anchor: 'centre',
    note: `Vùng ảnh hưởng dẹt 2:1, phóng ×2 trong game. ${power.text}`, paint: (i) => impact(king, i),
  };
  if (king === 'forge' || king === 'arcane') {
    return [{ ...falling, paintGlow(i) {
      const c = new PixelCanvas(24, 24);
      c.fillEllipse(12, 12 + i, 8, 7, r[1]);
      c.fillEllipse(11, 11 + i, 4, 3, r[2]);
      return c;
    } }, { ...burst, paintGlow(i) {
      const c = new PixelCanvas(burst.size.w, burst.size.h);
      if (i < 3) c.fillEllipse(c.width / 2, 20, 10 - i * 2, 5 - i, r[2]);
      return c;
    } }];
  }
  return [falling, burst];
}

export const POWERS: readonly CodeFxDef[] = [
  ...powerPair('wheat'), ...powerPair('stone'), ...powerPair('arcane'),
  ...powerPair('grove'), ...powerPair('tide'), ...powerPair('forge'),
  ...powerPair('clock'), ...powerPair('moon'), ...powerPair('nomad'),
];
