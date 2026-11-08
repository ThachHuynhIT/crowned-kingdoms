import { project, unproject } from '../../core/iso';
import { BATTLE } from '../../data/battle';
import { plotCol, plotRow } from '../../game/run/board';
import { CARD_LIFT, GAP, MARGIN, SPEED_GAP, type Point, type Rect, type Size } from '../hud/layout';
import { calendarStripLayout } from '../planning/calendarStripLayout';

/**
 * Pure layout maths of the realm screens (no Phaser): the planning HUD (§10.4), the battle
 * HUD (§10.7) and the camera scroll/zoom maths. Rects are logical screen px. Laid out for
 * the two canonical sizes (desktop 1280×720, mobile 375×812; `width ≥ 768` uses desktop
 * rules); other sizes are best effort and never throw.
 */

/** §10.1: from 768 px wide the desktop layout is used. */
export const isDesktop = (width: number): boolean => width >= 768;

/**
 * Farthest zoom-out on a phone (spec 2026-11-08 §4): a plot diamond 128z × 64z holds an axis-aligned square of side
 * 128z/3, so z = 33/32 is the smallest zoom that keeps a 44 × 44 touch square inside every plot.
 */
export const PLANNING_ZOOM = 33 / 32;
/** Highest camera zoom (spec 2026-11-08 §4: free zoom up to 3×). */
export const ZOOM_MAX = 3;
/** Desktop overview: the board fills this share of the screen width (owner 08/11/2026, from the reference picture). */
export const OVERVIEW_BOARD_SHARE = 0.65;
/** Desktop: the board stays below the top HUD rows (lives, strip, year label) … */
const DESK_TOP_HUD = 104;
/** … and above the hand (planning, with a 16 px gap) or the bottom bars (battle). */
const DESK_HAND_GAP = 16;
const DESK_BATTLE_BOTTOM = 72;
/** The board is 5×5 plots (spec §4.1, `src/game/run/board.ts`). */
const BOARD_SIDE = 5;
/**
 * The board on screen at zoom 1 (isometric, spec 2026-11-06): a diamond 128×64 per plot, so the
 * whole 5×5 board is a diamond 640 wide and 320 tall. Layout rects hold its bounding box.
 */
const ISO_BOARD_W = 2 * BOARD_SIDE * BATTLE.plot;
const ISO_BOARD_H = BOARD_SIDE * BATTLE.plot;

/**
 * The overview (farthest) zoom of a phase (spec 2026-11-08 §4), a free (fractional) zoom. Desktop: the board is
 * `OVERVIEW_BOARD_SHARE` of the screen width, but no taller than the room between the top HUD and the hand
 * (planning) or the bottom bars (battle), and never past `ZOOM_MAX`. Phone: `PLANNING_ZOOM` in both phases
 * (touch targets first; the player drags to the side plots).
 */
export const overviewZoom = (screen: Size, phase: RealmPhase, handSize = 3): number => {
  if (!isDesktop(screen.w)) return PLANNING_ZOOM;
  const bottom =
    phase === 'planning' ? handRow(screen, DESK.card, handSize)[0]!.y - DESK_HAND_GAP : screen.h - DESK_BATTLE_BOTTOM;
  const room = Math.max(1, bottom - DESK_TOP_HUD);
  return Math.max(0.25, Math.min((OVERVIEW_BOARD_SHARE * screen.w) / ISO_BOARD_W, room / ISO_BOARD_H, ZOOM_MAX));
};

/** Battle overview zoom (§10.7, spec 2026-11-08 §4). */
export const battleZoom = (width: number, height: number): number => overviewZoom({ w: width, h: height }, 'battle');

/** Planning overview zoom (§10.4, spec 2026-11-08 §4); the camera eases to the battle one when a battle starts. */
export const planningZoom = (screen: Size, handSize = 3): number => overviewZoom(screen, 'planning', handSize);

const BUTTON = 48;
const BUTTON_GAP = 8;

const DESK = {
  top: { lives: 120, gold: 120, year: 160, h: 52 },
  scout: { w: 260, y: 92, bottom: 520 },
  card: { w: 120, h: 176, gap: 12 },
  button: { w: 140, h: 52 },
} as const;

