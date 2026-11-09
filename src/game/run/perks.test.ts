import { describe, expect, it } from 'vitest';
import { INTERVENTION } from '../../data/battle';
import { RULES_FULL } from '../../data/rules';
import { RUN, battleGold, rerollCost } from '../../data/run';
import type { CardId, KingDef, KingId, PerkId } from '../../data/types';
import { hashWorld } from '../battle/hash';
import { battleResult, simulateBattle, stepBattle } from '../battle/step';
import { addDot, tickStatuses } from '../battle/statuses';
import type { BattleResult, BattleSetup } from '../battle/types';
import { TEAM_FOE, addUnit, createBattle } from '../battle/world';
import { freeMovesAllowed } from '../cards/custom/nomad';
import { CONTENT } from '../cards/registry';
import { encodeRun, decodeRun } from '../save/codec';
import { battleSetup as fixtureSetup, contentWith, throneSetup, unitStats, withBuilding } from '../testing/fixtures';
import { buildBattleSetup } from './battleSetup';
import { THRONE_PLOT } from './board';
import { applyCommand } from './commands';
import { collectStatSheet } from './modifiers';
import { perkBattleMods } from './perks';
import type { IllegalReason, RunCommand, RunState } from './state';
import { newRun, startYear } from './yearFlow';

const run = (king: KingId, perk: PerkId | null = null, seed = 7): RunState =>
  newRun(seed, king, CONTENT, RULES_FULL, { perk });

const planning = (s: RunState, over: Partial<RunState> = {}): RunState => ({ ...s, phase: 'planning', played: false, ...over });
const setupOf = (s: RunState): BattleSetup => buildBattleSetup(s, CONTENT);

const ok = (s: RunState, cmd: RunCommand): RunState => {
  const r = applyCommand(s, cmd, CONTENT);
  if ('error' in r) throw new Error(r.error);
  return r.state;
};
const errorOf = (s: RunState, cmd: RunCommand): IllegalReason => {
  const r = applyCommand(s, cmd, CONTENT);
  if (!('error' in r)) throw new Error('expected an error');
  return r.error;
};

/** Plays the battle to the end and returns the final world hash. */
const finalHash = (setup: BattleSetup): number => {
  const w = createBattle(setup);
  for (let i = 0; i < 2000 && battleResult(w) === null; i++) stepBattle(w, []);
  return hashWorld(w);
};

const loss = (): BattleResult => ({
  won: false,
  ticks: 300,
  throneHpLostPct: 100,
  kills: 0,
  killsBySource: {},
  interventionsUsed: 0,
  unitsLost: 0,
  capped: 0,
  inputs: [],
});

describe('newRun perk validation', () => {
  it("rejects another king's perk and a perk the king does not list", () => {
    expect(() => run('wheat', 'stone_p1')).toThrow();
    expect(() => run('wheat', 'wheat_p9' as PerkId)).toThrow();
    const wheat = CONTENT.king('wheat');
    const twoPerks = { ...wheat, perks: [wheat.perks[0], wheat.perks[1], wheat.perks[1]] } as unknown as KingDef;
    const content = contentWith({ kings: [twoPerks] });
    expect(() => newRun(7, 'wheat', content, RULES_FULL, { perk: 'wheat_p3' })).toThrow();
    expect(newRun(7, 'wheat', content, RULES_FULL, { perk: 'wheat_p2' }).perk).toBe('wheat_p2');
  });

  it('the save codec only accepts a perk listed by the run king in the content', () => {
    const s = run('wheat', 'wheat_p3');
    expect(decodeRun(encodeRun(s, CONTENT), CONTENT).kind).toBe('ok');
    const wheat = CONTENT.king('wheat');
    const twoPerks = { ...wheat, perks: [wheat.perks[0], wheat.perks[1], wheat.perks[1]] } as unknown as KingDef;
    const content = contentWith({ kings: [twoPerks] });
    expect(decodeRun(encodeRun(s, CONTENT), content).kind).toBe('incompatible');
  });

  it('a run without a perk is unchanged by the perk system', () => {
    const s = run('wheat');
    expect(s.perk).toBeNull();
    expect(setupOf(s).perk).toBeUndefined();
  });
});

