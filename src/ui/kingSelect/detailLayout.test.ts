import { describe, expect, it } from 'vitest';
import type { Rect, Size } from '../hud/layout';
import { detailLayout, perkDialogLayout } from './detailLayout';

const DESKTOP: Size = { w: 1280, h: 720 };
const TABLET: Size = { w: 768, h: 1024 };
const MOBILE: Size = { w: 375, h: 812 };
const PHONE_767: Size = { w: 767, h: 900 };

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (r: Rect, s: Size): boolean => r.x >= 0 && r.y >= 0 && r.x + r.w <= s.w && r.y + r.h <= s.h;

describe('detailLayout', () => {
  it('detail_desktop_grid_left_portrait_right: nine 116×180 cards in rows of 5 + 4 left of a 264×384 king card', () => {
    const l = detailLayout(DESKTOP, 6);
    expect(l.desktop).toBe(true);
    expect(l.cards).toHaveLength(9);
    for (const c of l.cards) expect([c.w, c.h]).toEqual([116, 180]);
    expect(l.cards[1]!.x).toBe(l.cards[0]!.x + 116 + 10);
    expect(l.cards[4]!.y).toBe(l.cards[0]!.y);
    expect(l.cards[5]!.y).toBe(l.cards[0]!.y + 180 + 10);
    // the short second row is centred under the first
    const rowMid = (a: Rect, b: Rect): number => (a.x + b.x + b.w) / 2;
    expect(rowMid(l.cards[5]!, l.cards[8]!)).toBe(rowMid(l.cards[0]!, l.cards[4]!));
    expect([l.portrait.w, l.portrait.h]).toEqual([264, 384]);
    expect(l.portrait.x).toBeGreaterThan(l.cards[4]!.x + 116);
  });

  it('desktop: the whole block (cards, king card, buttons) is centred on the screen both ways', () => {
    for (const screen of [DESKTOP, { w: 1920, h: 1080 }]) {
      const l = detailLayout(screen, 6);
      const parts = [l.portrait, l.perks, l.play, l.seed, l.reroll, ...l.modes, l.modeNote, ...l.cards];
      const left = Math.min(...parts.map((r) => r.x));
      const right = Math.max(...parts.map((r) => r.x + r.w));
      const top = Math.min(...parts.map((r) => r.y), l.perkName.y);
      const bottom = Math.max(...parts.map((r) => r.y + r.h));
      expect(Math.abs(left + right - screen.w), 'horizontal').toBeLessThanOrEqual(2);
      // vertically centred in the room under the title
      const below = l.title.y + l.title.h;
      expect(Math.abs(top - below - (screen.h - bottom)), 'vertical').toBeLessThanOrEqual(12);
    }
  });

  it('desktop: falls back to a 3×3 grid where 5 columns do not fit (768 px tablet)', () => {
    const l = detailLayout(TABLET, 6);
    expect(new Set(l.cards.map((c) => c.x)).size).toBe(3);
    for (const c of l.cards) expect([c.w, c.h]).toEqual([116, 180]);
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
        mode0: l.modes[0]!, mode1: l.modes[1]!, modeNote: l.modeNote,
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
      for (const [n, r] of Object.entries({ back: l.back, perks: l.perks, previous: l.previous, next: l.next, play: l.play, reroll: l.reroll, mode0: l.modes[0]!, mode1: l.modes[1]! })) {
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

describe('detailLayout run-mode toggle (spec 2026-11-09 §2)', () => {
  it('has two toggle buttons, "30 năm" before "Vô tận", and room for the locked reason', () => {
    for (const screen of [DESKTOP, MOBILE, TABLET, PHONE_767]) {
      const l = detailLayout(screen, 6);
      expect(l.modes).toHaveLength(2);
      const [a, b] = l.modes as [Rect, Rect];
      expect(a.x < b.x || a.y < b.y).toBe(true);
      expect(l.modeNote.w).toBeGreaterThanOrEqual(96);
      expect(l.modeNote.h).toBeGreaterThanOrEqual(44);
    }
  });

  it('desktop: one row under the seed row, still inside 1280×720', () => {
    const l = detailLayout(DESKTOP, 6);
    expect(l.modes[0]!.y).toBeGreaterThanOrEqual(l.seed.y + l.seed.h);
    expect(l.modes[0]!.y).toBe(l.modes[1]!.y);
    expect(l.modeNote.y + l.modeNote.h).toBeLessThanOrEqual(720 - 10);
  });

  it('phone: stacked left of the king card, clear of it', () => {
    const l = detailLayout(MOBILE, 6);
    for (const r of [...l.modes, l.modeNote]) expect(r.x + r.w).toBeLessThanOrEqual(l.portrait.x);
    expect(l.modes[1]!.y).toBeGreaterThan(l.modes[0]!.y);
  });
});

describe('detailLayout perk caption', () => {
  for (const [name, screen] of [
    ['desktop', DESKTOP],
    ['tablet 768', TABLET],
    ['mobile', MOBILE],
    ['767', PHONE_767],
  ] as const) {
    it(`the chosen perk's name has its own room on screen, clear of everything else (${name})`, () => {
      const l = detailLayout(screen, 6);
      expect(inside(l.perkName, screen)).toBe(true);
      expect(l.perkName.w).toBeGreaterThanOrEqual(96);
      expect(l.perkName.h).toBeGreaterThanOrEqual(18);
      const others = [l.title, l.back, l.portrait, l.perks, l.difficulty, l.previous, l.next, l.play, l.seed, l.reroll, ...l.modes, l.modeNote, ...l.cards];
      for (const r of others) expect(overlaps(l.perkName, r)).toBe(false);
    });
  }

  it('sits next to the perks button on desktop (just above it)', () => {
    const l = detailLayout(DESKTOP, 6);
    expect(l.perkName.y + l.perkName.h).toBeLessThanOrEqual(l.perks.y);
    expect(l.perks.y - (l.perkName.y + l.perkName.h)).toBeLessThanOrEqual(8);
    expect(l.perkName.x).toBe(l.perks.x);
  });
});

describe('perkDialogLayout', () => {
  for (const [name, screen] of [
    ['desktop', DESKTOP],
    ['mobile', MOBILE],
    ['767', PHONE_767],
  ] as const) {
    it(`fits the screen with a 48×48 close button and three ≥ 44 px perk rows (${name})`, () => {
      const l = perkDialogLayout(screen, 12);
      expect(inside(l.panel, screen)).toBe(true);
      expect([l.close.w, l.close.h]).toEqual([48, 48]);
      expect(l.rows).toHaveLength(3);
      const contained = (r: Rect): boolean =>
        r.x >= l.panel.x && r.y >= l.panel.y && r.x + r.w <= l.panel.x + l.panel.w && r.y + r.h <= l.panel.y + l.panel.h;
      for (const r of [l.title, l.close, ...l.rows]) expect(contained(r)).toBe(true);
      for (const r of l.rows) {
        expect(r.w).toBeGreaterThanOrEqual(44);
        expect(r.h).toBeGreaterThanOrEqual(44);
      }
      const parts = [l.title, l.close, ...l.rows];
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) expect(overlaps(parts[i]!, parts[j]!), `${i} × ${j}`).toBe(false);
      }
    });
  }

  it('rows are tall enough for a wrapped perk text on phones', () => {
    for (const r of perkDialogLayout(MOBILE, 12).rows) expect(r.h).toBeGreaterThanOrEqual(88);
  });
});
