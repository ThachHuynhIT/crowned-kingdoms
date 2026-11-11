import { describe, expect, it } from 'vitest';
import { unproject } from '../../core/iso';
import { BATTLE } from '../../data/battle';
import { cardLayout, fitArt } from '../cards/cardLayout';
import { CARD_LIFT, type Rect, type Size } from '../hud/layout';
import {
  PLANNING_ZOOM,
  battleCamera,
  centerHand,
  battleLayout,
  battleWorldAt,
  battleZoom,
  cameraScroll,
  confirmFor,
  isDesktop,
  planningLayout,
  plotAtScreen,
  overviewZoom,
  legacyOverviewZoom,
  realmZoomLimits,
  planningZoom,
  plotScreenRect,
  realmCamera,
  realmCameraMix,
  screenToWorld,
} from './realmLayout';

const DESKTOP: Size = { w: 1280, h: 720 };
const MOBILE: Size = { w: 375, h: 812 };

const inside = (r: Rect, s: Size): boolean =>
  r.x >= 0 && r.y >= 0 && r.x + r.w <= s.w && r.y + r.h <= s.h;
/** Touching edges do not overlap. */
const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * The board is an isometric diamond inside its box (spec 2026-11-06): a rect overlaps it when the
 * point of the rect nearest the diamond centre lies strictly inside the diamond.
 */
const overlapsDiamond = (r: Rect, box: Rect): boolean => {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const nx = Math.min(r.x + r.w, Math.max(r.x, cx));
  const ny = Math.min(r.y + r.h, Math.max(r.y, cy));
  return Math.abs(nx - cx) / (box.w / 2) + Math.abs(ny - cy) / (box.h / 2) < 1;
};

const expectSeparate = (named: Record<string, Rect>): void => {
  const entries = Object.entries(named);
  for (let i = 0; i < entries.length; i++)
    for (let j = i + 1; j < entries.length; j++) {
      const [na, a] = entries[i]!;
      const [nb, b] = entries[j]!;
      const hit = na === 'board' ? overlapsDiamond(b, a) : nb === 'board' ? overlapsDiamond(a, b) : overlaps(a, b);
      expect(hit, `${na} overlaps ${nb}`).toBe(false);
    }
};

describe('isDesktop', () => {
  it('uses the desktop rules from 768 px wide', () => {
    expect(isDesktop(767)).toBe(false);
    expect(isDesktop(768)).toBe(true);
    expect(isDesktop(1280)).toBe(true);
    expect(isDesktop(375)).toBe(false);
  });
});

