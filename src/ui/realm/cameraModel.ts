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

/** The world area a zoomed view may show: the field with the spawn rows south and a margin east/west. */
export const MAP_BOUNDS = {
  x0: -BATTLE.plot,
  y0: 0,
  x1: BATTLE.field + BATTLE.plot,
  y1: BATTLE.field + BATTLE.plot + BATTLE.spawnOutside + BATTLE.spawnRowGap,
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

/** Keeps the shown world rect inside `MAP_BOUNDS`; a view wider (or taller) than the map is centred on it. */
export const clampView = (view: CameraView, screen: Size): CameraView => {
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

/** Drag the map by a screen delta (the world follows the finger); no pan at the overview step. */
export const panBy = (view: CameraView, delta: Point, screen: Size, phase: RealmPhase): CameraView => {
  if (view.zoom <= overviewView(screen, phase).zoom) return view;
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

/** World point under screen point `p`, null outside the field. */
export const worldAtView = (view: CameraView, screen: Size, p: Point): Point | null => {
  const w = screenToWorld(p, view.scroll, screen, view.zoom);
  if (w.x < 0 || w.x > BATTLE.field || w.y < 0 || w.y > BATTLE.field) return null;
  return w;
};

const SIDE = 5;

/** Plot under screen point `p` through the live view, null off the board. */
export const plotAtView = (view: CameraView, screen: Size, p: Point): number | null => {
  const w = screenToWorld(p, view.scroll, screen, view.zoom);
  const col = Math.floor((w.x - BATTLE.boardOrigin) / BATTLE.plot);
  const row = Math.floor((w.y - BATTLE.boardOrigin) / BATTLE.plot);
  if (col < 0 || col >= SIDE || row < 0 || row >= SIDE) return null;
  return row * SIDE + col;
};

/** Screen rect of `plot` through the live view. */
export const plotRectAtView = (view: CameraView, screen: Size, plot: number): Rect => {
  const col = plot % SIDE;
  const row = Math.floor(plot / SIDE);
  const mx = screen.w / 2;
  const my = screen.h / 2;
  const toScreen = (wx: number, wy: number): Point => ({
    x: (wx - view.scroll.x - mx) * view.zoom + mx,
    y: (wy - view.scroll.y - my) * view.zoom + my,
  });
  const tl = toScreen(BATTLE.boardOrigin + col * BATTLE.plot, BATTLE.boardOrigin + row * BATTLE.plot);
  return { x: tl.x, y: tl.y, w: BATTLE.plot * view.zoom, h: BATTLE.plot * view.zoom };
};

/** −1, 0 or +1 zoom step for a pinch whose squared finger spread went from `startSq` to `nowSq`. */
export const pinchStep = (startSq: number, nowSq: number): -1 | 0 | 1 => {
  if (!(startSq > 0)) return 0;
  if (nowSq >= startSq * PINCH_IN * PINCH_IN) return 1;
  if (nowSq <= startSq * PINCH_OUT * PINCH_OUT) return -1;
  return 0;
};
