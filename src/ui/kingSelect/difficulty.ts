import { availableDifficulties, type MetaProfile } from '../../game/meta';

/** Difficulty levels the king-select screen offers: Peasant (no thorn), then Gai 1–5. */
export interface DifficultyOption {
  readonly id: string;
  readonly labelVi: string;
  /** Number of thorns (0 = none); the run's `difficulty`. */
  readonly thorn: number;
}

export const DIFFICULTY_OPTIONS: readonly DifficultyOption[] = [
  { id: 'peasant', labelVi: 'Nông dân', thorn: 0 },
  { id: 'thorn1', labelVi: 'Gai 1', thorn: 1 },
  { id: 'thorn2', labelVi: 'Gai 2', thorn: 2 },
  { id: 'thorn3', labelVi: 'Gai 3', thorn: 3 },
  { id: 'thorn4', labelVi: 'Gai 4', thorn: 4 },
  { id: 'thorn5', labelVi: 'Gai 5', thorn: 5 },
];

/** The levels this profile has opened (Gai d after a win at Gai d − 1), lowest first. */
export const difficultyChoices = (profile: MetaProfile): readonly DifficultyOption[] => {
  const open = availableDifficulties(profile);
  return DIFFICULTY_OPTIONS.filter((o) => open.includes(o.thorn));
};
