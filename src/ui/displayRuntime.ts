/**
 * HiDPI display runtime (spec 2026-11-11-hidpi-rendering-design.md §5): the one owner of the display density D.
 *
 * The game runs in `Scale.NONE` with `scale.zoom = 1`. The runtime sizes the canvas backing store to
 * `round(logical × D)` pixels and sets the canvas CSS box to the logical size itself. Phaser leaves that CSS alone
 * (in NONE mode with zoom 1 neither `resize` nor `refresh` writes the style) and derives `displayScale` (the pointer
 * mapping) from the CSS bounds, so pointer `x/y` arrive in backing px.
 *
 * Scenes bind through `bindSceneDisplay`:
 * - HUD/menu cameras get origin 0, zoom = ratio, scroll 0, so every layout keeps working in logical px.
 * - The realm camera is driven by `cameraBackingView` from its logical view.
 * - Every Text added to a bound scene is rasterised at D (times the realm's world-zoom bucket for kind 'realm').
 * - Layout code reads `logicalSize` / `logicalPointer`.
 *
 * Until `HIDPI_ENABLED` is true (the plan's last task), D is 1 unless a DEV `?density=` override is given, so output
 * stays identical while the scenes migrate.
 */
import type Phaser from 'phaser';
import type { Point, Size } from './hud/layout';
import {
  logicalPressDistance,
  makeDisplayMetrics,
  resolveDensity,
  toLogicalPoint,
  type DisplayMetrics,
} from './displayMetrics';

/** Rollout switch (on since 11/11/2026, plan Task 6): the device density; false = density 1 unless a DEV `?density=` override is given. */
export const HIDPI_ENABLED = true;

const REGISTRY_KEY = 'displayRuntime';

// Phaser event names (kept as strings so this module, imported by `theme.ts`, never loads Phaser at runtime).
const ADDED_TO_SCENE = 'addedtoscene';
const SHUTDOWN = 'shutdown';
const DESTROY = 'destroy';
const BOOT = 'boot';

const isText = (obj: unknown): obj is Phaser.GameObjects.Text =>
  (obj as { type?: string } | null)?.type === 'Text' && typeof (obj as { setResolution?: unknown }).setResolution === 'function';

export type SceneDisplayKind = 'hud' | 'realm';

/** Environment the runtime reads; injectable for tests. */
export interface DisplayEnv {
  readonly devicePixelRatio: () => number;
  /** The `density` query value, or undefined. */
  readonly densityOverride: () => string | undefined;
  readonly dev: boolean;
  readonly enabled: boolean;
}

export const browserDisplayEnv = (): DisplayEnv => ({
  devicePixelRatio: () => window.devicePixelRatio,
  densityOverride: () => new URLSearchParams(window.location.search).get('density') ?? undefined,
  dev: import.meta.env.DEV,
  enabled: HIDPI_ENABLED,
});

const boxOf = (parent: HTMLElement): Size => ({
  w: parent.clientWidth || window.innerWidth,
  h: parent.clientHeight || window.innerHeight,
});

const densityOf = (env: DisplayEnv, cap?: number): number =>
  resolveDensity({
    device: env.devicePixelRatio(),
    enabled: env.enabled,
    dev: env.dev,
    override: env.densityOverride(),
    ...(cap !== undefined ? { cap } : {}),
  });

/** Metrics before the game exists (for its config width/height). */
export const readInitialDisplayMetrics = (parent: HTMLElement, env: DisplayEnv = browserDisplayEnv()): DisplayMetrics =>
  makeDisplayMetrics(boxOf(parent), densityOf(env));

/** The world-text zoom bucket: text in the realm is rasterised at D × bucket (1, 2 or 3) so zooming in stays sharp. */
export const worldTextBucket = (logicalZoom: number): number =>
  Math.min(3, Math.max(1, Math.ceil(logicalZoom - 1e-9)));

interface Binding {
  readonly scene: Phaser.Scene;
  readonly kind: SceneDisplayKind;
  readonly relayout: () => void;
  readonly texts: Set<Phaser.GameObjects.Text>;
  bucket: number;
}

/** The minimal Phaser surface the runtime drives (a real `Phaser.Game` satisfies it). */
export interface DisplayHost {
  readonly scale: {
    resize(width: number, height: number): unknown;
    updateBounds(): void;
    readonly canvas: HTMLCanvasElement;
  };
}

export class DisplayRuntime {
  private current: DisplayMetrics;
  private readonly bindings = new Set<Binding>();
  /** Density cap from the graphics setting (`GRAPHICS_DENSITY_CAP`); Infinity = the device density. */
  densityCap = Number.POSITIVE_INFINITY;
  /** Re-measures the box and density and applies them (set by `installDisplayRuntime`). */
  recheck: () => void = () => {};

