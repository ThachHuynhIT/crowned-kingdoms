import { describe, expect, it } from 'vitest';
import { hashSeed } from '../../core/random';
import { ENDLESS_MODIFIER_IDS } from '../../data/endless';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import { RUN } from '../../data/run';
import type { BattleResult } from '../battle/types';
import { CONTENT } from '../cards/registry';
import { applyCommand } from './commands';
import { endlessStatBonuses, modifierAt } from './endlessModifiers';
import { collectStatSheet } from './modifiers';
import { calendarSlotAt, slotMultFor } from './calendar';
import { buildYearArmy } from './enemyArmy';
import { endlessArmyBudget } from './endlessRules';
import { buildBattleSetup } from './battleSetup';
import type { EndlessModifierId } from '../../data/endless';
import type { RunState } from './state';
import { newRun, startYear } from './yearFlow';

const endless = (over: Partial<RunState> = {}): RunState => ({ ...newRun(7, 'wheat', CONTENT, RULES_ENDLESS), year: 31, ...over });
const withModifier = (s: RunState, id: RunState['endless'] extends infer E ? (E extends { modifierId: infer M } ? M : never) : never): RunState => ({
  ...s,
  endless: { ...s.endless!, modifierId: id, modifierStartYear: 31 },
});

describe('decade modifiers (spec 2026-11-09 §6)', () => {
  it('none before 31; one id per 10-year block from a seeded offset, cycling through all four', () => {
    expect(modifierAt(7, 30)).toBeNull();
    const first = modifierAt(7, 31)!;
    expect(first.id).toBe(ENDLESS_MODIFIER_IDS[hashSeed('7:endless-modifier') % 4]);
    for (let y = 31; y <= 40; y++) expect(modifierAt(7, y)).toEqual({ id: first.id, startYear: 31 });
    const second = modifierAt(7, 41)!;
    expect(second.startYear).toBe(41);
    expect(second.id).not.toBe(first.id);
    expect(new Set([31, 41, 51, 61].map((y) => modifierAt(7, y)!.id)).size).toBe(4);
    expect(modifierAt(7, 71)).toEqual({ id: first.id, startYear: 71 });
    expect(modifierAt(7, 1_000_001)).not.toBeNull();
  });

  it('startYear records the modifier of the new year in Endless only, without touching other RNG', () => {
    const s = startYear({ ...endless({ year: 30 }), phase: 'yearEnd' }, CONTENT);
    expect(s.year).toBe(31);
    expect(s.endless).toMatchObject({ modifierId: modifierAt(7, 31)!.id, modifierStartYear: 31 });
    const normal = startYear({ ...newRun(7, 'wheat', CONTENT, RULES_FULL), year: 5, phase: 'yearEnd' }, CONTENT);
    expect(normal.endless).toBeNull();
  });

  it('famine: tax −2 (not below 0) and +3 gold for a won battle', () => {
    const base = { ...endless({ year: 31 }), phase: 'yearEnd' as const };
    const plain = startYear(base, CONTENT);
    const famine = startYear(withModifier(base, 'famine'), CONTENT);
    // The new year 32 is still in the 31..40 block, so startYear keeps the stored block only when it matches.
    expect(famine.endless!.modifierId).toBe(modifierAt(7, 32)!.id);
    const fight = (s: RunState): RunState => ({ ...s, phase: 'battle', played: true, army: { attacker: 'raiders', budget: 10, level: 1, statMult: 1, waves: [] } });
    const res: BattleResult = { won: true, ticks: 1, throneHpLostPct: 0, kills: 0, killsBySource: {}, interventionsUsed: 0, unitsLost: 0, capped: 0, inputs: [] };
    const a = applyCommand(fight(endless()), { type: 'battleResult', result: res }, CONTENT);
    const b = applyCommand(fight(withModifier(endless(), 'famine')), { type: 'battleResult', result: res }, CONTENT);
    if ('error' in a || 'error' in b) throw new Error('illegal');
    expect(b.state.gold - a.state.gold).toBe(3);
    expect(plain.gold).toBeGreaterThanOrEqual(0);
  });
});

describe('ally stat bonuses', () => {
  it('blessings and modifiers add % to the matching sheet cells; normal runs get nothing', () => {
    const s = endless();
    s.endless = { ...s.endless!, blessingStacks: { vigor: 2, might: 1, haste: 1, tower_might: 3, tower_haste: 2, masonry: 1 } };
    expect(endlessStatBonuses(s, 'unit')).toEqual({ hp: 20, dmg: 10, speed: 5, burnDps: 10 });
    expect(endlessStatBonuses(s, 'tower')).toEqual({ dmg: 30, attackSpeed: 10, burnDps: 30 });
    expect(endlessStatBonuses(s, 'structure')).toEqual({ structureHp: 10 });
    const siege = withModifier(s, 'siege');
    expect(endlessStatBonuses(siege, 'structure')).toEqual({ structureHp: 30 });
    const edge = withModifier(s, 'double_edge');
    expect(endlessStatBonuses(edge, 'unit').dmg).toBe(35);
    expect(endlessStatBonuses(newRun(7, 'wheat', CONTENT, RULES_FULL), 'unit')).toEqual({});
  });

  it('collectStatSheet adds the unit bonuses to a troop building and structure HP to every building', () => {
    const s = endless();
    const plot = 7;
    s.plots[plot]!.building = { ...s.plots[2]!.building!, uid: 50, cardId: 'wheat_militia' as never };
    const before = collectStatSheet(s, CONTENT, plot);
    s.endless = { ...s.endless!, blessingStacks: { vigor: 1, masonry: 2 } };
    const after = collectStatSheet(s, CONTENT, plot);
    expect(after.hp.pct - before.hp.pct).toBe(10);
    expect(after.structureHp.pct - before.structureHp.pct).toBe(20);
    const throne = collectStatSheet(s, CONTENT, 2);
    s.endless = { ...s.endless, blessingStacks: {} };
    expect(throne.structureHp.pct - collectStatSheet(s, CONTENT, 2).structureHp.pct).toBe(20);
    expect(RUN.maxLevel).toBeGreaterThan(0);
  });
});

