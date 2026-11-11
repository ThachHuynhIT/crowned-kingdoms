import Phaser from 'phaser';
import { AudioManager } from '../audio/AudioManager';
import { CONTENT } from '../game/cards/registry';
import { browserIdbFactory, createSession } from '../platform/session';
import { SCENES } from './keys';
import { GRAPHICS_DENSITY_CAP } from '../data/settings';
import { setDisplayDensityCap } from '../ui/displayRuntime';
import { setSession, setStorageWarning } from './sessionRegistry';
import { getAudio, setAudio } from './audioRegistry';

/**
 * First scene. Loads only what the loading screen itself needs (nothing yet), opens the
 * save storage (IndexedDB, or memory with one warning), then hands over to Preload.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    const game = this.game;
    let audio = getAudio(this);
    if (!audio) {
      audio = new AudioManager(() => new AudioContext());
      setAudio(game, audio);
      const manager = audio;
      let gestured = false;
      const unlock = (): void => {
        gestured = true;
        void manager.unlock().catch(() => undefined);
      };
      const visibility = (): void => {
        if (document.hidden) void manager.suspend();
        else if (gestured) void manager.unlock().catch(() => undefined);
      };
      // Canvas input survives Boot shutdown. Only a real pointer gesture creates the context.
      game.canvas.addEventListener('pointerdown', unlock);
      document.addEventListener('visibilitychange', visibility);
      game.events.once(Phaser.Core.Events.DESTROY, () => {
        game.canvas.removeEventListener('pointerdown', unlock);
        document.removeEventListener('visibilitychange', visibility);
        void manager.destroy();
      });
    }
    const manager = audio;
    createSession(browserIdbFactory(), (text) => setStorageWarning(game, text), CONTENT)
      .catch(() => createSession(null, (text) => setStorageWarning(game, text), CONTENT))
      .then((session) => {
        setSession(game, session);
        manager.setVolumes(session.meta().settings);
        setDisplayDensityCap(game, GRAPHICS_DENSITY_CAP[session.meta().settings.graphics]);
        this.scene.start(SCENES.preload);
      });
  }
}