/** A calendar cell: the year, an attacker badge and attack dots (§10.4). */
const CELL = 52;
const CALENDAR_CELLS = 5;

const PHONE = {
  top: { lives: 96, gold: 96, h: 48 },
  /** Second row: calendar + scout button (y 64..116). */
  rowY: 64,
  /** Below the calendar row and the ✓/✕ row above the board. */
  boardY: 180,
  /** Deck / reroll / sell, one row under the board; ends well above the hand (y 650). */
  buttons: { w: 84, h: 48, y: 530 },
  card: { w: 108, h: 162, gap: 8 },
} as const;

const FIGHT = { w: 200, h: 56 } as const;
/** The year label under the strip, and the two status rows at the bottom corners. */
const YEAR_LABEL_H = 26;
const STATUS_H = 44;
const STATUS_H_PHONE = 40;
const STATUS_W = 240;
/** Height of the desktop play-hint box (one or two lines of 13 px text in a tooltip frame). */
const HINT_H = 48;
const HAND_BOTTOM = 10;

export interface PlanningLayout {
  desktop: boolean;
  /** Camera zoom of the planning phase: one plot is `BATTLE.plot × zoom` screen px. */
  zoom: number;
  lives: Rect;
  gold: Rect;
  /** The "Trợ giúp" button, just right of the gold box. */
  help: Rect;
  year: Rect;
  /** Five 52×52 cells: this year and the next four. */
  calendar: readonly Rect[];
  /** The bars joining the five cells (drawn, not tappable). */
  calendarLinks: readonly Rect[];
  /** Bottom-left: the playing king. */
  allyStatus: Rect;
  /** Bottom-right: who attacks next. */
  foeStatus: Rect;
  board: Rect;
  /** The scouting report column (desktop); null on mobile, where `scoutButton` opens it. */
  scout: Rect | null;
  scoutButton: Rect | null;
  /** The decrees-and-quests column (wide desktop); null elsewhere, where `decreeButton` opens it. */
  decreePanel: Rect | null;
  decreeButton: Rect | null;
  hand: readonly Rect[];
  /** "Đổi bài", "Bán bài" and "Bộ bài". */
  reroll: Rect;
  sell: Rect;
  deck: Rect;
  /** "Dời trại (N)", the Nomad King's free relocation (shown only for him): over "Bộ bài" on desktop, right of ✓/✕ on a phone. */
  freeMove: Rect;
  fight: Rect;
  /** Default ✓/✕ spot: the row above the board on mobile, beside the centre plot on desktop. */
  confirm: Rect;
  cancel: Rect;
  /** Room for the play hint (a `tooltip` box): above the board, clear of ✓/✕ on mobile. */
  hint: Rect;
}

/**
 * The hand row for `count` cards. A fourth card (Bàn Tay Thứ Tư) that would not fit the screen
 * shrinks every card, keeping the aspect ratio, so the row fits between the margins.
 */
const handRow = (screen: Size, card: { w: number; h: number; gap: number }, count = 3): Rect[] => {
  const n = Math.max(1, count);
  const avail = screen.w - 2 * MARGIN;
  let { w, h } = card;
  if (n * w + (n - 1) * card.gap > avail) {
    w = Math.max(1, Math.floor((avail - (n - 1) * card.gap) / n));
    h = Math.round((card.h * w) / card.w);
  }
  const total = n * w + (n - 1) * card.gap;
  const x0 = Math.round((screen.w - total) / 2);
  const y = screen.h - h - HAND_BOTTOM;
  return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (w + card.gap), y, w, h }));
};

/**
 * Slots for the first `count` cards of a hand that may hold fewer than the row's slots: the
 * same size, spacing and y, shifted so the cards sit centred on the row.
 */
export const centerHand = (slots: readonly Rect[], count: number): Rect[] => {
  const n = Math.max(0, Math.min(count, slots.length));
  if (n === 0) return [];
  const first = slots[0]!;
  const last = slots[slots.length - 1]!;
  const rowCentre = (first.x + last.x + last.w) / 2;
  const used = slots.slice(0, n);
  const left = used[0]!.x;
  const right = used[n - 1]!.x + used[n - 1]!.w;
  const shift = Math.round(rowCentre - (left + right) / 2);
  return used.map((r) => ({ ...r, x: r.x + shift }));
};

