/** Vị trí xuất quân trên mép (spec §8.2). Chỉ phụ thuộc dữ liệu và kiểu, để bounds.ts dùng được mà không vòng import. */
import { BATTLE } from '../../data/battle';
import type { Edge } from './types';

/**
 * Vị trí xuất hiện của `count` lính trên một mép (§8.2): hàng `perRow` lính cách nhau
 * spawnSpacing, căn giữa quanh trung điểm mép, ngoài cánh đồng spawnOutside; hàng sau
 * lùi ra thêm spawnRowGap.
 */
export const edgePositions = (edge: Edge, count: number): { x: number; y: number }[] => {
  const field = BATTLE.field;
  const perRow = Math.floor((BATTLE.edgeSpan * field) / BATTLE.spawnSpacing) + 1;
  const mid = field / 2;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, count - row * perRow);
    const along = mid + (i - row * perRow - (inRow - 1) / 2) * BATTLE.spawnSpacing;
    const depth = BATTLE.spawnOutside + row * BATTLE.spawnRowGap;
    switch (edge) {
      case 'N':
        out.push({ x: along, y: -depth });
        break;
      case 'S':
        out.push({ x: along, y: field + depth });
        break;
      case 'W':
        out.push({ x: -depth, y: along });
        break;
      case 'E':
        out.push({ x: field + depth, y: along });
        break;
    }
  }
  return out;
};
