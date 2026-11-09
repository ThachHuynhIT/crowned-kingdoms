import { describe, expect, it } from 'vitest';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import { freeMoveIllegal } from '../../game/cards/custom/nomad';
import { CONTENT } from '../../game/cards/registry';
import { THRONE_PLOT } from '../../game/run/board';
import type { RunState } from '../../game/run/state';
import { newRun } from '../../game/run/yearFlow';
import { withBuilding } from '../../game/testing/fixtures';
import { illegalText } from '../realm/calendarModel';
import {
  START_FREE_MOVE,
  freeMoveCommand,
  freeMoveHighlights,
  freeMoveHint,
  freeMoveLabel,
  freeMoveReady,
  freeMoveReason,
  freeMoveReasonText,
  freeMovesLeft,
  showFreeMove,
  sourceIllegal,
  tapFreeMove,
  type FreeMovePick,
} from './freeMoveModel';

/** Nomad run in planning: throne on 2, militia on 6, archer tower on 7, the middle 3×3 open. */
const nomad = (over: Partial<RunState> = {}): RunState => {
  let s: RunState = { ...newRun(3, 'nomad', CONTENT, RULES_FULL), year: 4, phase: 'planning', ...over };
  s = withBuilding(s, 6, 'wheat_militia', 1);
  s = withBuilding(s, 7, 'neutral_archer_tower', 1);
  return s;
};

const tap = (s: RunState, pick: FreeMovePick, plot: number): FreeMovePick => {
  const r = tapFreeMove(s, CONTENT, pick, plot);
  if ('reject' in r) throw new Error(`rejected: ${r.reject}`);
  return r.next;
};

describe('showFreeMove / freeMovesLeft / freeMoveLabel', () => {
  it('shows the button only for the Nomad King in planning', () => {
    expect(showFreeMove(nomad())).toBe(true);
    expect(showFreeMove(nomad({ phase: 'battle' }))).toBe(false);
    expect(showFreeMove({ ...newRun(3, 'wheat', CONTENT, RULES_FULL), phase: 'planning' })).toBe(false);
  });

  it('counts the moves left from the state (allowed − used, never below 0)', () => {
    expect(freeMovesLeft(nomad(), CONTENT)).toBe(1);
    expect(freeMovesLeft(nomad({ throneLevel: 3 }), CONTENT)).toBe(2);
    expect(freeMovesLeft(nomad({ freeMovesUsed: 1 }), CONTENT)).toBe(0);
    expect(freeMovesLeft(nomad({ freeMovesUsed: 5 }), CONTENT)).toBe(0);
  });

  it('labels the button "Dời trại (N)", on two lines on a phone, and as a cancel while picking', () => {
    expect(freeMoveLabel(2, true, false)).toBe('Dời trại (2)');
    expect(freeMoveLabel(0, false, false)).toBe('Dời trại\n0');
    expect(freeMoveLabel(1, true, true)).toBe('✕ Huỷ dời');
    expect(freeMoveLabel(1, false, true)).toBe('✕\nHuỷ dời');
  });
});

describe('sourceIllegal (first pick)', () => {
  it('accepts a building with a legal neighbour and says why other plots are not', () => {
    const s = nomad();
    expect(sourceIllegal(s, CONTENT, 6)).toBeNull();
    expect(sourceIllegal(s, CONTENT, 7)).toBeNull();
    expect(sourceIllegal(s, CONTENT, 8)).toBe('noBuilding');
    expect(sourceIllegal(s, CONTENT, THRONE_PLOT)).toBe('throne');
    expect(sourceIllegal(s, CONTENT, 0)).toBe('locked');
  });

  it('refuses every plot once the year has no move left (the rule says why)', () => {
    const s = nomad({ freeMovesUsed: 1 });
    expect(sourceIllegal(s, CONTENT, 6)).toBe('noFreeMove');
  });
});

describe('freeMoveHighlights', () => {
  it('first step: buildings that can move are good, every other plot bad', () => {
    const map = freeMoveHighlights(nomad(), CONTENT, START_FREE_MOVE);
    expect(map.size).toBe(25);
    expect(map.get(6)).toBe('good');
    expect(map.get(7)).toBe('good');
    expect(map.get(8)).toBe('bad');
    expect(map.get(THRONE_PLOT)).toBe('bad');
    expect(map.get(0)).toBe('bad');
  });

  it('second step: the source is selected, adjacent open plots good (swap included), the rest bad', () => {
    const map = freeMoveHighlights(nomad(), CONTENT, { from: 6, to: null });
    expect(map.get(6)).toBe('selected');
    expect(map.get(7)).toBe('good'); // swap
    expect(map.get(11)).toBe('good');
    expect(map.get(1)).toBe('bad'); // locked
    expect(map.get(8)).toBe('bad'); // not adjacent
  });

  it('marks both picks selected once ready', () => {
    const map = freeMoveHighlights(nomad(), CONTENT, { from: 6, to: 11 });
    expect(map.get(6)).toBe('selected');
    expect(map.get(11)).toBe('selected');
    expect(map.get(7)).toBe('good');
  });

  it('agrees with freeMoveIllegal on every pair (the UI never re-implements the rule)', () => {
    const s = withBuilding(nomad({ throneLevel: 3 }), 12, 'neutral_barracks', 1);
    for (let from = 0; from < 25; from++) {
      if (sourceIllegal(s, CONTENT, from) !== null) continue;
      const map = freeMoveHighlights(s, CONTENT, { from, to: null });
      for (let to = 0; to < 25; to++) {
        if (to === from) continue;
        const legal = freeMoveIllegal(s, CONTENT, from, to) === null;
        expect(map.get(to), `${from} → ${to}`).toBe(legal ? 'good' : 'bad');
        expect(freeMoveReason(s, CONTENT, { from, to: null }, to)).toBe(freeMoveIllegal(s, CONTENT, from, to));
      }
    }
  });
});

