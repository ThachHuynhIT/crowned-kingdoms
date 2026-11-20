import Phaser from 'phaser';
import { bindSceneDisplay, displayMetrics, logicalSize } from '../ui/displayRuntime';
import { toCss } from '../data/palette';
import { UI_PALETTE } from '../data/uiPalette';
import type { RunState } from '../game/run/state';
import { UI_KEY } from '../render/atlas';
import { hudTexture } from '../render/hudArtHd';
import { MENU_LOGO_FILE, MENU_LOGO_RIBBON, imageArtKey } from '../render/imageArt';
import { resolveShortcut, shortcutFlags } from '../ui/input/shortcuts';
import { GAME_ICONS_CREDIT, gameIcon, type GameIconId } from '../ui/gameIcons';
import { MenuBackdrop } from '../ui/menuBackdrop';
import {
  MENU_BOARD_PAD,
  MENU_BUTTON,
  layoutMenu,
  menuButtonBoard,
  menuLogoScale,
  ribbonTitleSize,
  visibleMenuItems,
  type MenuItemId,
} from '../ui/menuLayout';
import { openHelp } from './helpLauncher';
import {
  addUiText,
  createButton,
  createPanel,
  FONT_TITLE,
  frameBorder,
  textStyle,
  type Button,
  type UiBox,
} from '../ui/theme';
import { LoadGuard, continueLabel, resumeTarget } from '../ui/resumeModel';
import { SCENES } from './keys';
import type { RealmData } from './RealmScene';
import { getSession, takeStorageWarning } from './sessionRegistry';
import { getAudio } from './audioRegistry';
import { openSettings } from './SettingsScene';

const TITLE = 'Crowned Kingdoms';
const SUBTITLE = 'Một vương quốc nhỏ, chín ngai vàng';
/** Drift speed of each hill layer, far → near (screen px per second). */
const FIREFLIES = 24;

