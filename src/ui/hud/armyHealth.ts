import { KIND_UNIT, TEAM_FOE, type BattleWorld } from '../../game/battle/world';

/**
 * Pure health read-outs of a battle for the HUD bars. They only read the world, never change
 * it, and add no gameplay field: the numbers come from what the battle already tracks.
 */
export interface HealthReadout {
  label: string;
  /** Current health, rounded up, never below 0. */
  hp: number;
  maxHp: number;
  /** 0..1 (0 when `maxHp` is 0). */
  fraction: number;
}

/** What the enemy bar's number means (it is not the king's health and not the whole wave). */
export const ENEMY_ARMY_TOOLTIP = 'Tổng máu quân địch đang hiện diện; thay đổi khi có quân mới.';

/** "44 | 60", or "Chưa xuất quân" while no unit of that army is on the field. */
export const healthText = (r: HealthReadout | null): string => (r === null ? 'Chưa xuất quân' : `${r.hp} | ${r.maxHp}`);

const readout = (label: string, hp: number, maxHp: number): HealthReadout => ({
  label,
  hp: Math.max(0, Math.ceil(hp)),
  maxHp: Math.max(0, Math.round(maxHp)),
  fraction: maxHp <= 0 ? 0 : Math.max(0, Math.min(1, hp / maxHp)),
});

/** The throne's health ("Ngai") as absolute numbers and a fraction. */
export const throneHealth = (world: BattleWorld): HealthReadout => {
  const id = world.throneId;
  return readout('Ngai', world.hp[id]!, world.maxHp[id]!);
};

/**
 * Total health of `team`'s units on the field now: the sum of `hp` over the sum of `maxHp` of the
 * living units (not the waves still to arrive, and not the boss, who has his own bar). A unit that
 * dies leaves the total and one that appears (a new wave, a summon, a revival) joins it, so the
 * bar can grow. `null` while no such unit is alive.
 */
export const armyHealth = (world: BattleWorld, team: number): HealthReadout | null => {
  let hp = 0;
  let maxHp = 0;
  let units = 0;
  for (let id = 0; id < world.count; id++) {
    if (world.alive[id] !== 1 || world.team[id] !== team || world.kind[id] !== KIND_UNIT || id === world.bossId) continue;
    hp += world.hp[id]!;
    maxHp += world.maxHp[id]!;
    units++;
  }
  if (units === 0) return null;
  return readout(team === TEAM_FOE ? 'Máu quân địch' : 'Máu quân ta', hp, maxHp);
};
