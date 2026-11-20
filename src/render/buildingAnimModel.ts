/**
 * Activity loop of a building (20/11/2026): frames 0, 1, 2, 1 at `BUILDING_ANIM_FPS`, each structure offset by its id
 * so neighbours do not move in step. Pure.
 */
export const BUILDING_ANIM_FPS = 4;
const ORDER = [0, 1, 2, 1] as const;

export const buildingAnimIndex = (nowMs: number, id: number): number =>
  ORDER[(Math.floor((nowMs / 1000) * BUILDING_ANIM_FPS) + id * 3) % ORDER.length]!;