describe('wheat perks', () => {
  it("'wheat_p1' Hạt Giống Tốt: a level-1 Ruộng Lúa on plot 7 placed in year 1", () => {
    const s = run('wheat', 'wheat_p1');
    expect(s.plots[7]!.building).toMatchObject({ cardId: 'wheat_field', level: 1, placedYear: 1, enchants: [], ageBonus: 0 });
    expect(s.plots[7]!.building!.uid).not.toBe(s.plots[THRONE_PLOT]!.building!.uid);
    expect(s.nextUid).toBeGreaterThan(s.plots[7]!.building!.uid);
    expect(run('wheat').plots[7]!.building).toBeNull();
  });

  it("'wheat_p2' Thuế Nhẹ: the first reroll of each year is free, then rerollCost(1); stacks with the guild", () => {
    let s = planning(run('wheat', 'wheat_p2'), { gold: 100 });
    expect(s.year).toBe(1);
    expect(s.freeRerollsLeft).toBe(1);
    let next = ok(s, { type: 'reroll' });
    expect(s.gold - next.gold).toBe(0);
    s = next;
    next = ok(s, { type: 'reroll' });
    expect(s.gold - next.gold).toBe(rerollCost(1));
    expect(rerollCost(1)).toBe(1);
    s = startYear(next, CONTENT);
    expect(s.year).toBe(2);
    expect(s.freeRerollsLeft).toBe(1);
    const guild = startYear({ ...next, decrees: ['decree_merchant_guild'] }, CONTENT);
    expect(guild.freeRerollsLeft).toBe(2);
    expect(startYear({ ...run('wheat'), decrees: ['decree_merchant_guild'] }, CONTENT).freeRerollsLeft).toBe(1);
  });

  it("'wheat_p3' Toàn Dân Cầm Giáo: militia and peasant +10 HP, +1 DMG flat before percentages", () => {
    const militia = (perk: PerkId | null) =>
      setupOf(withBuilding(run('wheat', perk), 8, 'wheat_militia', 1)).structures.find((x) => x.plot === 8)!.spawn!.stats;
    expect(militia(null)).toMatchObject({ hp: 32, dmg: 5 });
    expect(militia('wheat_p3')).toMatchObject({ hp: 42, dmg: 6 });
    const s = withBuilding(run('wheat', 'wheat_p3'), 8, 'wheat_militia', 1);
    const peasant = collectStatSheet(s, CONTENT, 8, CONTENT.unit('peasant'));
    expect(peasant.hp.flat).toBe(10);
    expect(peasant.dmg.flat).toBe(1);
    // A tower (no unit) and other units do not get it.
    expect(collectStatSheet(s, CONTENT, 8).dmg.flat).toBe(0);
    expect(collectStatSheet(s, CONTENT, 8, CONTENT.unit('mercenary')).hp.flat).toBe(0);
  });
});

describe('stone perks', () => {
  it("'stone_p1' Nền Móng Vững: throne +200 HP flat (140 → 340)", () => {
    expect(setupOf(run('stone')).throne.hp).toBe(140);
    expect(setupOf(run('stone', 'stone_p1')).throne.hp).toBe(340);
  });

  it("'stone_p2' Đá Gọi Đá: a level-1 Tháp Ném Đá on plot 7", () => {
    expect(run('stone', 'stone_p2').plots[7]!.building).toMatchObject({ cardId: 'stone_catapult', level: 1, placedYear: 1 });
  });

  it("'stone_p3' Tường Không Đổ: every building +30% HP", () => {
    const hp = (perk: PerkId | null, plot: number) => {
      const setup = setupOf(withBuilding(run('stone', perk), 8, 'wheat_militia', 1));
      return plot === THRONE_PLOT ? setup.throne.hp : setup.structures.find((x) => x.plot === plot)!.hp;
    };
    expect(hp('stone_p3', 8)).toBeCloseTo(hp(null, 8) * 1.3);
    expect(hp('stone_p3', THRONE_PLOT)).toBeCloseTo(140 * 1.3);
  });
});