/** The 200×56 "Ra trận" button, centred on the hand row it replaces. */
const fightOver = (screen: Size, hand: readonly Rect[]): Rect => {
  const row = hand[0] ?? { x: 0, y: screen.h - FIGHT.h - HAND_BOTTOM, w: 0, h: FIGHT.h };
  return {
    x: Math.round((screen.w - FIGHT.w) / 2),
    y: Math.round(row.y + (row.h - FIGHT.h) / 2),
    w: FIGHT.w,
    h: FIGHT.h,
  };
};

/** Mobile ✓/✕: a centred pair in the gap above the board (✕ left, ✓ right). */
const aboveBoard = (screen: Size, board: Rect): { confirm: Rect; cancel: Rect } => {
  const y = Math.max(0, board.y - BUTTON - GAP);
  const mid = screen.w / 2;
  return {
    cancel: { x: Math.round(mid - BUTTON_GAP / 2 - BUTTON), y, w: BUTTON, h: BUTTON },
    confirm: { x: Math.round(mid + BUTTON_GAP / 2), y, w: BUTTON, h: BUTTON },
  };
};

/** Desktop ✓/✕: side by side right of the plot (✓ nearest), flipped left if it would overflow. */
const besidePlot = (cell: Rect, screen: Size): { confirm: Rect; cancel: Rect } => {
  const y = Math.max(
    MARGIN,
    Math.min(Math.round(cell.y + (cell.h - BUTTON) / 2), screen.h - MARGIN - BUTTON),
  );
  const rightX = cell.x + cell.w + GAP;
  if (rightX + 2 * BUTTON + GAP <= screen.w - MARGIN)
    return {
      confirm: { x: rightX, y, w: BUTTON, h: BUTTON },
      cancel: { x: rightX + BUTTON + GAP, y, w: BUTTON, h: BUTTON },
    };
  const leftX = Math.max(0, cell.x - GAP - BUTTON);
  return {
    confirm: { x: leftX, y, w: BUTTON, h: BUTTON },
    cancel: { x: Math.max(0, leftX - GAP - BUTTON), y, w: BUTTON, h: BUTTON },
  };
};

/**
 * From this width the decree / quest column (left) and the scout panel (right) may stand beside the
 * isometric board, and only where they clear its box by `PANEL_CLEAR`; otherwise each becomes a button,
 * like the phone (spec 2026-11-08 §4).
 */
const WIDE_DESKTOP = 1200;
const PANEL_CLEAR = 16;
const DECREE_PANEL_W = 260;

/** Help button next to the gold box (same height); 52 wide, so it is a comfortable touch target too. */
const helpRect = (gold: Rect): Rect => ({ x: gold.x + gold.w + GAP, y: gold.y, w: 52, h: gold.h });