describe('planningLayout', () => {
  it('lays out the desktop 1280×720 HUD (§10.4)', () => {
    const l = planningLayout(DESKTOP);
    expect(l.desktop).toBe(true);
    expect(l.lives).toEqual({ x: 10, y: 10, w: 120, h: 52 });
    expect(l.year).toEqual({ x: 560, y: 66, w: 160, h: 26 });
    // the board is as tall as the band between the top HUD and the 208 px hand (spec 2026-11-08 §4; cards 2026-11-10)
    expect(l.board.w).toBe(477.5);
    expect(l.board.h).toBe(238.75);
    expect(l.zoom).toBeCloseTo(0.74609375, 12);
    // the side panels would overlap the bigger board at 1280 px: buttons instead
    expect(l.scout).not.toBeNull();
    expect(l.scoutButton).toBeNull();
    expect(l.gold).toEqual({ x: 134, y: 10, w: 120, h: 52 });
    expect(l.calendar[0]).toEqual({ x: 502, y: 10, w: 52, h: 52 });
    expect(l.sell).toEqual({ x: 10, y: 658, w: 140, h: 52 });
    expect(l.reroll).toEqual({ x: 10, y: 598, w: 140, h: 52 });
    expect(l.deck).toEqual({ x: 1130, y: 658, w: 140, h: 52 });
    // Dời trại (Nomad King) stands over Bộ bài, mirroring Đổi bài over Bán bài
    expect(l.freeMove).toEqual({ x: 1130, y: 598, w: 140, h: 52 });
    expect(l.hand).toHaveLength(3);
    expect(l.hand[0]).toEqual({ x: 406, y: 502, w: 148, h: 208 });
    expect(l.hand[2]!.x).toBe(406 + 2 * 160);
    expect(l.shop.w).toBe(140);
    expect(l.shop.h).toBe(52);
  });

  it('lays out the mobile 375×812 HUD (§10.4)', () => {
    const l = planningLayout(MOBILE);
    expect(l.desktop).toBe(false);
    expect(l.lives).toEqual({ x: 10, y: 10, w: 96, h: 48 });
    expect(l.gold).toEqual({ x: 110, y: 10, w: 96, h: 48 });
    expect(l.help).toEqual({ x: 210, y: 10, w: 52, h: 48 });
    expect(l.year.x).toBe(266);
    expect(l.year.x + l.year.w).toBe(365);
    expect(l.board).toEqual({ x: -142, y: 180, w: 660, h: 330 }); // wider than a phone: the map pans
    expect(l.zoom).toBe(33 / 32);
    expect(l.hand).toHaveLength(3);
    expect(l.hand[0]).toEqual({ x: 18, y: 640, w: 108, h: 162 });
    expect(l.hand[1]!.x).toBe(134);
    expect(l.scout).toBeNull();
    expect(l.scoutButton).toEqual({ x: 313, y: 64, w: 52, h: 52 });
    expect(l.calendar).toHaveLength(5);
    // Dời trại (Nomad King): right end of the ✓/✕ row above the board
    expect(l.freeMove).toEqual({ x: 281, y: 128, w: 84, h: 48 });
  });

  for (const [name, screen] of [
    ['desktop', DESKTOP],
    ['mobile', MOBILE],
  ] as const) {
    it(`leaves room for a lifted selected card under the panels above the hand (${name})`, () => {
      const l = planningLayout(screen);
      for (const card of l.hand) {
        const lifted = { ...card, y: card.y - CARD_LIFT };
        expectSeparate({ lifted, board: l.board, sell: l.sell, reroll: l.reroll, deck: l.deck, freeMove: l.freeMove });
      }
    });

    it(`selected_lift_clear_of_actions: with four cards too (${name})`, () => {
      const l = planningLayout(screen, 4);
      for (const card of l.hand) {
        const lifted = { ...card, y: card.y - CARD_LIFT };
        expectSeparate({ lifted, board: l.board, sell: l.sell, reroll: l.reroll, deck: l.deck, freeMove: l.freeMove });
      }
    });
  }

  const ODD: Size = { w: 900, h: 600 };
  for (const [name, screen] of [
    ['desktop', DESKTOP],
    ['mobile', MOBILE],
    ['odd 900×600', ODD],
  ] as const) {
    it(`keeps every rect on screen, buttons ≥ 44 and parts apart (${name})`, () => {
      const l = planningLayout(screen);
      const named: Record<string, Rect> = {
        lives: l.lives,
        gold: l.gold,
        year: l.year,
        board: l.board,
        hand0: l.hand[0]!,
        hand1: l.hand[1]!,
        hand2: l.hand[2]!,
        sell: l.sell,
        reroll: l.reroll,
        deck: l.deck,
        freeMove: l.freeMove,
        ...Object.fromEntries(l.calendar.map((r, i) => [`cal${i}`, r])),
        ...Object.fromEntries(l.calendarLinks.map((r, i) => [`link${i}`, r])),
        allyStatus: l.allyStatus,
        foeStatus: l.foeStatus,
      };
      if (l.scout) named.scout = l.scout;
      if (l.scoutButton) named.scoutButton = l.scoutButton;
      for (const [n, r] of Object.entries(named)) {
        // The board is world, not HUD: on a phone its 640 px diamond runs past both sides.
        if (n === 'board' && !l.desktop) continue;
        expect(inside(r, screen), `${n} ${JSON.stringify(r)}`).toBe(true);
      }
      expect(inside(l.shop, screen)).toBe(true);
      expect(l.calendar).toHaveLength(5);
      for (const c of l.calendar) {
        expect(c.w).toBe(52);
        expect(c.h).toBe(52);
      }
      for (const b of [l.sell, l.reroll, l.deck, l.freeMove, l.shop, l.confirm, l.cancel, ...(l.scoutButton ? [l.scoutButton] : [])]) {
        expect(b.w).toBeGreaterThanOrEqual(44);
        expect(b.h).toBeGreaterThanOrEqual(44);
      }
      // `fight` replaces the hand once a card is played; confirm/cancel appear only while aiming.
      expectSeparate(named);
      // Exactly one of the scout panel (desktop) and the scout button (mobile).
      expect((l.scout === null) !== (l.scoutButton === null)).toBe(true);
      // The scout panel only stands where it clears the board (spec 2026-11-08 §4); else it is a button.
      expect(l.scout === null || !overlaps(l.scout, l.board)).toBe(true);
      // ✓/✕ and the hint never sit on the calendar or the buttons.
      for (const r of [l.confirm, l.cancel, l.hint])
        for (const other of [...l.calendar, l.reroll, l.sell, l.deck, l.freeMove])
          expect(overlaps(r, other), JSON.stringify(r)).toBe(false);
    });
  }

  it('never throws for odd sizes', () => {
    for (const s of [
      { w: 0, h: 0 },
      { w: 100, h: 100 },
      { w: 768, h: 600 },
      { w: 900, h: 600 },
      { w: 1920, h: 1080 },
      { w: 600, h: 1400 },
    ])
      expect(() => planningLayout(s)).not.toThrow();
  });
});

describe('planning header and status zones', () => {
  const ODD: Size = { w: 900, h: 600 };
  const SIZES: readonly [string, Size][] = [
    ['desktop', DESKTOP],
    ['768', { w: 768, h: 1024 }],
    ['mobile', MOBILE],
    ['767', { w: 767, h: 900 }],
    ['odd 900×600', ODD],
  ];

  for (const [name, screen] of SIZES) {
    it(`planning_header_zones_do_not_overlap: lives, gold, help, year, calendar and links (${name})`, () => {
      const l = planningLayout(screen);
      const zones: Record<string, Rect> = {
        lives: l.lives, gold: l.gold, help: l.help, year: l.year,
        ...Object.fromEntries(l.calendar.map((r, i) => [`cal${i}`, r])),
      };
      const names = Object.keys(zones);
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) expect(overlaps(zones[names[i]!]!, zones[names[j]!]!), `${names[i]} × ${names[j]}`).toBe(false);
      }
      for (const link of l.calendarLinks) {
        expect(l.calendarLinks).toHaveLength(4);
        for (const c of l.calendar) expect(overlaps(link, c)).toBe(false);
      }
    });
  }

  it('desktop: the five-year strip is centred on the screen with the year label right under it', () => {
    const l = planningLayout(DESKTOP);
    const first = l.calendar[0]!;
    const last = l.calendar[4]!;
    expect((first.x + last.x + last.w) / 2).toBeCloseTo(DESKTOP.w / 2, 0);
    expect(l.year.y).toBeGreaterThanOrEqual(first.y + first.h);
    expect(l.year.x + l.year.w / 2).toBeCloseTo(DESKTOP.w / 2, 0);
  });

  it('phone_board_is_the_660x330_diamond at zoom 33/32, under the header', () => {
    const l = planningLayout(MOBILE);
    expect([l.board.w, l.board.h]).toEqual([660, 330]);
    for (const r of [...l.calendar, l.year, l.help]) expect(r.y + r.h).toBeLessThanOrEqual(l.board.y);
  });

  for (const [name, screen] of [['desktop', DESKTOP], ['mobile', MOBILE]] as const) {
    it(`four_card_hand_and_actions_clear_board: status rows sit apart from the hand, the actions and the board (${name})`, () => {
      const l = planningLayout(screen, 4);
      for (const status of [l.allyStatus, l.foeStatus]) {
        expect(inside(status, screen)).toBe(true);
        for (const other of [l.board, l.reroll, l.sell, l.deck, ...l.hand.map((r) => ({ ...r, y: r.y - 12 }))]) {
          expect(overlaps(status, other), JSON.stringify([status, other])).toBe(false);
        }
      }
      expect(overlaps(l.allyStatus, l.foeStatus)).toBe(false);
    });
  }

  it('the two status rows are on opposite sides: ally left, enemy right', () => {
    for (const screen of [DESKTOP, MOBILE]) {
      const l = planningLayout(screen);
      expect(l.allyStatus.x).toBeLessThan(l.foeStatus.x);
    }
  });
});

