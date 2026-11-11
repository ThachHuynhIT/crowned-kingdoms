import { describe, expect, it } from 'vitest';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import { runState } from '../../game/testing/fixtures';
import { canFight, planningHint } from './fightRule';

describe('fight rule (owner 2026-11-10: the battle starts by itself)', () => {
  it('never shows a Ra trận button', () => {
    expect(canFight(runState({ rules: RULES_FULL, hand: [] }))).toBe(false);
    expect(canFight(runState({ rules: RULES_FULL, hand: ['wheat_militia', 'wheat_field'] }))).toBe(false);
  });

  it('planning_hint_uses_final_target: two cards, or none in the last year of a 30-year run', () => {
    expect(planningHint(runState({ rules: RULES_FULL, year: 12 }))).toContain('còn 2 lá');
    expect(planningHint(runState({ rules: RULES_FULL, year: 30 }))).toContain('hết bài');
    expect(planningHint(runState({ rules: RULES_ENDLESS, year: 30, mode: 'endless' }))).toContain('còn 2 lá');
  });
});