describe('freeMoveReason', () => {
  it('gives the reason of the next pick, and none for a plot already picked', () => {
    const s = nomad();
    expect(freeMoveReason(s, CONTENT, START_FREE_MOVE, 8)).toBe('noBuilding');
    expect(freeMoveReason(s, CONTENT, START_FREE_MOVE, 6)).toBeNull();
    expect(freeMoveReason(s, CONTENT, { from: 6, to: null }, 8)).toBe('notAdjacent');
    expect(freeMoveReason(s, CONTENT, { from: 6, to: null }, 6)).toBeNull();
    expect(freeMoveReason(s, CONTENT, { from: 6, to: 11 }, 11)).toBeNull();
  });
});

describe('tapFreeMove', () => {
  it('picks a building, then an adjacent plot; ready gives the freeMove command', () => {
    const s = nomad();
    let pick = tap(s, START_FREE_MOVE, 6);
    expect(pick).toEqual({ from: 6, to: null });
    expect(freeMoveReady(pick)).toBe(false);
    expect(freeMoveCommand(pick)).toBeNull();
    pick = tap(s, pick, 7);
    expect(pick).toEqual({ from: 6, to: 7 });
    expect(freeMoveReady(pick)).toBe(true);
    expect(freeMoveCommand(pick)).toEqual({ type: 'freeMove', from: 6, to: 7 });
  });

  it('a new legal target replaces the last; tapping the source again goes back to the first step', () => {
    const s = nomad();
    let pick = tap(s, { from: 6, to: 7 }, 11);
    expect(pick).toEqual({ from: 6, to: 11 });
    pick = tap(s, pick, 6);
    expect(pick).toEqual(START_FREE_MOVE);
  });

  it('rejects an illegal pick with the rule reason', () => {
    const s = nomad();
    expect(tapFreeMove(s, CONTENT, START_FREE_MOVE, 8)).toEqual({ reject: 'noBuilding' });
    expect(tapFreeMove(s, CONTENT, { from: 6, to: null }, 8)).toEqual({ reject: 'notAdjacent' });
    expect(tapFreeMove(s, CONTENT, { from: 6, to: null }, 1)).toEqual({ reject: 'locked' });
  });

  it('a far building that can itself move becomes the new source', () => {
    const s = withBuilding(nomad(), 18, 'neutral_barracks', 1);
    expect(tap(s, { from: 6, to: null }, 18)).toEqual({ from: 18, to: null });
  });
});

describe('texts', () => {
  it('guides each step', () => {
    expect(freeMoveHint(START_FREE_MOVE, true)).toContain('công trình');
    expect(freeMoveHint({ from: 6, to: null }, true)).toContain('ô kề');
    expect(freeMoveHint({ from: 6, to: 7 }, true)).toContain('✓');
  });

  it('explains notAdjacent as "next to the chosen building"; other reasons use the shared text', () => {
    expect(freeMoveReasonText('notAdjacent')).not.toBe(illegalText('notAdjacent'));
    expect(freeMoveReasonText('locked')).toBe(illegalText('locked'));
    expect(freeMoveReasonText('throne')).not.toBe(illegalText('throne')); // "cannot place on the throne" reads wrong for a move
  });
});

describe('Endless free relocation', () => {
  it('finds the outer neighbour of an inner building and all 49 highlights', () => {
    let state = newRun(3, 'nomad', CONTENT, RULES_ENDLESS);
    state = withBuilding(state, 0, 'wheat_militia', 1);
    state.plots[32] = { unlocked: true, building: null };
    // Isolate the outer destination so a normal-only neighbour scan cannot accept the source.
    state.plots[1] = { unlocked: false, building: null };
    state.plots[5] = { unlocked: false, building: null };
    expect(sourceIllegal(state, CONTENT, 0)).toBeNull();
    expect(tapFreeMove(state, CONTENT, { from: 0, to: null }, 32))
      .toEqual({ next: { from: 0, to: 32 } });
    expect(freeMoveHighlights(state, CONTENT, START_FREE_MOVE).size).toBe(49);
    expect(freeMoveHighlights(state, CONTENT, { from: 0, to: null }).get(32)).toBe('good');
  });
});
