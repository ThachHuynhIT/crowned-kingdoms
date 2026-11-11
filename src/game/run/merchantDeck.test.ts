import { describe, expect, it } from 'vitest';
import { RULES_FULL } from '../../data/rules';
import type { CardId } from '../../data/types';
import { greedyBot } from '../sim/bots/greedy';
import { runHeadless } from '../sim/headless';
import type { RunCommand, RunState } from './state';

/** Every owned card is in exactly one pile: hand ∪ drawPile ∪ discardPile = deck (spec §3.4). */
const pilesMatchDeck = (s: RunState): boolean => {
  const sorted = (cards: readonly CardId[]): string => [...cards].sort().join(',');
  return sorted([...s.hand, ...s.drawPile, ...s.discardPile]) === sorted(s.deck);
};

describe('owning cards through every pick, purchase and skip (night 12/11/2026 bug hunt)', () => {
  it('keeps hand ∪ draw ∪ discard = deck after every command, merchant purchases included', () => {
    let merchantBuys = 0;
    for (const seed of [1, 2, 3]) {
      runHeadless({
        seed,
        kingId: 'wheat',
        rules: RULES_FULL,
        bot: greedyBot,
        onCommand: (before: RunState, cmd: RunCommand, after: RunState) => {
          if (cmd.type === 'pickOffer' && before.offers?.kind === 'merchant' && cmd.index !== null) {
            merchantBuys++;
            expect(after.deck.length, `seed ${seed} year ${before.year}`).toBe(before.deck.length + 1);
          }
          expect(pilesMatchDeck(after), `seed ${seed} year ${after.year} after ${cmd.type}`).toBe(true);
        },
      });
    }
    expect(merchantBuys).toBeGreaterThan(0);
  }, 60_000);
});
