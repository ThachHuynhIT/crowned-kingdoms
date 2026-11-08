/**
 * Balance CLI (G5, spec §14 G5): `npm run balance -- --king <id|all> --runs N --bot greedy|random|scripted --difficulty d`.
 * Plays seeds 1…N per king under RULES_FULL (no perk, no meta cards), prints a summary and writes four CSVs to
 * `tools/out/` (git-ignored). The maths lives in `src/game/sim/balance.ts`; this file only runs and writes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RULES_FULL } from '../src/data/rules';
import {
  aggregateBalance,
  csv,
  parseBalanceArgs,
  type BalanceBot,
  type BalanceOptions,
} from '../src/game/sim/balance';
import { greedyBot } from '../src/game/sim/bots/greedy';
import { randomBot, type Bot } from '../src/game/sim/bots/random';
import { scriptedBot } from '../src/game/sim/bots/scripted';
import { CONTENT } from '../src/game/cards/registry';
import { runHeadless } from '../src/game/sim/headless';
import { createRunStats, type RunStats } from '../src/game/sim/stats';

const BOTS: Record<BalanceBot, Bot> = {
  greedy: greedyBot,
  random: randomBot,
  scripted: scriptedBot,
};
const pct = (x: number | null): string => (x === null ? '—' : `${(x * 100).toFixed(1)}%`);

function main(): void {
  let opts: BalanceOptions;
  try {
    opts = parseBalanceArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`balance: ${(e as Error).message}`);
    process.exitCode = 2;
    return;
  }
  const bot = BOTS[opts.bot];
  const runs: RunStats[] = [];
  const started = Date.now();
  for (const kingId of opts.kings) {
    const kingStart = Date.now();
    for (let seed = 1; seed <= opts.runs; seed++) {
      const c = createRunStats(seed, kingId, opts.difficulty);
      const result = runHeadless({
        seed,
        kingId,
        rules: RULES_FULL,
        bot,
        difficulty: opts.difficulty,
        perk: null,
        unlockedCards: [],
        onCommand: c.observe,
      });
      runs.push(c.finish(result));
    }
    const done = runs.filter((r) => r.kingId === kingId);
    const wins = done.filter((r) => r.won).length;
    console.log(
      `${kingId.padEnd(7)} ${wins}/${done.length} won (${pct(wins / done.length)})  ${((Date.now() - kingStart) / 1000).toFixed(1)} s`,
    );
  }
  const t = aggregateBalance(
    runs,
    CONTENT.allCards().map((c) => c.id),
  );
  console.log(
    `\nbot ${opts.bot}, Gai ${opts.difficulty}, ${opts.runs} runs/king, RULES_FULL, autoFire ${opts.bot === 'random' ? 'off' : 'on'}`,
  );
  for (const k of t.kings)
    console.log(
      `${k.kingId.padEnd(7)} win ${pct(k.winRate).padStart(6)}  mean year ${k.meanYear.toFixed(1)}`,
    );
  console.log(
    `spread ${pct(t.spread)}  target ${t.onTarget ? 'MET' : 'not met'}  elapsed ${((Date.now() - started) / 1000).toFixed(1)} s`,
  );

  const dir = join('tools', 'out');
  mkdirSync(dir, { recursive: true });
  const base = join(dir, `balance-${opts.bot}-gai-${opts.difficulty}`);
  writeFileSync(
    `${base}-runs.csv`,
    csv([
      ['king', 'seed', 'difficulty', 'won', 'yearReached', 'completedYears', 'commands'],
      ...runs.map((r) => [
        r.kingId,
        r.seed,
        r.difficulty,
        r.won ? 1 : 0,
        r.yearReached,
        r.completedYears,
        r.commands,
      ]),
    ]),
  );
  writeFileSync(
    `${base}-summary.csv`,
    csv([
      ['king', 'runs', 'wins', 'winRate', 'meanYear'],
      ...t.kings.map((k) => [k.kingId, k.runs, k.wins, k.winRate, k.meanYear]),
    ]),
  );
  writeFileSync(
    `${base}-cards.csv`,
    csv([
      ['card', 'picked', 'offered', 'rate'],
      ...t.cards.map((c) => [c.cardId, c.picked, c.offered, c.rate]),
    ]),
  );
  writeFileSync(
    `${base}-years.csv`,
    csv([
      ['year', 'lost', 'reached', 'rate'],
      ...t.years.map((y) => [y.year, y.lost, y.reached, y.rate]),
    ]),
  );
  console.log(`CSV: ${base}-{runs,summary,cards,years}.csv`);
}

main();
