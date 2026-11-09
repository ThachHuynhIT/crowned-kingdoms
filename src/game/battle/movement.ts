/**
 * Di chuyển (spec §8.9 bước 5, §8.11): ghi prevX/prevY = vị trí đầu tick; mỗi lính còn sống
 * đi thẳng về mục tiêu (dừng đúng ở khoảng cách mép = range, không vượt) hoặc về điểm nhà khi
 * rảnh — hướng tính từ vị trí đầu tick; rồi separation từ ảnh chụp vị trí, áp cùng lúc; rồi
 * đẩy lùi đang chạy; rồi kẹp biên. Công trình/Ngai không bao giờ di chuyển.
 */
import { BATTLE } from '../../data/battle';
import { clampNorthY } from './bounds';
import { leashBox } from './formation';
import { separationPush } from './steering';
import { edgeDistance, isRage } from './targeting';
import { KIND_UNIT, TEAM_ALLY, TEAM_FOE, type BattleWorld } from './world';

/** Rảnh và cách nhà < SNAP px → đặt đúng vào nhà (không rung). */
const SNAP = 0.5;
const RAGE_MULT = 1 + BATTLE.rageSpeedPct / 100;

// Bộ đệm dùng chung cho separation (mô phỏng đồng bộ, không giữ trạng thái giữa các lần gọi).
const ids = new Int32Array(BATTLE.entityCap);
const sx = new Float64Array(BATTLE.entityCap);
const sy = new Float64Array(BATTLE.entityCap);
const sr = new Float64Array(BATTLE.entityCap);
const sFixed = new Uint8Array(BATTLE.entityCap);
const sFlying = new Uint8Array(BATTLE.entityCap);
const sTeam = new Uint8Array(BATTLE.entityCap);
const sAnchored = new Uint8Array(BATTLE.entityCap);
/** Theo id: 1 nếu lính đang trong tầm mục tiêu ở bước đi vừa rồi (đứng yên đánh). */
const engaged = new Uint8Array(BATTLE.entityCap);
const outX = new Float64Array(BATTLE.entityCap);
const outY = new Float64Array(BATTLE.entityCap);

/** Công trình/Ngai còn sống của tick này (id tăng dần): vật cản cho lính đi bộ (2026-11-09). */
const obstacles = new Int32Array(BATTLE.entityCap);
let obstacleCount = 0;

/** Bốn góc theo vòng: tây-bắc, đông-bắc, đông-nam, tây-nam. */
const CORNER_SX = [-1, 1, 1, -1] as const;
const CORNER_SY = [-1, -1, 1, 1] as const;
const cornerX = new Float64Array(4);
const cornerY = new Float64Array(4);
const cornerCost = new Float64Array(4);

/** Lề ngoài khối chặn đã nới theo bán kính lính, để lính đứng ở góc không còn chạm khối. */
const CORNER_MARGIN = 1;

/** Đoạn (ax, ay) → (bx, by) có đi vào trong hình vuông tâm (cx, cy) nửa cạnh h không; trả t vào (0..1) hoặc −1. */
const segmentEntry = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number, h: number): number => {
  // Loại nhanh: hộp bao của đoạn không chạm hình vuông.
  if (Math.max(ax, bx) <= cx - h || Math.min(ax, bx) >= cx + h) return -1;
  if (Math.max(ay, by) <= cy - h || Math.min(ay, by) >= cy + h) return -1;
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  if (dx === 0) {
    if (ax <= cx - h || ax >= cx + h) return -1;
  } else {
    const ta = (cx - h - ax) / dx;
    const tb = (cx + h - ax) / dx;
    t0 = Math.max(t0, Math.min(ta, tb));
    t1 = Math.min(t1, Math.max(ta, tb));
    if (t0 >= t1) return -1;
  }
  const dy = by - ay;
  if (dy === 0) {
    if (ay <= cy - h || ay >= cy + h) return -1;
  } else {
    const ta = (cy - h - ay) / dy;
    const tb = (cy + h - ay) / dy;
    t0 = Math.max(t0, Math.min(ta, tb));
    t1 = Math.min(t1, Math.max(ta, tb));
    if (t0 >= t1) return -1;
  }
  return t0;
};

