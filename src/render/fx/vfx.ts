import { PALETTE as P } from '../../data/palette';
import type { CodeFxDef } from '../codeFx';
import { PixelCanvas } from '../pixel';

type Ramp = readonly [number, number, number, number];
type Painter = (c: PixelCanvas, i: number, ramp: Ramp) => void;
const FIRE: Ramp = [P.redDark, P.orange, P.gold, P.white];
const WATER: Ramp = [P.waterDeep, P.water, P.waterLight, P.white];
const MAGIC: Ramp = [P.plum, P.purple, P.wheatLight, P.white];
const GREEN: Ramp = [P.leafDark, P.leaf, P.grassLight, P.cream];
const GOLD: Ramp = [P.soilDark, P.wheat, P.gold, P.white];
const DUST: Ramp = [P.soilDark, P.soil, P.sand, P.cream];

/** Stamp a solid material cluster with a one-pixel dark silhouette. */
function blob(c: PixelCanvas, x: number, y: number, rx: number, ry: number, r: Ramp): void {
  c.fillEllipse(x, y, rx, ry, r[0]);
  c.fillEllipse(x, y, Math.max(1, rx - 1), Math.max(1, ry - 1), r[1]);
  c.fillEllipse(x - 1, y - 1, Math.max(1, rx - 2), Math.max(1, ry - 2), r[2]);
  if (rx >= 3 && ry >= 3) c.set(x - 1, y - 2, r[3]);
}

/** Integer polyline; thickness is authored in pixels, never rotated/resampled. */
function line(c: PixelCanvas, points: readonly (readonly [number, number])[], color: number, width = 1): void {
  let previous: readonly [number, number] | undefined;
  for (const point of points) {
    if (previous) {
      const [x, y] = previous, dx = point[0] - x, dy = point[1] - y;
      const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
      for (let s = 0; s <= steps; s++)
        c.fillRect(Math.round(x + dx * s / steps), Math.round(y + dy * s / steps), width, width, color);
    }
    previous = point;
  }
}

function spark(c: PixelCanvas, x: number, y: number, r: Ramp, small = false): void {
  c.fillRect(x - 1, y - 3, 3, 7, r[0]); c.fillRect(x - 3, y - 1, 7, 3, r[0]);
  c.fillRect(x, y - 2, 1, 5, r[2]); c.fillRect(x - 2, y, 5, 1, r[2]);
  c.set(x, y, r[3]);
  if (small) { // A compact final pose, rather than a spray of unrelated pixels.
    c.fillRect(x - 3, y - 3, 7, 7, r[0], 0);
    c.fillRect(x - 1, y - 1, 3, 3, r[0]); c.set(x, y, r[3]);
  }
}

/** Hollow 2:1 ground ring (or diamond), with a solid rim and no interior noise. */
function ring(c: PixelCanvas, x: number, y: number, rx: number, ry: number, r: Ramp, diamond = false): void {
  for (let py = Math.floor(y - ry); py <= y + ry; py++) for (let px = Math.floor(x - rx); px <= x + rx; px++) {
    const dx = Math.abs(px + 0.5 - x), dy = Math.abs(py + 0.5 - y);
    const outer = diamond ? dx / rx + dy / ry : (dx / rx) ** 2 + (dy / ry) ** 2;
    const inner = diamond ? dx / (rx - 3) + dy / (ry - 2) : (dx / (rx - 3)) ** 2 + (dy / (ry - 2)) ** 2;
    if (outer <= 1 && inner >= 1) c.set(px, py, outer > 0.86 ? r[0] : py < y ? r[2] : r[1]);
  }
}

function effect(id: string, label: string, group: string, w: number, h: number,
  loop: boolean, anchor: 'feet' | 'centre', note: string, ramp: Ramp, painter: Painter): CodeFxDef {
  return { id, label, group, kind: 'effect', covers: [id], size: { w, h }, frames: 4,
    frameMs: loop ? [110, 110, 110, 110] : [65, 55, 70, 95], loop, anchor, note,
    paint(i) {
      const c = new PixelCanvas(w, h);
      painter(c, i, ramp);
      return c;
    } };
}

