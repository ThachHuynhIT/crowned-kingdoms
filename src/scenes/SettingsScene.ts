import Phaser from 'phaser';
import { bindSceneDisplay, logicalSize } from '../ui/displayRuntime';
import type { EventBus } from '../core/events';
import type { GameSpeed } from '../core/SimClock';
import { DISCARD_MEMORY_ONLY_TEXT, SETTINGS_SAVE_FAILED_TEXT } from '../data/save';
import { CONTENT } from '../game/cards/registry';
import { defaultSlotName } from '../game/save/slots';
import type { RealmScene } from './RealmScene';
import type { AudioSettings } from '../data/settings';
import type { GameEvents } from '../game/events';
import { defaultProfile } from '../game/meta';
import { stepVolume } from '../game/meta/settings';
import { ContentBox } from '../ui/ContentBox';
import { Tooltip } from '../ui/Tooltip';
import { textContent, type Rect } from '../ui/hud/layout';
import { createOverlay, fitOverlay } from '../ui/modals/overlay';
import { settingsLayout } from '../ui/settings/settingsLayout';
import { addUiText, createButton, createPanel, type Button, type UiBox } from '../ui/theme';
import { getAudio } from './audioRegistry';
import { SCENES } from './keys';
import { getSession } from './sessionRegistry';

export interface SettingsLaunch {
  owner: string;
  bus?: EventBus<GameEvents>;
  speed?: GameSpeed;
  settings?: AudioSettings;
}

const OPEN_KEY = 'settingsOpen';
const VOLUMES = [
  { key: 'master', label: 'Âm lượng chung' },
  { key: 'music', label: 'Nhạc' },
  { key: 'sfx', label: 'Hiệu ứng' },
] as const;
const DISCARD_WARNING = 'Ván đang chơi sẽ bị xoá. Điểm Vương Miện và mở khoá được giữ nguyên.';

/** Reserve the next-frame launch too, so rapid taps cannot open two overlays. */
export const openSettings = (
  scene: Phaser.Scene,
  bus?: EventBus<GameEvents>,
  speed?: GameSpeed,
): void => {
  if (scene.registry.get(OPEN_KEY) || scene.scene.isActive(SCENES.help)) return;
  scene.registry.set(OPEN_KEY, true);
  const data: SettingsLaunch = {
    owner: scene.scene.key,
    bus,
    speed,
    settings: getSession(scene)?.meta().settings,
  };
  scene.scene.launch(SCENES.settings, data);
};

export class SettingsScene extends Phaser.Scene {
  private launch!: SettingsLaunch;
  private settings!: AudioSettings;
  private busy = false;
  private confirming = false;
  private saved = false;
  private closed = false;
  private visit = 0;
  private locked: { scene: Phaser.Scene; input: boolean; keyboard: boolean }[] = [];
  private overlay!: Phaser.GameObjects.Rectangle;
  private panel!: UiBox;
  private title!: Phaser.GameObjects.Text;
  private tooltip!: Tooltip;
  private message!: ContentBox;
  private rows: {
    label: Phaser.GameObjects.Text;
    value: Phaser.GameObjects.Text;
    minus: Button;
    plus: Button;
  }[] = [];
  private shake!: Button;
  private discard!: Button;
  /** In a run (not the main menu): save the run into a named slot (2026-11-09). */
  private saveSlot!: Button;
  private confirm!: Button;
  private cancel!: Button;
  private close!: Button;

  constructor() {
    super(SCENES.settings);
  }

