import Phaser from 'phaser';
import { toCss } from '../../data/palette';
import type { PerkId } from '../../data/types';
import { UI_PALETTE } from '../../data/uiPalette';
import { textContent } from '../hud/layout';
import { createOverlay, fitOverlay } from '../modals/overlay';
import type { UiSkin } from '../skin';
import { addUiText, createButton, createPanel, frameBorder, type Button, type TooltipHost, type UiBox } from '../theme';
import { perkDialogLayout } from './detailLayout';
import type { PerkOption } from './perkModel';

const PAD_DESKTOP = 12;
const PAD_MOBILE = 6;
const LOCKED_TEXT_ALPHA = 0.6;

interface Row {
  button: Button;
  name: Phaser.GameObjects.Text;
  text: Phaser.GameObjects.Text;
  status: Phaser.GameObjects.Text;
}

/**
 * The perk dialog of the king detail page: the king's three perks (name, text, and either
 * "Thông thạo N" while locked or "Đang chọn"), one chosen at most. Tapping an open perk calls
 * `onTap`; the ✕, a tap on the dimmed overlay or Esc (handled by the scene) call `onClose`.
 */
export class PerkDialog {
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly box: UiBox;
  private readonly title: Phaser.GameObjects.Text;
  private readonly close: Button;
  private readonly rows: Row[] = [];
  private readonly root: Phaser.GameObjects.Container;
  private options: readonly PerkOption[];

  constructor(
    private readonly scene: Phaser.Scene,
    options: readonly PerkOption[],
    tooltip: TooltipHost,
    onTap: (id: PerkId) => void,
    onClose: () => void,
    skin: UiSkin,
  ) {
    this.options = options;
    this.overlay = createOverlay(scene);
    this.overlay.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, onClose);
    this.box = createPanel(scene, 'panel', 64, 64, 0, 0, skin);
    this.box.image.setInteractive(); // a tap on the panel must not reach the closing overlay
    this.title = addUiText(scene, 0, 0, 'ĐẶC QUYỀN', 18).setOrigin(0, 0.5).setFontStyle('bold');
    this.close = createButton(scene, 0, 0, '✕', {
      width: 48,
      height: 48,
      fontSize: 20,
      onClick: onClose,
      tooltip: { host: tooltip, content: () => textContent(['Đóng (Esc)']) },
      skin,
    });
    const children: Phaser.GameObjects.GameObject[] = [this.overlay, this.box.image, this.title, this.close.container];
    for (let i = 0; i < 3; i++) {
      const button = createButton(scene, 0, 0, '', {
        width: 200,
        height: 80,
        onClick: () => {
          const o = this.options[i];
          if (o) onTap(o.id);
        },
        tooltip: {
          host: tooltip,
          content: () => {
            const o = this.options[i];
            if (!o) return textContent([]);
            return textContent([o.nameVi, o.textVi, o.unlocked ? (o.selected ? 'Bấm lần nữa để bỏ chọn.' : 'Bấm để chọn.') : `Cần ${o.note ?? ''}.`]);
          },
        },
        skin,
      });
      const name = addUiText(scene, 0, 0, '', 15).setFontStyle('bold');
      const text = addUiText(scene, 0, 0, '', 13);
      const status = addUiText(scene, 0, 0, '', 12, UI_PALETTE.bad).setOrigin(1, 0);
      this.rows.push({ button, name, text, status });
      children.push(button.container, name, text, status);
    }
    this.root = scene.add.container(0, 0, children);
    this.setOptions(options);
  }

  setDepth(depth: number): this {
    this.root.setDepth(depth);
    return this;
  }

  setOptions(options: readonly PerkOption[]): void {
    this.options = options;
    this.rows.forEach((row, i) => {
      const o = options[i];
      row.button.setVisible(o !== undefined);
      if (!o) return;
      row.name.setText(o.nameVi);
      row.text.setText(o.textVi);
      row.status.setText(o.unlocked ? (o.selected ? '✓ Đang chọn' : '') : (o.note ?? ''));
      row.status.setColor(toCss(o.unlocked ? UI_PALETTE.good : UI_PALETTE.bad));
      row.button.setEnabled(o.unlocked);
      row.button.setActive(o.selected);
      for (const t of [row.name, row.text]) t.setAlpha(o.unlocked ? 1 : LOCKED_TEXT_ALPHA);
    });
    this.layout();
  }

  layout(): void {
    const { width, height } = this.scene.scale;
    const desktop = width >= 768;
    const inset = frameBorder(this.scene, 'panel') + (desktop ? PAD_DESKTOP : PAD_MOBILE);
    const l = perkDialogLayout({ w: width, h: height }, inset);
    fitOverlay(this.scene, this.overlay);
    this.box.resize(l.panel.w, l.panel.h);
    this.box.image.setPosition(l.panel.x, l.panel.y);
    this.title.setPosition(l.title.x, l.title.y + l.title.h / 2);
    this.close.container.setPosition(l.close.x + l.close.w / 2, l.close.y + l.close.h / 2);
    this.rows.forEach((row, i) => {
      const r = l.rows[i]!;
      row.button.resize(r.w, r.h);
      row.button.container.setPosition(r.x + r.w / 2, r.y + r.h / 2);
      const pad = 12;
      row.status.setPosition(r.x + r.w - pad, r.y + 10);
      row.name.setPosition(r.x + pad, r.y + 8);
      row.text.setPosition(r.x + pad, r.y + 30).setWordWrapWidth(r.w - 2 * pad);
    });
  }

  destroy(): void {
    this.root.destroy();
  }
}
