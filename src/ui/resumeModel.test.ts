import { describe, expect, it } from 'vitest';
import { INCOMPATIBLE_RUN_TEXT } from '../data/save';
import { runState } from '../game/testing/fixtures';
import { RULES_ENDLESS, RULES_FULL } from '../data/rules';
import { CONTENT } from '../game/cards/registry';
import { newRun } from '../game/run/yearFlow';
import { LoadGuard, continueLabel, resumeCaption, resumeTarget } from './resumeModel';

describe('resumeCaption', () => {
  it('reads the mode and year from the saved state', () => {
    const endless = { ...newRun(3, 'wheat', CONTENT, RULES_ENDLESS), year: 41 };
    expect(resumeCaption(endless)).toBe('Vô tận · Năm 41');
    const normal = { ...newRun(3, 'wheat', CONTENT, RULES_FULL), year: 12 };
    expect(resumeCaption(normal)).toBe('30 năm · Năm 12');
  });

  it('the Continue label carries it on a second line, plain before a save loads', () => {
    expect(continueLabel(null)).toBe('Tiếp tục');
    expect(continueLabel({ ...newRun(3, 'wheat', CONTENT, RULES_ENDLESS), year: 1_000_000 })).toBe('Tiếp tục\nVô tận · Năm 1000000');
  });
});

describe('resumeTarget', () => {
  it('enables Continue with the run for a valid save', () => {
    const state = runState();
    expect(resumeTarget({ kind: 'ok', state })).toEqual({ enabled: true, state, warning: null });
  });

  it('disables Continue silently when nothing is saved', () => {
    expect(resumeTarget({ kind: 'empty' })).toEqual({ enabled: false, state: null, warning: null });
  });

  it('disables Continue and carries the notice for an unusable save', () => {
    expect(resumeTarget({ kind: 'incompatible', message: INCOMPATIBLE_RUN_TEXT })).toEqual({
      enabled: false,
      state: null,
      warning: INCOMPATIBLE_RUN_TEXT,
    });
  });
});

describe('stale_menu_load', () => {
  it('a load started by an older create or before shutdown is not current', () => {
    const guard = new LoadGuard();
    const first = guard.begin();
    expect(guard.isCurrent(first)).toBe(true);
    guard.invalidate(); // shutdown of create 1
    const second = guard.begin(); // create 2
    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
    guard.invalidate();
    expect(guard.isCurrent(second)).toBe(false);
  });
});