  constructor(
    private readonly host: DisplayHost,
    initial: DisplayMetrics,
  ) {
    this.current = initial;
  }

  get metrics(): DisplayMetrics {
    return this.current;
  }

  /**
   * Size the canvas and CSS box for `next`, then update cameras, text resolution and layouts. A no-op when nothing
   * changed. The CSS is written before `scale.resize` so Phaser's own refresh measures the right bounds.
   */
  apply(next: DisplayMetrics, force = false): void {
    const prev = this.current;
    const same =
      prev.logical.w === next.logical.w &&
      prev.logical.h === next.logical.h &&
      prev.density === next.density &&
      prev.backing.w === next.backing.w &&
      prev.backing.h === next.backing.h;
    if (same && !force) return;
    this.current = next;
    const canvas = this.host.scale.canvas;
    canvas.style.width = `${next.logical.w}px`;
    canvas.style.height = `${next.logical.h}px`;
    this.host.scale.resize(next.backing.w, next.backing.h);
    this.host.scale.updateBounds();
    for (const b of [...this.bindings]) {
      this.applyCamera(b);
      this.applyTexts(b);
      if (!same) b.relayout();
    }
  }

  /** Bind a scene: camera, automatic text resolution, relayout on metric changes. Unbinds itself on shutdown. */
  bind(scene: Phaser.Scene, relayout: () => void, kind: SceneDisplayKind = 'hud'): () => void {
    const b: Binding = { scene, kind, relayout, texts: new Set(), bucket: 1 };
    this.bindings.add(b);
    this.applyCamera(b);
    const onAdded = (obj: unknown): void => {
      if (!isText(obj) || b.texts.has(obj)) return;
      b.texts.add(obj);
      obj.once(DESTROY, () => b.texts.delete(obj));
      obj.setResolution(this.textResolution(b));
    };
    // Text already on the display list (created before the bind) is picked up too.
    for (const obj of scene.children.list) onAdded(obj);
    scene.events.on(ADDED_TO_SCENE, onAdded);
    const dispose = (): void => {
      if (!this.bindings.delete(b)) return;
      scene.events.off(ADDED_TO_SCENE, onAdded);
      scene.events.off(SHUTDOWN, dispose);
      b.texts.clear();
    };
    scene.events.once(SHUTDOWN, dispose);
    return dispose;
  }

  /** The realm's logical zoom changed: re-rasterise its text when the zoom bucket changes. */
  setWorldTextZoom(scene: Phaser.Scene, logicalZoom: number): void {
    const bucket = worldTextBucket(logicalZoom);
    for (const b of this.bindings) {
      if (b.scene !== scene || b.kind !== 'realm' || b.bucket === bucket) continue;
      b.bucket = bucket;
      this.applyTexts(b);
    }
  }

  private textResolution(b: Binding): number {
    // D 1 keeps resolution 1 at every zoom, so output stays identical to before HiDPI.
    if (this.current.density === 1) return 1;
    return Math.max(this.current.ratio.x, this.current.ratio.y) * (b.kind === 'realm' ? b.bucket : 1);
  }

  private applyTexts(b: Binding): void {
    const r = this.textResolution(b);
    for (const t of b.texts) if (t.active && t.style.resolution !== r) t.setResolution(r);
  }

  private applyCamera(b: Binding): void {
    if (b.kind !== 'hud') return; // the realm camera is driven by RealmScene through `cameraBackingView`
    const cam = b.scene.cameras?.main;
    if (!cam) return;
    const { ratio } = this.current;
    cam.setOrigin(0, 0);
    cam.setZoom(ratio.x, ratio.y);
    cam.setScroll(0, 0);
  }
}

/** Install the runtime (call from `callbacks.preBoot`): it sizes the canvas once Phaser has created it. */
export const installDisplayRuntime = (
  game: Phaser.Game,
  parent: HTMLElement,
  initial: DisplayMetrics,
  env: DisplayEnv = browserDisplayEnv(),
): (() => void) => {
  const runtime = new DisplayRuntime(game, initial);
  game.registry.set(REGISTRY_KEY, runtime);
  let media: MediaQueryList | null = null;
  const check = (): void => {
    const box = boxOf(parent);
    if (!(box.w > 0 && box.h > 0)) return; // minimised: keep the last valid metrics
    runtime.apply(makeDisplayMetrics(box, densityOf(env, runtime.densityCap)));
    watchDensity();
  };
  const watchDensity = (): void => {
    const d = env.devicePixelRatio();
    if (media && media.media === `(resolution: ${d}dppx)`) return;
    media?.removeEventListener('change', check);
    media = window.matchMedia(`(resolution: ${d}dppx)`);
    media.addEventListener('change', check);
  };
  runtime.recheck = check;
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
  // BOOT: the renderer has created the canvas at the config's backing size; this listener (registered in preBoot)
  // runs just before ScaleManager.boot, which then measures these CSS bounds for its pointer mapping.
  game.events.once(BOOT, () => {
    game.canvas.style.width = `${initial.logical.w}px`;
    game.canvas.style.height = `${initial.logical.h}px`;
    observer?.observe(parent);
    window.addEventListener('resize', check);
    watchDensity();
  });
  return () => {
    observer?.disconnect();
    window.removeEventListener('resize', check);
    media?.removeEventListener('change', check);
  };
};

