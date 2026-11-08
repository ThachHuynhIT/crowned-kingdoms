/** Bị động Ngai trong trận (spec §6.6–6.10): Sinh Trưởng, Lửa Tôi, Lên Dây, Chiến Lợi Phẩm, Thu Hồn. */
import { describe, expect, it } from 'vitest';
import { TOWER_STD, TROOP_STD, levelMult } from '../../data/scaling';
import type { KingId, Level } from '../../data/types';
import { BattleRunner } from '../battle/BattleRunner';
import { tickBehaviours } from '../battle/behaviours';
import { hashWorld } from '../battle/hash';
import { stepBattle } from '../battle/step';
import type { BattleResult, BattleSetup } from '../battle/types';
import { TEAM_ALLY, addUnit, createBattle, type BattleWorld } from '../battle/world';
import { createGameBus } from '../events';
import { buildBattleSetup, structureFor } from '../run/battleSetup';
import type { RunState } from '../run/state';
import { newRun } from '../run/yearFlow';
import { unitStats, withBuilding } from '../testing/fixtures';
import { CONTENT } from './registry';

const kingRun = (king: KingId, throneLevel: Level, year = 1): RunState => ({
  ...newRun(1, king, CONTENT),
  throneLevel,
  year,
});

/** Chạy trọn trận bằng BattleRunner; trả kết quả và hash cuối. */
const runOnce = (setup: BattleSetup): { result: BattleResult; hash: number } => {
  const runner = new BattleRunner(setup, createGameBus());
  for (let i = 0; i < 2000 && runner.result === null; i++) runner.update(1000);
  runner.dispose();
  return { result: runner.result!, hash: hashWorld(runner.world) };
};

/** Hai lần chạy cùng setup cho cùng hash (deterministic). */
const expectDeterministic = (setup: BattleSetup): BattleResult => {
  const a = runOnce(setup);
  const b = runOnce(setup);
  expect(a.hash).toBe(b.hash);
  expect(a.result).toEqual(b.result);
  return a.result;
};

/** Trận yên tĩnh: đợt duy nhất tới ở tick 800 và rỗng. */
const quiet = (setup: BattleSetup): BattleSetup => ({ ...setup, waves: [{ spawnTick: 800, spawns: [] }] });


describe('grove_growth (Sinh Trưởng)', () => {
  const wolfDmg = 7 * levelMult(TROOP_STD, 1);
  const wolfHp = 36 * levelMult(TROOP_STD, 1);
  const den = (s: RunState) => structureFor(s, 6, CONTENT).spawn!.stats;

  it('a grove building placed in year 1 is +20% HP and DMG in year 11 at throne level 1', () => {
    const s = withBuilding(kingRun('grove', 1, 11), 6, 'grove_wolf_den', 1, { placedYear: 1 });
    expect(den(s).dmg).toBeCloseTo(wolfDmg * 1.2);
    expect(den(s).hp).toBeCloseTo(wolfHp * 1.2);
  });

  it('clamps at +60% for a 40-year-old building', () => {
    const s = withBuilding(kingRun('grove', 1, 41), 6, 'grove_wolf_den', 1, { placedYear: 1 });
    expect(den(s).dmg).toBeCloseTo(wolfDmg * 1.6);
  });

  it('counts ageBonus (Mưa Xuân) and scales with the throne level', () => {
    const s = withBuilding(kingRun('grove', 5, 11), 6, 'grove_wolf_den', 1, { placedYear: 1, ageBonus: 2 });
    expect(den(s).dmg).toBeCloseTo(wolfDmg * 1.48);
  });

  it('leaves a building without the grove tag at ×1.00', () => {
    const s = withBuilding(kingRun('grove', 1, 11), 6, 'wheat_militia', 1, { placedYear: 1 });
    const militia = CONTENT.unit('militia');
    expect(structureFor(s, 6, CONTENT).spawn!.stats.dmg).toBeCloseTo(militia.attack.dmg * levelMult(TROOP_STD, 1));
  });

  it('is deterministic in a real battle', () => {
    const s = withBuilding(kingRun('grove', 3, 11), 6, 'grove_wolf_den', 2, { placedYear: 1 });
    expectDeterministic(buildBattleSetup(s, CONTENT));
  });
});

describe('forge_tempered (Lửa Tôi)', () => {
  const towerDmg = (level: Level) => 7 * levelMult(TOWER_STD, level);

  it('a level-3 tower deals ×1.20 at throne level 5, ×1.10 at throne level 1', () => {
    const at5 = withBuilding(kingRun('forge', 5), 7, 'neutral_archer_tower', 3);
    expect(structureFor(at5, 7, CONTENT).attack!.dmg).toBeCloseTo(towerDmg(3) * 1.2);
    const at1 = withBuilding(kingRun('forge', 1), 7, 'neutral_archer_tower', 3);
    expect(structureFor(at1, 7, CONTENT).attack!.dmg).toBeCloseTo(towerDmg(3) * 1.1);
  });

  it('a level-2 tower stays at ×1.00', () => {
    const s = withBuilding(kingRun('forge', 5), 7, 'neutral_archer_tower', 2);
    expect(structureFor(s, 7, CONTENT).attack!.dmg).toBeCloseTo(towerDmg(2));
  });

  it('is deterministic in a real battle', () => {
    const s = withBuilding(kingRun('forge', 5), 7, 'neutral_archer_tower', 3);
    expectDeterministic(buildBattleSetup(s, CONTENT));
  });
});