describe('arcane perks', () => {
  const withStacks = (perk: PerkId | null, stacks: number): RunState => {
    // A second building with room keeps the rune playable, so a full throne answers 'stacksFull'.
    const s = withBuilding(run('arcane', perk), 8, 'wheat_militia', 1);
    const plots = structuredClone(s.plots);
    plots[THRONE_PLOT]!.building!.enchants = [{ cardId: 'arcane_spark_rune', stacks }];
    return planning(s, { plots, hand: ['arcane_spark_rune' as CardId] });
  };
  const rune: RunCommand = { type: 'play', handIndex: 0, target: { kind: 'plot', plot: THRONE_PLOT } };

  it("'arcane_p1' Sách Phép Dày: up to 6 enchant stacks per building, the 7th is stacksFull", () => {
    expect(errorOf(withStacks(null, 4), rune)).toBe('stacksFull');
    const fifth = ok(withStacks('arcane_p1', 4), rune);
    expect(fifth.plots[THRONE_PLOT]!.building!.enchants[0]!.stacks).toBe(5);
    const sixth = ok(withStacks('arcane_p1', 5), rune);
    expect(sixth.plots[THRONE_PLOT]!.building!.enchants[0]!.stacks).toBe(6);
    expect(errorOf(withStacks('arcane_p1', 6), rune)).toBe('stacksFull');
    // The save keeps 6 stacks only for that perk.
    const saved = run('arcane', 'arcane_p1');
    saved.plots = structuredClone(saved.plots);
    saved.plots[THRONE_PLOT]!.building!.enchants = [{ cardId: 'arcane_spark_rune', stacks: 6 }];
    expect(decodeRun(encodeRun(saved, CONTENT), CONTENT).kind).toBe('ok');
    expect(decodeRun(encodeRun({ ...saved, perk: null }, CONTENT), CONTENT).kind).toBe('incompatible');
  });

  it("'arcane_p2' Bùa Đầu Mùa: the throne starts with 1 stack of Bùa Tia Lửa", () => {
    expect(run('arcane', 'arcane_p2').plots[THRONE_PLOT]!.building!.enchants).toEqual([
      { cardId: 'arcane_spark_rune', stacks: 1 },
    ]);
    expect(run('arcane').plots[THRONE_PLOT]!.building!.enchants).toEqual([]);
  });

  it("'arcane_p3' Ma Lực Dồi Dào: intervention cooldown −30%, adding to Phản Xạ Nhanh under the same cap", () => {
    expect(setupOf(run('arcane')).intervention).toBeUndefined();
    expect(setupOf(run('arcane', 'arcane_p3')).intervention!.cooldownTicks).toBe(Math.floor((INTERVENTION.cooldownTicks * 70) / 100));
    const both = setupOf({ ...run('arcane', 'arcane_p3'), decrees: ['decree_quick_reflex'] });
    expect(both.intervention!.cooldownTicks).toBe(Math.floor((INTERVENTION.cooldownTicks * 40) / 100));
  });
});

describe('grove perks', () => {
  it("'grove_p1' Rễ Từ Trước: newly placed grove buildings get ageBonus 2, others 0", () => {
    const base = planning(run('grove', 'grove_p1'), { hand: ['grove_wolf_den' as CardId] });
    const play: RunCommand = { type: 'play', handIndex: 0, target: { kind: 'plot', plot: 8 } };
    expect(ok(base, play).plots[8]!.building!.ageBonus).toBe(2);
    expect(ok({ ...base, hand: ['wheat_militia' as CardId] }, play).plots[8]!.building!.ageBonus).toBe(0);
    expect(ok({ ...base, perk: null }, play).plots[8]!.building!.ageBonus).toBe(0);
  });

  it("'grove_p2' Sói Đầu Đàn: Hang Sói +1 wolf at every level (level 2: 5)", () => {
    const count = (perk: PerkId | null, level: 1 | 2 | 5) =>
      setupOf(withBuilding(run('grove', perk), 8, 'grove_wolf_den', level)).structures.find((x) => x.plot === 8)!.spawn!.count;
    expect(count(null, 2)).toBe(4);
    expect(count('grove_p2', 1)).toBe(4);
    expect(count('grove_p2', 2)).toBe(5);
    expect(count('grove_p2', 5)).toBe(8);
  });

  it("'grove_p3' Đất Lành: the throne heals 1% of max HP every second in battle", () => {
    expect(perkBattleMods(run('grove', 'grove_p3'), CONTENT)).toEqual({ throneRegenPct: 1 });
    expect(setupOf(run('grove', 'grove_p3')).perk).toEqual({ throneRegenPct: 1 });
    const w = createBattle(fixtureSetup({ throne: throneSetup({ attack: null, hp: 300 }), perk: { throneRegenPct: 1 } }));
    w.hp[w.throneId] = 100;
    w.tick = 10;
    tickStatuses(w);
    expect(w.hp[w.throneId]).toBeCloseTo(103);
    w.tick = 11;
    tickStatuses(w);
    expect(w.hp[w.throneId]).toBeCloseTo(103);
  });
});

