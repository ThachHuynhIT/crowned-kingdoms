import { describe, expect, it } from 'vitest';
import { CONTENT } from '../cards/registry';
import { runState, withBuilding } from '../testing/fixtures';
import { applyCommand } from './commands';
import { canPlayCard, hasPlayableCard } from './playable';
import type { RunState } from './state';
import { THRONE_PLOT } from './board';

describe('hasPlayableCard', () => {
  it('is true when some card in hand has a legal target', () => {
    expect(hasPlayableCard(runState({ hand: ['neutral_clear_land', 'wheat_militia'] }), CONTENT)).toBe(true);
  });

  it('is false for an empty hand', () => {
    expect(hasPlayableCard(runState({ hand: [] }), CONTENT)).toBe(false);
  });

  it('is false when every card in hand lacks a target', () => {
    const s = runState({ hand: ['neutral_clear_land'] });
    const open = { ...s, plots: s.plots.map((p) => ({ ...p, unlocked: true })) };
    expect(hasPlayableCard(open, CONTENT)).toBe(false);
  });

  it('is false for building cards when no unlocked plot is free', () => {
    const s = runState({ hand: ['wheat_militia'] });
    const full = {
      ...s,
      plots: s.plots.map((p, i) =>
        p.unlocked && i !== THRONE_PLOT
          ? { ...p, building: { uid: i + 10, cardId: 'wheat_scarecrow' as const, level: 1 as const, enchants: [], placedYear: 1, permanent: {}, ageBonus: 0, counters: {}, movedYear: null } }
          : p,
      ),
    };
    expect(hasPlayableCard(full, CONTENT)).toBe(false);
  });

  describe('state refusals (same rule as applyCommand)', () => {
    const throne5 = (s: RunState): RunState => ({
      ...s,
      throneLevel: 5,
      plots: s.plots.map((p, i) => (i === THRONE_PLOT ? { ...p, building: { ...p.building!, level: 5 as const } } : p)),
    });
    const start = (s: RunState) => applyCommand(s, { type: 'startBattle' }, CONTENT);

    it('a hand of only Royal Seal at throne level 5 is not playable and the battle may start', () => {
      const s = throne5(runState({ hand: ['neutral_royal_seal'] }));
      expect(canPlayCard(s, CONTENT, 'neutral_royal_seal')).toBe(false);
      expect(hasPlayableCard(s, CONTENT)).toBe(false);
      expect('error' in start(s)).toBe(false);
    });

    it('a hand of only the eclipse pact at one life is not playable and the battle may start', () => {
      const s = { ...withBuilding(runState({ hand: ['moon_eclipse_pact'] }), 6, 'wheat_militia', 1), lives: 1 };
      expect(canPlayCard(s, CONTENT, 'moon_eclipse_pact')).toBe(false);
      expect(hasPlayableCard(s, CONTENT)).toBe(false);
      expect('error' in start(s)).toBe(false);
    });

    it('the same cards stay playable when the run state allows them', () => {
      const seal = runState({ hand: ['neutral_royal_seal'] });
      expect(hasPlayableCard(seal, CONTENT)).toBe(true);
      expect(start(seal)).toEqual({ error: 'notPlayed' });
      const pact = { ...withBuilding(runState({ hand: ['moon_eclipse_pact'] }), 6, 'wheat_militia', 1), lives: 2 };
      expect(hasPlayableCard(pact, CONTENT)).toBe(true);
      expect(start(pact)).toEqual({ error: 'notPlayed' });
    });
  });
});
