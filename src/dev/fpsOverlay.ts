/**
 * Dev-only frame-rate readout for measuring on a real phone (spec §8.10): open the game with `?fps` in the URL.
 * Every second it shows the mean fps, the slowest frame and the 95th-percentile frame time of the last second,
 * measured from requestAnimationFrame (what the screen really shows). Nothing is drawn without `?fps`.
 * With a `metrics` accessor (the display runtime's, never `window.devicePixelRatio`) a second line shows the density
 * and the logical → backing size. The box stays at its CSS size (12 px font), not scaled by the density.
 */
export interface FpsDisplayInfo {
  readonly density: number;
  readonly logical: { readonly w: number; readonly h: number };
  readonly backing: { readonly w: number; readonly h: number };
}

const displayLine = (m: FpsDisplayInfo): string =>
  `D ${Number(m.density.toFixed(3))} · ${m.logical.w}×${m.logical.h} → ${m.backing.w}×${m.backing.h}`;

export const startFpsOverlay = (metrics?: () => FpsDisplayInfo | null): void => {
  if (!new URLSearchParams(window.location.search).has('fps')) return;
  const box = document.createElement('div');
  box.style.cssText =
    'position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:9999;padding:2px 8px;' +
    'font:12px monospace;white-space:pre;text-align:center;color:#fff;background:rgba(0,0,0,.65);border-radius:3px;pointer-events:none';
  document.body.appendChild(box);
  const frames: number[] = [];
  let last = performance.now();
  let windowStart = last;
  const tick = (now: number): void => {
    frames.push(now - last);
    last = now;
    if (now - windowStart >= 1000) {
      const sorted = [...frames].sort((a, b) => a - b);
      const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
      const worst = sorted[sorted.length - 1] ?? 0;
      const fps = (frames.length * 1000) / (now - windowStart);
      const m = metrics?.();
      const line = `${fps.toFixed(0)} fps · p95 ${p95.toFixed(1)} ms · max ${worst.toFixed(0)} ms`;
      box.textContent = m ? `${line}\n${displayLine(m)}` : line;
      frames.length = 0;
      windowStart = now;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
