/**
 * The one isometric projection of the realm (spec 2026-11-06, P3; owner decision: a 64 px plot is a
 * 128×64 diamond at zoom 1). The simulation stays on the square world grid; only drawing and pointer
 * input go through this. Pure: only + − × ÷, no engine, no data.
 *
 *   projected.x = world.x − world.y          (world +x goes down-right, world +y goes down-left)
 *   projected.y = (world.x + world.y) / 2
 */
export interface IsoPoint {
  readonly x: number;
  readonly y: number;
}

/** Screen size of one 64 px plot at zoom 1, and the factor world length → projected length along an axis. */
export const ISO = { plotW: 128, plotH: 64 } as const;

export const project = (p: IsoPoint): IsoPoint => ({ x: p.x - p.y, y: (p.x + p.y) / 2 });

export const unproject = (q: IsoPoint): IsoPoint => ({ x: q.y + q.x / 2, y: q.y - q.x / 2 });

/** Draw order of something standing at world point `p`: its projected foot y (unrounded). */
export const isoDepth = (p: IsoPoint): number => (p.x + p.y) / 2;
