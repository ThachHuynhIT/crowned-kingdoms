import { describe, expect, it } from 'vitest';
import { DIFFICULTY_OPTIONS } from './difficulty';

describe('DIFFICULTY_OPTIONS', () => {
  it('has the single Peasant level at thorn 0 for now', () => {
    expect(DIFFICULTY_OPTIONS).toEqual([{ id: 'peasant', labelVi: 'Nông dân', thorn: 0 }]);
  });
});
