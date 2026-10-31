import { ENEMY_BUDGET, ENEMY_CAP, ENEMY_LEVEL_COST, WAVES } from '../../data/battle';
import { RUN } from '../../data/run';
import type { UnitId } from '../../data/types';
import { Rng, hashSeed } from '../../core/random';
import type { ArmySpawn, ArmyPlan, ArmyWave } from './types';

export interface ComposeEntry {
  unit: UnitId;
  weight: number;
  /** EP ở cấp 1. */
  enemyCost: number;
}

const LEVELS = [1, 2, 3, 4, 5] as const;

/** Ngân sách EP của một đạo quân (độ khó Gai 0): round(ENEMY_BUDGET[year−1] × slot). */
export const armyBudget = (year: number, slot: number, difficulty = 0): number => {
  const idx = Math.min(Math.max(year, 1), ENEMY_BUDGET.length) - 1;
  return Math.round(ENEMY_BUDGET[idx]! * slot * (1 + RUN.difficultyBudgetStep * difficulty));
};

/** Chọn theo trọng số trong `pool` (thứ tự cố định, không phụ thuộc Map/Set). */
const pickWeighted = (pool: readonly ComposeEntry[], rng: Rng): ComposeEntry => {
  let total = 0;
  for (const e of pool) total += e.weight;
  let r = rng.next() * total;
  for (const e of pool) {
    if (r < e.weight) return e;
    r -= e.weight;
  }
  return pool[pool.length - 1]!;
};

/** Thuần và xác định: cùng đầu vào → cùng ArmyPlan (spec §3.6). */
export const composeArmy = (
  roster: readonly ComposeEntry[],
  budget: number,
  year: number,
  seed: number,
  meta: {
    attacker?: ArmyPlan['attacker'];
    attackNo?: 1 | 2 | 3;
    banner?: string;
    kings?: ArmyPlan['kings'];
    boss?: ArmyPlan['boss'];
    bossOrdinal?: ArmyPlan['bossOrdinal'];
    /** Giữ cho nơi gọi cũ; không còn tác dụng ở đây (cờ Đột Kích thêm hàng dàn quân trong buildBattleSetup). */
    extraEdges?: number;
  } = {},
): ArmyPlan => {
  const rng = new Rng(hashSeed(`${seed}:army:${year}`));

  let weightSum = 0;
  let costSum = 0;
  for (const e of roster) {
    if (e.enemyCost <= 0) continue; // EP 0 = không bao giờ được chọn (lính triệu hồi, boss)
    weightSum += e.weight;
    costSum += e.weight * e.enemyCost;
  }
  const avg = weightSum > 0 ? costSum / weightSum : 1;

  let level: ArmyPlan['level'] = 5;
  for (const l of LEVELS) {
    if (budget / (avg * ENEMY_LEVEL_COST[l - 1]!) <= ENEMY_CAP) {
      level = l;
      break;
    }
  }
  const levelCost = ENEMY_LEVEL_COST[level - 1]!;

  const chosen: UnitId[] = [];
  let spent = 0;
  while (chosen.length < ENEMY_CAP) {
    const remaining = budget - spent;
    const pool = roster.filter((e) => e.weight > 0 && e.enemyCost > 0 && e.enemyCost * levelCost <= remaining);
    if (pool.length === 0) break;
    const e = pickWeighted(pool, rng);
    chosen.push(e.unit);
    spent += e.enemyCost * levelCost;
  }

  const statMult = chosen.length >= ENEMY_CAP && spent > 0 && spent < budget ? Math.sqrt(budget / spent) : 1;

  const n = chosen.length;
  const sizes = [Math.floor(n * WAVES.share[0]), Math.floor(n * WAVES.share[1]), 0];
  sizes[2] = n - sizes[0]! - sizes[1]!;

  const waves: ArmyWave[] = [];
  let cursor = 0;
  for (let w = 0; w < WAVES.share.length; w++) {
    // Địch chỉ tiến từ phía trước (mép S, spec 26/10/2026); cờ `extraEdges` và năm muộn chỉ thêm hàng dàn quân.
    const units: ArmySpawn[] = [];
    for (let i = 0; i < sizes[w]!; i++) units.push({ unit: chosen[cursor++]!, edge: 'S' });
    waves.push({ spawnTick: WAVES.spawnTick[w]!, units });
  }

  const plan: ArmyPlan = { attacker: meta.attacker ?? 'raiders', budget, level, statMult, waves };
  if (meta.attackNo !== undefined) plan.attackNo = meta.attackNo;
  if (meta.banner !== undefined) plan.banner = meta.banner;
  if (meta.kings !== undefined) plan.kings = meta.kings;
  if (meta.boss !== undefined) plan.boss = meta.boss;
  if (meta.bossOrdinal !== undefined) plan.bossOrdinal = meta.bossOrdinal;
  return plan;
};
