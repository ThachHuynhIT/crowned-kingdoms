import { describe, expect, it } from 'vitest';
import { handWindow } from './handLayoutModel';
import { planningLayout } from '../realm/realmLayout';

describe('desktop hand window', () => {
  for (const count of [0, 3, 5, 6, 9, 12]) {
    it(`keeps size and reaches every card in a hand of ${count}`, () => {
      const screen = { w: 1280, h: 720 };
      const first = handWindow(screen, count, 0);
      expect(first.viewport.x).toBeGreaterThanOrEqual(162);
      expect(first.viewport.x + first.viewport.w).toBeLessThanOrEqual(1118);
      const layout = planningLayout(screen, count);
      for (const action of [layout.shop, layout.sell, layout.reroll, layout.deck, layout.freeMove]) {
        expect(action.x + action.w <= first.viewport.x || action.x >= first.viewport.x + first.viewport.w).toBe(true);
      }
      for (let i = 0; i < count; i++) {
        const window = handWindow(screen, count, i * 160);
        const card = window.cards[i]!;
        expect([card.w, card.h]).toEqual([148, 208]);
        expect(card.x).toBeGreaterThanOrEqual(window.viewport.x);
        expect(card.x + card.w).toBeLessThanOrEqual(window.viewport.x + window.viewport.w);
      }
      expect(handWindow(screen, count, -100)).toEqual(first);
      expect(handWindow(screen, count, Infinity)).toEqual(first);
      expect(handWindow(screen, count, 1e6)).toEqual(handWindow(screen, count, first.scrollMax));
    });
  }

  for (const count of [9, 12]) {
    it(`leaves action gaps and snaps every scroll position for ${count} cards`, () => {
      const screen = { w: 1280, h: 720 };
      const layout = planningLayout(screen, count);
      const end = handWindow(screen, count, 1e6);
      for (const offset of [0, 79, 80, 161, end.scrollMax - 1, end.scrollMax, 1e6]) {
        const { viewport, cards, scroll } = handWindow(screen, count, offset);
        for (const action of [layout.shop, layout.reroll, layout.sell]) {
          expect(viewport.x - (action.x + action.w)).toBeGreaterThanOrEqual(12);
        }
        expect(layout.deck.x - (viewport.x + viewport.w)).toBeGreaterThanOrEqual(12);
        expect(scroll % 160).toBe(0);
        const visible = cards.filter((r) => r.x >= viewport.x && r.x + r.w <= viewport.x + viewport.w);
        expect(visible.length).toBeGreaterThan(0);
        expect(visible[0]!.x).toBe(viewport.x);
        for (const card of visible) {
          expect(card.x).toBeGreaterThanOrEqual(viewport.x);
          expect(card.x + card.w).toBeLessThanOrEqual(viewport.x + viewport.w);
        }
      }
      const last = end.cards[count - 1]!;
      expect(last.x).toBeGreaterThanOrEqual(end.viewport.x);
      expect(last.x + last.w).toBeLessThanOrEqual(end.viewport.x + end.viewport.w);
    });
  }
});