describe('plotScreenRect', () => {
  it('maps plots to the 128×64 diamonds of the isometric board (boxes)', () => {
    const l = planningLayout(DESKTOP);
    const z = l.zoom; // a 64 px plot is a 128z × 64z diamond
    const cw = 128 * z;
    const ch = 64 * z;
    const cx = l.board.x + l.board.w / 2 - cw / 2;
    const near = (r: { x: number; y: number; w: number; h: number }, e: { x: number; y: number }) => {
      expect(r.x).toBeCloseTo(e.x, 9);
      expect(r.y).toBeCloseTo(e.y, 9);
      expect(r.w).toBeCloseTo(cw, 9);
      expect(r.h).toBeCloseTo(ch, 9);
    };
    near(plotScreenRect(l, 0), { x: cx, y: l.board.y }); // the top corner
    near(plotScreenRect(l, 12), { x: cx, y: l.board.y + 2 * ch });
    near(plotScreenRect(l, 4), { x: cx - 2 * cw, y: l.board.y + 2 * ch }); // the left corner (world north-east)
    near(plotScreenRect(l, 20), { x: cx + 2 * cw, y: l.board.y + 2 * ch }); // the right corner (world south-west)
    near(plotScreenRect(l, 24), { x: cx, y: l.board.y + 4 * ch }); // the bottom corner
  });
});

describe('centerHand', () => {
  for (const [name, screen] of [
    ['desktop', DESKTOP],
    ['mobile', MOBILE],
  ] as const) {
    it(`centres 1–3 cards on the hand row and keeps them apart and on screen (${name})`, () => {
      const slots = planningLayout(screen).hand;
      const rowCentre = (slots[0]!.x + slots[2]!.x + slots[2]!.w) / 2;
      expect(centerHand(slots, 3)).toEqual([...slots]);
      for (const n of [2, 1]) {
        const placed = centerHand(slots, n);
        expect(placed).toHaveLength(n);
        const left = placed[0]!.x;
        const right = placed[n - 1]!.x + placed[n - 1]!.w;
        expect(Math.abs((left + right) / 2 - rowCentre)).toBeLessThanOrEqual(0.5);
        placed.forEach((r, i) => {
          expect(r.y).toBe(slots[i]!.y);
          expect(r.w).toBe(slots[i]!.w);
          expect(inside(r, screen)).toBe(true);
        });
        if (n === 2) expect(placed[1]!.x - (placed[0]!.x + placed[0]!.w)).toBe(slots[1]!.x - (slots[0]!.x + slots[0]!.w));
      }
    });
  }

  it('returns no slots for an empty hand and never more than the row holds', () => {
    const slots = planningLayout(DESKTOP).hand;
    expect(centerHand(slots, 0)).toEqual([]);
    expect(centerHand(slots, 7)).toEqual([...slots]);
    expect(centerHand([], 2)).toEqual([]);
  });
});

