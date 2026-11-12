/**
 * Hand limit and shop limit (owner 12/11/2026): at most `RUN.handMax` (5) cards in hand, at most
 * `RUN.shopBuysPerYear` (3) "Mua thẻ" per year. No card is ever lost: a card gained with a full hand goes on top of
 * the draw pile; every command keeps hand ∪ draw ∪ discard = deck.
 */
import { describe, expect, it } from 'vitest';
import { RUN } from '../../data/run';
import type { CardId } from '../../data/types';
import { CONTENT } from '../cards/registry';
import { runHeadless } from '../sim/headless';
import { greedyBot } from '../sim/bots/greedy';
import { runState } from '../testing/fixtures';
import { RULES_FULL } from '../../data/rules';
import { applyCommand } from './commands';
import { gainCard } from './deck';
import { finishYearStart } from './flow';
import { buyCardIllegal } from './shop';
import type { RunState } from './state';

const sorted = (cards: readonly CardId[]): string => [...cards].sort().join(',');
const piles = (s: RunState): string => sorted([...s.hand, ...s.drawPile, ...s.discardPile]);
const M: CardId = 'wheat_militia';
const A: CardId = 'wheat_a';
const B: CardId = 'wheat_b';
const C: CardId = 'wheat_c';
const X: CardId = 'wheat_x';

describe('hand limit and shop limit (owner 12/11/2026)', () => {
  it('limits are 5 cards in hand and 3 purchases a year', () => {
    expect(RUN.handMax).toBe(5);
    expect(RUN.shopBuysPerYear).toBe(3);
  });

  it('gainCard puts the card in hand below the limit, on top of the draw pile at the limit', () => {
    const open = gainCard({ hand: [M, M], drawPile: [A], discardPile: [] }, X);
    expect(open).toEqual({ hand: [M, M, X], drawPile: [A], discardPile: [] });
    const full = gainCard({ hand: [M, M, M, M, M], drawPile: [A], discardPile: [B] }, X);
    expect(full).toEqual({ hand: [M, M, M, M, M], drawPile: [X, A], discardPile: [B] });
  });

  it('refuses a fourth purchase in a year and a purchase with a full hand', () => {
    let s = runState({ gold: 100, hand: [M] });
    for (let i = 0; i < 3; i++) {
      const r = applyCommand(s, { type: 'buyCard' }, CONTENT);
      if ('error' in r) throw new Error(r.error);
      s = r.state;
    }
    expect(s.shopPurchasesThisYear).toBe(3);
    expect(buyCardIllegal(s, CONTENT)).toBe('shopLimit');
    expect(buyCardIllegal(runState({ gold: 100, hand: [M, M, M, M, M] }), CONTENT)).toBe('handFull');
  });

  it('the year draw stops at the hand limit and leaves the rest in the draw pile', () => {
    const s = runState({
      phase: 'planning',
      yearStartPendingDraw: true,
      year: 5, // council year: bonus draw
      hand: [M, M, M, M],
      drawPile: [A, B, C],
      discardPile: [],
      deck: [M, M, M, M, A, B, C],
    });
    const next = finishYearStart(s, CONTENT);
    expect(next.hand).toHaveLength(RUN.handMax);
    expect(next.drawPile).toEqual([B, C]);
    expect(piles(next)).toBe(sorted(next.deck));
  });

  it('a reward picked with a full hand goes on top of the draw pile, not lost', () => {
    const won = applyCommand(
      runState({ phase: 'battle', hand: runState().deck.slice(0, RUN.handMax), played: true, year: 3 }),
      {
        type: 'battleResult',
        result: { won: true, ticks: 100, throneHpLostPct: 0, kills: 4, killsBySource: {}, interventionsUsed: 0, unitsLost: 0, capped: 0, inputs: [] },
      },
      CONTENT,
    );
    if ('error' in won) throw new Error(won.error);
    const offer = won.state.offers;
    if (offer === null || !('cardIds' in offer)) throw new Error('no reward offer');
    const r = applyCommand(won.state, { type: 'pickOffer', index: 0 }, CONTENT);
    if ('error' in r) throw new Error(r.error);
    expect(r.state.hand.length).toBeLessThanOrEqual(RUN.handMax);
    expect(r.state.deck.filter((c) => c === offer.cardIds[0])).toHaveLength(
      [...r.state.hand, ...r.state.drawPile, ...r.state.discardPile].filter((c) => c === offer.cardIds[0]).length,
    );
    expect(piles(r.state)).toBe(sorted(r.state.deck));
  });

  it('whole runs never pass the hand limit and never lose a card', { timeout: 120_000 }, () => {
    for (const kingId of ['wheat', 'stone', 'nomad'] as const) {
      for (const seed of [1, 2, 3]) {
        runHeadless({
          seed,
          kingId,
          rules: RULES_FULL,
          bot: greedyBot,
          onCommand: (_before, cmd, after) => {
            expect(after.hand.length, `${kingId}:${seed} ${cmd.type}`).toBeLessThanOrEqual(RUN.handMax);
            expect(piles(after), `${kingId}:${seed} ${cmd.type}`).toBe(sorted(after.deck));
          },
        });
      }
    }
  });
});
