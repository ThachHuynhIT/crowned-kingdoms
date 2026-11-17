/**
 * Facing and pose of a unit drawn from its diagonal sheets (17/11/2026, spec 2026-11-17-iso-unit-sheets-design.md).
 * Pure: the renderer feeds it the simulation state and the clock.
 */
import type { IsoDir } from './imageArt';

/** Which sheet a unit shows and whether it faces the screen's left. SE faces right, NW left; a flip gives SW / NE. */
export interface IsoFacing {
  readonly dir: IsoDir;
  readonly left: boolean;
}

/** A screen axis turns only when the move along it is at least this share of the move along the other (no flicker). */
const TURN_SHARE = 0.25;

/**
 * The facing after a screen move (`sx`, `sy`; y grows down the screen): toward the viewer → SE sheet, away → NW;
 * left / right by the sign of `sx`. A near-horizontal move keeps the sheet, a near-vertical one the side.
 */
export const isoFacing = (prev: IsoFacing, sx: number, sy: number): IsoFacing => {
  const ax = Math.abs(sx);
  const ay = Math.abs(sy);
  if (ax === 0 && ay === 0) return prev;
  const left = ax > TURN_SHARE * ay ? sx < 0 : prev.left;
  const dir: IsoDir = ay > TURN_SHARE * ax ? (sy < 0 ? 'nw' : 'se') : prev.dir;
  return left === prev.left && dir === prev.dir ? prev : { dir, left };
};

/** Screen move of a world move (`project` in `core/iso.ts`: x = y − x, y = (x + y) / 2). */
export const isoScreenMove = (dx: number, dy: number): { sx: number; sy: number } => ({ sx: dy - dx, sy: (dx + dy) / 2 });

/** Whether the sprite of a sheet is flipped horizontally for `facing`. */
export const isoFlip = (facing: IsoFacing): boolean => (facing.dir === 'se' ? facing.left : !facing.left);

/** First cell and length of each animation in a strip. */
export const ISO_ANIMS = { idle: [0, 3], walk: [3, 4], attack: [7, 4] } as const;
/** Frames per second (one loop lasts as long as the two-frame front-view loop: idle 333 ms, walk 250 ms). */
const IDLE_FPS = 9;
const WALK_FPS = 16;
/** Ticks after a strike that show the strike (to 1.2) and then the recovery (to 2), as `ATTACK_SHOW_TICKS` before. */
const STRIKE_TICKS = 1.2;
const ATTACK_TICKS = 2;

export interface IsoPoseInput {
  readonly moving: boolean;
  /** Attack interval and cooldown in ticks (combat.ts: the strike sets cooldown = interval, then it counts down). */
  readonly interval: number;
  readonly cooldown: number;
  readonly stunned: boolean;
  readonly hasTarget: boolean;
  /** Share of the way to the next tick (0..1). */
  readonly alpha: number;
  readonly nowMs: number;
}

/**
 * The strip cell to show. Attack, keyed to the simulation so it keeps pace at any battle speed: during the last tick
 * before a strike that will land (cooldown 1, standing at a live target, not stunned) the ready pose then the wind-up;
 * from the strike the strike pose, then the recovery. Otherwise walk while moving, else idle, on the clock.
 */
export const isoPoseCell = (s: IsoPoseInput): number => {
  if (s.interval > 0) {
    const since = s.interval - s.cooldown + s.alpha;
    if (since < ATTACK_TICKS) return ISO_ANIMS.attack[0] + (since < STRIKE_TICKS ? 2 : 3);
    if (s.cooldown > 0 && s.cooldown <= 1 && s.hasTarget && !s.moving && !s.stunned)
      return ISO_ANIMS.attack[0] + (s.alpha < 0.5 ? 0 : 1);
  }
  if (s.moving) return ISO_ANIMS.walk[0] + (Math.floor((s.nowMs / 1000) * WALK_FPS) % ISO_ANIMS.walk[1]);
  return ISO_ANIMS.idle[0] + (Math.floor((s.nowMs / 1000) * IDLE_FPS) % ISO_ANIMS.idle[1]);
};