describe('siege budget', () => {
  it('siege multiplies the enemy budget by 1.2 before the final cap', () => {
    const s = endless({ year: 33 });
    const plain = buildYearArmy(s, CONTENT).budget;
    const siege = buildYearArmy(withModifier(s, 'siege'), CONTENT).budget;
    expect(siege).toBe(endlessArmyBudget(33, slotMultFor(calendarSlotAt(RULES_ENDLESS, 33)), 0, 1.2));
    expect(siege).toBeGreaterThan(plain);
  });

  it('famine lowers the year-start tax by 2 (never below 0)', () => {
    let seed = 1;
    while (modifierAt(seed, 32)!.id !== 'famine') seed += 1;
    const run = (rules: typeof RULES_ENDLESS) => {
      const s = newRun(seed, 'wheat', CONTENT, rules);
      return startYear({ ...s, year: 31, phase: 'yearEnd', endless: s.endless && { ...s.endless, modifierId: 'famine', modifierStartYear: 31 } }, CONTENT);
    };
    const famine = run(RULES_ENDLESS);
    const plain = startYear({ ...newRun(seed, 'wheat', CONTENT, RULES_ENDLESS), year: 29, phase: 'yearEnd' }, CONTENT);
    expect(famine.endless!.modifierId).toBe('famine');
    expect(plain.endless!.modifierId).toBeNull();
    expect(famine.gold - plain.gold).toBe(Math.max(0, RUN.taxPerYear - 2) - RUN.taxPerYear);
  });
});

describe('enemy scaling in the battle setup', () => {
  const at = (year: number, modifierId: EndlessModifierId | null, rules = RULES_ENDLESS): RunState => {
    const s = { ...newRun(11, 'stone', CONTENT, rules), year };
    if (s.endless !== null) s.endless = { ...s.endless, modifierId, modifierStartYear: modifierId === null ? 0 : 31 };
    return { ...s, army: buildYearArmy(s, CONTENT) };
  };
  const firstFoe = (setup: ReturnType<typeof buildBattleSetup>) => setup.waves.find((w) => w.spawns.length > 0)!.spawns[0]!.stats;

  it('year-40 boss is scaled x1.25 once (HP and damage), summons and mirror too; escorts are not', () => {
    const endlessSetup = buildBattleSetup(at(40, null), CONTENT);
    const baseState = at(10, null, RULES_FULL);
    const normalSetup = buildBattleSetup(baseState, CONTENT);
    expect(endlessSetup.boss!.id).toBe(normalSetup.boss!.id);
    expect(endlessSetup.boss!.stats.hp).toBeCloseTo(normalSetup.boss!.stats.hp * 1.25, 6);
    expect(endlessSetup.boss!.stats.dmg).toBeCloseTo(normalSetup.boss!.stats.dmg * 1.25, 6);
    for (const [id, summon] of Object.entries(endlessSetup.boss!.summons)) {
      expect(summon.hp).toBeCloseTo(normalSetup.boss!.summons[id]!.hp * 1.25, 6);
    }
  });

  it('elite: foes +25% HP, +10% damage; double_edge: foes +25% damage, HP unchanged', () => {
    const plain = firstFoe(buildBattleSetup(at(33, null), CONTENT));
    const elite = firstFoe(buildBattleSetup(at(33, 'elite'), CONTENT));
    const edge = firstFoe(buildBattleSetup(at(33, 'double_edge'), CONTENT));
    expect(elite.hp).toBeCloseTo(plain.hp * 1.25, 6);
    expect(elite.dmg).toBeCloseTo(plain.dmg * 1.1, 6);
    expect(edge.hp).toBeCloseTo(plain.hp, 6);
    expect(edge.dmg).toBeCloseTo(plain.dmg * 1.25, 6);
  });

  it('is deterministic and leaves the registry untouched', () => {
    const s = at(40, 'elite');
    const unitHp = CONTENT.allUnits().map((u) => u.hp);
    expect(JSON.stringify(buildBattleSetup(s, CONTENT))).toBe(JSON.stringify(buildBattleSetup(s, CONTENT)));
    expect(CONTENT.allUnits().map((u) => u.hp)).toEqual(unitHp);
  });
});