  create(data: SettingsLaunch): void {
    bindSceneDisplay(this, () => this.layout());
    // Scene instances are reused; no state from the previous visit survives.
    this.launch = data;
    this.settings = {
      ...(getSession(this)?.meta().settings ?? data.settings ?? defaultProfile().settings),
    };
    this.busy = false;
    this.confirming = false;
    this.saved = false;
    this.closed = false;
    this.visit += 1;
    this.locked = [];
    this.rows = [];
    this.registry.set(OPEN_KEY, true);
    for (const scene of this.scene.manager.getScenes(true)) {
      if (scene === this) continue;
      this.locked.push({
        scene,
        input: scene.input.enabled,
        keyboard: scene.input.keyboard?.enabled ?? false,
      });
      scene.input.enabled = false;
      if (scene.input.keyboard) scene.input.keyboard.enabled = false;
    }
    if (data.speed !== undefined) data.bus?.emit('ui:set-speed', { speed: 0 });
    this.scene.pause(data.owner);
    this.scene.bringToTop();

    this.overlay = createOverlay(this);
    this.panel = createPanel(this, 'panel', 100, 100);
    this.panel.image.setInteractive();
    this.title = addUiText(this, 0, 0, 'Cài đặt', 26).setOrigin(0.5);
    this.tooltip = new Tooltip(this);
    this.message = new ContentBox(this, 'tooltip', 300, { fontSize: 13, blocking: true });
    this.rows = VOLUMES.map(({ key, label }) => ({
      label: addUiText(this, 0, 0, label, 18).setOrigin(0.5),
      value: addUiText(this, 0, 0, '', 18).setOrigin(0.5),
      minus: this.button(
        '−',
        () => void this.change({ [key]: stepVolume(this.settings[key], -1) }),
      ),
      plus: this.button('+', () => void this.change({ [key]: stepVolume(this.settings[key], 1) })),
    }));
    this.shake = this.button(
      '',
      () => void this.change({ screenShake: !this.settings.screenShake }),
    );
    this.discard = this.button('Xoá ván đang chơi', () => {
      this.confirming = true;
      this.showMessage(DISCARD_WARNING);
      this.refresh();
    });
    this.saveSlot = this.button('Lưu ván…', () => void this.saveNamed());
    this.confirm = this.button('Xác nhận xoá', () => void this.discardSaved());
    this.cancel = this.button('Huỷ', () => {
      this.confirming = false;
      this.showMessage('');
      this.refresh();
    });
    this.close = this.button('Đóng', () => this.leave());
    this.input.keyboard?.on('keydown-ESC', this.onEscape, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this);
    this.refresh();
    void this.loadSaved(this.visit);
  }

  private button(label: string, onClick: () => void): Button {
    return createButton(this, 0, 0, label, {
      width: 48,
      height: 48,
      fontSize: 16,
      onClick: () => {
        getAudio(this)?.play('ui_click');
        onClick();
      },
      tooltip: {
        host: this.tooltip,
        content: () => (label === 'Đóng' ? textContent(['Đóng (Esc)']) : null),
      },
    });
  }

  private async loadSaved(visit: number): Promise<void> {
    if (this.launch.owner !== SCENES.mainMenu) return;
    try {
      const result = await getSession(this)?.load();
      if (this.visit !== visit) return;
      this.saved = result?.kind === 'ok';
      this.refresh();
    } catch {
      if (this.visit === visit) this.showMessage('Không đọc được ván đang chơi.');
    }
  }

  private async change(patch: Partial<AudioSettings>): Promise<void> {
    const session = getSession(this);
    if (this.busy || !session) return;
    const visit = this.visit;
    this.busy = true;
    this.refresh();
    try {
      const result = await session.updateSettings(patch);
      if (result.ok) getAudio(this)?.setVolumes(result.profile.settings);
      if (visit !== this.visit) return;
      if (result.ok) {
        this.settings = result.profile.settings;
        this.showMessage(this.confirming ? DISCARD_WARNING : '');
      } else this.showMessage(result.message);
    } catch {
      if (visit === this.visit) this.showMessage(SETTINGS_SAVE_FAILED_TEXT);
    } finally {
      if (visit === this.visit) {
        this.busy = false;
        this.refresh();
      }
    }
  }

  private async discardSaved(): Promise<void> {
    const session = getSession(this);
    if (this.busy || !this.confirming || !this.saved || !session) return;
    if (this.launch.owner !== SCENES.mainMenu) return;
    const visit = this.visit;
    this.busy = true;
    this.refresh();
    try {
      const result = await session.discardRun();
      if (visit !== this.visit) return;
      this.saved = false;
      this.confirming = false;
      this.showMessage(result.persistent ? 'Đã xoá ván đang chơi.' : DISCARD_MEMORY_ONLY_TEXT);
    } catch {
      if (visit === this.visit) this.showMessage('Chưa xoá được ván đang chơi, hãy thử lại.');
    } finally {
      if (visit === this.visit) {
        this.busy = false;
        this.refresh();
      }
    }
  }

