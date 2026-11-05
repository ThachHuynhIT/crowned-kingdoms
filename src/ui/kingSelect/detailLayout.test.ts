import { describe, expect, it } from 'vitest';
import type { Rect, Size } from '../hud/layout';
import { detailLayout } from './detailLayout';

const DESKTOP: Size = { w: 1280, h: 720 };
const TABLET: Size = { w: 768, h: 1024 };
const MOBILE: Size = { w: 375, h: 812 };
const PHONE_767: Size = { w: 767, h: 900 };

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (r: Rect, s: Size): boolean => r.x >= 0 && r.y >= 0 && r.x + r.w <= s.w && r.y + r.h <= s.h;

describe('detailLayout', () => {
  it('detail_desktop_grid_left_portrait_right: nine 84×132 cards in 3×3 left of a 264×384 king card', () => {
    const l = detailLayout(DESKTOP, 6);
    expect(l.desktop).toBe(true);
    expect(l.cards).toHaveLength(9);
    for (const c of l.cards) expect([c.w, c.h]).toEqual([84, 132]);
    expect(l.cards[1]!.x).toBe(l.cards[0]!.x + 84 + 8);
    expect(l.cards[3]!.y).toBe(l.cards[0]!.y + 132 + 8);
    expect(l.cards[8]).toEqual({ x: l.cards[0]!.x + 2 * 92, y: l.cards[0]!.y + 2 * 140, w: 84, h: 132 });
    expect([l.portrait.w, l.portrait.h]).toEqual([264, 384]);
    expect(l.portrait.x).toBeGreaterThan(l.cards[2]!.x + 84);
  });

  it('detail_mobile_grid_stays_3_by_3: the small king card sits above a 3×3 grid of 72×112 cards', () => {
    const l = detailLayout(MOBILE, 6);
    expect(l.desktop).toBe(false);
    expect(l.cards).toHaveLength(9);
    for (const c of l.cards) expect([c.w, c.h]).toEqual([72, 112]);
    expect(new Set(l.cards.map((c) => c.x)).size).toBe(3);
    expect(new Set(l.cards.map((c) => c.y)).size).toBe(3);
    expect(l.cards[1]!.x).toBe(l.cards[0]!.x + 72 + 6);
    expect(l.cards[3]!.y).toBe(l.cards[0]!.y + 112 + 6);
    expect([l.portrait.w, l.portrait.h]).toEqual([132, 192]);
    expect(l.portrait.y + l.portrait.h).toBeLessThanOrEqual(l.cards[0]!.y);
  });

  it('mobile order is portrait → grid → seed → actions, top to bottom', () => {
    const l = detailLayout(MOBILE, 6);
    const gridBottom = l.cards[8]!.y + l.cards[8]!.h;
    expect(gridBottom).toBeLessThanOrEqual(l.seed.y);
    expect(l.seed.y + l.seed.h).toBeLessThanOrEqual(l.perks.y);
    expect(l.perks.y + l.perks.h).toBeLessThanOrEqual(l.play.y);
  });

  for (const [name, screen] of [
    ['desktop', DESKTOP],
    ['tablet 768', TABLET],
    ['mobile', MOBILE],
    ['767', PHONE_767],
  ] as const) {
    it(`footer_and_seed_do_not_overlap: every part is on screen and apart (${name})`, () => {
      const l = detailLayout(screen, 6);
      const parts: Record<string, Rect> = {
        title: l.title, back: l.back, portrait: l.portrait, perks: l.perks, difficulty: l.difficulty,
        previous: l.previous, next: l.next, play: l.play, seed: l.seed, reroll: l.reroll,
      };
      l.cards.forEach((c, i) => (parts[`card${i}`] = c));
      const names = Object.keys(parts);
      for (const n of names) expect(inside(parts[n]!, screen), n).toBe(true);
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          expect(overlaps(parts[names[i]!]!, parts[names[j]!]!), `${names[i]} × ${names[j]}`).toBe(false);
        }
      }
    });

    it(`every button is at least 44×44 and the buttons are not shrunk to fit (${name})`, () => {
      const l = detailLayout(screen, 6);
      for (const [n, r] of Object.entries({ back: l.back, perks: l.perks, previous: l.previous, next: l.next, play: l.play, reroll: l.reroll })) {
        expect(r.w, n).toBeGreaterThanOrEqual(44);
        expect(r.h, n).toBeGreaterThanOrEqual(44);
      }
      expect(l.seed.h).toBeGreaterThanOrEqual(44);
    });
  }

  it('has a title area of its own, no level bar, and difficulty arrows either side of the label', () => {
    for (const screen of [DESKTOP, MOBILE]) {
      const l = detailLayout(screen, 6);
      expect(l.title.w).toBeGreaterThan(100);
      expect(Object.keys(l)).not.toContain('level');
      expect(l.previous.x + l.previous.w).toBeLessThanOrEqual(l.difficulty.x);
      expect(l.difficulty.x + l.difficulty.w).toBeLessThanOrEqual(l.next.x);
    }
  });

  it('keeps the whole mobile content inside 375×812 with a margin', () => {
    const l = detailLayout(MOBILE, 6);
    expect(l.play.y + l.play.h).toBeLessThanOrEqual(812 - 10);
  });
});