export const burn = effect('fx_burn', 'Bỏng', 'Trạng thái', 24, 24, true, 'feet',
  'Neo chân lính đang chịu bỏng từ quân Lò Rèn; lửa liếm lên thân, sát thương theo giây trong tickStatuses.', FIRE,
  (c, i, r) => {
    for (let k = 0; k < 3; k++) {
      const x = 6 + k * 6, height = 10 + (i + k) % 3 * 2;
      const bend = (i + k) % 2 ? 1 : -1;
      // Wide roots taper into curved, alternating tips, not straight strokes.
      for (let row = 0; row < height; row++) {
        const t = row / (height - 1), y = 21 - row;
        const centre = x + Math.round(bend * t * t * 3);
        const half = Math.floor(3 * (1 - t));
        c.fillRect(centre - half, y, half * 2 + 1, 1, r[0]);
        if (half > 0) c.fillRect(centre - half + 1, y, half * 2 - 1, 1, r[1]);
        if (row < 5) c.fillRect(centre, y, row < 2 ? 2 : 1, 1, r[2]);
      }
    }
    for (let k = 0; k < 2; k++) {
      const x = 7 + k * 10 + (i + k) % 2, y = 7 - (i + k * 2) % 5;
      c.fillRect(x, y, 1, 2, r[1]); c.set(x, y, r[2]);
    }
  });

export const poison = effect('fx_poison', 'Nhiễm độc', 'Trạng thái', 24, 24, true, 'feet',
  'Neo chân lính nhiễm độc từ quân Rừng Xanh; bong bóng bay lên, độc cộng lớp theo nguồn trong tickStatuses.', GREEN,
  (c, i, r) => {
    for (let k = 0; k < 3; k++) blob(c, 6 + k * 6 + (i + k) % 2, 20 - (i * 3 + k * 5) % 16, 3, 3, r);
  });

export const slow = effect('fx_slow', 'Chậm', 'Trạng thái', 24, 24, true, 'feet',
  'Neo chân lính bị làm chậm bởi Pháp Sư Băng hoặc đòn có slow; xoáy lạnh và tinh thể quanh chân.', WATER,
  (c, i, r) => {
    ring(c, 12, 19, 10, 4, r);
    for (let k = 0; k < 3; k++) {
      const x = 5 + k * 6, y = 12 + (i + k) % 3 + i % 2;
      line(c, [[x, y + 5], [x - 2, y], [x, y - 3], [x + 2, y], [x, y + 5]], r[0]);
      line(c, [[x, y + 3], [x, y - 1]], r[2]); c.set(x, y - 2, r[3]);
    }
  });

export const disable = effect('fx_disable', 'Vô hiệu', 'Trạng thái', 32, 32, true, 'centre',
  'Neo giữa công trình bị Ném Bùn của trùm đầm lầy vô hiệu (disabledUntil); công trình còn đứng nhưng ngừng hoạt động.', WATER,
  (c, i, r) => {
    c.fillEllipse(16, 16, 7, 7, P.stoneDark);
    const teeth: readonly (readonly [number, number])[] = [
      [14, 6], [20, 8], [23, 14], [20, 20], [14, 23], [8, 20], [6, 14], [8, 8],
    ];
    for (const [x, y] of teeth) c.fillRect(x, y, 4, 4, P.stoneDark);
    c.fillEllipse(15, 15, 6, 6, P.stone);
    line(c, [[11, 14], [12, 11], [16, 10]], P.stoneLight);
    c.fillEllipse(16, 16, 3, 3, P.stoneDark);
    c.fillEllipse(16, 16, 2, 2, P.shadow);
    line(c, [[18, 9], [16, 12], [19, 14], [18, 18], [21, 21]], P.shadow);
    const shift = i % 2 * 2;
    const bolts: readonly (readonly (readonly [number, number])[])[] = [
      [[4, 7 + shift], [2, 11 + shift], [5, 11 + shift], [3, 15 + shift]],
      [[27, 16 - shift], [25, 20 - shift], [28, 20 - shift], [26, 25 - shift]],
    ];
    for (const points of bolts) {
      line(c, points, P.soilDark, 3); line(c, points, P.gold, 2);
      if (i % 2 === 0) line(c, points, r[3]);
    }
  });

