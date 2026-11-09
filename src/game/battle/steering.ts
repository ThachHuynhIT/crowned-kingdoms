/**
 * Separation (spec §8.11), carried over from the colony sim's movementSystem: bodies that
 * overlap (centre distance < rA + rB) are pushed apart.
 *
 * - Two units: each moves min(overlap / 2, pushMax) away from the other.
 * - Teams (optional `team`): two units of different teams are pushed apart by at most
 *   `crossMax` each (default `pushMax`), and a unit marked `anchored` (in contact with its
 *   target) is never pushed by an enemy, so a crowd cannot shove a fighting unit away.
 * - A structure (`fixed`) never moves; it pushes a non-flying unit fully out of its square
 *   footprint (half-side = its radius, 2026-11-09). Flying units ignore structures. Two structures
 *   never push each other.
 * - Pass-through (optional `passTeam`, spec 06/11/2026): a unit of that team is not pushed by a
 *   structure of the same team. The battle no longer uses it (2026-11-09: nobody walks through).
 * - Exactly coincident centres split along the fixed axis (1, 0), as the old code did.
 *
 * Deterministic: pushes are computed from the positions as given (a snapshot) and only
 * accumulated into `outX`/`outY`, so the caller applies them all at once (§8.9 step 5);
 * pairs are visited in index order; only + − × ÷, Math.sqrt and Math.min are used.
 * Arrays may be typed arrays (BattleWorld struct-of-arrays) or plain arrays.
 */
export interface SeparationBodies {
  readonly count: number;
  readonly x: ArrayLike<number>;
  readonly y: ArrayLike<number>;
  readonly radius: ArrayLike<number>;
  /** 1 = structure (tower, building, throne), 0 = unit. */
  readonly fixed: ArrayLike<number>;
  /** 1 = flying unit, 0 = ground unit. */
  readonly flying: ArrayLike<number>;
  /** Team id per body; without it every pair of units counts as teammates. */
  readonly team?: ArrayLike<number>;
  /** 1 = in contact with its target: ignores pushes from enemy units. */
  readonly anchored?: ArrayLike<number>;
  /** Units of this team pass through structures of the same team (needs `team`). */
  readonly passTeam?: number;
}

/** Below this centre distance two bodies count as coincident. */
const COINCIDENT = 1e-3;

/**
 * A structure's footprint is the square of half-side `half` around (fx, fy) (2026-11-09: buildings block their
 * footprint, not a circle). Pushes the ground unit `u` (centre ux, uy, radius ru) fully out of it: off the nearest
 * point of the square, or, with its centre inside, along the axis of least overlap (ties: x; dead centre: +x).
 */
const squarePush = (
  fx: number,
  fy: number,
  half: number,
  ux: number,
  uy: number,
  ru: number,
  outX: Float64Array,
  outY: Float64Array,
  u: number,
): void => {
  const relX = ux - fx;
  const relY = uy - fy;
  const cx = Math.min(half, Math.max(-half, relX));
  const cy = Math.min(half, Math.max(-half, relY));
  if (cx !== relX || cy !== relY) {
    const dx = relX - cx;
    const dy = relY - cy;
    const distSq = dx * dx + dy * dy;
    if (distSq >= ru * ru) return;
    const d = Math.sqrt(distSq);
    const out = ru - d;
    outX[u] = outX[u]! + (dx / d) * out;
    outY[u] = outY[u]! + (dy / d) * out;
    return;
  }
  const penX = half + ru - Math.abs(relX);
  const penY = half + ru - Math.abs(relY);
  if (penX <= penY) outX[u] = outX[u]! + (relX < 0 ? -penX : penX);
  else outY[u] = outY[u]! + (relY < 0 ? -penY : penY);
};

/** Writes each body's separation push into outX/outY (indices 0..count-1, zeroed first). */
export const separationPush = (
  bodies: SeparationBodies,
  pushMax: number,
  outX: Float64Array,
  outY: Float64Array,
  crossMax: number = pushMax,
): void => {
  const { count, x, y, radius, fixed, flying, team, anchored, passTeam } = bodies;
  outX.fill(0, 0, count);
  outY.fill(0, 0, count);
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const fixedI = fixed[i] === 1;
      const fixedJ = fixed[j] === 1;
      if (fixedI && fixedJ) continue;
      if ((fixedI && flying[j] === 1) || (fixedJ && flying[i] === 1)) continue;
      if ((fixedI || fixedJ) && passTeam !== undefined && team !== undefined && team[i] === passTeam && team[j] === passTeam) continue;
      if (fixedI || fixedJ) {
        const f = fixedI ? i : j;
        const u = fixedI ? j : i;
        squarePush(x[f]!, y[f]!, radius[f]!, x[u]!, y[u]!, radius[u]!, outX, outY, u);
        continue;
      }
      const minDist = radius[i]! + radius[j]!;
      let dx = x[j]! - x[i]!;
      let dy = y[j]! - y[i]!;
      const distSq = dx * dx + dy * dy;
      if (distSq >= minDist * minDist) continue; // sqrt only for overlapping pairs
      let d = Math.sqrt(distSq);
      if (d < COINCIDENT) {
        dx = 1;
        dy = 0;
        d = 0;
      } else {
        dx /= d;
        dy /= d;
      }
      const overlap = minDist - d;
      const enemies = team !== undefined && team[i] !== team[j];
      const push = Math.min(overlap / 2, enemies ? crossMax : pushMax);
      if (!(enemies && anchored !== undefined && anchored[i] === 1)) {
        outX[i] = outX[i]! - dx * push;
        outY[i] = outY[i]! - dy * push;
      }
      if (!(enemies && anchored !== undefined && anchored[j] === 1)) {
        outX[j] = outX[j]! + dx * push;
        outY[j] = outY[j]! + dy * push;
      }
    }
  }
};
