/**
 * Áp mô tả hình học bàn (`src/data/boardGeometry.ts`) theo chế độ chơi (spec 2026-11-09 §4). Id 0..24
 * là bàn trong ở mọi chế độ; Vô tận thêm 25..48 cho vòng ngoài. Không dùng `row*7+col` làm id.
 */
import { ENDLESS_GEOMETRY, NORMAL_GEOMETRY, type BoardGeometryDef, type PlotCell } from '../../data/boardGeometry';
import type { RunMode } from '../../data/rules';

export const geometryFor = (mode: RunMode): BoardGeometryDef =>
  mode === 'endless' ? ENDLESS_GEOMETRY : NORMAL_GEOMETRY;

/**
 * Tầm bắn của Ngai phủ cả vùng đất của mình (chủ dự án 11/11/2026): khoảng cách từ tâm ô Ngai tới góc xa nhất của bàn
 * (mọi ô, kể cả vòng ngoài Vô tận). Px thế giới, cùng đơn vị với `cells()`.
 */
export const throneLandRange = (mode: RunMode = 'normal', throne: number = 2): number => {
  const g = geometryFor(mode);
  const t = g.plotCells[throne]!;
  let best = 0;
  for (const c of g.plotCells) {
    // farthest corner of plot c from the throne plot's centre, in plot units
    const dx = Math.abs(c.col - t.col) + 0.5;
    const dy = Math.abs(c.row - t.row) + 0.5;
    best = Math.max(best, Math.sqrt(dx * dx + dy * dy));
  }
  return best * g.plotSize;
};

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