const desktopLayout = (screen: Size, handSize: number): PlanningLayout => {
  const { w, h } = screen;
  const zoom = planningZoom(screen, handSize);
  const boardW = ISO_BOARD_W * zoom;
  const boardH = ISO_BOARD_H * zoom;
  const lives = { x: MARGIN, y: MARGIN, w: DESK.top.lives, h: DESK.top.h };
  const gold = { x: lives.x + lives.w + GAP, y: MARGIN, w: DESK.top.gold, h: DESK.top.h };
  const wide =
    w >= WIDE_DESKTOP && (w - boardW) / 2 >= MARGIN + Math.max(DECREE_PANEL_W, DESK.scout.w) + PANEL_CLEAR;
  // The year strip sits in the middle of the top edge (right of the help button on a narrow window),
  // with the year label right under it.
  const stripW = CALENDAR_CELLS * CELL + (CALENDAR_CELLS - 1) * GAP;
  const helpEnd = helpRect(gold).x + 52;
  const stripX = Math.max(Math.round((w - stripW) / 2), helpEnd + GAP);
  const strip = calendarStripLayout({ x: stripX, y: MARGIN, w: stripW, h: CELL }, CALENDAR_CELLS);
  const calendar = strip.cells;
  const hand = handRow(screen, DESK.card, handSize);
  const first = hand[0]!;
  const last = hand[hand.length - 1]!;
  // The year label sits under the strip; on a short window (the 320 px board would not fit between
  // it and the hand) it moves beside the strip, on the top row.
  const underY = MARGIN + CELL + GAP;
  const inline = underY + YEAR_LABEL_H + GAP + boardH + GAP > first.y;
  const year = inline
    ? { x: stripX + stripW + GAP, y: Math.round(MARGIN + (CELL - YEAR_LABEL_H) / 2), w: DESK.top.year, h: YEAR_LABEL_H }
    : { x: Math.round(stripX + stripW / 2 - DESK.top.year / 2), y: underY, w: DESK.top.year, h: YEAR_LABEL_H };
  // Centred in the band between the top HUD and the hand (spec 2026-11-08 §4: the overview zoom is chosen so the
  // board fits it), so a lifted selected card stays clear of the board; never up into the year label.
  const bandTop = Math.max(DESK_TOP_HUD, year.y + year.h + GAP / 2);
  const bandBottom = first.y - DESK_HAND_GAP;
  const centreY = Math.max(bandTop + boardH / 2, (bandTop + bandBottom) / 2);
  const board = {
    x: Math.round(w / 2 - boardW / 2),
    y: Math.round(centreY - boardH / 2),
    w: boardW,
    h: boardH,
  };
  // Ends above a lifted selected card too, so a narrow desktop window never overlaps the hand.
  const scoutBottom = Math.min(DESK.scout.bottom, first.y - CARD_LIFT - GAP);
  const scout = wide
    ? { x: w - MARGIN - DESK.scout.w, y: DESK.scout.y, w: DESK.scout.w, h: Math.max(0, scoutBottom - DESK.scout.y) }
    : null;
  // Narrow desktop: the scout opens from a button in the top-right corner instead.
  const scoutButton = wide ? null : { x: w - MARGIN - CELL, y: MARGIN, w: CELL, h: CELL };
  const bottomY = h - HAND_BOTTOM - DESK.button.h;
  // Left of the hand: "Đổi bài" over "Bán bài". Right of it: "Bộ bài".
  const left = first.x - DESK.card.gap - DESK.button.w;
  const sell = { x: left, y: bottomY, w: DESK.button.w, h: DESK.button.h };
  const reroll = { ...sell, y: bottomY - GAP * 2 - DESK.button.h };
  const deck = { x: last.x + last.w + DESK.card.gap, y: bottomY, w: DESK.button.w, h: DESK.button.h };
  const statusY = h - HAND_BOTTOM - STATUS_H;
  const allyW = Math.max(0, Math.min(STATUS_W, sell.x - GAP - MARGIN));
  const foeX = deck.x + deck.w + GAP;
  const foeW = Math.max(0, Math.min(STATUS_W, w - MARGIN - foeX));
  const centre = plotRectOf(board, Math.floor((BOARD_SIDE * BOARD_SIDE) / 2));
  return {
    desktop: true,
    zoom,
    lives,
    gold,
    help: helpRect(gold),
    year,
    calendar,
    calendarLinks: strip.links,
    allyStatus: { x: MARGIN, y: statusY, w: allyW, h: STATUS_H },
    foeStatus: { x: foeX, y: statusY, w: foeW, h: STATUS_H },
    board,
    scout,
    scoutButton,
    decreePanel: wide
      ? { x: MARGIN, y: DESK.scout.y, w: DECREE_PANEL_W, h: Math.max(0, scoutBottom - DESK.scout.y) }
      : null,
    decreeButton: wide ? null : { x: MARGIN, y: lives.y + lives.h + GAP * 2, w: DESK.button.w, h: BUTTON },
    hand,
    reroll,
    sell,
    deck,
    freeMove: { ...deck, y: reroll.y },
    fight: fightOver(screen, hand),
    ...besidePlot(centre, screen),
    // The play hint sits in the empty top-left corner of the board box, beside the diamond's top corner: the diamond is
    // 2·d wide on each side at depth d, so a box HINT_H tall clears it by GAP (spec 2026-11-08 §4: the board now fills
    // the band, there is no row above it).
    hint: {
      x: board.x,
      y: board.y,
      w: Math.max(0, Math.round(board.w / 2 - (board.w / board.h) * HINT_H - GAP)),
      h: HINT_H,
    },
  };
};

