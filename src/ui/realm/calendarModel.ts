import { ENDLESS_BLESSING_EVERY, ENDLESS_BLESSING_FIRST_YEAR, type EndlessModifierId } from '../../data/endless';
import { RUN } from '../../data/run';
import { hasFullCalendar, modeForRules, type Rules } from '../../data/rules';
import type { BossId, KingId } from '../../data/types';
import { calendarFor, calendarSlotAt, type CalendarSlot } from '../../game/run/calendar';
import { plotPurchasePrice } from '../../game/run/endlessBlessings';
import { modifierAt } from '../../game/run/endlessModifiers';
import { isCouncilYear } from '../../game/run/endlessRules';
import type { IllegalReason, RunState } from '../../game/run/state';

/** One year of the calendar strip / modal. */
export interface CalendarCell {
  year: number;
  /** Who attacks that year: raiders, the enemy king of that slot, a two-king coalition or a boss. */
  attacker: 'raiders' | 'coalition' | 'boss' | KingId;
  /** Which attack of that king (1..3), null for raiders, coalitions and bosses. */
  attack: 1 | 2 | 3 | null;
  /** The two kings of a coalition. */
  kings?: readonly KingId[];
  boss?: BossId;
  /** A royal council follows this year's battle (full rules only). */
  council: boolean;
  /** A quest may be offered at the start of this year (full rules only). */
  quest: boolean;
  /** The year being played now. */
  current: boolean;
  /** Endless only: a blessing is chosen after this year's battle (30, 35, 40, …). */
  blessing?: boolean;
  /** Endless only: the decade modifier of this year (null before 31). */
  modifier?: { id: EndlessModifierId; startYear: number } | null;
}

/** Years on one page of the calendar modal. */
export const CALENDAR_PAGE_YEARS = 30;

type CalendarSource = Pick<RunState, 'year' | 'rules' | 'enemyKings' | 'enemies'> & Partial<Pick<RunState, 'seed'>>;

const inYears = (years: readonly number[], year: number): boolean => years.includes(year);

const cell = (
  slot: CalendarSlot,
  year: number,
  rules: Rules,
  enemyKings: readonly KingId[],
  current: boolean,
  seed = 0,
): CalendarCell => {
  const mode = modeForRules(rules);
  // Councils skip the last year of a normal run (it ends there); quests are offered at the start of a year.
  const marks: Pick<CalendarCell, 'council' | 'quest' | 'blessing' | 'modifier'> = {
    council: isCouncilYear({ mode, year, rules }),
    quest: hasFullCalendar(rules) && inYears(RUN.questYears, year),
  };
  if (mode === 'endless') {
    marks.blessing = year >= ENDLESS_BLESSING_FIRST_YEAR && year % ENDLESS_BLESSING_EVERY === 0;
    marks.modifier = modifierAt(seed, year);
  }
  if (slot.kind === 'coalition') {
    const kings = slot.kings.flatMap((n) => (enemyKings[n - 1] ? [enemyKings[n - 1]!] : []));
    return { year, attacker: 'coalition', attack: null, kings, ...marks, current };
  }
  if (slot.kind === 'boss') return { year, attacker: 'boss', attack: null, boss: slot.boss, ...marks, current };
  const king = slot.kind === 'king' ? enemyKings[slot.king - 1] : undefined;
  if (slot.kind === 'raiders' || king === undefined)
    return { year, attacker: 'raiders', attack: null, ...marks, current };
  return { year, attacker: king, attack: slot.attack, ...marks, current };
};

/** This year and up to `count - 1` following ones, never past `rules.years` (Endless has no last year). */
export const calendarCells = (state: CalendarSource, count: number): CalendarCell[] => {
  const out: CalendarCell[] = [];
  if (modeForRules(state.rules) === 'endless') {
    for (let year = state.year; year < state.year + count; year++)
      out.push(cell(calendarSlotAt(state.rules, year), year, state.rules, state.enemyKings, year === state.year, state.seed));
    return out;
  }
  const slots = calendarFor(state.rules);
  for (let year = state.year; year < state.year + count && year <= slots.length; year++)
    out.push(cell(slots[year - 1]!, year, state.rules, state.enemyKings, year === state.year));
  return out;
};

