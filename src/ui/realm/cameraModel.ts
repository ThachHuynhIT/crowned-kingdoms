import { project, unproject } from '../../core/iso';
import { BATTLE } from '../../data/battle';
import type { Point, Rect, Size } from '../hud/layout';
import { ZOOM_MAX, cameraScroll, overviewZoom, realmCamera, screenToWorld, type RealmPhase } from './realmLayout';

/**
 * The realm camera with zoom and pan (spec 06/11/2026, P2). Pure maths: RealmScene owns the
 * Phaser camera and applies these views; the HUD scenes get the live view on the bus
 * (`realm:view`) and map screen points through it. Zoom is free (spec 2026-11-08 §4): from the phase's
 * overview zoom (`overviewZoom`, the camera of `realmCamera`) up to `ZOOM_MAX`; the view pans at any zoom and stays
 * inside the map (`clampView`). `snapView` gives the pixel-snapped view that is actually drawn.
 */
export interface CameraView {
  readonly zoom: number;
  readonly scroll: Point;
}

export { ZOOM_MAX };

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

/** Wheel: the zoom changes by `WHEEL_RATE` of the wheel delta, at most `WHEEL_MAX` per event (spec 2026-11-08 §4). */
const WHEEL_RATE = 0.001;
const WHEEL_MAX = 100;

export const overviewView = (screen: Size, phase: RealmPhase): CameraView => realmCamera(screen, phase);

/** The free zoom range of a phase: from its overview zoom to `ZOOM_MAX` (spec 2026-11-08 §4). */
export const zoomLimits = (screen: Size, phase: RealmPhase): { min: number; max: number } => {
  const min = overviewZoom(screen, phase);
  return { min, max: Math.max(min, ZOOM_MAX) };
};

/** Zoom after one wheel event of delta `dy` (up = negative = in): a ratio, at most ±10% per event. */
export const wheelZoom = (zoom: number, dy: number): number =>
  zoom * (1 - Math.max(-WHEEL_MAX, Math.min(WHEEL_MAX, dy)) * WHEEL_RATE);

/** Pinch zoom: the zoom at the gesture's start times the ratio of the finger spreads (squared distances given). */
export const pinchZoom = (startZoom: number, startSq: number, nowSq: number): number =>
  startSq > 0 && nowSq > 0 && Number.isFinite(nowSq) ? startZoom * Math.sqrt(nowSq / startSq) : startZoom;

/**
 * The view as drawn (spec 2026-11-08 §4): Phaser draws world point p at `(1 − z)·mid − z·scroll + z·p`, so the
 * camera translation `(1 − z)·mid − z·scroll` is rounded to whole screen pixels and the scroll solved back. Nothing
 * shimmers at a fractional zoom; the view moves at most half a screen pixel. Only for drawing and the HUDs: pan and
 * zoom keep accumulating on the unsnapped view.
 */
export const snapView = (view: CameraView, screen: Size): CameraView => {
  const z = view.zoom;
  const axis = (scroll: number, half: number): number => {
    const t = (1 - z) * half - z * scroll;
    return ((1 - z) * half - Math.round(t)) / z;
  };
  return { zoom: z, scroll: { x: axis(view.scroll.x, screen.w / 2), y: axis(view.scroll.y, screen.h / 2) } };
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

/**
 * Zoom to `next`, clamped to the phase's free range (spec 2026-11-08 §4), keeping the world point under `p` still
 * unless the map edge clamp wins. Reaching the overview zoom does not snap the view back to the overview centre.
 */
export const zoomAt = (view: CameraView, p: Point, next: number, screen: Size, phase: RealmPhase): CameraView => {
  const { min, max } = zoomLimits(screen, phase);
  const zoom = Math.min(max, Math.max(min, Number.isFinite(next) ? next : view.zoom));
  const world = screenToWorld(p, view.scroll, screen, view.zoom);
  return clampView({ zoom, scroll: cameraScroll(world, p, screen, zoom) }, screen);
};

/**
 * Pinch (spec 2026-11-08 §4): the zoom follows the finger spread from the gesture's start view, and the world point
 * that was under the starting midpoint stays under the current midpoint (so two fingers also pan), within the zoom
 * range and the map.
 */
export const pinchView = (
  start: CameraView,
  startMid: Point,
  nowMid: Point,
  startSq: number,
  nowSq: number,
  screen: Size,
  phase: RealmPhase,
): CameraView => {
  const { min, max } = zoomLimits(screen, phase);
  const zoom = Math.min(max, Math.max(min, pinchZoom(start.zoom, startSq, nowSq)));
  const anchor = screenToWorld(startMid, start.scroll, screen, start.zoom);
  return clampView({ zoom, scroll: cameraScroll(anchor, nowMid, screen, zoom) }, screen);
};

/** True when `view` is the phase's overview camera (the player has not zoomed or panned it). */
export const isOverview = (view: CameraView, screen: Size, phase: RealmPhase): boolean => {
  const o = overviewView(screen, phase);
  const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;
  return near(view.zoom, o.zoom) && near(view.scroll.x, o.scroll.x) && near(view.scroll.y, o.scroll.y);
};

/**
 * A hand-set view carried into another phase (spec 2026-11-08 §4): same screen-centre world point, the zoom raised
 * to the new phase's overview zoom if it was below it, kept inside the map.
 */
export const keepView = (view: CameraView, screen: Size, phase: RealmPhase): CameraView => {
  const { min, max } = zoomLimits(screen, phase);
  const zoom = Math.min(max, Math.max(min, view.zoom));
  const mid = { x: screen.w / 2, y: screen.h / 2 };
  const centre = screenToWorld(mid, view.scroll, screen, view.zoom);
  return clampView({ zoom, scroll: cameraScroll(centre, mid, screen, zoom) }, screen);
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

/**
 * World point under screen point `p` (camera, then the inverse isometric projection) for battle aim: the field, plus
 * the strip south of it down to the clamp line, so the enemy portal (spec 2026-11-08 §3) can be aimed at; null
 * elsewhere. Card placement does not use this: it goes through `plotAtView` (25 plots only).
 */
export const worldAtView = (view: CameraView, screen: Size, p: Point): Point | null => {
  const w = unproject(screenToWorld(p, view.scroll, screen, view.zoom));
  if (w.x < 0 || w.x > BATTLE.field || w.y < 0 || w.y > BATTLE.field + BATTLE.fieldClampMargin) return null;
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