const mobileLayout = (screen: Size, handSize: number): PlanningLayout => {
  const { w } = screen;
  const boardW = ISO_BOARD_W * PLANNING_ZOOM;
  const boardH = ISO_BOARD_H * PLANNING_ZOOM;
  const lives = { x: MARGIN, y: MARGIN, w: PHONE.top.lives, h: PHONE.top.h };
  const gold = { x: lives.x + lives.w + GAP, y: MARGIN, w: PHONE.top.gold, h: PHONE.top.h };
  const help = helpRect(gold);
  const yearX = help.x + help.w + GAP;
  const year = { x: yearX, y: MARGIN, w: Math.max(0, w - MARGIN - yearX), h: PHONE.top.h };
  const scoutButton = { x: w - MARGIN - CELL, y: PHONE.rowY, w: CELL, h: CELL };
  const strip = calendarStripLayout(
    { x: MARGIN, y: PHONE.rowY, w: Math.max(0, scoutButton.x - GAP - MARGIN), h: CELL },
    CALENDAR_CELLS,
  );
  const calendar = strip.cells;
  // The 640 px wide diamond is wider than a phone: the board box overflows left and right and
  // the player drags the map to reach the side plots.
  const board = {
    x: Math.round((w - boardW) / 2),
    y: PHONE.boardY,
    w: boardW,
    h: boardH,
  };
  const hand = handRow(screen, PHONE.card, handSize);
  const pair = aboveBoard(screen, board);
  const b = PHONE.buttons;
  const sell = { x: w - MARGIN - b.w, y: b.y, w: b.w, h: b.h };
  const reroll = { x: sell.x - GAP - b.w, y: b.y, w: b.w, h: b.h };
  const deck = { x: reroll.x - GAP - b.w, y: b.y, w: b.w, h: b.h };
  const statusY = b.y + b.h + 8;
  const statusW = Math.floor((w - 2 * MARGIN - GAP) / 2);
  return {
    desktop: false,
    zoom: PLANNING_ZOOM,
    lives,
    gold,
    help,
    year,
    calendar,
    calendarLinks: strip.links,
    allyStatus: { x: MARGIN, y: statusY, w: statusW, h: STATUS_H_PHONE },
    foeStatus: { x: MARGIN + statusW + GAP, y: statusY, w: statusW, h: STATUS_H_PHONE },
    board,
    scout: null,
    scoutButton,
    decreePanel: null,
    decreeButton: { x: MARGIN, y: b.y, w: b.w, h: b.h },
    hand,
    reroll,
    sell,
    deck,
    freeMove: { x: w - MARGIN - b.w, y: pair.confirm.y, w: b.w, h: b.h },
    fight: fightOver(screen, hand),
    ...pair,
    hint: {
      x: MARGIN,
      y: pair.cancel.y,
      w: Math.max(0, pair.cancel.x - GAP - MARGIN),
      h: Math.max(0, board.y - GAP - pair.cancel.y),
    },
  };
};

/** §10.4. */
export const planningLayout = (screen: Size, handSize = 3): PlanningLayout =>
  isDesktop(screen.w) ? desktopLayout(screen, handSize) : mobileLayout(screen, handSize);

/**
 * Bounding box of `plot`'s diamond inside the board box `board` (isometric, src/core/iso.ts: plot 0
 * is the top corner, rows (world south) run down-right, columns (world east) down-left).
 */
const plotRectOf = (board: Rect, plot: number): Rect => {
  const cw = board.w / BOARD_SIDE;
  const ch = board.h / BOARD_SIDE;
  const col = plotCol(plot);
  const row = plotRow(plot);
  return {
    x: board.x + board.w / 2 + ((row - col) * cw) / 2 - cw / 2,
    y: board.y + ((col + row) * ch) / 2,
    w: cw,
    h: ch,
  };
};

