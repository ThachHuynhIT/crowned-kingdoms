/**
 * Pure side of the balance tool (G5 spec §2.2): argument parsing, aggregation of `RunStats`, CSV. `tools/balance.ts`
 * only does the I/O (running, printing, writing files).
 */
import {
  BALANCE_MAX_SPREAD,
  BALANCE_MAX_WIN,
  BALANCE_MIN_WIN,
  BALANCE_RUNS,
} from '../../data/balance';
import { ALL_KINGS } from '../../data/rules';
import type { KingId } from '../../data/types';
import { RUN } from '../../data/run';
import type { RunStats } from './stats';

export type BalanceBot = 'greedy' | 'random' | 'scripted';
export const BALANCE_BOTS: readonly BalanceBot[] = ['greedy', 'random', 'scripted'];

export interface BalanceOptions {
  kings: readonly KingId[];
  runs: number;
  bot: BalanceBot;
  difficulty: number;
}

/** `--king <id|all> --runs N --bot greedy|random|scripted --difficulty d`; throws on anything invalid. */
export function parseBalanceArgs(args: readonly string[]): BalanceOptions {
  const opts: BalanceOptions = {
    kings: ALL_KINGS,
    runs: BALANCE_RUNS,
    bot: 'greedy',
    difficulty: 0,
  };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i]!;
    const value = args[i + 1];
    if (value === undefined) throw new Error(`missing value for ${flag}`);
    i++;
    if (flag === '--king') {
      if (value === 'all') opts.kings = ALL_KINGS;
      else if ((ALL_KINGS as readonly string[]).includes(value)) opts.kings = [value as KingId];
      else throw new Error(`unknown king ${value}`);
    } else if (flag === '--runs') {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1)
        throw new Error(`--runs must be a positive integer, got ${value}`);
      opts.runs = n;
    } else if (flag === '--bot') {
      if (!(BALANCE_BOTS as readonly string[]).includes(value))
        throw new Error(`unknown bot ${value}`);
      opts.bot = value as BalanceBot;
    } else if (flag === '--difficulty') {
      const d = Number(value);
      if (!Number.isInteger(d) || d < 0 || d > RUN.difficultyLevels)
        throw new Error(`--difficulty must be 0..${RUN.difficultyLevels}, got ${value}`);
      opts.difficulty = d;
    } else {
      throw new Error(`unknown flag ${flag}`);
    }
  }
  return opts;
}

export interface KingSummary {
  kingId: KingId;
  runs: number;
  wins: number;
  winRate: number;
  meanYear: number;
}

export interface CardRow {
  cardId: string;
  picked: number;
  offered: number;
  /** null when the card was never offered. */
  rate: number | null;
}

export interface YearRow {
  year: number;
  lost: number;
  reached: number;
  rate: number | null;
}

export interface BalanceTables {
  kings: KingSummary[];
  cards: CardRow[];
  years: YearRow[];
  /** max − min win rate over the kings that ran. */
  spread: number;
  /** Every king in [BALANCE_MIN_WIN, BALANCE_MAX_WIN] and spread ≤ BALANCE_MAX_SPREAD. */
  onTarget: boolean;
}

const add = (into: Record<string, number>, from: Record<string | number, number>): void => {
  for (const [k, v] of Object.entries(from)) into[k] = (into[k] ?? 0) + v;
};

/** Aggregate runs; `allCards` lists every card so unoffered ones still get a 0/0 row. Sorted, deterministic. */
export function aggregateBalance(
  runs: readonly RunStats[],
  allCards: readonly string[] = [],
): BalanceTables {
  const byKing = new Map<KingId, RunStats[]>();
  for (const r of runs) byKing.set(r.kingId, [...(byKing.get(r.kingId) ?? []), r]);
  const kings = ALL_KINGS.filter((k) => byKing.has(k)).map((kingId): KingSummary => {
    const list = byKing.get(kingId)!;
    const wins = list.filter((r) => r.won).length;
    return {
      kingId,
      runs: list.length,
      wins,
      winRate: wins / list.length,
      meanYear: list.reduce((s, r) => s + r.yearReached, 0) / list.length,
    };
  });
  const picks: Record<string, number> = {};
  const offered: Record<string, number> = {};
  const reached: Record<string, number> = {};
  const lost: Record<string, number> = {};
  for (const r of runs) {
    add(picks, r.picks);
    add(offered, r.offered);
    add(reached, r.battlesReached);
    add(lost, r.battlesLost);
  }
  const cardIds = [
    ...new Set([...allCards, ...Object.keys(offered), ...Object.keys(picks)]),
  ].sort();
  const cards = cardIds.map((cardId): CardRow => {
    const o = offered[cardId] ?? 0;
    const p = picks[cardId] ?? 0;
    return { cardId, picked: p, offered: o, rate: o === 0 ? null : p / o };
  });
  const years = Object.keys(reached)
    .map(Number)
    .sort((a, b) => a - b)
    .map((year): YearRow => {
      const n = reached[year] ?? 0;
      const l = lost[year] ?? 0;
      return { year, lost: l, reached: n, rate: n === 0 ? null : l / n };
    });
  const rates = kings.map((k) => k.winRate);
  const spread = rates.length === 0 ? 0 : Math.max(...rates) - Math.min(...rates);
  const onTarget =
    kings.length > 0 &&
    rates.every((w) => w >= BALANCE_MIN_WIN && w <= BALANCE_MAX_WIN) &&
    spread <= BALANCE_MAX_SPREAD + 1e-9;
  return { kings, cards, years, spread, onTarget };
}

const cell = (v: string | number | null): string => {
  if (v === null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

/** RFC 4180-style CSV (quotes, commas and newlines escaped), `\n` line ends. */
export const csv = (rows: readonly (readonly (string | number | null)[])[]): string =>
  rows.map((row) => row.map(cell).join(',')).join('\n') + '\n';
