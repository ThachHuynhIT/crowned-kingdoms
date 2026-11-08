import { describe, expect, it } from 'vitest';
import { RULES_FULL } from '../../data/rules';
import { freeMoveIllegal, freeMovesAllowed } from '../cards/custom/nomad';
import { CONTENT } from '../cards/registry';
import { withBuilding } from '../testing/fixtures';
import { applyCommand } from './commands';
import type { IllegalReason, RunCommand, RunState } from './state';
import { newRun, startYear } from './yearFlow';

const nomad = (over: Partial<RunState> = {}): RunState => {
  let s: RunState = { ...newRun(3, 'nomad', CONTENT, RULES_FULL), year: 4, phase: 'planning', ...over };
  s = withBuilding(s, 6, 'wheat_militia', 3, { enchants: [{ cardId: 'neutral_sharpen', stacks: 1 }], placedYear: 2 });
  s = withBuilding(s, 7, 'neutral_archer_tower', 2);
  return s;
};
const move = (from: number, to: number): RunCommand => ({ type: 'freeMove', from, to });
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

describe('freeMovesAllowed', () => {
  it('follows the throne level 1,1,2,2,2 for the Nomad King and is 0 for others', () => {
    const levels = [1, 2, 3, 4, 5] as const;
    expect(levels.map((l) => freeMovesAllowed(nomad({ throneLevel: l }), CONTENT))).toEqual([1, 1, 2, 2, 2]);
    expect(freeMovesAllowed(newRun(1, 'wheat', CONTENT, RULES_FULL), CONTENT)).toBe(0);
  });
});

describe('freeMove command (Nomad King)', () => {
  it('moves to an adjacent empty plot without playing a card', () => {
    const s = ok(nomad(), move(6, 11));
    expect(s.plots[6]!.building).toBeNull();
    expect(s.plots[11]!.building!.cardId).toBe('wheat_militia');
    expect(s.played).toBe(false);
    expect(s.freeMovesUsed).toBe(1);
    expect(s.plots[11]!.building!.movedYear).toBe(4);
  });

  it('swaps two buildings keeping level, enchants and placedYear; both are moved this year', () => {
    const s = ok(nomad(), move(6, 7));
    const a = s.plots[7]!.building!;
    const b = s.plots[6]!.building!;
    expect(a).toMatchObject({ cardId: 'wheat_militia', level: 3, placedYear: 2, movedYear: 4 });
    expect(a.enchants).toEqual([{ cardId: 'neutral_sharpen', stacks: 1 }]);
    expect(b).toMatchObject({ cardId: 'neutral_archer_tower', level: 2, movedYear: 4 });
  });

  it('allows one move at throne level 1, then noFreeMove; the next year allows it again', () => {
    const s = ok(nomad(), move(6, 11));
    expect(errorOf(s, move(11, 12))).toBe('noFreeMove');
    expect(startYear({ ...s, year: 4 }, CONTENT).freeMovesUsed).toBe(0);
  });

  it('allows two moves from throne level 3', () => {
    const s = ok(ok(nomad({ throneLevel: 3 }), move(6, 11)), move(11, 12));
    expect(s.freeMovesUsed).toBe(2);
    expect(errorOf(s, move(12, 13))).toBe('noFreeMove');
  });

  it('can still play one card afterwards', () => {
    const s = ok({ ...nomad(), hand: ['neutral_sharpen'] }, move(6, 11));
    const r = applyCommand(s, { type: 'play', handIndex: 0, target: { kind: 'plot', plot: 11 } }, CONTENT);
    expect('error' in r).toBe(false);
  });

  it('refuses illegal moves with the right reason', () => {
    const s = nomad();
    expect(errorOf(s, move(6, 8))).toBe('notAdjacent');
    expect(errorOf(s, move(6, 1))).toBe('locked');
    expect(errorOf(s, move(2, 7))).toBe('throne');
    expect(errorOf(s, move(7, 2))).toBe('throne');
    expect(errorOf(s, move(11, 12))).toBe('noBuilding');
    expect(errorOf({ ...s, phase: 'battle' }, move(6, 11))).toBe('wrongPhase');
    expect(errorOf(newRun(1, 'wheat', CONTENT, RULES_FULL), move(6, 11))).toBe('wrongKing');
  });

  it('shares its legality rule with freeMoveIllegal and changes nothing on refusal', () => {
    const s = nomad();
    expect(freeMoveIllegal(s, CONTENT, 6, 11)).toBeNull();
    expect(freeMoveIllegal(s, CONTENT, 6, 8)).toBe('notAdjacent');
    expect(freeMoveIllegal(ok(s, move(6, 11)), CONTENT, 11, 12)).toBe('noFreeMove');
  });

  it('pays the Caravan +1 gold per free move, at most 3 a year shared with other moves', () => {
    let s = withBuilding(nomad({ throneLevel: 5, gold: 0 }), 12, 'nomad_caravan', 1);
    s = ok(s, move(6, 11));
    expect(s.gold).toBe(1);
    s = ok(s, move(11, 16));
    expect(s.gold).toBe(2);
    expect(errorOf(s, move(16, 17))).toBe('noFreeMove');
    // a third move via a card shares the same per-year counter
    s = { ...s, freeMovesUsed: 0 };
    s = ok(s, move(16, 17));
    expect(s.gold).toBe(3);
    s = { ...s, freeMovesUsed: 0 };
    s = ok(s, move(17, 18));
    expect(s.gold).toBe(3);
  });
});