export const heal = effect('fx_heal', 'Hồi máu', 'Trạng thái', 24, 24, true, 'feet',
  'Neo chân lính được hồi máu bởi aura hoặc healAlly của Rừng Xanh; dấu cộng xanh bay lên thân.', GREEN,
  (c, i, r) => {
    const y = 17 - i * 3;
    c.fillRect(9, y - 4, 5, 11, r[0]); c.fillRect(6, y - 1, 11, 5, r[0]);
    c.fillRect(10, y - 3, 3, 9, r[1]); c.fillRect(7, y, 9, 3, r[2]);
    c.fillRect(10, y - 2, 1, 4, r[3]); spark(c, 19, 18 - i * 2, r, true);
  });

export const slash = effect('fx_slash', 'Vệt chém', 'Chiến đấu', 32, 32, false, 'centre',
  'Vệt chém cận chiến trắng-xanh theo một hướng chéo; lật ngang khi cần, không xoay sprite.', WATER,
  (c, i, r) => {
    const start = i === 3 ? 3 : 0;
    const curve: readonly (readonly [number, number])[] = [[5, 25], [7, 17], [13, 10], [21, 6], [27, 5]];
    line(c, curve.slice(start), r[0], i === 3 ? 2 : 4);
    line(c, curve.slice(start), r[1], i === 3 ? 1 : 3);
    if (i < 3) line(c, curve.slice(start), r[2], 2);
    if (i < 3) line(c, [[7 + i, 22], [11, 15], [17, 10], [25, 7]], r[3]);
  });

export const magicHit = effect('fx_magic_hit', 'Phép trúng', 'Chiến đấu', 24, 24, false, 'centre',
  'Nổ tím tại mục tiêu chịu đòn phép của Phép Thuật hoặc Ánh Trăng.', MAGIC,
  (c, i, r) => {
    if (i < 3) blob(c, 12, 12, 4 + i * 2, 4 + i * 2, r);
    for (let k = 0; k < 4; k++) {
      const dx = k % 2 ? 1 : -1, dy = k < 2 ? -1 : 1;
      spark(c, 12 + dx * (4 + i * 2), 12 + dy * (3 + i * 2), r, i === 3);
    }
  });

export const splash = effect('fx_splash', 'Nước bắn', 'Chiến đấu', 32, 32, false, 'feet',
  'Nước bắn tại điểm đòn Thuỷ Triều chạm đất; neo chân mục tiêu.', WATER,
  (c, i, r) => {
    if (i < 3) ring(c, 16, 25, 7 + i * 3, 4 + i, r);
    for (let k = 0; k < (i === 3 ? 2 : 4); k++) {
      const x = 7 + k * 6 + (k < 2 ? -i : i), y = 18 - i * 3 + i * i + k % 2 * 3;
      blob(c, x, y, i === 3 ? 2 : 3, i === 3 ? 2 : 4, r);
    }
  });

export const wave = effect('fx_wave', 'Sóng nước', 'Chiến đấu', 48, 24, false, 'centre',
  'Sóng phép lan và đẩy lùi quanh Tháp Sóng của Vua Thuỷ Triều; vòng dẹt isometric 2:1.', WATER,
  (c, i, r) => {
    ring(c, 24, 12, 10 + i * 4, 5 + i * 2, r);
    if (i < 3) c.fillRect(21, 8 - i * 2, 5, 1, r[3]);
    else c.fillRect(0, 0, 48, 12, r[0], 0);
  });

export const fireCone = effect('fx_fire_cone', 'Luồng lửa', 'Chiến đấu', 48, 24, false, 'centre',
  'Nón lửa hướng đông của Tháp Phun Lửa và Rồng Sắt; lật ngang cho hướng tây, không xoay sprite.', FIRE,
  (c, i, r) => {
    const end = i === 3 ? 19 : 29 + i * 7;
    for (let x = 5; x < end; x++) {
      const half = Math.max(1, Math.floor((x - 4) / 5)), y = 12 + (Math.floor(x / 5) + i) % 2;
      c.fillRect(x, y - half, 1, half * 2 + 1, r[0]);
      c.fillRect(x, y - half + 1, 1, Math.max(1, half * 2 - 1), r[1]);
      if (x < end - 4) c.fillRect(x, y, 1, Math.max(1, half - 1), r[2]);
    }
    if (i < 3) c.fillRect(7, 12, 8, 1, r[3]);
  });

