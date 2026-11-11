import Phaser from 'phaser';
import { PALETTE, toCss } from './data/palette';
import { registerPwa } from './platform/pwa';
import { BattleHudScene } from './scenes/BattleHudScene';
import { BootScene } from './scenes/BootScene';
import { CrownsScene } from './scenes/CrownsScene';
import { HelpScene } from './scenes/HelpScene';
import { KingSelectScene } from './scenes/KingSelectScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { PlanningHudScene } from './scenes/PlanningHudScene';
import { PreloadScene } from './scenes/PreloadScene';
import { RealmScene } from './scenes/RealmScene';
import { RunEndScene } from './scenes/RunEndScene';
import { SavesScene } from './scenes/SavesScene';
import { SettingsScene } from './scenes/SettingsScene';
import { installDisplayRuntime, readInitialDisplayMetrics } from './ui/displayRuntime';

const parent = document.getElementById('game') ?? document.body;
// HiDPI (spec 2026-11-11): the canvas has round(CSS px × density) pixels; the display runtime owns that size.
const display = readInitialDisplayMetrics(parent);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: toCss(PALETTE.outline),
  // Nearest-neighbour sampling + rounded positions: crisp pixel art (the realm camera zooms freely and snaps its
  // translation to whole pixels, spec 2026-11-08 §4).
  pixelArt: true,
  // WebAudio belongs to our gesture-unlocked AudioManager.
  audio: { noAudio: true },
  scale: {
    // The canvas fills the #game box (the window minus the safe-area insets, G5) at the display density: the
    // display runtime (`src/ui/displayRuntime.ts`) sizes the backing store and the CSS box itself, so Phaser runs
    // in NONE mode with zoom 1 and never rewrites the canvas style.
    mode: Phaser.Scale.NONE,
    width: display.backing.w,
    height: display.backing.h,
    zoom: 1,
  },
  callbacks: {
    preBoot: (g) => {
      installDisplayRuntime(g, parent, display);
    },
  },
  input: {
    // Mouse + up to two simultaneous touches (pinch).
    activePointers: 3,
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    KingSelectScene,
    CrownsScene,
    RealmScene,
    PlanningHudScene,
    BattleHudScene,
    RunEndScene,
    HelpScene,
    SettingsScene,
    SavesScene,
  ],
});

if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
  void import('./dev/registerPreview').then((m) => m.registerPreview(game));
  void Promise.all([import('./dev/fpsOverlay'), import('./ui/displayRuntime')]).then(([fps, display]) =>
    fps.startFpsOverlay(() => display.devDisplaySnapshot(game)),
  );
}

void registerPwa();