describe('tide perks', () => {
  it("'tide_p1' Túi Đầy: +5 starting gold", () => {
    expect(run('tide', 'tide_p1').gold - run('tide').gold).toBe(5);
  });

  it("'tide_p2' Gió Thuận: every knockback +50% (Coral Throne 16 → 24)", () => {
    const kb = (perk: PerkId | null) => setupOf(run('tide', perk)).throne.attack!.onHit!.find((h) => h.type === 'knockback');
    expect(kb(null)).toEqual({ type: 'knockback', px: 16 });
    expect(kb('tide_p2')).toEqual({ type: 'knockback', px: 24 });
  });

  it("'tide_p3' Chuộc Tù: a lost battle still pays floor(battleGold(year) / 2)", () => {
    const lose = (perk: PerkId | null) => ok({ ...run('tide', perk), year: 10, phase: 'battle', gold: 0 }, { type: 'battleResult', result: loss() });
    expect(battleGold(10)).toBe(6);
    expect(lose('tide_p3').gold - lose(null).gold).toBe(3);
    expect(lose(null).gold).toBe(0);
  });
});

describe('forge perks', () => {
  it("'forge_p1' Than Hồng: every burn +30% (2/s → 2.6/s, 6 → 7.8 over 30 ticks)", () => {
    const burnOf = (perk: PerkId | null) => {
      const h = setupOf(run('forge', perk)).throne.attack!.onHit!.find((x) => x.type === 'burn');
      if (h === undefined || h.type !== 'burn') throw new Error('no burn');
      return h;
    };
    expect(burnOf(null).dps).toBe(2);
    expect(burnOf('forge_p1').dps).toBeCloseTo(2.6);
    const total = (dps: number, ticks: number): number => {
      const w = createBattle(fixtureSetup({ throne: throneSetup({ attack: null }) }));
      const v = addUnit(w, unitStats({ hp: 100, dmg: 0, interval: 0, speed: 0 }), TEAM_FOE, 40, 20, 40, 20, -1);
      addDot(w, v, 'burn', 1, dps, ticks, 0);
      for (w.tick = 1; w.tick <= 30; w.tick++) tickStatuses(w);
      return 100 - w.hp[v]!;
    };
    expect(total(burnOf(null).dps, burnOf(null).ticks)).toBeCloseTo(6);
    expect(total(burnOf('forge_p1').dps, burnOf('forge_p1').ticks)).toBeCloseTo(7.8);
  });

  it("'forge_p2' Học Việc: a level-1 Lò Rèn on plot 7", () => {
    expect(run('forge', 'forge_p2').plots[7]!.building).toMatchObject({ cardId: 'forge_smithy', level: 1, placedYear: 1 });
  });

  it("'forge_p3' Thép Tốt: every unit +0.1 armor, buildings unchanged", () => {
    const setup = (perk: PerkId | null) => setupOf(withBuilding(run('forge', perk), 8, 'wheat_militia', 1));
    const armor = (perk: PerkId | null) => setup(perk).structures.find((x) => x.plot === 8)!.spawn!.stats.armor;
    expect(armor('forge_p3')).toBeCloseTo(armor(null) + 0.1);
    expect(setup('forge_p3').throne.armor).toBe(setup(null).throne.armor);
    expect(setup('forge_p3').structures.find((x) => x.plot === 8)!.armor).toBe(0);
  });
});