export const chain = effect('fx_chain', 'Sét chuyền', 'Chiến đấu', 48, 16, false, 'centre',
  'Tia nối hai mục tiêu khi đòn Tháp Pháp Sư nảy sang địch khác; vẽ nằm ngang, không xoay sprite.', WATER,
  (c, i, r) => {
    const points: readonly (readonly [number, number])[] = [[3, 8], [12, 4 + i % 2 * 3], [18, 11], [29, 4], [35, 10 - i], [43, 8]];
    const pose = i === 3 ? points.slice(3) : points;
    line(c, pose, r[0], 3); line(c, pose, r[2], 2); line(c, pose, r[3]);
    if (i < 3) { c.fillRect(2, 6, 3, 4, r[0]); c.fillRect(3, 7, 1, 2, r[1]); }
  });

export const rope = effect('fx_rope', 'Dây kéo', 'Chiến đấu', 48, 8, false, 'centre',
  'Dây căng ngang khi Lính Móc Câu kéo mục tiêu theo pullEvery; bốn tư thế rung, không xoay sprite.', DUST,
  (c, i, r) => {
    const points: readonly (readonly [number, number])[] = [[2, 3], [13, 2 + i % 2], [25, 4 - i % 2], [44, 3]];
    const pose = i === 3 ? points.slice(1) : points;
    line(c, pose, r[0], 3); line(c, pose, r[1], 2); line(c, pose, r[2]);
    if (i < 3) c.set(3, 3, r[3]);
  });

export const dust = effect('fx_dust', 'Bụi chân', 'Sự kiện', 24, 16, false, 'feet',
  'Neo chân lính khi chạy hoặc đáp xuống; bụi thuần hình ảnh, không đổi chuyển động mô phỏng.', DUST,
  (c, i, r) => {
    for (let k = 0; k < (i === 3 ? 1 : 3); k++)
      blob(c, 7 + k * 5 - i, 12 - i + k % 2, i === 3 ? 2 : 3 + i, i === 3 ? 2 : 3, r);
  });

export const soul = effect('fx_soul', 'Hồn bay', 'Sự kiện', 32, 32, false, 'feet',
  'Hồn xanh bay lên khi lính chết, minh hoạ nguồn Hồn và soulScaling của Vua Ánh Trăng; neo chân.', WATER,
  (c, i, r) => {
    const y = 23 - i * 5;
    blob(c, 16, y, i === 3 ? 2 : 5, i === 3 ? 3 : 6, r);
    if (i < 3) { line(c, [[14, y + 3], [16, y + 8], [19, y + 5]], r[0], 2); c.set(14, y - 1, r[0]); c.set(17, y - 1, r[0]); }
  });

export const revive = effect('fx_revive', 'Sống lại', 'Sự kiện', 32, 32, false, 'feet',
  'Neo chân khi deathBehaviours phát revive: lính có reviveOnce hoặc địch được Bất Tử cho sống lại.', GOLD,
  (c, i, r) => {
    const top = i === 0 ? 17 : i === 1 ? 8 : 3;
    const half = i === 0 ? 2 : i === 3 ? 1 : 3;
    ring(c, 16, 26, i === 3 ? 7 : 10, i === 3 ? 3.5 : 5, r);
    for (let y = top; y <= 26; y++) for (let x = 16 - half; x <= 16 + half; x++) {
      const edge = Math.abs(x - 16) === half;
      if (i === 3 && (edge || y < top + 4) && (x + y) % 2 === 0) continue;
      c.set(x, y, edge ? r[2] : r[3]);
    }
    if (i === 3) {
      // Dissolve the rim using hard-edged dither, never partial alpha.
      for (let y = 22; y < 31; y++) for (let x = 8; x < 24; x++)
        if ((x + y) % 2 === 0 && (x < 15 || x > 17)) c.set(x, y, r[0], 0);
    }
    for (let k = 0; k < (i === 3 ? 2 : 3); k++) {
      const x = k % 2 ? 22 : 9 + k, y = 23 - k * 5 - i * 3;
      c.fillRect(x, y, 1, 2, r[2]); c.set(x, y, r[3]);
    }
  });

export const summon = effect('fx_summon', 'Triệu hồi', 'Sự kiện', 32, 32, false, 'feet',
  'Vòng phép tím-vàng ở chân lính được sinh bởi Vòng Triệu Hồi hoặc summonOnKill của Ánh Trăng.', MAGIC,
  (c, i, r) => {
    ring(c, 16, 22, 7 + i * 2, 3.5 + i, r);
    if (i < 3) { spark(c, 7, 18 - i * 3, r); spark(c, 24, 18 - i * 3, r); }
    else c.fillRect(0, 22, 32, 10, r[0], 0);
  });

