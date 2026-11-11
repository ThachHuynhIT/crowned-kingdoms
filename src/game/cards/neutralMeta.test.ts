import { describe, expect, it } from 'vitest';
import type { CardId } from '../../data/types';
import { THRONE_PLOT } from '../run/board';
import { applyCommand } from '../run/commands';
import type { PlayTarget, RunState } from '../run/state';
import { decodeRun, encodeRun } from '../save/codec';
import { runState, withBuilding } from '../testing/fixtures';
import { CONTENT } from './registry';

const two = (first: number, second: number): PlayTarget => ({ kind: 'two', first, second });
const tryPlay = (s: RunState, card: string, target: PlayTarget) =>
  applyCommand({ ...s, hand: [card as CardId, ...s.hand.slice(1)] }, { type: 'play', handIndex: 0, target }, CONTENT);
const play = (s: RunState, card: string, target: PlayTarget): RunState => {
  const r = tryPlay(s, card, target);
  if ('error' in r) throw new Error(r.error);
  return r.state;
};
const withThrone = (s: RunState, level: 1 | 2 | 3 | 4 | 5): RunState => ({
  ...s,
  throneLevel: level,
  plots: s.plots.map((p, i) => (i === THRONE_PLOT ? { ...p, building: { ...p.building!, level } } : p)),
});

describe('neutral meta cards (spec 6.1)', () => {
  it('are rare neutral tomes locked behind meta', () => {
    for (const id of ['neutral_duplicate', 'neutral_royal_seal']) {
      const c = CONTENT.card(id as CardId);
      expect(c).toMatchObject({ owner: 'neutral', kind: 'tome', rarity: 'rare', unlock: 'meta' });
    }
  });

  describe('neutral_duplicate', () => {
    const base = (): RunState => {
      const s = withBuilding(runState({ year: 4 }), 6, 'wheat_militia', 3, {
        enchants: [{ cardId: 'neutral_sharpen' as CardId, stacks: 2 }],
        counters: { grown: 5 },
        permanent: { dmg: 1 },
        ageBonus: 2,
        movedYear: 2,
        placedYear: 1,
      });
      return { ...s, plots: s.plots.map((p, i) => (i === 7 ? { ...p, unlocked: true } : p)) };
    };

    it('places a clean same-level copy on an empty unlocked plot', () => {
      const s = base();
      const next = play(s, 'neutral_duplicate', two(6, 7));
      const copy = next.plots[7]!.building!;
      expect(copy).toMatchObject({
        cardId: 'wheat_militia',
        level: 3,
        enchants: [],
        placedYear: 4,
        counters: {},
        permanent: {},
        ageBonus: 0,
        movedYear: null,
        uid: s.nextUid,
      });
      expect(next.nextUid).toBe(s.nextUid + 1);
      expect(next.plots[6]!.building).toEqual(s.plots[6]!.building);
      expect(next.played).toBe(true);
    });

    it('rejects an occupied target, the throne, and a locked target', () => {
      const s = withBuilding(base(), 7, 'wheat_militia', 1);
      expect(tryPlay(s, 'neutral_duplicate', two(6, 7))).toEqual({ error: 'occupied' });
      expect(tryPlay(base(), 'neutral_duplicate', two(THRONE_PLOT, 7))).toEqual({ error: 'throne' });
      const locked = base().plots.findIndex((p) => !p.unlocked);
      expect(tryPlay(base(), 'neutral_duplicate', two(6, locked))).toEqual({ error: 'locked' });
    });

    it('rejects copying onto the throne plot', () => {
      expect(tryPlay(base(), 'neutral_duplicate', two(6, THRONE_PLOT))).toEqual({ error: 'throne' });
    });
  });

  describe('neutral_royal_seal', () => {
    it('raises the throne by one level', () => {
      const next = play(runState(), 'neutral_royal_seal', { kind: 'none' });
      expect(next.throneLevel).toBe(2);
      expect(next.plots[THRONE_PLOT]!.building!.level).toBe(2);
    });

    it('keeps the save loadable after the play (throne level and building level agree)', () => {
      const base = runState();
      const s: RunState = { ...base, deck: [...base.deck, 'neutral_royal_seal' as CardId], hand: ['neutral_royal_seal' as CardId, ...base.hand] };
      const roundTrip = (x: RunState) => decodeRun(JSON.parse(JSON.stringify(encodeRun(x, CONTENT))), CONTENT).kind;
      expect(roundTrip(s)).toBe('ok');
      const r = applyCommand(s, { type: 'play', handIndex: 0, target: { kind: 'none' } }, CONTENT);
      if ('error' in r) throw new Error(r.error);
      expect(roundTrip(r.state)).toBe('ok');
    });

    it('is illegal at throne level 5 with maxLevel', () => {
      const s = withThrone(runState(), 5);
      expect(tryPlay(s, 'neutral_royal_seal', { kind: 'none' })).toEqual({ error: 'maxLevel' });
    });
  });
});
