import type { KingId } from '../data/types';
import {
  SKINNABLE_FRAMES,
  themedFrame,
  type AnyUiFrame,
  type SkinnableFrame,
  type UiFrame,
} from '../render/uiArt';

/** `neutral` is the wood-and-cream look; a king id paints panels, buttons, cards and bars in that king's colours. */
export type UiSkin = 'neutral' | KingId;

const isSkinnable = (frame: UiFrame): frame is SkinnableFrame =>
  (SKINNABLE_FRAMES as readonly string[]).includes(frame);

/** The frame to draw for `base` under `skin`: unchanged for `neutral` and for frames that have no king version. */
export const skinFrame = (base: UiFrame, skin: UiSkin): AnyUiFrame =>
  skin === 'neutral' || !isSkinnable(base) ? base : themedFrame(base, skin);
