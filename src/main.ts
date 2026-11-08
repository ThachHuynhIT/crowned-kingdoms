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
import { SettingsScene } from './scenes/SettingsScene';

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
    // Canvas fills the window 1:1; zoom is handled by the camera in whole steps.
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
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
  ],
});

if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
  void import('./dev/registerPreview').then((m) => m.registerPreview(game));
}

void registerPwa();
