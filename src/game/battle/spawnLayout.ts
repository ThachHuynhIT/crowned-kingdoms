/** Vị trí xuất quân trên mép (spec §8.2). Chỉ phụ thuộc dữ liệu và kiểu, để bounds.ts dùng được mà không vòng import. */
import { BATTLE } from '../../data/battle';
import type { Edge } from './types';

/** Số lính tối đa trên một hàng xuất quân. */
export const rowCapacity = (): number => Math.floor((BATTLE.edgeSpan * BATTLE.field) / BATTLE.spawnSpacing) + 1;

/**
 * Vị trí xuất hiện của `count` lính trên một mép (§8.2): hàng `rowCapacity` lính cách nhau
 * spawnSpacing, căn giữa quanh trung điểm mép, ngoài cánh đồng spawnOutside; hàng sau
 * lùi ra thêm spawnRowGap. `formationRows` > số hàng tự nhiên chia đều quân ra từng ấy hàng.
 */
export const edgePositions = (edge: Edge, count: number, formationRows = 1): { x: number; y: number }[] => {
  const field = BATTLE.field;
  const perRow = rowCapacity();
  const naturalRows = Math.ceil(count / perRow);
  const rows = Math.max(naturalRows, Math.min(count, formationRows));
  const mid = field / 2;
  const out: { x: number; y: number }[] = [];
  let placed = 0;
  for (let row = 0; row < rows; row++) {
    const inRow =
      rows === naturalRows
        ? Math.min(perRow, count - row * perRow)
        : Math.floor(count / rows) + (row < count % rows ? 1 : 0);
    const depth = BATTLE.spawnOutside + row * BATTLE.spawnRowGap;
    for (let k = 0; k < inRow; k++) {
      placed += 1;
      const along = mid + (k - (inRow - 1) / 2) * BATTLE.spawnSpacing;
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
  }
  return out.slice(0, placed);
};