/**
 * Điểm đi tới của lính `i` (đứng ở px, py) đang muốn tới (gx, gy) mà không đi xuyên công trình nào trừ `skip`
 * (mục tiêu của nó): công trình đầu tiên chặn đường thẳng thì đi tới góc của khối đó (đã nới theo bán kính lính) cho
 * tổng đường ngắn nhất, trong các góc tới được bằng đường thẳng. Không bị chặn thì là chính (gx, gy). Bay thì bỏ qua.
 */
const detour = (w: BattleWorld, i: number, px: number, py: number, gx: number, gy: number, skip: number): [number, number] => {
  if (w.flying[i] === 1) return [gx, gy];
  const r = w.radius[i]!;
  let block = -1;
  let blockT = 2;
  for (let k = 0; k < obstacleCount; k++) {
    const s = obstacles[k]!;
    if (s === skip) continue;
    const t = segmentEntry(px, py, gx, gy, w.x[s]!, w.y[s]!, w.radius[s]! + r);
    if (t >= 0 && t < blockT) {
      block = s;
      blockT = t;
    }
  }
  if (block < 0) return [gx, gy];
  const cx = w.x[block]!;
  const cy = w.y[block]!;
  const h = w.radius[block]! + r;
  const c = h + CORNER_MARGIN;
  // Bốn góc theo vòng quanh khối (góc k kề k ± 1). Chi phí từ mỗi góc tới đích đi vòng khối: thẳng nếu không bị
  // khối chắn, không thì qua góc kề; ba lượt nới là đủ cho hình vuông.
  for (let k = 0; k < 4; k++) {
    cornerX[k] = cx + CORNER_SX[k]! * c;
    cornerY[k] = cy + CORNER_SY[k]! * c;
    cornerCost[k] =
      segmentEntry(cornerX[k]!, cornerY[k]!, gx, gy, cx, cy, h) >= 0
        ? Infinity
        : Math.sqrt((gx - cornerX[k]!) * (gx - cornerX[k]!) + (gy - cornerY[k]!) * (gy - cornerY[k]!));
  }
  const side = 2 * c;
  for (let round = 0; round < 3; round++)
    for (let k = 0; k < 4; k++)
      cornerCost[k] = Math.min(cornerCost[k]!, side + cornerCost[(k + 1) % 4]!, side + cornerCost[(k + 3) % 4]!);
  let best: [number, number] = [gx, gy];
  let bestLen = Infinity;
  for (let k = 0; k < 4; k++) {
    const ax = cornerX[k]! - px;
    const ay = cornerY[k]! - py;
    const near = Math.sqrt(ax * ax + ay * ay);
    if (near < 0.5) continue; // đã đứng ở góc này
    if (segmentEntry(px, py, cornerX[k]!, cornerY[k]!, cx, cy, h) >= 0) continue; // góc bên kia khối
    const len = near + cornerCost[k]!;
    if (len < bestLen) {
      best = [cornerX[k]!, cornerY[k]!];
      bestLen = len;
    }
  }
  return best;
};

/** Đi tối đa `step` về (tx, ty) từ (px, py), không vượt quá. */
const stepToward = (w: BattleWorld, i: number, px: number, py: number, tx: number, ty: number, step: number): void => {
  const dx = tx - px;
  const dy = ty - py;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d <= 0) return;
  const len = Math.min(step, d);
  w.x[i] = px + (dx / d) * len;
  w.y[i] = py + (dy / d) * len;
};