/** A fresh run seed; scenes may use wall-clock randomness (the run itself is seeded). */
export const newRunSeed = (): number => (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;

/**
 * What each §10.2 button does. The list and order live in `MENU_ITEMS` (hidden ones, e.g.
 * unfinished features, are not drawn). "Tiếp tục" starts disabled and is enabled once a valid
 * saved run has loaded; "Ván mới" opens the king select; "Vương Miện" the Crowns screen.
 */
const MENU_ACTIONS: Record<MenuItemId, (scene: MainMenuScene) => void> = {
  continue: (scene) => scene.resume(),
  newRun: (scene) => scene.scene.start(SCENES.kingSelect),
  saves: (scene) => scene.scene.start(SCENES.saves),
  crowns: (scene) => scene.scene.start(SCENES.crowns),
  settings: (scene) => openSettings(scene),
  help: (scene) => openHelp(scene, null, null),
};

/** game-icons.net icon of each menu button (12/11/2026). */
const MENU_ICONS: Readonly<Record<MenuItemId, GameIconId>> = {
  continue: 'continue',
  newRun: 'new_run',
  saves: 'load',
  crowns: 'crowns',
  settings: 'settings',
  help: 'book',
};

export class MainMenuScene extends Phaser.Scene {
  private pix = 2;
  /** Dusk sky and drifting hills, shared with the other screens outside the game. */
  private backdrop!: MenuBackdrop;
  private fireflies: Phaser.GameObjects.Image[] = [];
  private logo!: UiBox;
  /** The logo picture (20/11/2026) with its texture factor (2 for the HD twin); null keeps the wooden board. */
  private logoArt: { image: Phaser.GameObjects.Image; factor: number } | null = null;
  /** Wooden board behind the menu buttons (12/11/2026). */
  private buttonBoard!: UiBox;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private footer!: Phaser.GameObjects.Text;
  private buttons: Button[] = [];
  private notice!: Phaser.GameObjects.Text;
  /** Saved run waiting behind "Tiếp tục"; null while loading or when there is none. */
  private saved: RunState | null = null;
  /** A load that resolves for an older create (or after shutdown) is ignored. */
  private readonly guard = new LoadGuard();

  constructor() {
    super(SCENES.mainMenu);
  }

  create(): void {
    bindSceneDisplay(this, () => this.layout());
    this.fireflies = [];
    this.buttons = [];
    this.cameras.main.setBackgroundColor(toCss(UI_PALETTE.sky[3]));
    // Dusk sky, three drifting hill strips (src/ui/menuBackdrop.ts), fireflies.
    this.backdrop = new MenuBackdrop(this);
    this.pix = this.backdrop.pixelScale;
    this.createFireflies();

    // Logo board.
    this.buttonBoard = createPanel(this, 'board', 64, 64);
    this.logo = createPanel(this, 'panel', 200, 100, 0.5, 0.5);
    this.logoArt = null;
    if (MENU_LOGO_FILE && this.textures.exists(imageArtKey(MENU_LOGO_FILE))) {
      const tex = hudTexture(this.textures, imageArtKey(MENU_LOGO_FILE), displayMetrics(this).density);
      this.logoArt = { image: this.add.image(0, 0, tex.key).setOrigin(0.5, 0), factor: tex.factor };
      this.logo.image.setVisible(false);
    }
    this.title = this.add
      .text(0, 0, TITLE, {
        ...textStyle(48, UI_PALETTE.text, FONT_TITLE),
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, toCss(UI_PALETTE.textShadow), 0, false, true);
    this.subtitle = addUiText(this, 0, 0, SUBTITLE, 14).setOrigin(0.5, 0).setAlign('center');

    this.buttons = visibleMenuItems().map((item) => {
      const button = createButton(this, 0, 0, item.label, {
        width: MENU_BUTTON.w,
        height: MENU_BUTTON.h,
        fontSize: 18,
        icon: gameIcon(this, MENU_ICONS[item.id], 28),
        onClick: () => {
          getAudio(this)?.play('ui_click');
          MENU_ACTIONS[item.id](this);
        },
      });
      button.setEnabled(item.id !== 'continue'); // enabled once a saved run loads
      return button;
    });
    this.footer = this.add
      .text(0, 0, `v${__APP_VERSION__} · ${GAME_ICONS_CREDIT}`, textStyle(11, UI_PALETTE.creamLight))
      .setOrigin(0.5)
      .setStroke(toCss(UI_PALETTE.outline), 3);
    this.notice = this.add
      .text(0, 0, takeStorageWarning(this) ?? '', textStyle(13, UI_PALETTE.creamLight))
      .setOrigin(0.5, 1)
      .setAlign('center');
    this.saved = null;
    this.loadSaved(this.guard.begin());
    this.events.on(Phaser.Scenes.Events.RESUME, this.onResume, this);

    this.layout();
    this.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RESUME, this.onResume, this);
      this.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKey, this);
      this.guard.invalidate();
    });
  }

  private onResume(): void {
    this.saved = null;
    this.buttons[0]?.setEnabled(false);
    this.buttons[0]?.setLabel(continueLabel(null));
    this.loadSaved(this.guard.begin());
  }

  private onKey(event: KeyboardEvent): void {
    if (resolveShortcut(event.key, 'menu', shortcutFlags(event)) !== 'help.toggle') return;
    event.preventDefault();
    openHelp(this, null, null);
  }

  /** Reads the saved run; the answer is dropped if the menu was left or reopened meanwhile. */
  private loadSaved(token: number): void {
    const session = getSession(this);
    if (!session) return;
    void session.load().then((result) => {
      if (!this.guard.isCurrent(token)) return;
      const target = resumeTarget(result);
      this.saved = target.state;
      this.buttons[0]?.setEnabled(target.enabled);
      // One save slot: "Tiếp tục" says which run it holds (mode and year, from the state).
      this.buttons[0]?.setLabel(continueLabel(target.state));
      if (target.warning !== null) this.showNotice(target.warning);
    });
  }

  private showNotice(text: string): void {
    this.notice.setText(text);
    this.layout();
  }

  /** "Tiếp tục": open the saved run exactly as it was written. */
  resume(): void {
    if (this.saved === null) return;
    const data: RealmData = { resume: this.saved };
    this.scene.start(SCENES.realm, data);
  }

  update(_time: number, delta: number): void {
    this.backdrop.update(delta);
  }

  private layout(): void {
    const { w: width, h: height } = logicalSize(this);

    this.backdrop.layout();
    this.pix = this.backdrop.pixelScale;
    for (const fly of this.fireflies) fly.setScale(this.pix);

    if (this.logoArt) this.layoutLogoArt(width, height, this.logoArt);
    else this.layoutLogoBoard(width, height);
  }

  /** The logo picture: whole-number scale, the title written on its ribbon, the subtitle under it. */
  private layoutLogoArt(width: number, height: number, art: { image: Phaser.GameObjects.Image; factor: number }): void {
    const artW = art.image.width / art.factor;
    const artH = art.image.height / art.factor;
    const k = menuLogoScale(height, artH);
    art.image.setScale(k / art.factor);
    this.title.setFontSize(32);
    const perPx = this.title.width / 32;
    this.title.setFontSize(ribbonTitleSize(MENU_LOGO_RIBBON.w * k, MENU_LOGO_RIBBON.h * k, perPx));
    this.title.setShadow(0, 0, 'transparent', 0);
    this.subtitle.setWordWrapWidth(Math.min(520, width - 32));
    this.subtitle.setColor(toCss(UI_PALETTE.creamLight)).setStroke(toCss(UI_PALETTE.outline), 3);
    const logoW = artW * k;
    // room under the subtitle for the wooden board's padding round the buttons
    const logoH = artH * k + 4 + this.subtitle.height + MENU_BOARD_PAD;
    const m = layoutMenu({ w: width, h: height }, { w: logoW, h: logoH }, this.buttons.length);
    const top = Math.round(m.logo.y - logoH / 2);
    art.image.setPosition(Math.round(m.logo.x), top);
    this.title.setPosition(
      Math.round(m.logo.x + (MENU_LOGO_RIBBON.cx - artW / 2) * k),
      Math.round(top + MENU_LOGO_RIBBON.cy * k),
    );
    this.subtitle.setPosition(m.logo.x, top + artH * k + 4);
    this.layoutButtons(m, width);
  }

  private layoutLogoBoard(width: number, height: number): void {
    // Logo board size from its text (title size: same clamp as before).
    const inset = frameBorder(this, 'panel') + 16;
    const titleSize = Phaser.Math.Clamp(Math.floor(width / 14), 28, 64);
    this.title.setFontSize(titleSize);
    this.subtitle.setWordWrapWidth(Math.min(520, width - 32 - inset * 2));
    const logoW = Math.min(width - 16, Math.max(this.title.width, this.subtitle.width) + inset * 2);
    const logoH = inset * 2 + this.title.height + 4 + this.subtitle.height;

    const m = layoutMenu({ w: width, h: height }, { w: logoW, h: logoH }, this.buttons.length);
    this.logo.resize(logoW, logoH);
    this.logo.image.setPosition(m.logo.x, m.logo.y);
    const logoTop = m.logo.y - logoH / 2;
    this.title.setPosition(m.logo.x, logoTop + inset + this.title.height / 2);
    this.subtitle.setPosition(m.logo.x, logoTop + inset + this.title.height + 4);
    this.layoutButtons(m, width);
  }

  private layoutButtons(m: ReturnType<typeof layoutMenu>, width: number): void {
    this.buttons.forEach((button, i) => {
      const at = m.buttons[i]!;
      button.container.setPosition(at.x, at.y);
    });
    const board = menuButtonBoard(m.buttons);
    this.buttonBoard.image.setVisible(board !== null);
    if (board) {
      this.buttonBoard.resize(board.w, board.h);
      this.buttonBoard.image.setPosition(board.x, board.y);
    }
    this.footer.setPosition(m.footer.x, m.footer.y);
    this.notice.setWordWrapWidth(Math.max(120, width - 32));
    this.notice.setPosition(m.footer.x, m.footer.y - 18);
  }

  /** Fireflies drift over the hills; one that wanders off screen comes back elsewhere. */
  private createFireflies(): void {
    for (let i = 0; i < FIREFLIES; i++) {
      const fly = this.add.image(0, 0, UI_KEY, 'firefly').setScale(this.pix);
      this.fireflies.push(fly);
      this.tweens.add({
        targets: fly,
        alpha: { from: 0.15, to: 1 },
        duration: Phaser.Math.Between(500, 1500),
        delay: Phaser.Math.Between(0, 1500),
        yoyo: true,
        repeat: -1,
      });
      this.respawn(fly);
      this.wander(fly);
    }
  }

  private respawn(fly: Phaser.GameObjects.Image): void {
    const { w: width, h: height } = logicalSize(this);
    fly.setPosition(
      Phaser.Math.Between(0, width),
      Phaser.Math.Between(Math.floor(height * 0.3), height),
    );
  }

  private wander(fly: Phaser.GameObjects.Image): void {
    const { w: width, h: height } = logicalSize(this);
    if (fly.x < -8 || fly.x > width + 8 || fly.y < -8 || fly.y > height + 8) this.respawn(fly);
    this.tweens.add({
      targets: fly,
      x: fly.x + Phaser.Math.Between(-60, 60),
      y: fly.y + Phaser.Math.Between(-40, 30),
      duration: Phaser.Math.Between(2000, 4000),
      ease: 'Sine.easeInOut',
      onComplete: () => this.wander(fly),
    });
  }
}
