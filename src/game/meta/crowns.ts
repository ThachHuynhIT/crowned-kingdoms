import { RUN } from '../../data/run';
import { SETTLED_RUNS_KEPT } from '../../data/meta';
import { CONTENT } from '../cards/registry';
import type { RunState } from '../run/state';
import type { MetaProfile } from './profile';
import { unlockedPerks } from './unlocks';

export interface CrownBreakdown {
  years: number;
  conquests: number;
  bosses: number;
  victory: number;
  multiplier: number;
  total: number;
}

/** Điểm Vương Miện của một ván (spec §9.1): round((năm + 3·chinh phục + 5·boss + 20 nếu thắng) × (1 + 0.2·gai)). */
export const crownPoints = (state: RunState): CrownBreakdown => {
  const years = state.stats.completedYears;
  const conquests = state.stats.conquered * 3;
  const bosses = state.stats.bossesWon * 5;
  const victory = state.won === true ? 20 : 0;
  const multiplier = 1 + RUN.difficultyCrownStep * state.difficulty;
  const total = Math.round((years + conquests + bosses + victory) * multiplier);
  return { years, conquests, bosses, victory, multiplier, total };
};

export const runKey = (state: RunState): string =>
  `${state.seed}:${state.kingId}:${state.difficulty}:${state.perk ?? '-'}`;

/** Chấm điểm một ván đã kết thúc; cùng ván chấm hai lần chỉ cộng một lần. */
export const settleRun = (
  p: MetaProfile,
  state: RunState,
): { profile: MetaProfile; breakdown: CrownBreakdown; unlocks: string[] } => {
  const breakdown = crownPoints(state);
  const key = runKey(state);
  if (p.settledRuns.includes(key)) return { profile: p, breakdown, unlocks: [] };
  const won = state.won === true;
  const king = state.kingId;
  const profile: MetaProfile = {
    ...p,
    crownPoints: p.crownPoints + breakdown.total,
    mastery: { ...p.mastery, [king]: p.mastery[king] + breakdown.total },
    wins: { ...p.wins, [king]: p.wins[king] + (won ? 1 : 0) },
    highestDifficultyWon: won ? Math.max(p.highestDifficultyWon, state.difficulty) : p.highestDifficultyWon,
    settledRuns: [...p.settledRuns, key].slice(-SETTLED_RUNS_KEPT),
  };
  const unlocks: string[] = [];
  const before = unlockedPerks(p, king);
  const perks = CONTENT.king(king).perks;
  for (const id of unlockedPerks(profile, king)) {
    if (!before.includes(id)) {
      const def = perks.find((x) => x.id === id);
      unlocks.push(`Mở đặc quyền: ${def?.nameVi ?? id}`);
    }
  }
  for (let d = p.highestDifficultyWon + 2; d <= profile.highestDifficultyWon + 1 && d <= RUN.difficultyLevels; d++) {
    unlocks.push(`Mở độ khó Gai ${d}`);
  }
  return { profile, breakdown, unlocks };
};