/** Bước đi mong muốn của lính `i`, tính từ prevX/prevY (vị trí đầu tick của mọi thực thể). */
const steer = (w: BattleWorld, i: number, rage: boolean): void => {
  if (w.stunTicks[i]! > 0) return; // choáng: đứng yên (§8.6)
  let step = w.speed[i]! * (1 - w.slowPct[i]! / 100);
  if (rage && w.team[i] === TEAM_FOE) step *= RAGE_MULT;
  const px = w.prevX[i]!;
  const py = w.prevY[i]!;
  const t = w.target[i]!;
  if (t >= 0 && w.alive[t] === 1) {
    const dx = w.prevX[t]! - px;
    const dy = w.prevY[t]! - py;
    const d = Math.sqrt(dx * dx + dy * dy);
    // Kite (§8.4): địch quá gần trong lúc hồi đòn thì lùi thẳng ra xa nó.
    if (w.kiteDist[i]! > 0 && w.cooldown[i]! > 0 && d > 0 && edgeDistance(w, i, t) < w.kiteDist[i]!) {
      if (step > 0) {
        w.x[i] = px - (dx / d) * step;
        w.y[i] = py - (dy / d) * step;
      }
      return;
    }
    const gap = d - w.radius[i]! - w.radius[t]! - w.range[i]!;
    if (gap <= 0) engaged[i] = 1;
    if (gap <= 0 || step <= 0) return; // đã trong tầm (d > 0 khi gap > 0)
    const [wx, wy] = detour(w, i, px, py, w.prevX[t]!, w.prevY[t]!, t);
    if (wx === w.prevX[t] && wy === w.prevY[t]) {
      const len = Math.min(step, gap);
      w.x[i] = px + (dx / d) * len;
      w.y[i] = py + (dy / d) * len;
    } else stepToward(w, i, px, py, wx, wy, step);
    return;
  }
  const dx = w.homeX[i]! - px;
  const dy = w.homeY[i]! - py;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < SNAP || (step > 0 && d <= step)) {
    w.x[i] = w.homeX[i]!;
    w.y[i] = w.homeY[i]!;
    return;
  }
  if (step <= 0) return;
  const [wx, wy] = detour(w, i, px, py, w.homeX[i]!, w.homeY[i]!, -1);
  stepToward(w, i, px, py, wx, wy, step);
};

export const moveEntities = (world: BattleWorld): void => {
  const n = world.count;
  world.prevX.set(world.x.subarray(0, n));
  world.prevY.set(world.y.subarray(0, n));

  const rage = isRage(world);
  obstacleCount = 0;
  for (let i = 0; i < n; i++)
    if (world.alive[i] === 1 && world.kind[i] !== KIND_UNIT) obstacles[obstacleCount++] = i;
  engaged.fill(0, 0, n);
  for (let i = 0; i < n; i++) {
    if (world.alive[i] === 1 && world.kind[i] === KIND_UNIT) steer(world, i, rage);
  }

  // Separation từ ảnh chụp vị trí sau bước đi, chỉ thực thể còn sống (theo id tăng dần).
  let m = 0;
  for (let i = 0; i < n; i++) {
    if (world.alive[i] === 0) continue;
    ids[m] = i;
    sx[m] = world.x[i]!;
    sy[m] = world.y[i]!;
    sr[m] = world.radius[i]!;
    sFixed[m] = world.kind[i] === KIND_UNIT ? 0 : 1;
    sFlying[m] = world.flying[i]!;
    sTeam[m] = world.team[i]!;
    sAnchored[m] = engaged[i]!;
    m += 1;
  }
  separationPush(
    {
      count: m,
      x: sx,
      y: sy,
      radius: sr,
      fixed: sFixed,
      flying: sFlying,
      team: sTeam,
      anchored: sAnchored,
    },
    BATTLE.separationPushMax,
    outX,
    outY,
    BATTLE.separationPushCross,
  );

  const leash = leashBox(world.geometry);
  const lo = -BATTLE.fieldClampMargin;
  const hi = BATTLE.field + BATTLE.fieldClampMargin;
  for (let k = 0; k < m; k++) {
    const i = ids[k]!;
    if (world.kind[i] !== KIND_UNIT) continue; // công trình không bao giờ bị đẩy
    let x = world.x[i]! + outX[k]!;
    let y = world.y[i]! + outY[k]!;
    if (world.kbTicks[i]! > 0) {
      x += world.kbX[i]!;
      y += world.kbY[i]!;
      world.kbTicks[i] = world.kbTicks[i]! - 1;
      if (world.kbTicks[i] === 0) {
        world.kbX[i] = 0;
        world.kbY[i] = 0;
      }
    }
    x = Math.min(hi, Math.max(lo, x));
    y = Math.min(world.maxY, clampNorthY(y, world.radius[i]!, world.geometry));
    if (world.team[i] === TEAM_ALLY) {
      // Lính phe mình không ra ngoài bàn cờ + allyLeashPlots ô (2026-11-09).
      x = Math.min(leash.x1, Math.max(leash.x0, x));
      y = Math.min(leash.y1, Math.max(leash.y0, y));
    }
    world.x[i] = x;
    world.y[i] = y;
  }
};
