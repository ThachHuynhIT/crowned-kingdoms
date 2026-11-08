import { describe, expect, it } from 'vitest';
import { ENEMY_BUDGET, ENEMY_CAP } from '../../data/battle';
import { FULL_CALENDAR } from '../../data/calendar';
import {
  ENDLESS_BASE_BUDGET,
  ENDLESS_BASE_BUDGET_CAP,
  ENDLESS_BOSS_SCALE_BP,
  ENDLESS_BOSS_SCALE_CAP_BP,
  ENDLESS_FINAL_BUDGET_CAP,
} from '../../data/endless';
import { RULES_ENDLESS, RULES_FULL, RULES_G2 } from '../../data/rules';
import { RUN } from '../../data/run';
import { armyBudget, composeArmy } from '../battle/compose';
import { CONTENT } from '../cards/registry';
import { calendarFor, calendarSlotAt } from './calendar';
import { buildYearArmy } from './enemyArmy';
import { endlessArmyBudget, endlessBaseBudget, endlessBossScale } from './endlessRules';
import { newRun } from './yearFlow';

describe('calendarSlotAt (spec 2026-11-09 §3)', () => {
  it('normal calendars keep their slots', () => {
    for (const rules of [RULES_FULL, RULES_G2]) {
      calendarFor(rules).forEach((slot, i) => expect(calendarSlotAt(rules, i + 1)).toEqual(slot));
    }
  });

  it('endless repeats the 30-year template without reshuffling', () => {
    for (let y = 1; y <= 30; y++) expect(calendarSlotAt(RULES_ENDLESS, y)).toEqual(FULL_CALENDAR[y - 1]);
    expect(calendarSlotAt(RULES_ENDLESS, 31)).toEqual({ kind: 'raiders' });
    expect(calendarSlotAt(RULES_ENDLESS, 33)).toEqual({ kind: 'king', king: 1, attack: 1 });
    expect(calendarSlotAt(RULES_ENDLESS, 40)).toMatchObject({ kind: 'boss', boss: 'boss_bog_ogre', ordinal: 1 });
    expect(calendarSlotAt(RULES_ENDLESS, 50)).toMatchObject({ kind: 'boss', boss: 'boss_hornet_queen', ordinal: 2 });
    expect(calendarSlotAt(RULES_ENDLESS, 60)).toMatchObject({ kind: 'boss', boss: 'boss_crownless_king', ordinal: 3 });
    expect(calendarSlotAt(RULES_ENDLESS, 70)).toMatchObject({ kind: 'boss', boss: 'boss_bog_ogre', ordinal: 1 });
    expect(calendarSlotAt(RULES_ENDLESS, 1_000_000)).toEqual(FULL_CALENDAR[(1_000_000 - 1) % 30]);
  });

  it('the endless run keeps the same six enemy kings as the full calendar', () => {
    const full = newRun(4, 'wheat', CONTENT, RULES_FULL);
    const endless = newRun(4, 'wheat', CONTENT, RULES_ENDLESS);
    expect(endless.enemyKings).toEqual(full.enemyKings);
    expect(endless.rng.calendar).toBe(full.rng.calendar);
  });
});

describe('endless budgets', () => {
  it('base budget: years 1..30 are the shipped table, then the stored recurrence', () => {
    for (let y = 1; y <= 30; y++) expect(endlessBaseBudget(y)).toBe(ENEMY_BUDGET[y - 1]);
    expect(endlessBaseBudget(30)).toBe(691);
    expect(endlessBaseBudget(31)).toBe(795);
    expect(endlessBaseBudget(32)).toBe(914);
    let prev = 691;
    ENDLESS_BASE_BUDGET.forEach((b, i) => {
      expect(b).toBe(Math.min(ENDLESS_BASE_BUDGET_CAP, Math.floor((prev * 115 + 50) / 100)));
      if (i < ENDLESS_BASE_BUDGET.length - 1) expect(b).toBeLessThan(ENDLESS_BASE_BUDGET_CAP);
      prev = b;
    });
    expect(ENDLESS_BASE_BUDGET.at(-1)).toBe(ENDLESS_BASE_BUDGET_CAP);
    expect(endlessBaseBudget(1_000_000)).toBe(ENDLESS_BASE_BUDGET_CAP);
    expect(endlessBaseBudget(Number.MAX_SAFE_INTEGER)).toBe(ENDLESS_BASE_BUDGET_CAP);
  });

  it('final budget equals the normal budget for years 1..30 and never exceeds the final cap', () => {
    for (let y = 1; y <= 30; y++) {
      for (const d of [0, 3, 5]) expect(endlessArmyBudget(y, 1.2, d, 1)).toBe(armyBudget(y, 1.2, d));
    }
    for (const year of [100, 1_000_000]) {
      for (const slot of [0.8, 1.2, 2.0]) {
        for (const d of [0, RUN.difficultyLevels]) {
          const b = endlessArmyBudget(year, slot, d, 1.2);
          expect(Number.isFinite(b)).toBe(true);
          expect(b).toBeLessThanOrEqual(ENDLESS_FINAL_BUDGET_CAP);
        }
      }
    }
    expect(endlessArmyBudget(1_000_000, 2.0, 5, 1.2)).toBe(ENDLESS_FINAL_BUDGET_CAP);
  });

  it('a capped budget still composes at most ENEMY_CAP units with finite stats', () => {
    const roster = CONTENT.raiderRoster().map((r) => ({ unit: r.unit.id, weight: r.weight, enemyCost: r.unit.enemyCost }));
    const army = composeArmy(roster, ENDLESS_FINAL_BUDGET_CAP, 1_000_000, 1, { attacker: 'raiders' });
    expect(army.waves.flatMap((w) => w.units).length).toBeLessThanOrEqual(ENEMY_CAP);
    expect(JSON.stringify(army)).not.toMatch(/null|Infinity|NaN/);
  });

  it('boss scale: x1 up to 30, x1.25 per 30-year cycle, saturating at x10', () => {
    expect(endlessBossScale(30)).toBe(1);
    expect(endlessBossScale(31)).toBe(1.25);
    expect(endlessBossScale(40)).toBe(1.25);
    expect(endlessBossScale(70)).toBe(1.5625);
    expect(ENDLESS_BOSS_SCALE_BP.at(-1)).toBe(ENDLESS_BOSS_SCALE_CAP_BP);
    expect(endlessBossScale(1_000_000)).toBe(10);
  });

  it('buildYearArmy uses the endless slot and budget after year 30', () => {
    const s = newRun(2, 'stone', CONTENT, RULES_ENDLESS);
    s.year = 40;
    const army = buildYearArmy(s, CONTENT);
    expect(army.attacker).toBe('boss');
    expect(army.boss).toBe('boss_bog_ogre');
    s.year = 31;
    expect(buildYearArmy(s, CONTENT).attacker).toBe('raiders');
  });
});
