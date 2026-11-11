/** Hằng số trận (spec §3.6, §7.4, §8.2); hình học ô 64 theo spec 06/11/2026. */
import { BOARD_ORIGIN, FIELD, PLOT, PORTAL, WALL_Y, cells } from './boardGeometry';
import type { KingId } from './types';

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
/**
 * HP và sát thương của mọi lính địch nhân thêm hệ số này (cân bằng lại 2026-11-09 sau khi tầm tháp ×3, công trình
 * chặn đường và địch phải phá hết nhà: bot greedy Gai 0 thắng gần 100%; mục tiêu 35–65% mỗi vua).
 */
export const ENEMY_STAT_MULT = 1.5; // 2.15 → 1.5 (tối 11/11/2026): Can Thiệp giảm mạnh, lính/tháp mạnh lên (ALLY_ROLE_TUNING)
/**
 * Máu và sát thương của boss 1/2/3 lúc vào trận, nhân với số trong `BOSSES` (10/11/2026: hết giờ không
 * còn là thắng, boss phải hạ được). Đo bằng `npm run balance`, xem docs/balance/2026-11-10-draw-one-balance.md.
 */
export const BOSS_HP_MULT = [0.9, 0.5, 0.24] as const; // chủ dự án 10/11/2026: boss hơi khó → −10%
export const BOSS_DMG_MULT = [0.9, 0.58, 0.9] as const;
/**
 * Chỉnh sức phe mình theo vua (chủ dự án 10/11/2026, thay hệ số sức địch `FOE_MULT_BY_KING`): % cộng vào máu và sát
 * thương của mọi công trình, Ngai và lính phe mình khi vào trận (`BattleWorld`, theo `setup.power`). Âm = yếu đi.
 * Đo bằng `npm run balance`.
 */
export const KING_TUNING: Readonly<Record<KingId, { readonly hpPct: number; readonly dmgPct: number }>> = {
  wheat: { hpPct: 27, dmgPct: 27 },
  stone: { hpPct: -34, dmgPct: -34 },
  arcane: { hpPct: -12, dmgPct: -12 },
  grove: { hpPct: 21, dmgPct: 21 },
  tide: { hpPct: 3, dmgPct: 3 },
  forge: { hpPct: -26, dmgPct: -26 },
  clock: { hpPct: 130, dmgPct: 130 },
  moon: { hpPct: 7, dmgPct: 7 },
  nomad: { hpPct: 21, dmgPct: 21 },
};

/**
 * Role tuning of our side (owner 11/11/2026: troops and towers should deal most of the damage, not the
 * intervention). Percent added on top of the card stats, before `KING_TUNING`.
 * - `unitDmgPct` / `unitHpPct`: every unit of ours (spawned troops, summons);
 * - `towerDmgPct`: every structure of ours that attacks or pulses (not the throne).
 */
export const ALLY_ROLE_TUNING = { unitDmgPct: 120, unitHpPct: 50, towerDmgPct: 200 } as const;

export const WAVES = { share: [0.4, 0.35, 0.25], spawnTick: [0, 120, 240] } as const;

/** Hằng hình quạt 45° (cos 45° làm tròn xuống nên đúng 45° vẫn nằm trong quạt); không dùng Math.cos. */
export const CONE = { cos45: 0.7071 } as const;

/** Bỏng của Bùa Than Hồng kéo dài chừng này tick khi đòn vốn không có bỏng (§6.8). */
export const EMBER_TICKS = 30;

/** Trạng thái theo thời gian (§8.6): bỏng/độc/hồi máu gây hiệu lực mỗi `everyTicks` tick; nhịp đánh không dưới 50% gốc (§5.3). */
export const STATUS = { everyTicks: 10, minIntervalFactor: 0.5 } as const;

export const INTERVENTION = {
  // Halved 11/11/2026 (owner: the intervention dealt ~80% of our damage; troops and towers should carry the fight).
  dmgBase: 6,
  dmgPerYear: 1.5, // sát thương = dmgBase + dmgPerYear × (year − 1), loại phép (bỏ qua giáp)
  radius: cells(0.75),
  delayTicks: 6,
  knockback: 24, // px, ×2 cùng sân (giữ số ô dịch mỗi tick)
  cooldownTicks: 150,
  firstReadyTick: 30,
} as const;

/**
 * Can Thiệp riêng của từng vua (chủ dự án 10/11/2026): cùng điểm rơi, hồi chiêu và sát thương gốc, thêm một hiệu ứng
 * khi chạm đất. Mọi trường đều tuỳ chọn; vắng = như đá tảng gốc. `dmgPct` / `radiusPct` cộng vào % của sắc lệnh.
 */
