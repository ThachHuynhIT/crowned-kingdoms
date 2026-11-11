import { describe, expect, it } from 'vitest';
import { RULES_ENDLESS, RULES_FULL, RULES_G2 } from '../../data/rules';
import { CONTENT } from '../cards/registry';
import { runState } from '../testing/fixtures';
import { applyCommand } from './commands';
import { battleHandTarget, canStartBattle } from './turn';

describe('battle hand target (owner 2026-11-10)', () => {
  it('full_final_zero_is_not_endless_year_thirty', () => {
    expect(battleHandTarget(runState({ rules: RULES_FULL, year: 30 }))).toBe(0);
    expect(battleHandTarget(runState({ rules: RULES_FULL, year: 29 }))).toBe(2);
    expect(battleHandTarget(runState({ rules: RULES_ENDLESS, year: 30, mode: 'endless' }))).toBe(2);
    expect(battleHandTarget(runState({ rules: RULES_G2, year: 15 }))).toBe(2);
  });

  it('starts only once drawing and every choice step are done', () => {
    const two = runState({ rules: RULES_FULL, hand: ['wheat_militia', 'wheat_field'] });
    expect(canStartBattle(two)).toBe(true);
    expect(canStartBattle({ ...two, yearStartPendingDraw: true })).toBe(false);
    expect(canStartBattle({ ...two, hand: ['wheat_militia', 'wheat_field', 'wheat_field'] })).toBe(false);
  });

  it('final_year_unplayable_cards_can_all_be_sold: two cards in year 30 are sold, then the battle may start', () => {
    let s = runState({ rules: RULES_FULL, year: 30, hand: ['wheat_militia', 'wheat_field'] });
    expect(canStartBattle(s)).toBe(false);
    for (let i = 0; i < 2; i++) {
      const r = applyCommand(s, { type: 'discard', handIndex: 0 }, CONTENT);
      if ('error' in r) throw new Error(r.error);
      s = r.state;
    }
    expect(s.hand).toEqual([]);
    expect(canStartBattle(s)).toBe(true);
  });
});