describe('planningZoom / realmCamera', () => {
  it('uses the overview zooms: planning fits above the hand, battle above the bottom bars, PLANNING_ZOOM on mobile', () => {
    expect(planningZoom(DESKTOP)).toBeCloseTo(1.19375 / 1.6, 12);
    expect(planningZoom({ w: 1920, h: 1080 })).toBeCloseTo(1.95 / 1.6, 12);
    expect(planningZoom(MOBILE)).toBe(PLANNING_ZOOM);
  });

  for (const screen of [DESKTOP, { w: 1920, h: 1080 }, { w: 1024, h: 768 }]) {
    it(`keeps both phase camera centres south of the wall on desktop ${screen.w}×${screen.h}`, () => {
      const planning = realmCamera(screen, 'planning');
      const battle = realmCamera(screen, 'battle');
      expect(battle.zoom).toBeGreaterThanOrEqual(planning.zoom);
      const centre = (cam: { zoom: number; scroll: { x: number; y: number } }) =>
        unproject(screenToWorld({ x: screen.w / 2, y: screen.h / 2 }, cam.scroll, screen, cam.zoom));
      // The map clamp may shift the board sideways at the farther overview.
      for (const cam of [planning, battle]) {
        const c = centre(cam);
        expect(c.y).toBeGreaterThanOrEqual(BATTLE.wallY);
        expect(c.x).toBeGreaterThanOrEqual(-BATTLE.plot);
        expect(c.x).toBeLessThanOrEqual(BATTLE.field + BATTLE.plot);
      }
    });

    it(`centres the board across the screen, inside the band above the hand, on ${screen.w}×${screen.h}`, () => {
      const l = planningLayout(screen);
      expect(inside(l.board, screen)).toBe(true);
      expect(l.board.y).toBeGreaterThanOrEqual(104);
      expect(l.board.y + l.board.h).toBeLessThanOrEqual(l.hand[0]!.y - 16);
    });
  }

  it('uses zoom 33/32 for planning and for the battle on mobile', () => {
    expect(realmCamera(MOBILE, 'planning').zoom).toBe(33 / 32);
    expect(realmCamera(MOBILE, 'battle').zoom).toBe(33 / 32);
  });

  it('puts the board centre where planningLayout drew the board', () => {
    for (const screen of [DESKTOP, MOBILE, { w: 1920, h: 1080 }]) {
      const l = planningLayout(screen);
      const cam = realmCamera(screen, 'planning');
      // The top corner of the diamond is the board's world north-west corner.
      const p = unproject(screenToWorld({ x: l.board.x + l.board.w / 2, y: l.board.y }, cam.scroll, screen, cam.zoom));
      expect(p.x).toBeCloseTo(BATTLE.boardOrigin, 6);
      expect(p.y).toBeCloseTo(BATTLE.boardOrigin, 6);
    }
  });
});

describe('realmCameraMix', () => {
  it('equals the planning camera at 0 and the battle camera at 1', () => {
    for (const screen of [DESKTOP, MOBILE]) {
      const start = realmCameraMix(screen, 'planning', 'battle', 0);
      const end = realmCameraMix(screen, 'planning', 'battle', 1);
      const planning = realmCamera(screen, 'planning');
      const battle = realmCamera(screen, 'battle');
      expect(start.zoom).toBeCloseTo(planning.zoom, 9);
      expect(start.scroll.x).toBeCloseTo(planning.scroll.x, 6);
      expect(start.scroll.y).toBeCloseTo(planning.scroll.y, 6);
      expect(end.zoom).toBeCloseTo(battle.zoom, 9);
      expect(end.scroll.x).toBeCloseTo(battle.scroll.x, 6);
      expect(end.scroll.y).toBeCloseTo(battle.scroll.y, 6);
    }
  });

  it('keeps the phone zoom: both phases are at 33/32', () => {
    const mid = realmCameraMix(MOBILE, 'planning', 'battle', 0.5);
    expect(mid.zoom).toBe(33 / 32);
    const centre = unproject(screenToWorld({ x: MOBILE.w / 2, y: MOBILE.h / 2 }, mid.scroll, MOBILE, mid.zoom));
    expect(Math.abs(centre.x - BATTLE.field / 2)).toBeLessThan(200);
  });

  it('moves the zoom linearly between the two desktop overviews', () => {
    const a = realmCameraMix(DESKTOP, 'planning', 'battle', 0.3);
    const p = realmCamera(DESKTOP, 'planning').zoom;
    const b = realmCamera(DESKTOP, 'battle').zoom;
    expect(a.zoom).toBeCloseTo(p + (b - p) * 0.3, 12);
  });
});

describe('plotAtScreen over every plot', () => {
  for (const screen of [DESKTOP, MOBILE, { w: 1920, h: 1080 }]) {
    it(`inverts plotScreenRect for plots 0..24 on ${screen.w}×${screen.h}`, () => {
      const l = planningLayout(screen);
      for (let plot = 0; plot < 25; plot++) {
        const r = plotScreenRect(l, plot);
        expect(plotAtScreen(l, { x: r.x + r.w / 2, y: r.y + r.h / 2 })).toBe(plot);
      }
    });
  }
});

describe('plotAtScreen', () => {
  it('inverts plotScreenRect and returns null off the board', () => {
    for (const screen of [DESKTOP, MOBILE]) {
      const l = planningLayout(screen);
      for (const plot of [0, 7, 12, 24]) {
        const r = plotScreenRect(l, plot);
        const c = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
        expect(plotAtScreen(l, c)).toBe(plot);
        // just inside each of the diamond's four corners
        for (const p of [{ x: c.x, y: r.y + 1 }, { x: r.x + 2, y: c.y }, { x: r.x + r.w - 2, y: c.y }, { x: c.x, y: r.y + r.h - 1 }])
          expect(plotAtScreen(l, p), JSON.stringify(p)).toBe(plot);
      }
      // the box corners are outside the diamond
      expect(plotAtScreen(l, { x: l.board.x + 1, y: l.board.y + 1 })).toBeNull();
      expect(plotAtScreen(l, { x: l.board.x + l.board.w - 1, y: l.board.y + l.board.h - 1 })).toBeNull();
    }
  });
});

