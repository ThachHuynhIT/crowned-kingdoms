/**
 * Balance measurement for the isometric board polish (plan 2026-11-08, Task 1). The 600-run suite is opt-in:
 *
 *   ISO_POLISH_MEASURE=1 ISO_POLISH_PHASE=baseline npx vitest run src/game/sim/isoPolishMetrics.test.ts --reporter=verbose
 *
 * It plays real RULES_FULL runs (3 kings × seeds 1..100 × the random and scripted bots) with the same loop as
 * `runHeadless`, and prints one `ISO_POLISH_JSON` line per run plus one per king × bot aggregate. The numbers
 * come only from what the runs return; nothing here touches the battle or adds randomness to it.
 */
import { describe, expect, it } from 'vitest';
import { Rng, hashSeed } from '../../core/random';
import { RULES_FULL } from '../../data/rules';
import type { KingId } from '../../data/types';
import { simulateBattle } from '../battle/step';
import { CONTENT } from '../cards/registry';
import { buildBattleSetup } from '../run/battleSetup';
import { applyCommand } from '../run/commands';
import type { RunCommand, RunState } from '../run/state';
import { fullRunFixture } from '../testing/fixtures';
import type { Bot } from './bots/random';
import { randomBot } from './bots/random';
import { scriptedBot } from './bots/scripted';
import { runHeadless } from './headless';

declare const process: { env: Record<string, string | undefined> };

const KINGS: KingId[] = ['wheat', 'stone', 'arcane'];
const BOTS: Record<'random' | 'scripted', Bot> = { random: randomBot, scripted: scriptedBot };
type BotName = keyof typeof BOTS;

/** One measured run. `throneHpPct` is the mean Ngai HP left (100 − throneHpLostPct) over its battles. */
export interface RunRecord {
  readonly phase: string;
  readonly seed: number;
  readonly king: KingId;
  readonly bot: BotName;
  readonly won: boolean;
  readonly year: number;
  readonly battles: number;
  readonly battlesWon: number;
  readonly throneHpPct: number;
  readonly ticks: number;
  readonly bossFights: number;
  readonly bossKills: number;
  readonly capped: number;
  readonly commands: number;
  readonly state: RunState;
}

/** The `runHeadless` loop (same start state, bot RNG and battle call), keeping what a headless result drops. */
export const measureRun = (phase: string, seed: number, king: KingId, bot: BotName): RunRecord => {
  const rng = new Rng(hashSeed(`${seed}:bot`));
  let state = fullRunFixture(seed, king);
  let commands = 0;
  let battles = 0;
  let battlesWon = 0;
  let hpSum = 0;
  let ticks = 0;
  let bossFights = 0;
  let capped = 0;
  const apply = (cmd: RunCommand): void => {
    const r = applyCommand(state, cmd, CONTENT);
    if ('error' in r) throw new Error(`illegal ${JSON.stringify(cmd)}: ${r.error}`);
    state = r.state;
    commands += 1;
  };
  while (state.phase !== 'ended') {
    if (commands >= 5000) throw new Error(`${king} seed ${seed} ${bot}: did not finish`);
    const cmd = BOTS[bot](state, CONTENT, rng);
    apply(cmd);
    if (cmd.type === 'startBattle') {
      if (state.army?.attacker === 'boss') bossFights += 1;
      const result = simulateBattle(buildBattleSetup(state, CONTENT), []);
      battles += 1;
      if (result.won) battlesWon += 1;
      hpSum += 100 - result.throneHpLostPct;
      ticks += result.ticks;
      capped += result.capped;
      apply({ type: 'battleResult', result });
    }
  }
  return {
    phase,
    seed,
    king,
    bot,
    won: state.won === true,
    year: state.year,
    battles,
    battlesWon,
    throneHpPct: battles > 0 ? hpSum / battles : 100,
    ticks,
    bossFights,
    bossKills: state.stats.bossesDefeated.length,
    capped,
    commands,
    state,
  };
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

const printable = (r: RunRecord): Omit<RunRecord, 'state'> => {
  const rest: Omit<RunRecord, 'state'> & { state?: RunState } = { ...r };
  delete rest.state;
  return { ...rest, throneHpPct: round2(r.throneHpPct) };
};

describe('iso polish metrics harness', () => {
  for (const king of KINGS)
    for (const bot of Object.keys(BOTS) as BotName[])
      it(`metrics_loop_matches_headless_seed_one: ${king} ${bot}`, () => {
        const r = measureRun('check', 1, king, bot);
        const h = runHeadless({ seed: 1, kingId: king, rules: RULES_FULL, bot: BOTS[bot] });
        expect(JSON.stringify(r.state)).toBe(JSON.stringify(h.state));
        expect(r.commands).toBe(h.commands);
        for (const v of [r.year, r.battles, r.battlesWon, r.throneHpPct, r.ticks, r.bossFights, r.bossKills, r.capped])
          expect(Number.isFinite(v)).toBe(true);
        expect(r.battles).toBeGreaterThan(0);
      }, 120_000);
});

const MEASURE = process.env['ISO_POLISH_MEASURE'] === '1';
const PHASE = process.env['ISO_POLISH_PHASE'] ?? 'unnamed';
const SEEDS = Array.from({ length: 100 }, (_, i) => i + 1);

describe.runIf(MEASURE)(`iso polish measurement (${PHASE})`, () => {
  for (const king of KINGS)
    for (const bot of Object.keys(BOTS) as BotName[])
      it(`${king} ${bot}: 100 seeds`, () => {
        // A bot that sends an illegal command (a known bot bug, e.g. Giao Ước Nguyệt Thực on the last life) is
        // recorded as crashed and left out of the means, never counted as a legal loss.
        const rows: RunRecord[] = [];
        const crashed: { seed: number; error: string }[] = [];
        for (const seed of SEEDS) {
          try {
            rows.push(measureRun(PHASE, seed, king, bot));
          } catch (e) {
            crashed.push({ seed, error: e instanceof Error ? e.message : String(e) });
          }
        }
        for (const r of rows) console.info(`ISO_POLISH_JSON ${JSON.stringify(printable(r))}`);
        for (const c of crashed) console.info(`ISO_POLISH_JSON ${JSON.stringify({ phase: PHASE, king, bot, crashed: c })}`);
        const n = rows.length;
        const mean = (f: (r: RunRecord) => number): number => round2(rows.reduce((s, r) => s + f(r), 0) / n);
        const summary = {
          phase: PHASE,
          king,
          bot,
          runs: n,
          crashed: crashed.length,
          winRate: mean((r) => (r.won ? 100 : 0)),
          meanYear: mean((r) => r.year),
          meanBossKills: mean((r) => r.bossKills),
          meanThroneHpPct: mean((r) => r.throneHpPct),
          meanTicksPerBattle: round2(rows.reduce((s, r) => s + r.ticks, 0) / Math.max(1, rows.reduce((s, r) => s + r.battles, 0))),
          capped: rows.reduce((s, r) => s + r.capped, 0),
        };
        console.info(`ISO_POLISH_JSON ${JSON.stringify({ summary })}`);
        // the same seed again gives the same record (determinism of the measured loop)
        expect(printable(measureRun(PHASE, rows[0]!.seed, king, bot))).toEqual(printable(rows[0]!));
        expect(rows.length + crashed.length).toBe(100);
      }, 1_200_000);
});
