import type Phaser from 'phaser';
import type { GraphicsQuality } from '../data/settings';
import { type ArtQuality, chooseArtQuality } from '../render/artQuality';
import { displayMetrics, logicalSize } from '../ui/displayRuntime';
import { isDesktop } from '../ui/realm/realmLayout';

/** A desktop for close-up art: the desktop layout and a fine pointer (mouse or trackpad), so not a phone or tablet. */
const isDesktopDevice = (width: number): boolean =>
  isDesktop(width) && (typeof window.matchMedia !== 'function' || window.matchMedia('(pointer: fine)').matches);

/** The art quality of `graphics` on this device and display (close-up art, 12/11/2026). */
export const deviceArtQuality = (scene: Phaser.Scene, graphics: GraphicsQuality): ArtQuality =>
  chooseArtQuality({ graphics, density: displayMetrics(scene).density, desktop: isDesktopDevice(logicalSize(scene).w) });

/** Shown in Settings when the new graphics setting loads other art: the session keeps its art until a reload. */
export const ART_RELOAD_TEXT = 'Ảnh mới sẽ dùng sau khi tải lại trang.';

export const sameArtQuality = (a: ArtQuality, b: ArtQuality): boolean =>
  a.tier === b.tier && a.smooth === b.smooth && a.zoomMax === b.zoomMax;
