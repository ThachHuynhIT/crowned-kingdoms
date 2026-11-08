/**
 * Áp mô tả hình học bàn (`src/data/boardGeometry.ts`) theo chế độ chơi (spec 2026-11-09 §4). Id 0..24
 * là bàn trong ở mọi chế độ; Vô tận thêm 25..48 cho vòng ngoài. Không dùng `row*7+col` làm id.
 */
import { ENDLESS_GEOMETRY, NORMAL_GEOMETRY, type BoardGeometryDef, type PlotCell } from '../../data/boardGeometry';
import type { RunMode } from '../../data/rules';

export const geometryFor = (mode: RunMode): BoardGeometryDef =>
  mode === 'endless' ? ENDLESS_GEOMETRY : NORMAL_GEOMETRY;

/** Chế độ suy từ số ô của bàn (25 → thường, 49 → Vô tận); số khác không thuộc chế độ nào. */
export const modeForPlotCount = (count: number): RunMode | null =>
  count === NORMAL_GEOMETRY.plotCount ? 'normal' : count === ENDLESS_GEOMETRY.plotCount ? 'endless' : null;

/** Id ô hợp lệ của chế độ: số nguyên trong [0, plotCount). */
export const isPlotId = (plot: number, mode: RunMode = 'normal'): boolean =>
  Number.isInteger(plot) && plot >= 0 && plot < geometryFor(mode).plotCount;

/** Hàng/cột của ô trên hệ bàn trong. Ô không hợp lệ ném lỗi (người gọi phải kiểm trước). */
export function plotCoords(plot: number, mode: RunMode = 'normal'): PlotCell {
  if (!isPlotId(plot, mode)) throw new Error(`plotCoords: invalid plot ${plot} for ${mode}`);
  return geometryFor(mode).plotCells[plot]!;
}

/**
 * Ô ở hàng/cột (hệ bàn trong), hoặc `null` ngoài bàn. Bàn trong tính thẳng; vòng ngoài tra bảng
 * (24 ô, cố định).
 */
export function plotAtCell(row: number, col: number, mode: RunMode = 'normal'): number | null {
  if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
  if (row >= 0 && row < 5 && col >= 0 && col < 5) return row * 5 + col;
  if (mode !== 'endless') return null;
  const cells = ENDLESS_GEOMETRY.plotCells;
  for (let id = NORMAL_GEOMETRY.plotCount; id < cells.length; id++) {
    if (cells[id]!.row === row && cells[id]!.col === col) return id;
  }
  return null;
}
