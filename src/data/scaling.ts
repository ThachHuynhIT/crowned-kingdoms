import type { AttackSpec, Level, PerLevel } from './types';

/** Hồ sơ tăng cấp chuẩn L1→L5 (spec §5.2). */
export const TROOP_STD: PerLevel = [1, 1.25, 1.5, 1.75, 2]; // HP và DMG lính do công trình sinh ra
export const TOWER_STD: PerLevel = [1, 1.35, 1.7, 2.05, 2.4]; // DMG tháp / đòn pulse
export const STRUCT_STD: PerLevel = [1, 1.25, 1.5, 1.75, 2]; // máu công trình
export const THRONE_STD: PerLevel = [1, 1.25, 1.5, 1.75, 2]; // HP và DMG của Ngai
/** Cộng vào tầm tháp / bán kính pulse (px) theo cấp. */
/** +tầm đạn của tháp theo cấp (world px): +50% so với ô 32 (spec 06/11/2026). */
export const TOWER_RANGE: PerLevel = [0, 6, 12, 18, 24];
/**
 * Tầm bắn của công trình nhân ba (chủ dự án 09/11/2026), gồm cả phần cộng theo cấp. Ngoại lệ giữ tầm cũ: tháp có
 * đòn đẩy lùi (pháo và xúc tu của Thuỷ Triều) và tháp phun hình quạt (Tháp Lửa của Lò Rèn). Không áp cho Ngai, lính, xung, khiên, hồi máu, khiêu khích.
 */
export const TOWER_RANGE_MULT = 3;
/**
 * Sát thương đòn bắn của tháp nhân hệ số này (cân bằng 2026-11-09): tầm ×3 làm vua nhiều tháp (Đá Núi) mạnh vượt hẳn
 * vua nhiều lính; giữ tầm như chủ dự án muốn, hạ sát thương. Không áp cho xung, Ngai hay lính.
 */
export const TOWER_SHOT_DMG_MULT = 0.6;

/** Tầm của đòn tháp `attack` ở cấp `level` (world px). */
export const towerRange = (attack: AttackSpec, level: Level): number => {
  const base = attack.range + TOWER_RANGE[level - 1]!;
  const special = attack.cone !== undefined || (attack.onHit?.some((h) => h.type === 'knockback') ?? false);
  return special ? base : base * TOWER_RANGE_MULT;
};

/** +bán kính xung (pulse) của tháp theo cấp (world px): giữ số ô cũ, ×2 px. */
export const PULSE_RADIUS_BONUS: PerLevel = [0, 8, 16, 24, 32];

/** Giá trị của hồ sơ ở cấp `level`. */
export const levelMult = (profile: PerLevel, level: Level): number => profile[level - 1]!;

/** HP công trình mặc định theo loại (cấp 1). */
export const STRUCT_HP = { troop: 150, tower: 220, economy: 120, support: 160 } as const;

export const MAX_UNITS_PER_BUILDING = 20;