describe('hint rect', () => {
  for (const [name, screen] of [
    ['desktop', DESKTOP],
    ['mobile', MOBILE],
  ] as const) {
    it(`sits above the board, clear of the HUD and ✓/✕ (${name})`, () => {
      const l = planningLayout(screen);
      expect(inside(l.hint, screen)).toBe(true);
      expect(l.hint.w).toBeGreaterThanOrEqual(100);
      expect(l.hint.h).toBeGreaterThanOrEqual(40);
      expectSeparate({
        hint: l.hint,
        lives: l.lives,
        gold: l.gold,
        year: l.year,
        ...(l.desktop ? {} : { board: l.board }),
        ...(l.scout ? { scout: l.scout } : {}),
        ...(l.desktop ? {} : { confirm: l.confirm, cancel: l.cancel }),
      });
      // desktop: the hint sits in the empty corner of the board box, off every plot diamond (spec 2026-11-08 §4)
      if (l.desktop)
        for (const c of [
          { x: l.hint.x, y: l.hint.y },
          { x: l.hint.x + l.hint.w, y: l.hint.y },
          { x: l.hint.x, y: l.hint.y + l.hint.h },
          { x: l.hint.x + l.hint.w, y: l.hint.y + l.hint.h },
        ])
          expect(plotAtScreen(l, c)).toBeNull();
    });
  }
});

describe('confirmFor', () => {
  for (const [name, screen] of [
    ['desktop', DESKTOP],
    ['mobile', MOBILE],
  ] as const) {
    it(`keeps ✓/✕ on screen for edge plots (${name})`, () => {
      const l = planningLayout(screen);
      for (const plot of [0, 4, 10, 14, 20, 24]) {
        const cell = plotScreenRect(l, plot);
        const { confirm, cancel } = confirmFor(l, cell, screen);
        for (const b of [confirm, cancel]) {
          expect(inside(b, screen), `plot ${plot}: ${JSON.stringify(b)}`).toBe(true);
          expect(b.w).toBeGreaterThanOrEqual(44);
          expect(b.h).toBeGreaterThanOrEqual(44);
          expect(overlaps(b, cell), `plot ${plot} covered`).toBe(false);
        }
        expect(overlaps(confirm, cancel)).toBe(false);
      }
    });
  }

  it('flips to the left of a plot that has no room on the right', () => {
    const l = planningLayout(DESKTOP);
    const cell: Rect = { x: 1200, y: 300, w: 64, h: 64 };
    const { confirm, cancel } = confirmFor(l, cell, DESKTOP);
    expect(confirm.x + confirm.w).toBeLessThanOrEqual(cell.x);
    expect(cancel.x + cancel.w).toBeLessThanOrEqual(cell.x);
  });

  it('uses the row above the board on mobile', () => {
    const l = planningLayout(MOBILE);
    const { confirm, cancel } = confirmFor(l, plotScreenRect(l, 7), MOBILE);
    expect(confirm).toEqual(l.confirm);
    expect(cancel).toEqual(l.cancel);
    expect(confirm.y + confirm.h).toBeLessThanOrEqual(l.board.y);
  });
});

describe('battleZoom', () => {
  it('is the battle overview: min(0.65·w / 640, (h − 176) / 320, 3) on desktop, 33/32 on phones (spec 2026-11-08 §4)', () => {
    expect(battleZoom(1280, 720)).toBeCloseTo(1.3 / 1.6, 12);
    expect(battleZoom(375, 812)).toBe(33 / 32);
    expect(battleZoom(1920, 1080)).toBeCloseTo(1.95 / 1.6, 12);
    expect(battleZoom(2560, 1600)).toBeCloseTo(2.6 / 1.6, 12);
    expect(battleZoom(4000, 2000)).toBe(3 / 1.6);
    expect(battleZoom(100, 100)).toBe(33 / 32);
  });
});

