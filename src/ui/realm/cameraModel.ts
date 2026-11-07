import { project, unproject } from '../../core/iso';
import { BATTLE } from '../../data/battle';
import type { Point, Rect, Size } from '../hud/layout';
import { cameraScroll, realmCamera, screenToWorld, type RealmPhase } from './realmLayout';

/**
 * The realm camera with zoom and pan (spec 06/11/2026, P2). Pure maths: RealmScene owns the
 * Phaser camera and applies these views; the HUD scenes get the live view on the bus
 * (`realm:view`) and map screen points through it. Zoom is always a whole number (pixel art):
 * the overview step is the phase camera of `realmCamera`, the steps above it go up to `ZOOM_MAX`.
 * At the overview step the view is exactly `realmCamera` and does not pan; above it the view
 * pans and stays inside `MAP_BOUNDS`.
 */
export interface CameraView {
  readonly zoom: number;
  readonly scroll: Point;
}

/** Highest zoom step. */
export const ZOOM_MAX = 3;

/** The world area the camera may show: the field with the spawn rows south and a margin east/west. */
const WORLD_BOUNDS = {
  x0: -BATTLE.plot,
  y0: 0,
  x1: BATTLE.field + BATTLE.plot,
  y1: BATTLE.field + BATTLE.plot + BATTLE.spawnOutside + BATTLE.spawnRowGap,
} as const;

/** `WORLD_BOUNDS` as the camera sees it: the bounding box of its isometric diamond (camera space, x' = y − x). */
export const MAP_BOUNDS = {
  x0: WORLD_BOUNDS.y0 - WORLD_BOUNDS.x1,
  y0: (WORLD_BOUNDS.x0 + WORLD_BOUNDS.y0) / 2,
  x1: WORLD_BOUNDS.y1 - WORLD_BOUNDS.x0,
  y1: (WORLD_BOUNDS.x1 + WORLD_BOUNDS.y1) / 2,
} as const;

/** Pinch: one step in once the finger spread grows by 25%, one step out once it shrinks by 20%. */
const PINCH_IN = 1.25;
const PINCH_OUT = 0.8;

export const overviewView = (screen: Size, phase: RealmPhase): CameraView => realmCamera(screen, phase);

/** Whole zoom steps from the overview to `ZOOM_MAX` (just the overview if it is already higher). */
export const zoomSteps = (screen: Size, phase: RealmPhase): number[] => {
  const base = overviewView(screen, phase).zoom;
  const out: number[] = [];
  for (let z = base; z <= Math.max(base, ZOOM_MAX); z++) out.push(z);
  return out;
};

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
export const clampView = (view: CameraView, screen: Size): CameraView => {
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
  const lo = Math.max(bx0, 2 * (CENTRE_BOUNDS.y0 - cy), 2 * (cy - CENTRE_BOUNDS.x1));
  const hi = Math.min(bx1, 2 * (CENTRE_BOUNDS.y1 - cy), 2 * (cy - CENTRE_BOUNDS.x0));
  if (lo > hi) return rect; // this row never crosses the field (a view taller than the map): keep the rect clamp
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

/** Zoom to the whole step nearest below `next` (clamped to the steps), keeping the world point under `p` still. */
export const zoomAt = (view: CameraView, p: Point, next: number, screen: Size, phase: RealmPhase): CameraView => {
  const steps = zoomSteps(screen, phase);
  const zoom = Math.min(steps[steps.length - 1]!, Math.max(steps[0]!, Math.floor(next)));
  if (zoom === steps[0]) return overviewView(screen, phase);
  const world = screenToWorld(p, view.scroll, screen, view.zoom);
  return clampView({ zoom, scroll: cameraScroll(world, p, screen, zoom) }, screen);
};

/**
 * Drag the map by a screen delta (the world follows the finger), at any zoom step: the isometric
 * board is wider than a phone even at the overview step.
 */
export const panBy = (view: CameraView, delta: Point, screen: Size, _phase: RealmPhase): CameraView => {
  return clampView(
    { zoom: view.zoom, scroll: { x: view.scroll.x - delta.x / view.zoom, y: view.scroll.y - delta.y / view.zoom } },
    screen,
  );
};

/** After a resize: the overview stays the overview; a zoomed view keeps the world point at the screen centre. */
export const resizeView = (view: CameraView, from: Size, to: Size, phase: RealmPhase): CameraView => {
  const base = overviewView(to, phase);
  if (view.zoom <= overviewView(from, phase).zoom || view.zoom <= base.zoom) return base;
  const centre = screenToWorld({ x: from.w / 2, y: from.h / 2 }, view.scroll, from, view.zoom);
  return clampView({ zoom: view.zoom, scroll: cameraScroll(centre, { x: to.w / 2, y: to.h / 2 }, to, view.zoom) }, to);
};

/** World point under screen point `p` (camera, then the inverse isometric projection), null outside the field. */
export const worldAtView = (view: CameraView, screen: Size, p: Point): Point | null => {
  const w = unproject(screenToWorld(p, view.scroll, screen, view.zoom));
  if (w.x < 0 || w.x > BATTLE.field || w.y < 0 || w.y > BATTLE.field) return null;
  return w;
};

const SIDE = 5;

/** Plot whose diamond holds screen point `p` through the live view, null off the board. */
export const plotAtView = (view: CameraView, screen: Size, p: Point): number | null => {
  const w = unproject(screenToWorld(p, view.scroll, screen, view.zoom));
  const col = Math.floor((w.x - BATTLE.boardOrigin) / BATTLE.plot);
  const row = Math.floor((w.y - BATTLE.boardOrigin) / BATTLE.plot);
  if (col < 0 || col >= SIDE || row < 0 || row >= SIDE) return null;
  return row * SIDE + col;
};

/** World point `w` on screen through the live view (isometric projection, then the camera). */
export const worldToScreen = (view: CameraView, screen: Size, w: Point): Point => {
  const q = project(w);
  const mx = screen.w / 2;
  const my = screen.h / 2;
  return { x: (q.x - view.scroll.x - mx) * view.zoom + mx, y: (q.y - view.scroll.y - my) * view.zoom + my };
};

/** Screen bounding box of `plot`'s diamond through the live view. */
export const plotRectAtView = (view: CameraView, screen: Size, plot: number): Rect => {
  const col = plot % SIDE;
  const row = Math.floor(plot / SIDE);
  const x0 = BATTLE.boardOrigin + col * BATTLE.plot;
  const y0 = BATTLE.boardOrigin + row * BATTLE.plot;
  const corners = [
    worldToScreen(view, screen, { x: x0, y: y0 }),
    worldToScreen(view, screen, { x: x0 + BATTLE.plot, y: y0 }),
    worldToScreen(view, screen, { x: x0, y: y0 + BATTLE.plot }),
    worldToScreen(view, screen, { x: x0 + BATTLE.plot, y: y0 + BATTLE.plot }),
  ];
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
};

/** −1, 0 or +1 zoom step for a pinch whose squared finger spread went from `startSq` to `nowSq`. */
export const pinchStep = (startSq: number, nowSq: number): -1 | 0 | 1 => {
  if (!(startSq > 0)) return 0;
  if (nowSq >= startSq * PINCH_IN * PINCH_IN) return 1;
  if (nowSq <= startSq * PINCH_OUT * PINCH_OUT) return -1;
  return 0;
};