describe('clock perks', () => {
  it("'clock_p1' Dây Cót Căng: every ramp is pre-wound 5 s", () => {
    const setup = setupOf(withBuilding(run('clock', 'clock_p1'), 8, 'wheat_militia', 1));
    expect(setup.throne.prewind).toBe(5);
    expect(setup.structures.find((x) => x.plot === 8)!.spawn!.stats.prewind).toBe(5);
    expect(setupOf(run('clock')).throne.prewind).toBeUndefined();
  });

  it("'clock_p2' Bánh Răng Dự Phòng: a level-1 Tháp Bánh Răng on plot 7", () => {
    expect(run('clock', 'clock_p2').plots[7]!.building).toMatchObject({ cardId: 'clock_gear_tower', level: 1, placedYear: 1 });
  });

  it("'clock_p3' Giờ Vàng: rage and the hard limit come 150 ticks later (900 → 1050)", () => {
    expect(perkBattleMods(run('clock', 'clock_p3'), CONTENT)).toEqual({ rageTick: 750, hardLimitTick: 1050 });
    // A foe that never dies and never hurts the throne: the battle runs to the hard limit.
    const immortal = (perk: BattleSetup['perk']) =>
      fixtureSetup({
        throne: throneSetup({ attack: null }),
        waves: [{ spawnTick: 0, spawns: [{ stats: unitStats({ hp: 1e9, dmg: 0, speed: 0 }), edge: 'S' }], formationRows: 1 }],
        ...(perk ? { perk } : {}),
      });
    expect(simulateBattle(immortal(undefined)).ticks).toBe(900);
    expect(simulateBattle(immortal({ rageTick: 750, hardLimitTick: 1050 })).ticks).toBe(1050);
    const raged = createBattle(immortal({ rageTick: 750, hardLimitTick: 1050 }));
    const seen: number[] = [];
    for (let i = 0; i < 800; i++) {
      stepBattle(raged, []);
      if (raged.events.some((e) => e.type === 'rage')) seen.push(raged.tick - 1);
      raged.events.length = 0;
    }
    expect(seen).toEqual([750]);
  });
});

describe('moon perks', () => {
  it("'moon_p1' Hồn Đói: Thu Hồn needs 2 fewer souls (level 1: 6 → 4)", () => {
    expect(setupOf(run('moon')).throne.soulSummon!.every).toBe(6);
    expect(setupOf(run('moon', 'moon_p1')).throne.soulSummon!.every).toBe(4);
  });

  it("'moon_p2' Trăng Non: one extra Khế Ước Máu in the starting deck", () => {
    const count = (s: RunState) => s.deck.filter((id) => id === 'moon_blood_pact').length;
    expect(count(run('moon', 'moon_p2'))).toBe(count(run('moon')) + 1);
    const s = run('moon', 'moon_p2');
    expect([...s.hand, ...s.drawPile, ...s.discardPile].sort()).toEqual([...s.deck].sort());
  });

  it("'moon_p3' Mạng Thứ Tư: start with RUN.maxLives lives, throne −20% HP (560 → 448)", () => {
    const s = run('moon', 'moon_p3');
    expect(s.lives).toBe(RUN.maxLives);
    expect(s.lives).toBe(4);
    expect(setupOf(s).throne.hp).toBeCloseTo(448);
    expect(run('moon').lives).toBe(RUN.startLives);
  });
});

describe('nomad perks', () => {
  it("'nomad_p1' Vó Ngựa: cavalry +10% speed and +10% DMG", () => {
    const rider = (perk: PerkId | null) =>
      setupOf(withBuilding(run('nomad', perk), 8, 'nomad_riders', 1)).structures.find((x) => x.plot === 8)!.spawn!.stats;
    expect(rider('nomad_p1').speed).toBeCloseTo(rider(null).speed * 1.1);
    expect(rider('nomad_p1').dmg).toBeCloseTo(rider(null).dmg * 1.1);
    const militia = (perk: PerkId | null) =>
      setupOf(withBuilding(run('nomad', perk), 8, 'wheat_militia', 1)).structures.find((x) => x.plot === 8)!.spawn!.stats;
    expect(militia('nomad_p1').speed).toBe(militia(null).speed);
  });

  it("'nomad_p2' Thảo Nguyên Rộng: plots 10 and 14 start unlocked", () => {
    const s = run('nomad', 'nomad_p2');
    expect(s.plots[10]!.unlocked).toBe(true);
    expect(s.plots[14]!.unlocked).toBe(true);
    expect(s.purchasedPlots).toBe(0);
    expect(run('nomad').plots[10]!.unlocked).toBe(false);
    expect(run('nomad').plots[14]!.unlocked).toBe(false);
  });

  it("'nomad_p3' Nhổ Trại Nhanh: Lều Di Động +1 free move a year (throne level 1: 2)", () => {
    expect(freeMovesAllowed(run('nomad'), CONTENT)).toBe(1);
    expect(freeMovesAllowed(run('nomad', 'nomad_p3'), CONTENT)).toBe(2);
  });
});

describe('perk battles are deterministic', () => {
  const all = CONTENT.kings().flatMap((k) => k.perks.map((p) => [k.id, p.id] as const));
  it.each(all)('%s %s: same setup, same final hash', (king, perk) => {
    const setup = setupOf(run(king, perk, 11));
    expect(finalHash(setup)).toBe(finalHash(structuredClone(setup)));
  });
});