describe('battleLayout', () => {
  const SIZES: readonly [string, Size][] = [
    ['desktop', DESKTOP],
    ['768', { w: 768, h: 1024 }],
    ['odd 900×600', { w: 900, h: 600 }],
    ['mobile', MOBILE],
    ['767', { w: 767, h: 900 }],
  ];
  const partsOf = (l: ReturnType<typeof battleLayout>): Record<string, Rect> => ({
    clock: l.clock,
    lives: l.lives,
    gold: l.gold,
    help: l.help,
    year: l.year,
    foes: l.foes,
    waves: l.waves,
    intervene: l.intervene,
    auto: l.auto,
    allyStatus: l.allyStatus,
    foeStatus: l.foeStatus,
    bossStatus: l.bossStatus,
    ...Object.fromEntries(l.speed.map((r, i) => [`speed${i}`, r])),
    ...Object.fromEntries(l.calendar.map((r, i) => [`cal${i}`, r])),
  });

  for (const [name, screen] of SIZES) {
    it(`battle_top_controls_fit: every part is on screen and apart (${name})`, () => {
      const l = battleLayout(screen);
      const parts = partsOf(l);
      for (const [n, r] of Object.entries(parts)) expect(inside(r, screen), `${n} ${JSON.stringify(r)}`).toBe(true);
      expectSeparate(parts);
      for (const link of l.calendarLinks) for (const c of l.calendar) expect(overlaps(link, c)).toBe(false);
      expect(l.speed).toHaveLength(4);
      for (const b of [...l.speed, l.auto, l.waves, l.intervene, l.help]) {
        expect(b.w, JSON.stringify(b)).toBeGreaterThanOrEqual(44);
        expect(b.h, JSON.stringify(b)).toBeGreaterThanOrEqual(44);
      }
      for (const b of l.speed) expect([b.w, b.h]).toEqual([48, 48]);
    });

    it(`bottom_health_bars_do_not_overlap: ally bar left, enemy bar right, at the bottom (${name})`, () => {
      const l = battleLayout(screen);
      expect(l.allyStatus.x).toBeLessThan(l.foeStatus.x);
      expect(overlaps(l.allyStatus, l.foeStatus)).toBe(false);
      for (const r of [l.allyStatus, l.foeStatus]) {
        expect(r.y + r.h).toBe(screen.h - 10);
        expect(r.w).toBeGreaterThanOrEqual(170);
      }
      expect(l.intervene.x).toBe(l.allyStatus.x);
      expect(l.intervene.y + l.intervene.h).toBeLessThanOrEqual(l.allyStatus.y);
    });
  }

  it('desktop: the speed controls sit in the top-right corner', () => {
    const l = battleLayout(DESKTOP);
    expect(new Set(l.speed.map((b) => b.y)).size).toBe(1);
    expect(l.speed[0]!.y).toBe(10);
    expect(l.speed[3]!.x + l.speed[3]!.w).toBe(1270);
    l.speed.forEach((b, i) => {
      if (i > 0) expect(b.x - (l.speed[i - 1]!.x + 48)).toBe(2);
    });
    expect(l.waves.x + l.waves.w).toBe(l.foes.x + l.foes.w);
    expect(l.waves.y).toBeGreaterThanOrEqual(l.foes.y + l.foes.h);
  });

  it('phone_speed_wraps_into_two_rows: two rows of two on the right, above the enemy bar', () => {
    const l = battleLayout(MOBILE);
    expect(new Set(l.speed.map((b) => b.y)).size).toBe(2);
    expect(new Set(l.speed.map((b) => b.x)).size).toBe(2);
    for (const b of l.speed) expect(b.y + b.h).toBeLessThanOrEqual(l.foeStatus.y);
    expect(l.speed[1]!.x + l.speed[1]!.w).toBe(MOBILE.w - 10);
  });

  it('shows the same year strip and year label as the planning HUD, with the clock under it', () => {
    for (const screen of [DESKTOP, MOBILE]) {
      const b = battleLayout(screen);
      const p = planningLayout(screen);
      expect(b.calendar).toEqual(p.calendar);
      expect(b.year).toEqual(p.year);
      expect(b.clock.y).toBeGreaterThanOrEqual(b.year.y + b.year.h);
    }
  });

  it('boss_and_summary_clear_controls: the boss row is below the clock and apart from every control', () => {
    for (const [, screen] of SIZES) {
      const l = battleLayout(screen);
      expect(l.bossStatus.y).toBeGreaterThanOrEqual(l.clock.y + l.clock.h);
      for (const r of [...l.speed, l.auto, l.waves, l.intervene, l.foes, l.help]) expect(overlaps(l.bossStatus, r)).toBe(false);
    }
  });

  it('puts Can Thiệp bottom-left with Tự bắn right beside it, above the ally bar', () => {
    for (const screen of [DESKTOP, MOBILE]) {
      const l = battleLayout(screen);
      expect([l.intervene.w, l.intervene.h]).toEqual([72, 72]);
      expect(l.auto.x).toBeGreaterThanOrEqual(l.intervene.x + l.intervene.w);
      expect(l.auto.y + l.auto.h).toBeLessThanOrEqual(l.allyStatus.y);
    }
  });

  it('reuses the planning lives, gold and help', () => {
    for (const screen of [DESKTOP, MOBILE]) {
      const b = battleLayout(screen);
      const p = planningLayout(screen);
      expect([b.lives, b.gold, b.help]).toEqual([p.lives, p.gold, p.help]);
    }
  });
});

describe('cameraScroll / screenToWorld', () => {
  it('are inverses', () => {
    const world = { x: 192, y: 192 };
    const target = { x: 640, y: 340 };
    const scroll = cameraScroll(world, target, DESKTOP, 2);
    const back = screenToWorld(target, scroll, DESKTOP, 2);
    expect(Math.abs(back.x - world.x)).toBeLessThan(1e-9);
    expect(Math.abs(back.y - world.y)).toBeLessThan(1e-9);
  });

  it('matches Phaser: screen = mid + (p − scroll − mid) · zoom', () => {
    const world = { x: 100, y: 50 };
    const target = { x: 300, y: 600 };
    for (const zoom of [1, 2, 3]) {
      const s = cameraScroll(world, target, MOBILE, zoom);
      const mid = { x: MOBILE.w / 2, y: MOBILE.h / 2 };
      expect(mid.x + (world.x - s.x - mid.x) * zoom).toBeCloseTo(target.x, 9);
      expect(mid.y + (world.y - s.y - mid.y) * zoom).toBeCloseTo(target.y, 9);
    }
  });

  it('centres the world point with zoom 1 at screen mid', () => {
    expect(cameraScroll({ x: 192, y: 192 }, { x: 640, y: 360 }, DESKTOP, 1)).toEqual({
      x: 192 - 640,
      y: 192 - 360,
    });
  });
});

describe('battleCamera / battleWorldAt', () => {
  it('centres the board (world 384,384), not the back-row throne, on screen', () => {
    for (const screen of [DESKTOP, MOBILE]) {
      const mid = { x: screen.w / 2, y: screen.h / 2 };
      const p = battleWorldAt(mid, screen)!;
      const cam = battleCamera(screen);
      const expected = unproject(screenToWorld(mid, cam.scroll, screen, cam.zoom));
      expect(p.x).toBeCloseTo(expected.x, 9);
      expect(p.y).toBeCloseTo(expected.y, 9);
    }
    expect(battleCamera(DESKTOP).zoom).toBeCloseTo(1.3 / 1.6, 12);
    expect(battleCamera(MOBILE).zoom).toBe(33 / 32);
  });

  it('maps screen offsets by 1 / zoom and returns null off the field', () => {
    // Screen (+130, −65) from the centre at zoom 1.3 is projected (100, 334): world (334 − 50, 334 + 50).
    const p = battleWorldAt({ x: 640 + 130, y: 360 - 65 }, DESKTOP)!;
    const cam = battleCamera(DESKTOP);
    const expected = unproject(screenToWorld({ x: 770, y: 295 }, cam.scroll, DESKTOP, cam.zoom));
    expect(p.x).toBeCloseTo(expected.x, 9);
    expect(p.y).toBeCloseTo(expected.y, 9);
    // The screen's top-left corner is off the field (west of it).
    expect(battleWorldAt({ x: 0, y: 0 }, DESKTOP)).toBeNull();
    // On the board-centre row, the field's west edge (world x 0) is 768 projected px right of the centre.
    const z = 33 / 32;
    expect(battleWorldAt({ x: 187.5 + 768 * z, y: 406 }, MOBILE)!.x).toBeCloseTo(0, 9);
    expect(battleWorldAt({ x: 187.5 + 770 * z, y: 406 }, MOBILE)).toBeNull();
  });
});

