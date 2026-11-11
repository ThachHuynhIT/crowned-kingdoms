/**
 * Service worker registration (G5 PWA). Production builds only; the worker file is generated next to index.html by
 * the `pwa` Vite plugin (tools/pwa.ts), so it is resolved against the page's base and works under any sub-path.
 * A new worker is never activated on its own: `applyUpdate()` asks it to take over, then reloads (call it from a
 * menu, never mid-run). Saves live in IndexedDB and are never touched here.
 */
let waiting: ServiceWorker | null = null;

export const updateReady = (): boolean => waiting !== null;

export async function registerPwa(baseUrl: string = import.meta.env.BASE_URL): Promise<ServiceWorkerRegistration | null> {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const url = new URL(`${baseUrl}sw.js`, document.baseURI);
    const reg = await navigator.serviceWorker.register(url.href, { scope: new URL(baseUrl, document.baseURI).pathname });
    const track = (w: ServiceWorker | null): void => {
      if (w === null) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) waiting = w;
      });
    };
    if (reg.waiting && navigator.serviceWorker.controller) waiting = reg.waiting;
    track(reg.installing);
    reg.addEventListener('updatefound', () => track(reg.installing));
    return reg;
  } catch (e) {
    console.warn('[pwa] service worker registration failed', e);
    return null;
  }
}

/** Activate the waiting worker and reload once it controls the page. */
export function applyUpdate(): void {
  if (waiting === null) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
  waiting.postMessage('skipWaiting');
}
