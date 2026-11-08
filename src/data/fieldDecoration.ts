/**
 * Field decoration (spec 2026-11-06 §5, P4): how many wild objects are scattered and where they may stand.
 * Decoration is drawing only: it never enters the battle (no collision, no target, no save).
 * World px; the board is [224, 544)², the road is the two middle field columns south of the board.
 */
export const FIELD_DECOR = {
  /** Salt of the decoration's own hash stream (never one of the run's RNG streams). */
  salt: 6011,
  /** Tall objects (trees, crags) stand OUTSIDE the field so they never hide a unit. */
  tall: { count: 18, attempts: 600, ring: { inner: 24, outer: 260 } },
  /**
   * Low objects (bushes, rocks, stumps) stand inside the field, off the board, the road and the water, and only in
   * the two side bands (x ≤ west or x ≥ east), so the middle of the field stays clear for the fight (spec 2026-11-08).
   */
  low: { count: 12, attempts: 600, margin: 32, boardPad: 24, roadHalf: 44, edge: { west: 192, east: 576 } },
  /** The main battlefield, from the board's south edge to past the portal: no decoration footprint touches it. */
  combatClear: { x0: 256, x1: 512, y0: 544, y1: 832 },
  /** Around the enemy portal (`ENEMY_PORTAL`, 384 × 792) and where its foes fan out: kept empty too. */
  portalClear: { x0: 328, x1: 440, y0: 736, y1: 848 },
  /**
   * The forest behind the mountain cliff (spec 2026-11-08 §6; denser than the plan's 64 px grid after the in-game review): one candidate per `grid` cell of world
   * [x0, x1) × [y0, y1), kept with probability `occupancy`, a pine `pineShare` of the time, jittered by ±`jitter`;
   * footprints end at y1, 24 px north of the wall foot. The window covers what any view of the map can show.
   */
  forest: {
    salt: 6811, grid: 40, jitter: 12, occupancy: 0.72, pineShare: 0.9, x0: -1024, x1: 1792, y0: -1152, y1: 152,
    /** Only where a view of the map can reach: projected x' = y − x in [x0, x1], foot y' = (x + y) / 2 ≥ y0. */
    view: { x0: -1300, x1: 1400, y0: -320 },
  },
  /** Never north of this (the mountain wall's foot is at 176). */
  northLimit: 200,
} as const;
