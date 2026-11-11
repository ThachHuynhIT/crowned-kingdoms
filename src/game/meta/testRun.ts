import type { RunState } from '../run/state';

/** Minimal run state for meta tests (only the fields the meta layer reads). */
export const fakeRun = (o: {
  years: number;
  conquered: number;
  bosses: number;
  won: boolean;
  difficulty?: number;
  perk?: RunState['perk'];
  seed?: number;
  kingId?: RunState['kingId'];
}): RunState =>
  ({
    seed: o.seed ?? 1,
    kingId: o.kingId ?? 'wheat',
    difficulty: o.difficulty ?? 0,
    perk: o.perk ?? null,
    won: o.won,
    stats: { completedYears: o.years, conquered: o.conquered, bossesWon: o.bosses },
  }) as unknown as RunState;
