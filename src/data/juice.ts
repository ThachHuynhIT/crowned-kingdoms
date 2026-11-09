export const SHAKE_PX = 2;
export const SHAKE_MS = 150;
export const HIT_FLASH_FRAMES = 2;
export const FLOAT_DAMAGE_MIN = 50;
export const FLOAT_MS = 600;
export const FLOAT_RISE_PX = 12;
export const FLOAT_POOL = 64;
/** Death pop (spec §11.5): four discrete frames, each this long (real time). */
export const DEATH_POP_FRAMES = 4;
export const DEATH_FRAME_MS = 45;
/** At most this many pops drawn at once (oldest dropped). */
export const DEATH_POP_POOL = 64;
/** Gold gained: `+N` rises from the gold counter this long and this far (HUD px). */
export const COIN_FLY_MS = 700;
export const COIN_RISE_PX = 18;
/** Card fly: the played card flies from its hand slot to its plot in this time (spec §11.5: 250 ms). */
export const CARD_FLY_MS = 250;
