import { clampView, type CameraView } from './cameraBounds';
export { clampView, MAP_BOUNDS, type CameraView } from './cameraBounds';
import { project, unproject } from '../../core/iso';
import { BATTLE, ENEMY_PORTAL } from '../../data/battle';
import type { RunMode } from '../../data/rules';
import { plotCoords } from '../../game/run/boardGeometry';
import { plotAtWorld } from '../../render/endlessBoardModel';
import { snapTranslation } from '../displayMetrics';
import type { Point, Rect, Size } from '../hud/layout';
import { artQuality } from '../../render/artQuality';
import { ZOOM_MAX, cameraScroll, realmZoomLimits, realmCamera, screenToWorld, type RealmPhase } from './realmLayout';

/**
 * The realm camera with zoom and pan (spec 06/11/2026, P2). Pure maths: RealmScene owns the
 * Phaser camera and applies these views; the HUD scenes get the live view on the bus
 * (`realm:view`) and map screen points through it. Zoom is free (spec 2026-11-08 §4): from the phase's
 * overview zoom (`overviewZoom`, the camera of `realmCamera`) up to `ZOOM_MAX`; the view pans at any zoom and stays
 * inside the map (`clampView`). `snapView` gives the pixel-snapped view that is actually drawn.
 */


export { ZOOM_MAX };

/** Wheel: the zoom changes by `WHEEL_RATE` of the wheel delta, at most `WHEEL_MAX` per event (spec 2026-11-08 §4). */
const WHEEL_RATE = 0.001;
const WHEEL_MAX = 100;

export const overviewView = (
  screen: Size,
  phase: RealmPhase,
  mode: RunMode = 'normal',
): CameraView => realmCamera(screen, phase, mode);

