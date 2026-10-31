import type { KingId } from '../../data/types';
import { KING_THEMES, LOCKED_THEME, type KingTheme } from '../../data/uiPalette';

/** The colours of `id`'s screens. */
export const kingTheme = (id: KingId): KingTheme => KING_THEMES[id];

/** The grey colours of a king that is still locked (no portrait, no name leaked). */
export const lockedTheme = (): KingTheme => LOCKED_THEME;