describe('hand of four (Bàn Tay Thứ Tư)', () => {
  it('keeps the three-card row unchanged', () => {
    for (const screen of [DESKTOP, MOBILE]) {
      const three = planningLayout(screen).hand;
      expect(three).toHaveLength(3);
      expect(planningLayout(screen, 3).hand).toEqual(three);
    }
  });

  for (const [name, screen] of [
    ['desktop', DESKTOP],
    ['mobile', MOBILE],
    ['900×600', { w: 900, h: 600 }],
  ] as const) {
    it(`lays four cards side by side inside the screen, apart, ≥44 px wide (${name})`, () => {
      const l = planningLayout(screen, 4);
      expect(l.hand).toHaveLength(4);
      for (const r of l.hand) {
        if (!l.desktop || l.hand.length <= 3) expect(inside(r, screen), JSON.stringify(r)).toBe(true);
        expect(r.w).toBeGreaterThanOrEqual(44);
      }
      for (let i = 1; i < 4; i++) expect(l.hand[i]!.x).toBeGreaterThanOrEqual(l.hand[i - 1]!.x + l.hand[i - 1]!.w);
      expect(new Set(l.hand.map((r) => r.y)).size).toBe(1);
    });
  }

  it('shrinks the cards on mobile only as far as needed and keeps their proportions', () => {
    const [a] = planningLayout(MOBILE, 4).hand;
    expect(a!.w).toBeLessThan(108);
    expect(a!.w / a!.h).toBeCloseTo(108 / 162, 1);
  });

  it('four_cards_fit_phone: every card of a four-card hand fits the vertical card layout in compact density', () => {
    const { hand } = planningLayout(MOBILE, 4);
    for (const r of hand) {
      expect(r.w).toBeGreaterThanOrEqual(72);
      expect(r.w).toBeLessThan(100); // compact density
      const l = cardLayout({ w: r.w, h: r.h }, 4, 'compact');
      for (const part of [l.header, l.art, l.badge, l.description]) {
        expect(part.x + part.w).toBeLessThanOrEqual(r.w);
        expect(part.y + part.h).toBeLessThanOrEqual(r.h);
      }
      expect(fitArt(l.art, { w: 32, h: 24 }).scale).toBeGreaterThanOrEqual(2);
    }
  });

  it('centerHand centres a short hand on the four-slot row', () => {
    const slots = planningLayout(DESKTOP, 4).hand;
    const used = centerHand(slots, 3);
    const mid = (slots[0]!.x + slots[3]!.x + slots[3]!.w) / 2;
    expect((used[0]!.x + used[2]!.x + used[2]!.w) / 2).toBeCloseTo(mid, 0);
  });
});

describe('decree and quest panel', () => {
  it('wide desktop docks a 260 px column on the left, clear of the board, scout and top bar', () => {
    const screen = { w: 2000, h: 994 };
    const l = planningLayout(screen);
    expect(l.decreeButton).toBeNull();
    const p = l.decreePanel!;
    expect(p.w).toBe(260);
    expect(p.y).toBeGreaterThanOrEqual(72);
    expect(p.y + p.h).toBeLessThanOrEqual(520);
    expect(inside(p, screen)).toBe(true);
    for (const other of [l.board, l.scout!, l.lives, l.gold, l.year, l.reroll, l.sell, ...l.hand]) {
      expect(overlaps(p, other), JSON.stringify(other)).toBe(false);
    }
  });

  it('mobile and narrow desktop use a ≥44 px button that overlaps nothing', () => {
    for (const screen of [MOBILE, { w: 900, h: 600 }]) {
      const l = planningLayout(screen);
      expect(l.decreePanel).toBeNull();
      const b = l.decreeButton!;
      expect(b.w).toBeGreaterThanOrEqual(44);
      expect(b.h).toBeGreaterThanOrEqual(44);
      expect(inside(b, screen)).toBe(true);
      const others: Rect[] = [l.lives, l.gold, l.year, l.reroll, l.sell, l.deck, ...l.calendar, ...l.hand];
      if (l.scoutButton) others.push(l.scoutButton);
      if (l.scout) others.push(l.scout);
      for (const other of others) expect(overlaps(b, other), JSON.stringify(other)).toBe(false);
      expect(overlapsDiamond(b, l.board), 'board').toBe(false);
    }
  });
});

