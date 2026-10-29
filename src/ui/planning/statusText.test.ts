import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../game/cards/registry';
import type { CalendarCell } from '../realm/calendarModel';
import { allyStatusText, foeStatusText } from './statusText';

const cell = (over: Partial<CalendarCell>): CalendarCell => ({
  year: 3,
  attacker: 'raiders',
  attack: null,
  council: false,
  quest: false,
  current: true,
  ...over,
});

describe('allyStatusText', () => {
  it('names the playing king', () => {
    expect(allyStatusText('stone', CONTENT)).toBe(CONTENT.king('stone').nameVi);
  });
});

describe('foeStatusText', () => {
  it('says who comes this year, short, with no health numbers', () => {
    expect(foeStatusText(cell({ attacker: 'raiders' }), CONTENT)).toBe('Địch: Thổ Phỉ');
    expect(foeStatusText(cell({ attacker: 'stone', attack: 2 }), CONTENT)).toBe(`Địch: ${CONTENT.enemyKing('stone').nameVi}`);
    expect(foeStatusText(cell({ attacker: 'boss', boss: 'boss_bog_ogre' }), CONTENT)).toBe('Địch: Boss Ông Kẹ Đầm Lầy');
    expect(foeStatusText(cell({ attacker: 'coalition', kings: ['stone', 'arcane'] }), CONTENT)).toBe('Địch: Liên Quân');
    expect(foeStatusText(cell({ attacker: 'stone', attack: 1 }), CONTENT)).not.toMatch(/\d/);
  });

  it('is vague when there is no year ahead', () => {
    expect(foeStatusText(undefined, CONTENT)).toBe('Địch: chưa rõ');
  });
});