/** The page (0-based, 30 years each) holding `year`. */
export const calendarPageOf = (year: number): number => Math.floor((Math.max(1, Math.floor(year)) - 1) / CALENDAR_PAGE_YEARS);

/** Pages the calendar modal may show: the normal run's one page; Endless up to the page after the current one. */
export const calendarPageCount = (state: Pick<RunState, 'year' | 'rules'>): number =>
  modeForRules(state.rules) === 'endless' ? calendarPageOf(state.year) + 2 : 1;

/**
 * Page `pageIndex` of the calendar modal: years `30·p + 1 … 30·p + 30`, built one by one from
 * `calendarSlotAt` (never a list from year 1 to now), the current year marked. A normal run has only
 * page 0 (its whole calendar); other pages are empty.
 */
export const calendarPage = (state: CalendarSource, pageIndex: number): CalendarCell[] => {
  if (modeForRules(state.rules) !== 'endless') {
    if (pageIndex !== 0) return [];
    return fullCalendar(state.rules, state.enemyKings).map((c) => ({ ...c, current: c.year === state.year }));
  }
  const first = Math.max(0, Math.floor(pageIndex)) * CALENDAR_PAGE_YEARS + 1;
  return Array.from({ length: CALENDAR_PAGE_YEARS }, (_, i) => {
    const year = first + i;
    return cell(calendarSlotAt(state.rules, year), year, state.rules, state.enemyKings, year === state.year, state.seed);
  });
};

/** The HUD year: "NĂM 12 / 30" in a normal run, "Năm 41 · Vô tận" in Endless (no last year). */
export const yearLabel = (state: Pick<RunState, 'year' | 'rules'>): string =>
  modeForRules(state.rules) === 'endless' ? `Năm ${state.year} · Vô tận` : `NĂM ${state.year} / ${state.rules.years}`;

/** Every year of the run (the calendar modal); none is `current`. */
export const fullCalendar = (rules: Rules, enemyKings: readonly KingId[]): CalendarCell[] =>
  calendarFor(rules).map((slot, i) => cell(slot, i + 1, rules, enemyKings, false));

/** Gold price of the next locked plot (spec §3.11). */
export const lockedPlotPrice = (
  state: Pick<RunState, 'purchasedPlots'> & Partial<Pick<RunState, 'mode' | 'endless'>>,
  plot = 0,
): number =>
  plotPurchasePrice({ ...state, mode: state.mode ?? 'normal', endless: state.endless ?? null }, plot);

/** Why a play / purchase is refused (§4.4), in Vietnamese. */
export const illegalText = (reason: IllegalReason): string => ILLEGAL_TEXT[reason];

const ILLEGAL_TEXT: Record<IllegalReason, string> = {
  locked: 'Ô chưa mở.',
  throne: 'Không thể đặt lên Ngai.',
  occupied: 'Ô đã có công trình.',
  noBuilding: 'Ô này chưa có công trình.',
  noTarget: 'Không còn mục tiêu hợp lệ.',
  notAdjacent: 'Ô phải kề một ô đã mở.',
  notEnoughGold: 'Không đủ vàng.',
  maxLevel: 'Đã đạt cấp tối đa.',
  wrongKind: 'Bùa này không gắn được lên loại công trình đó.',
  stacksFull: 'Công trình đã đủ stack Bùa.',
  wrongPhase: 'Lúc này chưa dùng được.',
  alreadyPlayed: 'Chỉ đổi bài được trước khi chơi hoặc bán lá đầu tiên của năm.',
  handTooBig: 'Hãy chơi hoặc bán bài tới khi trên tay còn 2 lá.',
  badTarget: 'Mục tiêu không hợp lệ.',
  lastLife: 'Không thể: bạn chỉ còn 1 mạng.',
  noFreeMove: 'Năm nay đã hết lượt dời miễn phí.',
  wrongKing: 'Chỉ Vua Du Mục được dời miễn phí.',
  noShopCards: 'Không còn thẻ nào để mua.',
};
