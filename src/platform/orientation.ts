import type Phaser from 'phaser';
import { FONT_UI } from '../ui/theme';

/**
 * Phones and tablets play in landscape only (owner 12/11/2026). A touch device held in portrait gets a full-screen
 * "Xoay ngang điện thoại để chơi" overlay and the game sleeps until it turns; where the browser allows it the screen is
 * locked to landscape (`screen.orientation.lock`, which most browsers grant only in full screen, so it is tried on
 * every press and its refusal is ignored). Desktops (a fine pointer) are never blocked, whatever their window shape.
 */
export const ROTATE_TEXT = 'Xoay ngang điện thoại để chơi';

/** Whether the game must wait for the device to turn: a touch-only device whose screen is taller than wide. */
export const blocksPortrait = (o: { coarsePointer: boolean; finePointer: boolean; width: number; height: number }): boolean =>
  o.coarsePointer && !o.finePointer && o.height > o.width;

const media = (query: string): boolean => typeof window.matchMedia === 'function' && window.matchMedia(query).matches;

/** Install the portrait overlay and the landscape lock for `game`. */
export const installOrientationGuard = (game: Phaser.Game): void => {
  const overlay = document.createElement('div');
  overlay.setAttribute('role', 'alert');
  overlay.textContent = ROTATE_TEXT;
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    textAlign: 'center',
    background: '#2b1a0f',
    color: '#fff3d6',
    font: `600 24px ${FONT_UI}`,
    zIndex: '1000',
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(overlay);

  let blocked = false;
  const check = (): void => {
    const now = blocksPortrait({
      coarsePointer: media('(pointer: coarse)'),
      finePointer: media('(any-pointer: fine)'),
      width: window.innerWidth,
      height: window.innerHeight,
    });
    if (now === blocked) return;
    blocked = now;
    overlay.style.display = now ? 'flex' : 'none';
    if (now) game.loop.sleep();
    else game.loop.wake();
  };
  const lock = (): void => {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation?.lock?.('landscape').catch(() => undefined);
  };
  window.addEventListener('resize', check);
  window.addEventListener('orientationchange', check);
  document.addEventListener('pointerdown', lock, { passive: true });
  game.events.once('ready', check);
  check();
};
