/**
 * Đội hình và giới hạn đi xa của phe mình (2026-11-09). Lính rảnh không về cửa nhà mà đứng thành hàng ngay
 * trước mép nam bàn cờ (phía địch tới): khối bắn xa ở sát bàn, khối cận chiến đứng trước. Mỗi hàng căn giữa
 * bàn; đầy hàng thì sang hàng kế. Lính phe mình không đi ra ngoài bàn cờ nới thêm `allyLeashPlots` ô.
 */
import { BATTLE } from '../../data/battle';
import type { RunMode } from '../../data/rules';
import { geometryFor } from '../run/boardGeometry';

export interface Slot {
  readonly x: number;
  readonly y: number;
}

export const isRanged = (range: number): boolean => range > BATTLE.meleeMaxRange;

const rows = (count: number, mid: number, y0: number): Slot[] => {
  const out: Slot[] = [];
  const per = BATTLE.formationPerRow;
  for (let k = 0; k < count; k++) {
    const row = Math.floor(k / per);
    const inRow = Math.min(per, count - row * per);
    const col = k - row * per;
    out.push({ x: mid + (col - (inRow - 1) / 2) * BATTLE.formationSpacing, y: y0 + row * BATTLE.formationRowGap });
  }
  return out;
};

/** Ô đội hình cho `ranged` lính bắn xa rồi `melee` lính cận chiến, theo thứ tự được giao. */
export const formationSlots = (mode: RunMode, ranged: number, melee: number): { ranged: Slot[]; melee: Slot[] } => {
  const g = geometryFor(mode);
  const mid = (g.boardMin + g.boardMax) / 2;
  const y0 = g.boardMax + BATTLE.formationMargin;
  const rangedRows = Math.ceil(ranged / BATTLE.formationPerRow);
  const meleeY0 = y0 + rangedRows * BATTLE.formationRowGap + (rangedRows > 0 ? BATTLE.formationBandGap : 0);
  return { ranged: rows(ranged, mid, y0), melee: rows(melee, mid, meleeY0) };
};

interface Box {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}

const boxFor = (mode: RunMode): Box => {
  const g = geometryFor(mode);
  const reach = BATTLE.allyLeashPlots * BATTLE.plot;
  return { x0: g.boardMin - reach, x1: g.boardMax + reach, y0: g.boardMin - reach, y1: g.boardMax + reach };
};

/** Tính sẵn cho mỗi chế độ: chọn mục tiêu gọi `insideLeash` cho mọi cặp lính–địch mỗi lần chọn lại. */
const LEASH: Readonly<Record<RunMode, Box>> = { normal: boxFor('normal'), endless: boxFor('endless') };

export const leashBox = (mode: RunMode): Box => LEASH[mode];

export const insideLeash = (mode: RunMode, x: number, y: number): boolean => {
  const b = LEASH[mode];
  return x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
};
