/**
 * Khu tập kết lính của mỗi ô (spec 06/11/2026, quyết định C): lính của một công trình xuất hiện và
 * đứng sẵn trong `DEPLOY_BOX`, dải đất trước cửa nhà ở phía nam ô (ra con đường), không còn xếp vòng quanh tâm ô. Lưới xác định theo
 * hàng rồi cột; đông quá thì các ô lưới nhỏ lại và thân có thể chồng nhau (separation xử lý tiếp).
 * Chỉ dùng + − × ÷, Math.sqrt/ceil/floor.
 */
import { DEPLOY_BOX } from '../../data/boardGeometry';
import { plotCenter } from './world';

const PLOTS = 25;

/** Vị trí thứ `index` trong `count` lính thân bán kính `radius`, quanh tâm ô (cx, cy). */
export const deploySlot = (
  cx: number,
  cy: number,
  index: number,
  count: number,
  radius: number,
): { x: number; y: number } => {
  if (!Number.isInteger(count) || count < 1) throw new RangeError(`deploy count ${count}`);
  if (!Number.isInteger(index) || index < 0 || index >= count) throw new RangeError(`deploy index ${index}/${count}`);
  if (!(radius >= 0)) throw new RangeError(`deploy radius ${radius}`);
  // Miền tâm thân: hộp co vào mỗi phía một bán kính; hẹp hơn thân thì dồn về giữa.
  let x0 = DEPLOY_BOX.x0 + radius;
  let x1 = DEPLOY_BOX.x1 - radius;
  let y0 = DEPLOY_BOX.y0 + radius;
  let y1 = DEPLOY_BOX.y1 - radius;
  if (x0 > x1) x0 = x1 = (DEPLOY_BOX.x0 + DEPLOY_BOX.x1) / 2;
  if (y0 > y1) y0 = y1 = (DEPLOY_BOX.y0 + DEPLOY_BOX.y1) / 2;
  const boxW = DEPLOY_BOX.x1 - DEPLOY_BOX.x0;
  const boxH = DEPLOY_BOX.y1 - DEPLOY_BOX.y0;
  const cols = Math.min(count, Math.max(1, Math.ceil(Math.sqrt((count * boxW) / boxH))));
  const rows = Math.ceil(count / cols);
  const row = Math.floor(index / cols);
  const col = index - row * cols;
  return {
    x: cx + x0 + ((col + 0.5) * (x1 - x0)) / cols,
    y: cy + y0 + ((row + 0.5) * (y1 - y0)) / rows,
  };
};

/** Vị trí thứ `index` trong `count` lính của khu tập kết ô `plot`. */
export const deploymentPosition = (
  plot: number,
  index: number,
  count: number,
  radius: number,
): { x: number; y: number } => {
  if (!Number.isInteger(plot) || plot < 0 || plot >= PLOTS) throw new RangeError(`deploy plot ${plot}`);
  const c = plotCenter(plot);
  return deploySlot(c.x, c.y, index, count, radius);
};