describe('overviewZoom: the farthest zoom-out, like the owner reference picture (spec 2026-11-08 §4)', () => {
  it('overview_65_percent_clamps_to_hud_height', () => {
    expect(legacyOverviewZoom(DESKTOP, 'planning')).toBeCloseTo(1.19375, 12);
    expect(legacyOverviewZoom(DESKTOP, 'battle')).toBeCloseTo(1.3, 12);
    for (const phase of ['planning', 'battle'] as const) {
      expect(legacyOverviewZoom({ w: 2000, h: 994 }, phase)).toBeCloseTo(2.03125, 12);
      expect(legacyOverviewZoom({ w: 1920, h: 1080 }, phase)).toBeCloseTo(1.95, 12);
      expect(overviewZoom(MOBILE, phase)).toBe(33 / 32);
    }
    expect(planningZoom(DESKTOP)).toBe(overviewZoom(DESKTOP, 'planning'));
    expect(battleZoom(1280, 720)).toBe(overviewZoom(DESKTOP, 'battle'));
    const lay = planningLayout({ w: 2000, h: 994 });
    expect(lay.board.w / 2000).toBeCloseTo(0.65 / 1.6, 12);
  });

  it('mobile_diamond_contains_44_square: a plot diamond holds a 44 × 44 touch square at the phone overview', () => {
    const z = overviewZoom(MOBILE, 'planning');
    expect((128 * z) / 3).toBeGreaterThanOrEqual(44);
    expect(PLANNING_ZOOM).toBe(z);
  });

  it('four_cards_recompute_vertical_fit: the zoom follows the real hand height', () => {
    const short = { w: 1280, h: 600 };
    const top = planningLayout(short, 4).hand[0]!.y;
    expect(legacyOverviewZoom(short, 'planning', 4)).toBeCloseTo(Math.min((0.65 * 1280) / 640, (top - 16 - 104) / 320), 12);
  });

  it('side_panels_collapse_when_board_overlaps, and stand beside a board they clear', () => {
    const narrow = planningLayout(DESKTOP);
    expect(narrow.scout).not.toBeNull();
    expect(narrow.decreePanel).not.toBeNull();
    expect(narrow.scoutButton).toBeNull();
    const wide = planningLayout({ w: 2000, h: 994 });
    expect(wide.scout).not.toBeNull();
    expect(wide.decreePanel).not.toBeNull();
    expect(wide.decreePanel!.x + wide.decreePanel!.w + 16).toBeLessThanOrEqual(wide.board.x);
    expect(wide.board.x + wide.board.w + 16).toBeLessThanOrEqual(wide.scout!.x);
  });

  it('mobile_buttons_clear_board_and_hand', () => {
    const lay = planningLayout(MOBILE);
    expect([lay.board.y, lay.board.y + lay.board.h]).toEqual([180, 180 + 330]);
    expect([lay.deck.y, lay.deck.y + lay.deck.h]).toEqual([530, 578]);
    expect(lay.hand[0]!.y).toBe(640);
    expect(lay.allyStatus.y + lay.allyStatus.h).toBeLessThanOrEqual(lay.hand[0]!.y);
  });
});

describe('Endless overview', () => {
  it('fits 896 projected px on desktop and keeps phone touch zoom', () => {
    expect(overviewZoom(DESKTOP, 'planning', 3, 'endless')).toBeCloseTo(382 / 448 / 1.6, 12);
    expect(overviewZoom(DESKTOP, 'battle', 3, 'endless')).toBeCloseTo(832 / 896 / 1.6, 12);
    for (const phase of ['planning', 'battle'] as const)
      expect(overviewZoom(MOBILE, phase, 3, 'endless')).toBe(33 / 32);
    const board = planningLayout(DESKTOP, 3, 'endless').board;
    expect(board.w).toBeCloseTo(764 / 1.6, 12);
    expect(board.h).toBeCloseTo(382 / 1.6, 12);
  });
});

describe('desktop zoom limits and shop', () => {
  it('close-up art raises only the top zoom (12/11/2026); the overview zoom stays', () => {
    for (const screen of [DESKTOP, { w: 375, h: 812 }]) {
      for (const phase of ['planning', 'battle'] as const) {
        const base = realmZoomLimits(screen, phase);
        expect(realmZoomLimits(screen, phase, 'normal', 6)).toEqual({ min: base.min, max: 6 });
        expect(realmZoomLimits(screen, phase, 'normal', null)).toEqual(base);
      }
    }
  });
  it('uses stable five-slot legacy context for each phase', () => {
    expect(realmZoomLimits(DESKTOP, 'planning')).toEqual({ max: 1.19375, min: 0.74609375 });
    expect(realmZoomLimits(DESKTOP, 'battle')).toEqual({ max: 1.3, min: 0.8125 });
    for (const mode of ['normal', 'endless'] as const) {
      for (const screen of [{ w: 768, h: 720 }, DESKTOP, { w: 1920, h: 1080 }]) {
        for (const phase of ['planning', 'battle'] as const) {
          const limits = realmZoomLimits(screen, phase, mode);
          expect(limits.max).toBe(legacyOverviewZoom(screen, phase, 5, mode));
          expect(overviewZoom(screen, phase, 12, mode)).toBe(limits.min);
          expect(limits.min).toBe(limits.max / 1.6);
        }
      }
    }
  });
  it('keeps shop targets usable and clear of the desktop hand', () => {
    for (const count of [3, 5, 6, 12]) {
      const l = planningLayout(DESKTOP, count);
      expect(l.shop.w).toBeGreaterThanOrEqual(44);
      expect(l.shop.h).toBeGreaterThanOrEqual(44);
      expect(l.shop.x + l.shop.w).toBeLessThanOrEqual(168);
      expect(overlaps(l.shop, l.sell)).toBe(false);
      expect(overlaps(l.shop, l.reroll)).toBe(false);
    }
  });
});