  /** Save the run being played into a new named slot; the name comes from a browser prompt (default: king and year). */
  private async saveNamed(): Promise<void> {
    const session = getSession(this);
    const state = (this.scene.get(SCENES.realm) as RealmScene | null)?.currentRunState() ?? null;
    if (this.busy || !session || !state) return;
    const name = window.prompt('Tên bản lưu', defaultSlotName(CONTENT.king(state.kingId).nameVi, state.year));
    if (name === null) return;
    const visit = this.visit;
    this.busy = true;
    this.refresh();
    try {
      const result = await session.saveSlot(state, name);
      if (visit !== this.visit) return;
      this.showMessage(
        !result.ok
          ? result.message
          : result.memoryOnly
            ? `Đã lưu "${result.slot.name}" trong phiên này (trình duyệt không ghi được ra máy).`
            : `Đã lưu "${result.slot.name}".`,
      );
    } catch {
      if (visit === this.visit) this.showMessage('Không lưu được bản lưu này, hãy thử lại.');
    } finally {
      if (visit === this.visit) {
        this.busy = false;
        this.refresh();
      }
    }
  }

  private showMessage(text: string): void {
    this.message.setContent(text ? textContent([text]) : null);
    this.layout();
  }

  private refresh(): void {
    const writable = !this.busy && !!getSession(this) && !getSession(this)?.metaReadOnly;
    this.rows.forEach((row, i) => {
      const value = this.settings[VOLUMES[i]!.key];
      row.value.setText(`${value}%`);
      row.minus.setEnabled(writable && value > 0);
      row.plus.setEnabled(writable && value < 100);
    });
    this.shake.setLabel(`Rung màn hình: ${this.settings.screenShake ? 'Bật' : 'Tắt'}`);
    this.shake.setEnabled(writable);
    const menu = this.launch.owner === SCENES.mainMenu;
    this.discard.setVisible(menu);
    this.saveSlot.setVisible(!menu);
    this.saveSlot.setEnabled(!this.busy && !!getSession(this));
    this.discard.setEnabled(this.saved && !this.busy && !this.confirming);
    this.confirm.setVisible(menu && this.confirming);
    this.cancel.setVisible(menu && this.confirming);
    this.confirm.setEnabled(!this.busy);
    this.cancel.setEnabled(!this.busy);
    this.close.setEnabled(!this.busy);
    this.layout();
  }

  private layout(): void {
    const l = settingsLayout(logicalSize(this));
    fitOverlay(this, this.overlay);
    this.panel.resize(l.panel.w, l.panel.h);
    this.panel.image.setPosition(l.panel.x, l.panel.y);
    const text = (obj: Phaser.GameObjects.Text, r: Rect): void => {
      obj.setPosition(r.x + r.w / 2, r.y + r.h / 2);
    };
    const button = (obj: Button, r: Rect): void => {
      obj.resize(r.w, r.h);
      obj.container.setPosition(r.x + r.w / 2, r.y + r.h / 2);
    };
    text(this.title, l.title);
    this.rows.forEach((row, i) => {
      const r = l.rows[i]!;
      text(row.label, r.label);
      text(row.value, r.value);
      button(row.minus, r.minus);
      button(row.plus, r.plus);
    });
    button(this.shake, l.shake);
    button(this.discard, l.discard);
    button(this.saveSlot, l.discard); // same spot: the discard button only shows on the main menu
    button(this.confirm, l.confirm);
    button(this.cancel, l.cancel);
    button(this.close, l.close);
    this.message.setMaxWidth(l.message.w);
    this.message.setMaxHeight(l.message.h);
    this.message.refresh();
    this.message.container.setPosition(l.message.x, l.message.y);
    this.tooltip.refresh();
  }

  private onEscape(event: KeyboardEvent): void {
    event.preventDefault();
    this.leave();
  }

  private leave(): void {
    if (this.busy || this.closed) return;
    this.closed = true;
    this.confirming = false;
    this.scene.stop();
  }

  private teardown(): void {
    this.visit += 1;
    this.input.keyboard?.off('keydown-ESC', this.onEscape, this);
    this.message.destroy();
    this.tooltip.destroy();
    const data = this.launch;
    if (data.speed !== undefined && this.scene.manager.isPaused(data.owner)) {
      data.bus?.emit('ui:set-speed', { speed: data.speed });
    }
    this.scene.resume(data.owner);
    // Do not let the key or pointer release that closed Settings reach the owner.
    const locked = this.locked;
    const registry = this.registry;
    this.locked = [];
    setTimeout(() => {
      for (const entry of locked) {
        if (!entry.scene.sys.isActive() && !entry.scene.sys.isPaused()) continue;
        entry.scene.input.enabled = entry.input;
        if (entry.scene.input.keyboard) entry.scene.input.keyboard.enabled = entry.keyboard;
      }
      registry.remove(OPEN_KEY);
    }, 0);
  }
}
