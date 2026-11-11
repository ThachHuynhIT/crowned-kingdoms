import { RULES_ENDLESS, RULES_FULL, type Rules, type RunMode } from '../../data/rules';
import { isEndlessUnlocked, type MetaProfile } from '../../game/meta';

/** Why "Vô tận" cannot be picked yet (spec 2026-11-09 §2). */
export const ENDLESS_LOCKED_TEXT = 'Thắng một ván 30 năm để mở Vô tận.';

/** One button of the "30 năm" / "Vô tận" toggle on the king detail screen. */
export interface ModeChoice {
  readonly id: RunMode;
  readonly labelVi: string;
  readonly enabled: boolean;
  /** Shown under a disabled choice; null when it can be picked. */
  readonly reasonVi: string | null;
}

/** The two run modes; Vô tận stays on show while locked, disabled and with its reason. */
export const modeChoices = (profile: Pick<MetaProfile, 'endlessUnlocked'>): readonly ModeChoice[] => {
  const open = isEndlessUnlocked(profile);
  return [
    { id: 'normal', labelVi: '30 năm', enabled: true, reasonVi: null },
    { id: 'endless', labelVi: 'Vô tận', enabled: open, reasonVi: open ? null : ENDLESS_LOCKED_TEXT },
  ];
};

/** A tap on `wanted`: the new mode, or `current` when `wanted` is locked. */
export const pickRunMode = (
  profile: Pick<MetaProfile, 'endlessUnlocked'>,
  current: RunMode,
  wanted: RunMode,
): RunMode => (modeChoices(profile).find((c) => c.id === wanted)?.enabled ? wanted : current);

/**
 * The rules of a NEW run (never a resumed one): a missing mode is the normal 30-year run; Endless is
 * checked again against the session's profile (no profile = locked), so a stale button cannot start it.
 */
export const freshRunRules = (
  mode: RunMode | undefined,
  profile: Pick<MetaProfile, 'endlessUnlocked'> | null,
): { ok: true; rules: Rules } | { ok: false; reason: string } => {
  if (mode !== 'endless') return { ok: true, rules: RULES_FULL };
  if (profile === null || !isEndlessUnlocked(profile)) return { ok: false, reason: ENDLESS_LOCKED_TEXT };
  return { ok: true, rules: RULES_ENDLESS };
};
