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
  /** Low objects (bushes, rocks, stumps) stand inside the field, off the board, the road and the water. */
  low: { count: 26, attempts: 600, margin: 32, boardPad: 24, roadHalf: 44 },
  /** Never north of this (the mountain wall's foot is at 176). */
  northLimit: 200,
} as const;