/** Screen bounding box of `plot`'s diamond at the overview camera of the planning layout. */
export const plotScreenRect = (layout: PlanningLayout, plot: number): Rect => plotRectOf(layout.board, plot);

/** Plot whose diamond holds a screen point at the overview camera (inverse of plotScreenRect), null off the board. */
export const plotAtScreen = (layout: PlanningLayout, p: Point): number | null => {
  const cw = layout.board.w / BOARD_SIDE;
  const ch = layout.board.h / BOARD_SIDE;
  const dx = p.x - (layout.board.x + layout.board.w / 2);
  const dy = p.y - layout.board.y;
  const col = Math.floor(dy / ch - dx / cw);
  const row = Math.floor(dy / ch + dx / cw);
  if (col < 0 || col >= BOARD_SIDE || row < 0 || row >= BOARD_SIDE) return null;
  return row * BOARD_SIDE + col;
};

/** ✓/✕ for a chosen plot: beside it on desktop, the row above the board on mobile. */
export const confirmFor = (
  layout: PlanningLayout,
  plotRect: Rect,
  screen: Size,
): { confirm: Rect; cancel: Rect } =>
  layout.desktop
    ? besidePlot(plotRect, screen)
    : { confirm: { ...layout.confirm }, cancel: { ...layout.cancel } };

export interface BattleLayout {
  /** The battle clock (and "TẠM DỪNG"), a floating line under the year label. */
  clock: Rect;
  lives: Rect;
  gold: Rect;
  help: Rect;
  /** Same five-year strip, bars and label as the planning HUD. */
  calendar: readonly Rect[];
  calendarLinks: readonly Rect[];
  year: Rect;
  /** "Địch còn" and the wave dots. */
  foes: Rect;
  /** Pause, ×1, ×2, ×3: one row top-right on desktop, two rows of two bottom-right on phones. */
  speed: readonly Rect[];
  /** Can Thiệp, bottom-left above the ally bar. */
  intervene: Rect;
  /** "Tự bắn: Bật/Tắt" (§7.4), right beside Can Thiệp. */
  auto: Rect;
  /** "Địch": opens the full scout report of this year's army. */
  waves: Rect;
  /** Bottom-left: the throne's health bar with the king's name. */
  allyStatus: Rect;
  /** Bottom-right: the health bar of the enemy units on the field. */
  foeStatus: Rect;
  /** The boss bar, under the clock (empty while there is no live boss). */
  bossStatus: Rect;
}

const CLOCK = { w: 200, h: 30 } as const;
const CLOCK_PHONE = { w: 120, h: 30 } as const;
const FOES = { w: 140, h: 52 } as const;
const FOES_PHONE = { w: 120, h: 52 } as const;
const INTERVENE = 72;
const AUTO = { w: 104, h: 48 } as const;
const WAVES = { w: 44, h: 44 } as const;
const BOSS = { w: 340, h: 40 } as const;
const HP_BAR = { desktop: { w: 300, h: 44 }, phone: { h: 40 } } as const;

/**
 * §10.7. The top reuses the planning HUD (lives, gold, help, the five-year strip and the year
 * label) with the clock under it; the speed controls go top-right (second row of the top when a
 * narrow desktop window has no room beside the strip; two rows of two bottom-right on phones).
 * Bottom corners: the throne's bar with Can Thiệp and Tự bắn above it (left), the enemy bar (right).
 */
