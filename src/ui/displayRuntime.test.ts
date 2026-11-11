import { describe, expect, it, vi } from 'vitest';

// A minimal Phaser stand-in: the runtime only needs Text (instanceof + setResolution) and event names.
vi.mock('phaser', () => {
  class Emitter {
    private readonly map = new Map<string, Set<(...a: unknown[]) => void>>();
    on(e: string, f: (...a: unknown[]) => void): this {
      if (!this.map.has(e)) this.map.set(e, new Set());
      this.map.get(e)!.add(f);
      return this;
    }
    once(e: string, f: (...a: unknown[]) => void): this {
      const w = (...a: unknown[]): void => {
        this.off(e, w);
        f(...a);
      };
      return this.on(e, w);
    }
    off(e: string, f: (...a: unknown[]) => void): this {
      this.map.get(e)?.delete(f);
      return this;
    }
    emit(e: string, ...a: unknown[]): void {
      for (const f of [...(this.map.get(e) ?? [])]) f(...a);
    }
    count(e: string): number {
      return this.map.get(e)?.size ?? 0;
    }
  }
  class Text extends Emitter {
    type = 'Text';
    active = true;
    style = { resolution: 1 };
    setResolution(r: number): this {
      this.style.resolution = r;
      return this;
    }
    destroy(): void {
      this.active = false;
      this.emit('destroy');
    }
  }
  const Phaser = {
    Emitter,
    GameObjects: { Text, Events: { DESTROY: 'destroy' } },
    Scenes: { Events: { ADDED_TO_SCENE: 'addedtoscene', SHUTDOWN: 'shutdown' } },
    Core: { Events: { BOOT: 'boot' } },
  };
  return { default: Phaser };
});

const Phaser = (await import('phaser')).default as unknown as {
  Emitter: new () => { emit: (e: string, ...a: unknown[]) => void; count: (e: string) => number };
  GameObjects: { Text: new () => { style: { resolution: number }; destroy(): void } };
};
const { DisplayRuntime, logicalPointerDistance, worldTextBucket } = await import('./displayRuntime');
const { makeDisplayMetrics } = await import('./displayMetrics');

const host = () => {
  const calls: string[] = [];
  const canvas = { style: { width: '', height: '' } } as unknown as HTMLCanvasElement;
  return {
    calls,
    canvas,
    scale: {
      canvas,
      resize(w: number, h: number) {
        // Phaser's refresh measures the CSS bounds here: the CSS must already be logical.
        calls.push(`resize ${w}x${h} css ${canvas.style.width}x${canvas.style.height}`);
      },
      updateBounds() {
        calls.push('bounds');
      },
    },
  };
};

const sceneMock = () => {
  const cam = {
    origin: [0.5, 0.5],
    zoom: [1, 1],
    scroll: [7, 7],
    setOrigin(x: number, y: number) { this.origin = [x, y]; return this; },
    setZoom(x: number, y: number) { this.zoom = [x, y]; return this; },
    setScroll(x: number, y: number) { this.scroll = [x, y]; return this; },
  };
  const events = new Phaser.Emitter();
  return { cam, events, scene: { cameras: { main: cam }, events, children: { list: [] as unknown[] } } as never };
};

const m = (w: number, h: number, d: number) => makeDisplayMetrics({ w, h }, d);

