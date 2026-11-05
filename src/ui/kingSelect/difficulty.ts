/**
 * Difficulty levels the king-select screen offers. G3 only has the Peasant level; the list is
 * an array so the "Gai" (thorn) levels 1–5 of a later sub-project only need new entries.
 */
export interface DifficultyOption {
  readonly id: string;
  readonly labelVi: string;
  /** Number of thorns (0 = none). */
  readonly thorn: number;
}

export const DIFFICULTY_OPTIONS: readonly DifficultyOption[] = [{ id: 'peasant', labelVi: 'Nông dân', thorn: 0 }];