export const battleLayout = (screen: Size): BattleLayout => {
  const { w, h } = screen;
  const desktop = isDesktop(w);
  const plan = planningLayout(screen);
  const { lives, gold, help, calendar, calendarLinks } = plan;
  const speedW = 4 * BUTTON + 3 * SPEED_GAP;

  if (desktop) {
    // The battle has no board to make room for: the year label always sits under the strip
    // (planning may have moved it beside the strip on a short window), the clock under it.
    const stripMid = (calendar[0]!.x + calendar[calendar.length - 1]!.x + CELL) / 2;
    const year = { ...plan.year, x: Math.round(stripMid - plan.year.w / 2), y: MARGIN + CELL + GAP };
    const centreX = year.x + year.w / 2;
    const clock = { x: Math.round(centreX - CLOCK.w / 2), y: year.y + year.h + 2, w: CLOCK.w, h: CLOCK.h };
    const speedX = w - MARGIN - speedW;
    const stripRight = calendar[calendar.length - 1]!.x + CELL;
    const speedY = stripRight + GAP <= speedX ? MARGIN : MARGIN + CELL + GAP;
    const speed = [0, 1, 2, 3].map((i) => ({ x: speedX + i * (BUTTON + SPEED_GAP), y: speedY, w: BUTTON, h: BUTTON }));
    const foes = { x: w - MARGIN - FOES.w, y: speedY + BUTTON + GAP, w: FOES.w, h: FOES.h };
    const waves = { x: foes.x + foes.w - WAVES.w, y: foes.y + foes.h + GAP, w: WAVES.w, h: WAVES.h };
    // The boss bar is centred under the clock, narrowed if the foes panel stands beside it.
    const bossW = Math.max(200, Math.min(BOSS.w, 2 * (foes.x - GAP - centreX)));
    const bossStatus = { x: Math.round(centreX - bossW / 2), y: clock.y + clock.h + GAP, w: bossW, h: BOSS.h };
    const allyStatus = { x: MARGIN, y: h - MARGIN - HP_BAR.desktop.h, w: HP_BAR.desktop.w, h: HP_BAR.desktop.h };
    const foeStatus = { x: w - MARGIN - HP_BAR.desktop.w, y: allyStatus.y, w: HP_BAR.desktop.w, h: HP_BAR.desktop.h };
    const intervene = { x: MARGIN, y: allyStatus.y - GAP - INTERVENE, w: INTERVENE, h: INTERVENE };
    const auto = { x: intervene.x + intervene.w + GAP, y: intervene.y + intervene.h - AUTO.h, w: AUTO.w, h: AUTO.h };
    return { clock, lives, gold, help, calendar, calendarLinks, year, foes, speed, intervene, auto, waves, allyStatus, foeStatus, bossStatus };
  }

  const rowY = calendar[0]!.y + CELL + GAP;
  const clock = { x: MARGIN, y: rowY, w: CLOCK_PHONE.w, h: CLOCK_PHONE.h };
  const foes = { x: w - MARGIN - FOES_PHONE.w, y: rowY, w: FOES_PHONE.w, h: FOES_PHONE.h };
  const bossStatus = { x: MARGIN, y: foes.y + foes.h + GAP, w: w - 2 * MARGIN, h: BOSS.h };
  const barW = Math.floor((w - 2 * MARGIN - GAP) / 2);
  const allyStatus = { x: MARGIN, y: h - MARGIN - HP_BAR.phone.h, w: barW, h: HP_BAR.phone.h };
  const foeStatus = { x: w - MARGIN - barW, y: allyStatus.y, w: barW, h: HP_BAR.phone.h };
  const intervene = { x: MARGIN, y: allyStatus.y - GAP - INTERVENE, w: INTERVENE, h: INTERVENE };
  const auto = { x: intervene.x + intervene.w + GAP, y: allyStatus.y - GAP - AUTO.h, w: AUTO.w, h: AUTO.h };
  const blockW = 2 * BUTTON + SPEED_GAP;
  const blockX = w - MARGIN - blockW;
  const blockY = foeStatus.y - GAP - (2 * BUTTON + SPEED_GAP);
  const speed = [0, 1, 2, 3].map((i) => ({
    x: blockX + (i % 2) * (BUTTON + SPEED_GAP),
    y: blockY + Math.floor(i / 2) * (BUTTON + SPEED_GAP),
    w: BUTTON,
    h: BUTTON,
  }));
  const waves = plan.scoutButton ?? { x: w - MARGIN - WAVES.w, y: rowY, w: WAVES.w, h: WAVES.h };
  return { clock, lives, gold, help, calendar, calendarLinks, year: plan.year, foes, speed, intervene, auto, waves, allyStatus, foeStatus, bossStatus };
};

