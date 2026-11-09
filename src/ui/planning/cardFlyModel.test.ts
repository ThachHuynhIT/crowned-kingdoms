import { describe, expect, it } from 'vitest';
import { RULES_FULL } from '../../data/rules';
import { CONTENT } from '../../game/cards/registry';
import { applyCommand } from '../../game/run/commands';
import type { RunState } from '../../game/run/state';
import { newRun } from '../../game/run/yearFlow';
import { playedPlot } from './cardFlyModel';

const start = (): RunState => ({
  ...newRun(1, 'wheat', CONTENT, RULES_FULL),
  hand: ['wheat_militia'],
});
const ok = (s: RunState, cmd: Parameters<typeof applyCommand>[1]): RunState => {
  const r = applyCommand(s, cmd, CONTENT);
  if ('error' in r) throw new Error(r.error);
  return r.state;
};

describe('playedPlot', () => {
  it('names the plot a played building card landed on', () => {
    const s = start();
    const after = ok(s, { type: 'play', handIndex: 0, target: { kind: 'plot', plot: 7 } });
    expect(playedPlot(s, after)).toBe(7);
  });

  it('a level-up on an existing building counts', () => {
    const s0 = start();
    const s1 = ok(s0, { type: 'play', handIndex: 0, target: { kind: 'plot', plot: 7 } });
    const before = { ...s1, played: false, hand: ['wheat_militia' as const] };
    const after = ok(before, { type: 'play', handIndex: 0, target: { kind: 'plot', plot: 7 } });
    expect(playedPlot(before, after)).toBe(7);
  });

  it('nothing when the card was sold, when nothing was played, or across years', () => {
    const s = start();
    expect(playedPlot(s, ok(s, { type: 'discard', handIndex: 0 }))).toBeNull();
    expect(playedPlot(s, s)).toBeNull();
    const after = ok(s, { type: 'play', handIndex: 0, target: { kind: 'plot', plot: 7 } });
    expect(playedPlot(s, { ...after, year: s.year + 1 })).toBeNull();
  });
});