describe('DisplayRuntime', () => {
  it('refresh_normalizes_css_before_consumers: CSS is the logical box before Phaser resizes the backing', () => {
    const h = host();
    const rt = new DisplayRuntime(h, m(1280, 720, 1));
    rt.apply(m(1280, 720, 2));
    expect(h.calls).toEqual(['resize 2560x1440 css 1280pxx720px', 'bounds']);
  });

  it('does nothing when the metrics did not change (no resize loop)', () => {
    const h = host();
    const rt = new DisplayRuntime(h, m(1280, 720, 2));
    rt.apply(m(1280, 720, 2));
    expect(h.calls).toEqual([]);
  });

  it('density_round_trip_not_cumulative: D1 → 2 → 1 ends exactly at D1 for camera and text', () => {
    const h = host();
    const rt = new DisplayRuntime(h, m(375, 812, 1));
    const { cam, events, scene } = sceneMock();
    let layouts = 0;
    rt.bind(scene, () => layouts++);
    const t = new Phaser.GameObjects.Text();
    events.emit('addedtoscene', t);
    rt.apply(m(375, 812, 2));
    expect(cam.zoom).toEqual([2, 2]);
    expect(t.style.resolution).toBe(2);
    rt.apply(m(375, 812, 1));
    expect(cam.origin).toEqual([0, 0]);
    expect(cam.zoom).toEqual([1, 1]);
    expect(cam.scroll).toEqual([0, 0]);
    expect(t.style.resolution).toBe(1);
    expect(layouts).toBe(2);
  });

  it('binds HUD cameras at once: origin 0, zoom = ratio per axis, scroll 0', () => {
    const rt = new DisplayRuntime(host(), m(769, 815, 1.25));
    const { cam, scene } = sceneMock();
    rt.bind(scene, () => {});
    expect(cam.origin).toEqual([0, 0]);
    expect(cam.zoom).toEqual([rt.metrics.ratio.x, rt.metrics.ratio.y]);
    expect(cam.scroll).toEqual([0, 0]);
  });

  it('leaves the realm camera to RealmScene', () => {
    const rt = new DisplayRuntime(host(), m(1280, 720, 2));
    const { cam, scene } = sceneMock();
    rt.bind(scene, () => {}, 'realm');
    expect(cam.zoom).toEqual([1, 1]);
    expect(cam.scroll).toEqual([7, 7]);
  });

  it('live_text_registry_tracks_container_and_destroy: text gets the density, destroyed text is dropped, D1 keeps 1', () => {
    const rt = new DisplayRuntime(host(), m(1280, 720, 1));
    const { events, scene } = sceneMock();
    rt.bind(scene, () => {});
    const a = new Phaser.GameObjects.Text();
    const b = new Phaser.GameObjects.Text();
    events.emit('addedtoscene', a);
    events.emit('addedtoscene', b);
    expect(a.style.resolution).toBe(1);
    b.destroy();
    const spy = vi.spyOn(b as never, 'setResolution' as never);
    rt.apply(m(1280, 720, 3));
    expect(a.style.resolution).toBe(3);
    expect(spy).not.toHaveBeenCalled();
  });

  it('picks up Text that was on the display list before the bind (e.g. the Preload label)', () => {
    const rt = new DisplayRuntime(host(), m(1280, 720, 2));
    const s = sceneMock();
    const early = new Phaser.GameObjects.Text();
    (s.scene as { children: { list: unknown[] } }).children.list.push(early);
    rt.bind(s.scene, () => {});
    expect(early.style.resolution).toBe(2);
  });

  it('runtime_observers_and_scene_bindings_dispose: shutdown unbinds; a re-created scene binds once', () => {
    const rt = new DisplayRuntime(host(), m(1280, 720, 1));
    const { events, scene } = sceneMock();
    let layouts = 0;
    rt.bind(scene, () => layouts++);
    events.emit('shutdown');
    expect(events.count('addedtoscene')).toBe(0);
    rt.apply(m(1280, 720, 2));
    expect(layouts).toBe(0);
    rt.bind(scene, () => layouts++);
    rt.apply(m(1000, 720, 2));
    expect(layouts).toBe(1);
    expect(events.count('addedtoscene')).toBe(1);
  });

  it('realm text follows the world zoom bucket, only re-rasterising when the bucket changes', () => {
    const rt = new DisplayRuntime(host(), m(1280, 720, 2));
    const { events, scene } = sceneMock();
    rt.bind(scene, () => {}, 'realm');
    const t = new Phaser.GameObjects.Text();
    events.emit('addedtoscene', t);
    expect(t.style.resolution).toBe(2);
    const spy = vi.spyOn(t as never, 'setResolution' as never);
    rt.setWorldTextZoom(scene, 1);
    expect(spy).not.toHaveBeenCalled();
    rt.setWorldTextZoom(scene, 1.1);
    expect(t.style.resolution).toBe(4);
    rt.setWorldTextZoom(scene, 1.2);
    expect(spy).toHaveBeenCalledTimes(1);
    rt.setWorldTextZoom(scene, 2.4);
    expect(t.style.resolution).toBe(6);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('world_text_bucket_reuses_resolution at D1: resolution stays 1 at every zoom', () => {
    const rt = new DisplayRuntime(host(), m(1280, 720, 1));
    const { events, scene } = sceneMock();
    rt.bind(scene, () => {}, 'realm');
    const t = new Phaser.GameObjects.Text();
    events.emit('addedtoscene', t);
    rt.setWorldTextZoom(scene, 3);
    expect(t.style.resolution).toBe(1);
  });
});

describe('worldTextBucket', () => {
  it('is 1 up to zoom 1, then the zoom rounded up, capped at 3', () => {
    expect([0.8, 1, 1.0000000001, 1.2, 2, 2.01, 3, 4].map(worldTextBucket)).toEqual([1, 1, 1, 2, 2, 3, 3, 3]);
  });
});

describe('logicalPointerDistance', () => {

  const sceneAt = (d: number) =>
    ({ registry: { get: () => new DisplayRuntime(host(), m(1280, 720, d)) }, scale: { width: 1, height: 1 } }) as never;
  it('press_release_uses_up_position: down → current while down, down → up after release, in logical px', () => {
    const s = sceneAt(2);
    expect(logicalPointerDistance(s, { x: 16, y: 0, downX: 0, downY: 0, upX: 0, upY: 0, isDown: true })).toBe(8);
    expect(logicalPointerDistance(s, { x: 999, y: 999, downX: 0, downY: 0, upX: 12, upY: 16, isDown: false })).toBe(10);
  });
  it('equals getDistance at D1', () => {
    expect(logicalPointerDistance(sceneAt(1), { x: 6, y: 8, downX: 0, downY: 0, upX: 0, upY: 0, isDown: true })).toBe(10);
  });
});