/**
 * Camera scroll that shows world point `world` at screen point `target`.
 *
 * Phaser 4 (Camera#preRender, origin 0.5): matrix = translate(mid) · scale(zoom) ·
 * translate(−scroll − mid), i.e. world point p is drawn at `mid + (p − scroll − mid)·zoom`
 * with `mid = screen/2`. Solving for scroll gives `world − mid − (target − mid)/zoom`.
 */
export const cameraScroll = (world: Point, target: Point, screen: Size, zoom: number): Point => {
  const mx = screen.w / 2;
  const my = screen.h / 2;
  return {
    x: world.x - mx - (target.x - mx) / zoom,
    y: world.y - my - (target.y - my) / zoom,
  };
};

/** Inverse of the camera transform above: `p = scroll + mid + (screen − mid)/zoom`. */
export const screenToWorld = (p: Point, scroll: Point, screen: Size, zoom: number): Point => {
  const mx = screen.w / 2;
  const my = screen.h / 2;
  return {
    x: scroll.x + mx + (p.x - mx) / zoom,
    y: scroll.y + my + (p.y - my) / zoom,
  };
};

/**
 * Centre of the 5×5 board in camera (projected) space: the world centre of the board (the board
 * spans boardOrigin … +5 plots) through the isometric projection; not the throne, which sits on the back row.
 */
const BOARD_CENTRE: Point = project({
  x: BATTLE.boardOrigin + (BOARD_SIDE * BATTLE.plot) / 2,
  y: BATTLE.boardOrigin + (BOARD_SIDE * BATTLE.plot) / 2,
});

/** §10.7 battle camera: zoom `battleZoom`, the board centre at the screen centre. */
export const battleCamera = (screen: Size): { zoom: number; scroll: Point } => {
  const zoom = battleZoom(screen.w, screen.h);
  const scroll = cameraScroll(
    BOARD_CENTRE,
    { x: screen.w / 2, y: screen.h / 2 },
    screen,
    zoom,
  );
  return { zoom, scroll };
};

/** World point under screen point `p` in the battle view (through the isometric projection), null outside the field. */
export const battleWorldAt = (p: Point, screen: Size): Point | null => {
  const { zoom, scroll } = battleCamera(screen);
  const w = unproject(screenToWorld(p, scroll, screen, zoom));
  if (w.x < 0 || w.x > BATTLE.field || w.y < 0 || w.y > BATTLE.field) return null;
  return w;
};


/**
 * The one camera of the realm (§10.4, §10.7). Planning puts the board centre where
 * `planningLayout` drew the board; battle centres the board too. On desktop both are the same
 * camera, on mobile they differ in zoom (the scene eases between them).
 */
export type RealmPhase = 'planning' | 'battle';

/** Zoom and the screen point where the throne/board centre sits in `phase`. */
const anchorOf = (screen: Size, phase: RealmPhase): { zoom: number; point: Point } => {
  if (phase === 'battle') {
    return { zoom: battleZoom(screen.w, screen.h), point: { x: screen.w / 2, y: screen.h / 2 } };
  }
  const board = planningLayout(screen).board;
  return {
    zoom: planningZoom(screen),
    point: { x: board.x + board.w / 2, y: board.y + board.h / 2 },
  };
};

export const realmCamera = (screen: Size, phase: RealmPhase): { zoom: number; scroll: Point } => {
  const a = anchorOf(screen, phase);
  return { zoom: a.zoom, scroll: cameraScroll(BOARD_CENTRE, a.point, screen, a.zoom) };
};

/** The camera `k` (0..1) of the way from `from` to `to`: zoom and the throne's screen point ease linearly. */
export const realmCameraMix = (
  screen: Size,
  from: RealmPhase,
  to: RealmPhase,
  k: number,
): { zoom: number; scroll: Point } => {
  const a = anchorOf(screen, from);
  const b = anchorOf(screen, to);
  const zoom = a.zoom + (b.zoom - a.zoom) * k;
  const point = {
    x: a.point.x + (b.point.x - a.point.x) * k,
    y: a.point.y + (b.point.y - a.point.y) * k,
  };
  return { zoom, scroll: cameraScroll(BOARD_CENTRE, point, screen, zoom) };
};