export interface InterventionPower {
  /** Tên hiển thị (tiếng Việt). */
  readonly name: string;
  /** Mô tả một dòng cho trợ giúp và tooltip. */
  readonly text: string;
  readonly dmgPct?: number;
  readonly radiusPct?: number;
  readonly knockbackMult?: number;
  readonly slowPct?: number;
  readonly slowTicks?: number;
  readonly stunTicks?: number;
  readonly burnDps?: number;
  readonly burnTicks?: number;
  readonly poisonDps?: number;
  readonly poisonTicks?: number;
}

export const INTERVENTION_POWERS: Readonly<Record<KingId, InterventionPower>> = {
  wheat: { name: 'Bó Lúa Trói Chân', text: 'Địch trúng chậm 40% trong 4 giây.', slowPct: 40, slowTicks: 40 },
  stone: { name: 'Đá Tảng Núi', text: 'Địch trúng choáng 1 giây.', stunTicks: 10 },
  arcane: { name: 'Sét Phép', text: '+30% sát thương.', dmgPct: 30 },
  grove: { name: 'Rễ Quấn', text: 'Rễ cây giữ chân: địch trúng chậm 60% (mức trần) trong 2,5 giây.', slowPct: 60, slowTicks: 25 },
  tide: { name: 'Sóng Thần', text: 'Đẩy lùi địch xa gấp đôi.', knockbackMult: 2 },
  forge: { name: 'Thép Nung', text: 'Địch trúng bị bỏng 4/giây trong 4 giây.', burnDps: 4, burnTicks: 40 },
  clock: { name: 'Ngưng Thời Gian', text: 'Địch trúng choáng 1,8 giây; −10% sát thương.', stunTicks: 18, dmgPct: -10 },
  moon: { name: 'Lời Nguyền Trăng', text: 'Địch trúng nhiễm độc 3/giây trong 5 giây.', poisonDps: 3, poisonTicks: 50 },
  nomad: { name: 'Mưa Tên', text: 'Vùng rơi rộng thêm 35%; −15% sát thương.', radiusPct: 35, dmgPct: -15 },
};

export const BATTLE = {
  field: FIELD,
  plot: PLOT,
  boardOrigin: BOARD_ORIGIN,
  /** Nửa cạnh khối chặn vuông của công trình / Ngai giữa ô 64 px (2026-11-09: công trình không chiếm cả ô). */
  structureRadius: 18,
  throneRadius: 18,
  retargetTicks: 5,
  tauntRadiusDefault: cells(1.25),
  flyingHitMinRange: 24, // đòn có tầm ≥ 24 (và tháp, pulse, can thiệp) mới đánh được đơn vị bay
  rageTick: 600,
  /** Trần an toàn (chủ dự án 10/11/2026): tới tick này trận chưa xong thì tính THUA; hết giờ không còn là thắng. */
  hardLimitTick: 3000,
  /** Từ rageTick, cứ chừng này tick địch thêm một bậc Cuồng Nộ (bậc 1 ngay ở rageTick). */
  rageStackTicks: 600,
  /** Mỗi bậc Cuồng Nộ: mọi đòn của địch +% này, cộng dồn. */
  rageStackDmgPct: 20,
  rageSpeedPct: 50,
  /** Cuồng Nộ: đòn của địch vào công trình (không phải Ngai) thêm % này — địch vẫn phải phá hết nhà trước (2026-11-09). */
  rageStructureDmgPct: 100,
  playerUnitCap: 160,
  /** Lính phe mình không ra quá mép bàn cờ + số ô này ở mỗi phía (2026-11-09). */
  allyLeashPlots: 4,
  /** Tầm đánh ≤ số này là cận chiến (đứng hàng trước đội hình). */
  meleeMaxRange: 8,
  /** Đội hình khi rảnh trước bàn cờ: hàng đầu cách mép nam bàn `formationMargin`, mỗi hàng `formationPerRow` lính. */
  formationMargin: 14,
  formationPerRow: 20,
  formationSpacing: 16,
  formationRowGap: 16, // 12 → 16 cùng khoảng cách: lính to 1,3 lần (2026-11-09)
  /** Khoảng trống giữa khối bắn xa và khối cận chiến. */
  formationBandGap: 6,
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
  /** Lính phe mình chạy ra ô đội hình lần đầu nhanh gấp này; tới ô (hoặc gặp địch) thì về tốc độ thường (chủ dự án 11/11/2026). */
  rallySpeedMult: 2.5,
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
  x: PORTAL.x,
  y: PORTAL.y,
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
