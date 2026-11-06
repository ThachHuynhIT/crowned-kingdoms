/**
 * The one isometric projection of the realm (spec 2026-11-06, P3; owner decision: a 64 px plot is a
 * 128×64 diamond at zoom 1). The simulation stays on the square world grid; only drawing and pointer
 * input go through this. Pure: only + − × ÷, no engine, no data.
 *
 *   projected.x = world.y − world.x          (world +y, south, goes down-right; world +x, east, goes down-left)
 *   projected.y = (world.x + world.y) / 2
 *
 * Owner, 2026-11-06: the enemy comes in from the RIGHT of the screen, so the road (world south) runs to the
 * lower right and the mountain wall (world north) lies to the upper left.
 */
export interface IsoPoint {
  readonly x: number;
  readonly y: number;
}

/** Screen size of one 64 px plot at zoom 1, and the factor world length → projected length along an axis. */
export const ISO = { plotW: 128, plotH: 64 } as const;

export const project = (p: IsoPoint): IsoPoint => ({ x: p.y - p.x, y: (p.x + p.y) / 2 });

export const unproject = (q: IsoPoint): IsoPoint => ({ x: q.y - q.x / 2, y: q.y + q.x / 2 });

/** Draw order of something standing at world point `p`: its projected foot y (unrounded). */
export const isoDepth = (p: IsoPoint): number => (p.x + p.y) / 2;
