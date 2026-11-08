import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../../game/meta';
import { DIFFICULTY_OPTIONS, difficultyChoices } from './difficulty';

describe('DIFFICULTY_OPTIONS', () => {
  it('has Peasant at thorn 0, then Gai 1 … Gai 5', () => {
    expect(DIFFICULTY_OPTIONS.map((o) => [o.labelVi, o.thorn])).toEqual([
      ['Nông dân', 0],
      ['Gai 1', 1],
      ['Gai 2', 2],
      ['Gai 3', 3],
      ['Gai 4', 4],
      ['Gai 5', 5],
    ]);
    expect(DIFFICULTY_OPTIONS[0]).toEqual({ id: 'peasant', labelVi: 'Nông dân', thorn: 0 });
  });
});

describe('difficultyChoices', () => {
  it('default profile: only Nông dân (Gai 0)', () => {
    expect(difficultyChoices(defaultProfile()).map((o) => o.thorn)).toEqual([0]);
  });
  it('a win at Gai 0 opens Gai 1; a win at Gai 4 or more shows all six', () => {
    expect(difficultyChoices({ ...defaultProfile(), highestDifficultyWon: 0 }).map((o) => o.labelVi)).toEqual(['Nông dân', 'Gai 1']);
    expect(difficultyChoices({ ...defaultProfile(), highestDifficultyWon: 4 })).toHaveLength(6);
    expect(difficultyChoices({ ...defaultProfile(), highestDifficultyWon: 5 })).toHaveLength(6);
  });
});
