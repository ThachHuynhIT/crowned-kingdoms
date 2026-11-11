import { describe, expect, it } from 'vitest';
import { Rng } from '../../../core/random';
import { RULES_FULL } from '../../../data/rules';
import { CONTENT } from '../../cards/registry';
import { applyCommand } from '../../run/commands';
import type { CardId } from '../../../data/types';
import { newRun } from '../../run/yearFlow';
import { randomBot } from './random';

describe('randomBot legality', () => {
  it('never submits a command applyCommand rejects (moon_eclipse_pact with one life)', () => {
    const base = newRun(1, 'moon', CONTENT, RULES_FULL);
    const withHand = { ...base, hand: ['moon_reaper_shrine', 'moon_eclipse_pact'] as CardId[] };
    const built = applyCommand(withHand, { type: 'play', handIndex: 0, target: { kind: 'plot', plot: 7 } }, CONTENT);
    if ('error' in built) throw new Error(`setup: ${built.error}`);
    // a fresh turn with one life and only the pact in hand (plus a second copy)
    const state = { ...built.state, lives: 1, played: false, hand: ['moon_eclipse_pact', 'moon_eclipse_pact'] as CardId[], gold: 100 };
    for (let seed = 1; seed <= 300; seed++) {
      const cmd = randomBot(state, CONTENT, new Rng(seed));
      const r = applyCommand(state, cmd, CONTENT);
      expect('error' in r ? `${JSON.stringify(cmd)}: ${r.error}` : null).toBeNull();
    }
  });
});