/** The free zoom range of a phase: from its overview zoom to `ZOOM_MAX` (spec 2026-11-08 §4). */
export const zoomLimits = (
  screen: Size,
  phase: RealmPhase,
  mode: RunMode = 'normal',
): { min: number; max: number } => {
  return realmZoomLimits(screen, phase, mode, artQuality().zoomMax);
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
 * zoom keep accumulating on the unsnapped view. `ratio` is the backing/logical ratio per axis (HiDPI spec 2026-11-11
 * §4): the translation then lands on whole device pixels; ratio 1 (the default) is the old screen-pixel snap.
 */
export const snapView = (view: CameraView, screen: Size, ratio: Point = { x: 1, y: 1 }): CameraView => {
  const z = view.zoom;
  const axis = (scroll: number, half: number, r: number): number => {
    const t = (1 - z) * half - z * scroll;
    return ((1 - z) * half - snapTranslation(t, r)) / z;
  };
  return {
    zoom: z,
    scroll: { x: axis(view.scroll.x, screen.w / 2, ratio.x), y: axis(view.scroll.y, screen.h / 2, ratio.y) },
  };
};

/**
 * Zoom to `next`, clamped to the phase's free range (spec 2026-11-08 §4), keeping the world point under `p` still
 * unless the map edge clamp wins. Reaching the overview zoom does not snap the view back to the overview centre.
 */
export const zoomAt = (
  view: CameraView,
  p: Point,
  next: number,
  screen: Size,
  phase: RealmPhase,
  mode: RunMode = 'normal',
): CameraView => {
  const { min, max } = zoomLimits(screen, phase, mode);
  const zoom = Math.min(max, Math.max(min, Number.isFinite(next) ? next : view.zoom));
  const world = screenToWorld(p, view.scroll, screen, view.zoom);
  return clampView({ zoom, scroll: cameraScroll(world, p, screen, zoom) }, screen, mode);
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
  mode: RunMode = 'normal',
): CameraView => {
  const { min, max } = zoomLimits(screen, phase, mode);
  const zoom = Math.min(max, Math.max(min, pinchZoom(start.zoom, startSq, nowSq)));
  const anchor = screenToWorld(startMid, start.scroll, screen, start.zoom);
  return clampView({ zoom, scroll: cameraScroll(anchor, nowMid, screen, zoom) }, screen, mode);
};

/** True when `view` is the phase's overview camera (the player has not zoomed or panned it). */
export const isOverview = (
  view: CameraView,
  screen: Size,
  phase: RealmPhase,
  mode: RunMode = 'normal',
): boolean => {
  const o = overviewView(screen, phase, mode);
  const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;
  return near(view.zoom, o.zoom) && near(view.scroll.x, o.scroll.x) && near(view.scroll.y, o.scroll.y);
};

/**
 * A hand-set view carried into another phase (spec 2026-11-08 §4): same screen-centre world point, the zoom raised
 * to the new phase's overview zoom if it was below it, kept inside the map.
 */
export const keepView = (
  view: CameraView,
  screen: Size,
  phase: RealmPhase,
  mode: RunMode = 'normal',
): CameraView => {
  const { min, max } = zoomLimits(screen, phase, mode);
  const zoom = Math.min(max, Math.max(min, view.zoom));
  const mid = { x: screen.w / 2, y: screen.h / 2 };
  const centre = screenToWorld(mid, view.scroll, screen, view.zoom);
  return clampView({ zoom, scroll: cameraScroll(centre, mid, screen, zoom) }, screen, mode);
};

/**
 * Drag the map by a screen delta (the world follows the finger), at any zoom step: the isometric
 * board is wider than a phone even at the overview step.
 */
export const panBy = (
  view: CameraView,
  delta: Point,
  screen: Size,
  _phase: RealmPhase,
  mode: RunMode = 'normal',
): CameraView => {
  return clampView(
    { zoom: view.zoom, scroll: { x: view.scroll.x - delta.x / view.zoom, y: view.scroll.y - delta.y / view.zoom } },
    screen,
    mode,
  );
};

/** After a resize: the overview stays the overview; a zoomed view keeps the world point at the screen centre. */
export const resizeView = (
  view: CameraView,
  from: Size,
  to: Size,
  phase: RealmPhase,
  mode: RunMode = 'normal',
): CameraView => {
  const base = overviewView(to, phase, mode);
  if (isOverview(view, from, phase, mode)) return base;
  const centre = screenToWorld({ x: from.w / 2, y: from.h / 2 }, view.scroll, from, view.zoom);
  const { min, max } = zoomLimits(to, phase, mode);
  const zoom = Math.min(max, Math.max(min, view.zoom));
  return clampView({ zoom, scroll: cameraScroll(centre, { x: to.w / 2, y: to.h / 2 }, to, zoom) }, to, mode);
};

/**
 * World point under screen point `p` (camera, then the inverse isometric projection) for battle aim: the field, plus
 * the strip south of it down to the clamp line, so the enemy portal (spec 2026-11-08 §3) can be aimed at; null
 * elsewhere. Card placement does not use this: it goes through `plotAtView` (the run geometry).
 */
export const worldAtView = (view: CameraView, screen: Size, p: Point): Point | null => {
  const w = unproject(screenToWorld(p, view.scroll, screen, view.zoom));
  const south = Math.max(BATTLE.field + BATTLE.fieldClampMargin, ENEMY_PORTAL.y + BATTLE.spawnRowGap);
  if (w.x < 0 || w.x > BATTLE.field || w.y < 0 || w.y > south) return null;
  return w;
};


/** Plot whose diamond holds screen point `p` through the live view, null off the board. */
export const plotAtView = (
  view: CameraView,
  screen: Size,
  p: Point,
  mode: RunMode = 'normal',
): number | null => {
  const w = unproject(screenToWorld(p, view.scroll, screen, view.zoom));
  return plotAtWorld(w.x, w.y, mode);
};

/** World point `w` on screen through the live view (isometric projection, then the camera). */
export const worldToScreen = (view: CameraView, screen: Size, w: Point): Point => {
  const q = project(w);
  const mx = screen.w / 2;
  const my = screen.h / 2;
  return { x: (q.x - view.scroll.x - mx) * view.zoom + mx, y: (q.y - view.scroll.y - my) * view.zoom + my };
};

/** Screen bounding box of `plot`'s diamond through the live view. */
export const plotRectAtView = (
  view: CameraView,
  screen: Size,
  plot: number,
  mode: RunMode = 'normal',
): Rect => {
  const { col, row } = plotCoords(plot, mode);
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

