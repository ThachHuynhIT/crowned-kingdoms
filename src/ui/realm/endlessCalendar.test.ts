import { describe, expect, it } from 'vitest';
import { FULL_CALENDAR } from '../../data/calendar';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import type { KingId } from '../../data/types';
import { modifierAt } from '../../game/run/endlessModifiers';
import { CALENDAR_PAGE_YEARS, calendarCells, calendarPage, calendarPageCount, calendarPageOf, fullCalendar, yearLabel } from './calendarModel';

const KINGS: KingId[] = ['stone', 'arcane'];
const at = (year: number, rules = RULES_ENDLESS) => ({ year, rules, enemyKings: KINGS, enemies: {}, seed: 7 });

describe('calendarPage (Endless, spec 2026-11-09 §7)', () => {
  it('pages hold 30 years: year 31 is on page 1 (31..60), year 61 on page 2 (61..90)', () => {
    expect(CALENDAR_PAGE_YEARS).toBe(30);
    expect(calendarPageOf(1)).toBe(0);
    expect(calendarPageOf(30)).toBe(0);
    expect(calendarPageOf(31)).toBe(1);
    expect(calendarPageOf(60)).toBe(1);
    expect(calendarPageOf(61)).toBe(2);
    expect(calendarPage(at(31), 1).map((c) => c.year)).toEqual(Array.from({ length: 30 }, (_, i) => 31 + i));
    expect(calendarPage(at(61), 2)[0]!.year).toBe(61);
    expect(calendarPage(at(61), 2)[29]!.year).toBe(90);
  });

  it('marks only the current year current; a future page always has 30 cells', () => {
    const page = calendarPage(at(31), 1);
    expect(page.filter((c) => c.current).map((c) => c.year)).toEqual([31]);
    expect(calendarPage(at(31), 5)).toHaveLength(30);
    expect(calendarPage(at(31), 5).some((c) => c.current)).toBe(false);
  });

  it('repeats the 30-year pattern by year (31 raiders like 1, 40 like 10, …) without re-shuffling kings', () => {
    const page = calendarPage(at(31), 1);
    const first = fullCalendar(RULES_FULL, KINGS);
    page.forEach((c, i) => {
      expect(c.attacker).toBe(first[i]!.attacker);
      expect(c.attack).toBe(first[i]!.attack);
    });
    expect(FULL_CALENDAR).toHaveLength(30);
  });

  it('a far year does no work per elapsed year (year 1 000 000 is instant and bounded)', () => {
    const year = 1_000_000;
    const page = calendarPage(at(year), calendarPageOf(year));
    expect(page).toHaveLength(30);
    expect(page.some((c) => c.year === year && c.current)).toBe(true);
    expect(calendarPageCount(at(year))).toBe(calendarPageOf(year) + 2);
  });

  it('councils every 5 years, blessings from 30 every 5, modifiers from 31 by decade', () => {
    const page0 = calendarPage(at(12), 0);
    expect(page0.filter((c) => c.council).map((c) => c.year)).toEqual([5, 10, 15, 20, 25, 30]);
    expect(page0.filter((c) => c.blessing).map((c) => c.year)).toEqual([30]);
    expect(page0.every((c) => c.modifier === null)).toBe(true);
    const page1 = calendarPage(at(31), 1);
    expect(page1.filter((c) => c.blessing).map((c) => c.year)).toEqual([35, 40, 45, 50, 55, 60]);
    expect(page1.find((c) => c.year === 31)!.modifier).toEqual(modifierAt(7, 31));
    expect(page1.find((c) => c.year === 40)!.modifier).toEqual(modifierAt(7, 31));
    expect(page1.find((c) => c.year === 41)!.modifier).toEqual(modifierAt(7, 41));
    expect(page1.find((c) => c.year === 41)!.modifier!.startYear).toBe(41);
  });

  it('normal runs: one page of 30 cells, the old 6×5 content (no blessing / modifier fields)', () => {
    const normal = at(12, RULES_FULL);
    expect(calendarPageCount(normal)).toBe(1);
    const page = calendarPage(normal, 0);
    expect(page).toHaveLength(30);
    expect(page.map(({ current: _c, ...rest }) => rest)).toEqual(fullCalendar(RULES_FULL, KINGS).map(({ current: _c, ...rest }) => rest));
    expect(page.some((c) => 'blessing' in c || 'modifier' in c)).toBe(false);
    expect(page.filter((c) => c.council).map((c) => c.year)).toEqual(fullCalendar(RULES_FULL, KINGS).filter((c) => c.council).map((c) => c.year));
    expect(calendarPage(normal, 1)).toEqual([]);
  });
});

describe('calendarCells (the strip) in Endless', () => {
  it('goes on past year 30 with the full count', () => {
    expect(calendarCells(at(29), 5).map((c) => c.year)).toEqual([29, 30, 31, 32, 33]);
    expect(calendarCells(at(30), 5).map((c) => c.year)).toEqual([30, 31, 32, 33, 34]);
    expect(calendarCells(at(31), 5)).toHaveLength(5);
  });

  it('shows the old modifier up to 40 and the new one from 41', () => {
    const cells = calendarCells(at(38), 5);
    expect(cells.find((c) => c.year === 40)!.modifier).toEqual(modifierAt(7, 40));
    expect(cells.find((c) => c.year === 41)!.modifier).toEqual(modifierAt(7, 41));
  });

  it('normal full runs still stop at year 30', () => {
    expect(calendarCells(at(29, RULES_FULL), 5).map((c) => c.year)).toEqual([29, 30]);
  });
});

describe('yearLabel', () => {
  it('Endless has no "/30"', () => {
    expect(yearLabel({ year: 41, rules: RULES_ENDLESS })).toBe('Năm 41 · Vô tận');
  });

  it('normal keeps the old text', () => {
    expect(yearLabel({ year: 12, rules: RULES_FULL })).toBe('NĂM 12 / 30');
  });
});
