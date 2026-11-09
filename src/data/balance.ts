/**
 * Balance measurement (G5, spec §1 #7 and plan 2026-11-09-g5-balance-polish): the greedy bot's limits and the target
 * every king must reach at Gai 0. These are measurement settings, not gameplay numbers.
 */

/** The greedy bot rerolls at most this many times a year, and only when no card can be played. */
export const GREEDY_MAX_REROLLS = 2;
/** The greedy bot buys at most this many cards a year (Mua thẻ, 2026-11-10), only when nothing in hand can be played… */
export const GREEDY_MAX_SHOP_PURCHASES = 2;
/** … and only while it keeps at least this much gold after paying. */
export const GREEDY_SHOP_RESERVE = 4;

/** Runs per king of the acceptance cohort (seeds 1…N). */
export const BALANCE_RUNS = 500;
/** Every king's greedy win rate must lie in [min, max] … */
export const BALANCE_MIN_WIN = 0.35;
export const BALANCE_MAX_WIN = 0.65;
/** … and the best and worst king may differ by at most this much. */
export const BALANCE_MAX_SPREAD = 0.15;
