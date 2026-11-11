import { describe, expect, it } from 'vitest';
import { handWindow } from './handLayoutModel';
import { battleLayout, planningLayout } from '../realm/realmLayout';

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

describe('landscape phones (night 12/11/2026)', () => {
  const inside = (r: { x: number; y: number; w: number; h: number }, s: { w: number; h: number }): boolean =>
    r.x >= 0 && r.y >= 0 && r.x + r.w <= s.w && r.y + r.h <= s.h;
  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  for (const screen of [
    { w: 667, h: 375 },
    { w: 844, h: 390 },
    { w: 915, h: 412 },
    { w: 932, h: 430 },
    { w: 960, h: 540 },
  ]) {
    it(`${screen.w}×${screen.h}: desktop layout, shorter cards, the board clear of the hand and the actions`, () => {
      const layout = planningLayout(screen, 5);
      expect(layout.desktop).toBe(true);
      const { cards, viewport } = handWindow(screen, 5, 0);
      expect(cards[0]!.h).toBeLessThan(208);
      expect(cards[0]!.h).toBeGreaterThanOrEqual(112);
      expect(viewport.y + viewport.h).toBeLessThanOrEqual(screen.h);
      // the board keeps a usable height between the top HUD and the hand
      expect(layout.board.h).toBeGreaterThanOrEqual(70);
      expect(layout.board.y + layout.board.h).toBeLessThanOrEqual(viewport.y);
      for (const action of [layout.shop, layout.reroll, layout.sell, layout.deck]) {
        expect(inside(action, screen), JSON.stringify(action)).toBe(true);
        expect(action.h).toBeGreaterThanOrEqual(44);
        // cards scrolled out of the hand window are hidden (HandView), only the visible ones count
        for (const card of cards.filter((c) => c.x >= viewport.x && c.x + c.w <= viewport.x + viewport.w))
          expect(overlaps(action, card)).toBe(false);
      }
    });
  }

  it('keeps full-size cards from 650 px tall', () => {
    for (const screen of [{ w: 1280, h: 720 }, { w: 1024, h: 768 }, { w: 1100, h: 650 }]) {
      expect(handWindow(screen, 3, 0).cards[0]).toMatchObject({ w: 148, h: 208 });
    }
  });
});

describe('Endless on landscape phones (night 12/11/2026)', () => {
  for (const screen of [
    { w: 667, h: 375 },
    { w: 844, h: 390 },
  ]) {
    it(`${screen.w}×${screen.h}: the bigger Endless board still sits above the hand`, () => {
      const layout = planningLayout(screen, 5, 'endless');
      const { viewport } = handWindow(screen, 5, 0);
      expect(layout.desktop).toBe(true);
      expect(layout.board.h).toBeGreaterThan(0);
      expect(layout.board.y + layout.board.h).toBeLessThanOrEqual(viewport.y);
      expect(layout.board.x).toBeGreaterThanOrEqual(0);
      expect(layout.board.x + layout.board.w).toBeLessThanOrEqual(screen.w);
    });
  }
});

describe('battle HUD on landscape phones (night 12/11/2026)', () => {
  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const screen of [
    { w: 667, h: 375 },
    { w: 844, h: 390 },
    { w: 915, h: 412 },
    { w: 932, h: 430 },
    { w: 960, h: 540 },
    { w: 1024, h: 600 },
    { w: 1024, h: 768 },
    { w: 1280, h: 720 },
  ]) {
    it(`${screen.w}×${screen.h}: speed buttons, year, clock and panels do not overlap and stay on screen`, () => {
      const l = battleLayout(screen);
      const rects = { year: l.year, clock: l.clock, foes: l.foes, waves: l.waves, intervene: l.intervene, auto: l.auto, ally: l.allyStatus, foe: l.foeStatus, ...Object.fromEntries(l.speed.map((s, i) => [`speed${i}`, s])) };
      const entries = Object.entries(rects);
      for (const [i, [name, r]] of entries.entries()) {
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= screen.w && r.y + r.h <= screen.h, `${name} on screen`).toBe(true);
        for (const [other, o] of entries.slice(i + 1)) expect(overlaps(r, o), `${name} × ${other}`).toBe(false);
      }
    });
  }
});

describe('planning HUD on landscape phones (night 12/11/2026)', () => {
  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const screen of [
    { w: 667, h: 375 },
    { w: 844, h: 390 },
    { w: 932, h: 430 },
    { w: 960, h: 540 },
    { w: 1024, h: 600 },
    { w: 1024, h: 768 },
    { w: 1280, h: 720 },
  ]) {
    it(`${screen.w}×${screen.h}: top HUD, hint and actions do not overlap`, () => {
      const l = planningLayout(screen, 5);
      const rects: Record<string, { x: number; y: number; w: number; h: number }> = {
        lives: l.lives, gold: l.gold, help: l.help, year: l.year, hint: l.hint,
        shop: l.shop, reroll: l.reroll, sell: l.sell, deck: l.deck,
        ...Object.fromEntries(l.calendar.map((c, i) => [`cal${i}`, c])),
      };
      if (l.scoutButton) rects.scout = l.scoutButton;
      if (l.decreeButton) rects.decree = l.decreeButton;
      const entries = Object.entries(rects);
      for (const [i, [name, r]] of entries.entries()) {
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= screen.w && r.y + r.h <= screen.h, `${name} on screen`).toBe(true);
        for (const [other, o] of entries.slice(i + 1)) expect(overlaps(r, o), `${name} × ${other}`).toBe(false);
      }
    });
  }
});
