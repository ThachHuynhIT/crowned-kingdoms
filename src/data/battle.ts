/** Hằng số trận (spec §3.6, §7.4, §8.2); hình học ô 64 theo spec 06/11/2026. */
import { BOARD_ORIGIN, FIELD, PLOT, WALL_Y, cells } from './boardGeometry';

/** Ngân sách gốc năm 1..30 = round(12 × 1.15^(y−1)), lưu sẵn để không phụ thuộc Math.pow. */
export const ENEMY_BUDGET = [
  12, 14, 16, 18, 21, 24, 28, 32, 37, 42,
  49, 56, 64, 74, 85, 98, 112, 129, 149, 171,
  196, 226, 260, 299, 344, 395, 454, 522, 601, 691,
] as const;

export const SLOT_MULT = {
  raiders: 0.8, // Thổ Phỉ
  coalition: 1.1, // Liên Quân
  kingAttack: [0.9, 1.0, 1.2], // lần 1, 2, 3 của một vua
  boss: [1.4, 1.6, 1.8], // đạo quân đi kèm boss 1, 2, 3 (chưa tính chính boss)
} as const;

/** Tối đa đơn vị địch được tạo từ ngân sách. */
export const ENEMY_CAP = 120;
/** Hệ số EP theo cấp 1..5. */
export const ENEMY_LEVEL_COST = [1, 2, 4, 8, 16] as const;
/** Hệ số HP & DMG theo cấp. */
export const ENEMY_LEVEL_STAT = [1, 1.45, 2.1, 3.05, 4.42] as const;
export const WAVES = { share: [0.4, 0.35, 0.25], spawnTick: [0, 120, 240] } as const;

/** Hằng hình quạt 45° (cos 45° làm tròn xuống nên đúng 45° vẫn nằm trong quạt); không dùng Math.cos. */
export const CONE = { cos45: 0.7071 } as const;

/** Bỏng của Bùa Than Hồng kéo dài chừng này tick khi đòn vốn không có bỏng (§6.8). */
export const EMBER_TICKS = 30;

/** Trạng thái theo thời gian (§8.6): bỏng/độc/hồi máu gây hiệu lực mỗi `everyTicks` tick; nhịp đánh không dưới 50% gốc (§5.3). */
export const STATUS = { everyTicks: 10, minIntervalFactor: 0.5 } as const;

export const INTERVENTION = {
  dmgBase: 40,
  dmgPerYear: 10, // sát thương = dmgBase + dmgPerYear × (year − 1), loại phép (bỏ qua giáp)
  radius: cells(0.75),
  delayTicks: 6,
  knockback: 24, // px, ×2 cùng sân (giữ số ô dịch mỗi tick)
  cooldownTicks: 150,
  firstReadyTick: 30,
} as const;

export const BATTLE = {
  field: FIELD,
  plot: PLOT,
  boardOrigin: BOARD_ORIGIN,
  structureRadius: 12,
  throneRadius: 14,
  retargetTicks: 5,
  tauntRadiusDefault: cells(1.25),
  flyingHitMinRange: 24, // đòn có tầm ≥ 24 (và tháp, pulse, can thiệp) mới đánh được đơn vị bay
  rageTick: 600,
  hardLimitTick: 900,
  rageSpeedPct: 50,
  /** Cuồng Nộ: đòn của địch vào công trình (không phải Ngai) thêm % này — địch vẫn phải phá hết nhà trước (2026-11-09). */
  rageStructureDmgPct: 100,
  playerUnitCap: 160,
  bossSummonCap: 40,
  entityCap: 512,
  projectileCap: 400,
  edgeSpan: 0.6,
  spawnSpacing: 20,
  spawnOutside: 24,
  spawnRowGap: 20,
  fieldClampMargin: 64, // đơn vị bị kẹp trong [−64, field + 64] (phía bắc thay bằng wallY, phía nam mở rộng theo hàng xuất quân)
  /** Chân tường núi phía bắc (spec 26/10/2026): không ai đi lên bắc của y = wallY + bán kính. */
  wallY: WALL_Y,
  /** Hàng xuất quân phía nam: từ năm formationDualYear có thêm một nhóm; mỗi nhóm (cờ extraEdge hoặc nhóm năm muộn) thêm một hàng; tối đa formationMaxRows nhóm. */
  formationDualYear: 10,
  formationBaseRows: 1,
  formationLateRows: 2,
  formationMaxRows: 4,
  separationPushMax: 2,
  /** Trần đẩy giữa hai đơn vị khác phe: địch chen vào chỉ nhích lính ra, không hất văng. */
  separationPushCross: 0.4,
  knockbackTicks: 3,
  maxSlowPct: 60,
  bossStunFactor: 0.5,
  spatialCell: PLOT,
} as const;

/**
 * Cổng dịch chuyển của địch (spec 2026-11-08 §3, Q2): ở cuối con đường phía nam, đúng chỗ hàng xuất quân nam cũ.
 * Mọi quân địch xuất từ mép nam (các đợt, raiders, boss) ra ở đây: một đội hình 5×5 trước miệng cổng, quân thứ
 * k ở ô k mod 25 (cột trái → phải, hàng từ chân cổng lên bắc), boss ở tâm. Chỉ là vị trí xuất quân, không va chạm.
 */
export const ENEMY_PORTAL = {
  x: FIELD / 2,
  y: FIELD + BATTLE.spawnOutside,
  columns: 5,
  rows: 5,
  spacingX: 12,
  spacingY: 6,
} as const;

/** 16 vị trí xuất quân quanh tâm ô (px, số nguyên). Lính thứ k dùng SPAWN_OFFSETS[k % 16]; vòng thứ hai trở đi nhân 1.5 rồi làm tròn. */
export const SPAWN_OFFSETS = [
  [0, -8], [8, 0], [0, 8], [-8, 0], [6, -6], [6, 6], [-6, 6], [-6, -6],
  [0, -14], [14, 0], [0, 14], [-14, 0], [10, -10], [10, 10], [-10, 10], [-10, -10],
] as const;