export const reward = effect('fx_reward', 'Nhận thưởng', 'Sự kiện', 32, 32, false, 'centre',
  'Sao vàng bung ra khi nhận thưởng cuối trận hoặc chinh phục; minh hoạ phần thưởng, không phát thêm vàng.', GOLD,
  (c, i, r) => {
    if (i < 3) {
      const lid = 13 - i * 2;
      c.fillRect(8, lid, 16, 6, P.soilDark);
      c.fillRect(9, lid + 1, 14, 4, P.soil);
      c.fillRect(10, lid + 1, 12, 1, P.path);
      c.fillRect(9, lid + 6, 14, 18 - lid - 5, P.shadow);
      for (let k = 0; k < 3; k++) {
        const x = 12 + k * 4;
        line(c, [[x, 18], [x + (k - 1) * 2, lid + 5]], r[2], 2);
        c.set(x, lid + 5, r[3]);
      }
      c.fillRect(8, 18, 16, 10, P.soilDark);
      c.fillRect(9, 19, 14, 8, P.soil);
      c.fillRect(10, 19, 12, 1, P.path);
      c.fillRect(9, 23, 14, 1, P.soilDark);
      c.fillRect(21, 20, 2, 7, P.soilDark);
      for (const x of [11, 20]) {
        c.fillRect(x, lid + 1, 2, 4, P.gold);
        c.fillRect(x, 19, 2, 8, P.wheat); c.set(x, 19, P.white);
      }
      c.fillRect(15, 19, 3, 4, P.soilDark); c.fillRect(16, 19, 1, 3, P.gold);
    }
    spark(c, 6 - i, 12 - i, r, true); spark(c, 26 + i, 12 - i * 2, r, true);
    spark(c, 16, 7 - i, r, i === 3);
  });

export const place = effect('fx_place', 'Đặt công trình', 'Bàn cờ', 64, 32, false, 'centre',
  'Vòng sáng hình thoi 64×32 khớp ô isometric khi đặt công trình thành công; neo giữa ô.', GOLD,
  (c, i, r) => {
    ring(c, 32, 16, 31, 15.5, r, true);
    if (i < 3) for (let k = 0; k < 3; k++) blob(c, 20 + k * 12, 21 - k % 2 * 3 - i, 4 + i, 3, r);
    else c.fillRect(0, 0, 64, 16, r[0], 0);
  });

export const move = effect('fx_move', 'Dời công trình', 'Bàn cờ', 64, 32, false, 'centre',
  'Bụi dọc ô hình thoi 64×32 khi dời công trình, gồm freeMove của Du Mục; neo giữa ô.', DUST,
  (c, i, r) => {
    if (i < 3) ring(c, 32, 16, 31, 15.5, r, true);
    for (let k = 0; k < (i === 3 ? 1 : 4); k++) blob(c, 13 + k * 10 + i * 3, 16 + k % 2 * 3 - i, i === 3 ? 2 : 5, 3, r);
  });

export const upgrade = effect('fx_upgrade', 'Nâng cấp', 'Bàn cờ', 32, 48, false, 'feet',
  'Mũi tên vàng và tia sáng bốc lên khi công trình tăng cấp; neo chân công trình, không xoay sprite.', GOLD,
  (c, i, r) => {
    const y = 27 - i * 6, half = i === 3 ? 2 : 6;
    for (let row = 0; row <= half; row++) c.fillRect(16 - row, y + row, row * 2 + 1, 1, r[0]);
    c.fillRect(14, y + half, 5, i === 3 ? 5 : 12, r[0]);
    c.fillRect(17, y + half, 1, i === 3 ? 4 : 11, r[1]);
    for (let row = 1; row < half; row++) c.fillRect(17 - row, y + row + 1, row * 2 - 1, 1, r[2]);
    c.fillRect(15, y + half, 3, i === 3 ? 3 : 10, r[2]); c.set(16, y + 2, r[3]);
    spark(c, 7, y + 10, r, true);
    spark(c, 25, y + 4, r, true);
    if (i < 3) spark(c, 23, y + 18, r, true);
  });

export const VFX: readonly CodeFxDef[] = [burn, poison, slow, disable, heal, slash, magicHit, splash, wave,
  fireCone, chain, rope, dust, soul, revive, summon, reward, place, move, upgrade];