const runtimeOf = (scene: Phaser.Scene): DisplayRuntime | undefined =>
  scene.registry?.get(REGISTRY_KEY) as DisplayRuntime | undefined;

/** The realm scene's key (`SCENES.realm`; a literal so `ui` does not import `scenes`). */
const REALM_SCENE = 'Realm';

export type DevDisplaySnapshot = DisplayMetrics & { realmView?: { zoom: number; scroll: { x: number; y: number } } };

/**
 * DEV hook (`window.displayMetrics`, plan Task 4): a deep copy of the runtime metrics plus the Realm scene's logical
 * camera view while that scene is active. Never returns live runtime or scene objects. Null without a runtime.
 */
export const devDisplaySnapshot = (game: Phaser.Game): DevDisplaySnapshot | null => {
  const runtime = game.registry.get(REGISTRY_KEY) as DisplayRuntime | undefined;
  if (!runtime) return null;
  const { logical, backing, density, ratio } = runtime.metrics;
  const snap: DevDisplaySnapshot = {
    logical: { w: logical.w, h: logical.h },
    backing: { w: backing.w, h: backing.h },
    density,
    ratio: { x: ratio.x, y: ratio.y },
  };
  if (!game.scene.isActive(REALM_SCENE)) return snap;
  const view = (game.scene.getScene(REALM_SCENE) as unknown as { view?: { zoom: number; scroll: { x: number; y: number } } | null } | null)
    ?.view;
  if (!view) return snap;
  return { ...snap, realmView: { zoom: view.zoom, scroll: { x: view.scroll.x, y: view.scroll.y } } };
};

/** Current metrics; without a runtime (tests, tools) the scale size at density 1. */
export const displayMetrics = (scene: Phaser.Scene): DisplayMetrics =>
  runtimeOf(scene)?.metrics ?? makeDisplayMetrics({ w: scene.scale.width || 1, h: scene.scale.height || 1 }, 1);

/** The screen size in logical (CSS) px: what every layout uses. */
export const logicalSize = (scene: Phaser.Scene): Size => {
  const { w, h } = displayMetrics(scene).logical;
  return { w, h };
};

/** A Phaser pointer's screen position (backing px) in logical px. */
export const logicalPointer = (scene: Phaser.Scene, pointer: { x: number; y: number }): Point =>
  toLogicalPoint({ x: pointer.x, y: pointer.y }, displayMetrics(scene));

/**
 * Bind `scene` to the display runtime: camera (kind 'hud': origin 0, zoom = ratio), text resolution for every Text
 * the scene adds, `relayout` on metric changes. Call at the top of `preload()`/`create()` before building UI;
 * unbinds on shutdown. Without a runtime it does nothing.
 */
export const bindSceneDisplay = (
  scene: Phaser.Scene,
  relayout: () => void,
  kind: SceneDisplayKind = 'hud',
): (() => void) => runtimeOf(scene)?.bind(scene, relayout, kind) ?? (() => {});

/** See `DisplayRuntime.setWorldTextZoom`. */
export const setWorldTextZoom = (scene: Phaser.Scene, logicalZoom: number): void =>
  runtimeOf(scene)?.setWorldTextZoom(scene, logicalZoom);

/**
 * `pointer.getDistance()` in logical px: from the press point to the current point while down, or to the release
 * point after it went up (Phaser's own semantics), each axis by its own ratio.
 */
export const logicalPointerDistance = (
  scene: Phaser.Scene,
  pointer: { x: number; y: number; downX: number; downY: number; upX: number; upY: number; isDown: boolean },
): number => {
  const now = pointer.isDown ? { x: pointer.x, y: pointer.y } : { x: pointer.upX, y: pointer.upY };
  return logicalPressDistance(now, { x: pointer.downX, y: pointer.downY }, displayMetrics(scene));
};

/**
 * Graphics setting (owner 11/11/2026): cap the canvas density (`GRAPHICS_DENSITY_CAP`: Infinity, 2 or 1) and apply it
 * at once. Without a runtime it does nothing.
 */
export const setDisplayDensityCap = (game: Phaser.Game, cap: number): void => {
  const runtime = game.registry?.get(REGISTRY_KEY) as DisplayRuntime | undefined;
  if (!runtime) return;
  runtime.densityCap = cap > 0 ? cap : Number.POSITIVE_INFINITY;
  runtime.recheck();
};
