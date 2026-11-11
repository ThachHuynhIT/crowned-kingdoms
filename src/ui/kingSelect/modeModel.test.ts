import { describe, expect, it } from 'vitest';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import { defaultProfile } from '../../game/meta';
import { ENDLESS_LOCKED_TEXT, freshRunRules, modeChoices, pickRunMode } from './modeModel';

const locked = defaultProfile();
const open = { ...defaultProfile(), endlessUnlocked: true };

describe('modeChoices', () => {
  it('offers "30 năm" then "Vô tận"; a locked profile keeps Vô tận on show, disabled, with the reason', () => {
    expect(modeChoices(locked)).toEqual([
      { id: 'normal', labelVi: '30 năm', enabled: true, reasonVi: null },
      { id: 'endless', labelVi: 'Vô tận', enabled: false, reasonVi: 'Thắng một ván 30 năm để mở Vô tận.' },
    ]);
    expect(ENDLESS_LOCKED_TEXT).toBe('Thắng một ván 30 năm để mở Vô tận.');
  });

  it('enables Vô tận once the profile has opened it', () => {
    expect(modeChoices(open)[1]).toEqual({ id: 'endless', labelVi: 'Vô tận', enabled: true, reasonVi: null });
  });

  it('never trusts a missing or odd flag: only `true` opens it', () => {
    const odd = { ...defaultProfile(), endlessUnlocked: 'yes' as unknown as boolean };
    expect(modeChoices(odd)[1]!.enabled).toBe(false);
  });
});

describe('pickRunMode', () => {
  it('switches to an enabled mode and refuses a locked one (the mode stays)', () => {
    expect(pickRunMode(open, 'normal', 'endless')).toBe('endless');
    expect(pickRunMode(open, 'endless', 'normal')).toBe('normal');
    expect(pickRunMode(locked, 'normal', 'endless')).toBe('normal');
  });
});

describe('freshRunRules (the realm fresh-start guard)', () => {
  it('a missing mode is a normal 30-year run (dev launches)', () => {
    expect(freshRunRules(undefined, locked)).toEqual({ ok: true, rules: RULES_FULL });
    expect(freshRunRules('normal', open)).toEqual({ ok: true, rules: RULES_FULL });
  });

  it('starts Endless with RULES_ENDLESS only for an unlocked profile', () => {
    expect(freshRunRules('endless', open)).toEqual({ ok: true, rules: RULES_ENDLESS });
  });

  it('refuses Endless for a locked profile (and for no profile at all) with the locked text', () => {
    expect(freshRunRules('endless', locked)).toEqual({ ok: false, reason: ENDLESS_LOCKED_TEXT });
    expect(freshRunRules('endless', null)).toEqual({ ok: false, reason: ENDLESS_LOCKED_TEXT });
  });
});
