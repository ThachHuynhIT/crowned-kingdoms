import { describe, expect, it } from 'vitest';
import { RULES_G1, RULES_G2 } from '../../data/rules';
import { runState } from '../../game/testing/fixtures';
import { canFight } from './fightRule';

describe('canFight (owner 2026-11-10: Ra trận once the hand is down to two cards)', () => {
  it('shows Ra trận with two cards left, even if they could still be played', () => {
    expect(canFight(runState({ rules: RULES_G2, hand: ['wheat_militia', 'wheat_field'] }))).toBe(true);
  });

  it('hides it while three or more cards are in hand, played or not', () => {
    const s = runState({ rules: RULES_G2, played: true, hand: ['wheat_militia', 'wheat_field', 'wheat_field'] });
    expect(canFight(s)).toBe(false);
  });

  it('shows Ra trận when the hand is empty', () => {
    expect(canFight(runState({ rules: RULES_G2, played: false, hand: [] }))).toBe(true);
  });

  it('never shows it when battles start automatically, or outside planning', () => {
    expect(canFight(runState({ rules: RULES_G1, hand: [] }))).toBe(false);
    expect(canFight(runState({ rules: RULES_G2, hand: [], phase: 'battle' }))).toBe(false);
  });
});
