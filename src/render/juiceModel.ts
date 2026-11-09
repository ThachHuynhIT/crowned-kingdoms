import {
  DEATH_FRAME_MS,
  DEATH_POP_FRAMES,
  FLOAT_DAMAGE_MIN,
  SHAKE_MS,
  SHAKE_PX,
} from '../data/juice';

const SHAKE_SEQUENCE = [
  { x: SHAKE_PX, y: 0 },
  { x: -SHAKE_PX, y: 1 },
  { x: 1, y: -SHAKE_PX },
  { x: -1, y: SHAKE_PX },
  { x: 0, y: -1 },
] as const;

export const shakeOffset = (elapsedMs: number, enabled: boolean): { x: number; y: number } => {
  if (!enabled || elapsedMs >= SHAKE_MS) return { x: 0, y: 0 };
  const offset = SHAKE_SEQUENCE[Math.floor(Math.max(0, elapsedMs) / 30)];
  return offset ? { ...offset } : { x: 0, y: 0 };
};

export const showsFloatingDamage = (dmg: number): boolean => dmg >= FLOAT_DAMAGE_MIN;

/** Frame 0..3 of a death pop `elapsedMs` after the death, or null once it is over. */
export const deathPopFrame = (elapsedMs: number): number | null => {
  const f = Math.floor(Math.max(0, elapsedMs) / DEATH_FRAME_MS);
  return f < DEATH_POP_FRAMES ? f : null;
};

/** Six square puffs of frame `f` around the unit (screen px offsets): they move out and shrink each frame. */
const PUFF_DIRS = [
  [1, 0],
  [-1, 0],
  [1, -1],
  [-1, -1],
  [0, -1],
  [0, 1],
] as const;
export const deathPopPuffs = (f: number): { dx: number; dy: number; size: number }[] => {
  const reach = 2 + 3 * f;
  const size = Math.max(1, 4 - f);
  return PUFF_DIRS.map(([x, y]) => ({ dx: x * reach, dy: y * reach, size }));
};
