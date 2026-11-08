import { FLOAT_DAMAGE_MIN, SHAKE_MS, SHAKE_PX } from '../data/juice';

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
