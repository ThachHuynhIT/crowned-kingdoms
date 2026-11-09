import { BATTLE, ENEMY_PORTAL } from '../../data/battle';
import type { RunMode } from '../../data/rules';
import { geometryFor } from '../../game/run/boardGeometry';
import type { Point, Size } from '../hud/layout';

export interface CameraView {
  readonly zoom: number;
  readonly scroll: Point;
}
/** The world area the camera may show: the field with the spawn rows south and a margin east/west. */
const WORLD_BOUNDS = {
  x0: -BATTLE.plot,
  y0: 0,
  x1: BATTLE.field + BATTLE.plot,
  // past the enemy portal (y 916 since 2026-11-09) by one plot, so its mouth and the foes in front of it stay in view
  y1: Math.max(BATTLE.field + BATTLE.plot + BATTLE.spawnOutside + BATTLE.spawnRowGap, ENEMY_PORTAL.y + BATTLE.plot),
} as const;

/** `WORLD_BOUNDS` as the camera sees it: the bounding box of its isometric diamond (camera space, x' = y − x). */
export const MAP_BOUNDS = {
  x0: WORLD_BOUNDS.y0 - WORLD_BOUNDS.x1,
  y0: (WORLD_BOUNDS.x0 + WORLD_BOUNDS.y0) / 2,
  x1: WORLD_BOUNDS.y1 - WORLD_BOUNDS.x0,
  y1: (WORLD_BOUNDS.x1 + WORLD_BOUNDS.y1) / 2,
} as const;

/**
 * Where the screen centre may sit, in world px: on the map, and never north of the mountain wall. `MAP_BOUNDS`
 * alone is the diamond's bounding box, whose north-west corner is empty sky past the cliff.
 */
const CENTRE_BOUNDS = { x0: WORLD_BOUNDS.x0, y0: BATTLE.wallY, x1: WORLD_BOUNDS.x1, y1: WORLD_BOUNDS.y1 } as const;

/**
 * Keeps the shown world rect inside `MAP_BOUNDS` (a view wider or taller than the map is centred on it), then
 * slides the screen centre sideways, along its screen row, onto the part of that row inside `CENTRE_BOUNDS`
 * (on the field, south of the wall), as far as the rect still allows. Sideways only, so the rect clamp holds.
 */
export const clampView = (view: CameraView, screen: Size, mode: RunMode = 'normal'): CameraView => {
  const centreBounds = { ...CENTRE_BOUNDS, y0: geometryFor(mode).wallY };
  const rect = clampRect(view, screen);
  const hx = screen.w / 2;
  const cx = rect.scroll.x + hx;
  const cy = rect.scroll.y + screen.h / 2;
  // The centre's allowed screen x from the rect: [x0 + hw, x1 − hw], a single point when the view is wider.
  const hw = hx / view.zoom;
  const [bx0, bx1] = 2 * hw >= MAP_BOUNDS.x1 - MAP_BOUNDS.x0
    ? [cx, cx]
    : [MAP_BOUNDS.x0 + hw, MAP_BOUNDS.x1 - hw];
  // World (x, y) = (cy − cx/2, cy + cx/2): each CENTRE_BOUNDS side is a bound on cx for this row.
  let lo = Math.max(bx0, 2 * (centreBounds.y0 - cy), 2 * (cy - centreBounds.x1));
  let hi = Math.min(bx1, 2 * (centreBounds.y1 - cy), 2 * (cy - centreBounds.x0));
  if (lo > hi) return rect; // this row never crosses the field (a view taller than the map): keep the rect clamp
  if (screen.w >= 768) {
    const mid = (lo + hi) / 2;
    const half = (hi - lo) * 0.3;
    lo = mid - half;
    hi = mid + half;
  }
  return { zoom: rect.zoom, scroll: { x: Math.min(hi, Math.max(lo, cx)) - hx, y: rect.scroll.y } };
};

const clampRect = (view: CameraView, screen: Size): CameraView => {
  const axis = (scroll: number, half: number, size: number, lo: number, hi: number): number => {
    // The shown span is [scroll + half − half/zoom, … + size/zoom].
    const span = size / view.zoom;
    const left = scroll + half - half / view.zoom;
    const fixed = span >= hi - lo ? (lo + hi) / 2 - span / 2 : Math.min(hi - span, Math.max(lo, left));
    return fixed - half + half / view.zoom;
  };
  return {
    zoom: view.zoom,
    scroll: {
      x: axis(view.scroll.x, screen.w / 2, screen.w, MAP_BOUNDS.x0, MAP_BOUNDS.x1),
      y: axis(view.scroll.y, screen.h / 2, screen.h, MAP_BOUNDS.y0, MAP_BOUNDS.y1),
    },
  };
};