describe('clock_windup (Lên Dây)', () => {
  const towerWorld = (throneLevel: Level): BattleWorld => {
    const s = withBuilding(kingRun('clock', throneLevel), 7, 'neutral_archer_tower', 1);
    return createBattle(quiet(buildBattleSetup(s, CONTENT)));
  };
  const TOWER = 1; // Ngai = 0, rồi công trình theo plot

  it('a tower attacks 15% faster after 300 ticks at throne level 1, clamped at +40% after 900', () => {
    const w = towerWorld(1);
    const base = w.baseInterval[TOWER]!;
    w.tick = 300;
    tickBehaviours(w);
    expect(w.interval[TOWER]).toBeCloseTo(base / 1.15);
    w.tick = 900;
    tickBehaviours(w);
    expect(w.interval[TOWER]).toBeCloseTo(base / 1.4);
  });

  it('troops wind up too (1.0%/s at throne level 5), the throne itself does not', () => {
    const s = withBuilding(kingRun('clock', 5), 6, 'wheat_militia', 1);
    const setup = buildBattleSetup(s, CONTENT);
    expect(setup.structures.find((x) => x.plot === 6)!.spawn!.stats.behaviours).toContainEqual({
      type: 'rampAttackSpeed',
      pctPerSecond: 1,
      cap: 40,
    });
    expect(setup.throne.rampAs ?? null).toBeNull();
  });

  it('is deterministic in a real battle', () => {
    let s = withBuilding(kingRun('clock', 2), 7, 'neutral_archer_tower', 1);
    s = withBuilding(s, 6, 'wheat_militia', 1);
    expectDeterministic(buildBattleSetup(s, CONTENT));
  });
});

describe('tide_spoils (Chiến Lợi Phẩm)', () => {
  /** 47 địch chết ngay khi xuất hiện, không cờ hiệu. */
  const slaughter = (throneLevel: Level): BattleSetup => {
    const setup = buildBattleSetup(kingRun('tide', throneLevel), CONTENT);
    delete setup.banner;
    return {
      ...setup,
      waves: [{ spawnTick: 0, spawns: Array.from({ length: 47 }, () => ({ stats: unitStats({ hp: 0 }), edge: 'S' as const })) }],
    };
  };

  it('47 kills pay +3 gold at throne level 1 (capped) and +4 at throne level 5', () => {
    const l1 = expectDeterministic(slaughter(1));
    expect(l1.kills).toBe(47);
    expect(l1.goldDelta).toBe(3);
    expect(expectDeterministic(slaughter(5)).goldDelta).toBe(4);
  });

  it('pays nothing under 10 kills', () => {
    const setup = slaughter(5);
    const r = expectDeterministic({ ...setup, waves: [{ ...setup.waves[0]!, spawns: setup.waves[0]!.spawns.slice(0, 9) }] });
    expect(r.goldDelta ?? 0).toBe(0);
  });

  it('is deterministic in a real battle', () => {
    expectDeterministic(buildBattleSetup(withBuilding(kingRun('tide', 3), 6, 'wheat_militia', 1), CONTENT));
  });
});

describe('moon_soul_harvest (Thu Hồn)', () => {
  const wraithsAtThrone = (w: BattleWorld): number =>
    [...Array(w.count).keys()].filter(
      (i) => w.alive[i] === 1 && w.team[i] === TEAM_ALLY && w.label[i] === 'wraith' && w.sourceUid[i] === w.setup.throne.uid,
    ).length;
  /** `deaths` lính mình chết cùng một tick trong trận yên tĩnh. */
  const afterDeaths = (throneLevel: Level, deaths: number): BattleWorld => {
    const w = createBattle(quiet(buildBattleSetup(kingRun('moon', throneLevel), CONTENT)));
    for (let k = 0; k < deaths; k++) {
      const id = addUnit(w, unitStats({ hp: 1 }), TEAM_ALLY, 300, 300, 300, 300, -1);
      w.hp[id] = 0;
    }
    stepBattle(w, []);
    return w;
  };

  it('13 deaths raise exactly 2 wraiths at the throne at throne level 1', () => {
    expect(afterDeaths(1, 13).souls[TEAM_ALLY]).toBe(13);
    expect(wraithsAtThrone(afterDeaths(1, 13))).toBe(2);
  });

  it('every 4 souls at throne level 5, never more than 20 per battle', () => {
    expect(wraithsAtThrone(afterDeaths(5, 8))).toBe(2);
    expect(wraithsAtThrone(afterDeaths(5, 100))).toBe(20);
  });

  it('wraiths are summons built at the throne level', () => {
    const setup = buildBattleSetup(kingRun('moon', 3), CONTENT);
    expect(setup.throne.soulSummon).toMatchObject({ every: 5, max: 20 });
    expect(setup.throne.soulSummon!.stats.unit).toBe('wraith');
    expect(setup.throne.soulSummon!.stats.tags).toContain('summon');
  });

  it('other kings have no soul harvest', () => {
    expect(buildBattleSetup(kingRun('wheat', 5), CONTENT).throne.soulSummon ?? null).toBeNull();
  });

  it('is deterministic in a real battle', () => {
    let s = withBuilding(kingRun('moon', 5), 6, 'moon_crypt', 2);
    s = withBuilding(s, 7, 'wheat_militia', 2);
    expectDeterministic(buildBattleSetup(s, CONTENT));
  });
});
