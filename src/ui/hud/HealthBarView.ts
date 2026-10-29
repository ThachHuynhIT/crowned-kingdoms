import type Phaser from 'phaser';
import { toCss } from '../../data/palette';
import { UI_PALETTE } from '../../data/uiPalette';
import { skinFrame, type UiSkin } from '../skin';
import { createPanel, frameBorder, textStyle, type TooltipHost, type UiBox } from '../theme';
import type { Rect, TooltipContent } from './layout';
import type { HealthReadout } from './armyHealth';

const BAR_H = 16;
const LABEL_SIZE = 13;
const VALUE_SIZE = 12;
/** Below this fraction the fill turns to the warning colour whatever the king's colour. */
const LOW = 0.25;

/**
 * One health bar of the battle HUD: a name above, the bar (a `bar` frame in the king's colours)
 * with the numbers over it. `align` puts the name at the left or the right end. Pure display:
 * `set` takes what `throneHealth` / `armyHealth` computed. An optional tooltip explains the bar.
 */
export class HealthBarView {
  private readonly label: Phaser.GameObjects.Text;
  private readonly value: Phaser.GameObjects.Text;
  private readonly bar: UiBox;
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly zone: Phaser.GameObjects.Zone | null;
  private rect: Rect = { x: 0, y: 0, w: 100, h: 44 };
  private skin: UiSkin = 'neutral';
  private shown: { readout: HealthReadout | null; color: number } = { readout: null, color: UI_PALETTE.good };
  private readonly owner: string;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly align: 'left' | 'right',
    tooltip?: { host: TooltipHost; content: TooltipContent },
  ) {
    this.owner = `health-${align}`;
    const text = (size: number, origin: [number, number]): Phaser.GameObjects.Text =>
      scene.add
        .text(0, 0, '', textStyle(size, UI_PALETTE.creamLight))
        .setOrigin(origin[0], origin[1])
        .setFontStyle('bold')
        .setShadow(2, 2, toCss(UI_PALETTE.outline), 0, false, true);
    this.label = text(LABEL_SIZE, [align === 'left' ? 0 : 1, 0]);
    this.bar = createPanel(scene, 'bar', 100, BAR_H);
    this.fill = scene.add.graphics();
    this.value = text(VALUE_SIZE, [0.5, 0.5]);
    this.zone = tooltip ? scene.add.zone(0, 0, 1, 1).setOrigin(0, 0).setInteractive() : null;
    if (tooltip && this.zone) {
      this.zone.on('pointerover', () => tooltip.host.showAtPointer(tooltip.content, this.owner));
      this.zone.on('pointerout', () => tooltip.host.hide(this.owner));
    }
  }

  layout(rect: Rect): void {
    this.rect = rect;
    const barY = rect.y + rect.h - BAR_H;
    this.label.setPosition(this.align === 'left' ? rect.x : rect.x + rect.w, rect.y);
    this.bar.resize(rect.w, BAR_H);
    this.bar.image.setPosition(rect.x, barY);
    this.value.setPosition(rect.x + rect.w / 2, barY + BAR_H / 2);
    this.zone?.setPosition(rect.x, rect.y).setSize(rect.w, rect.h);
    if (this.zone?.input) this.zone.input.hitArea.setSize(rect.w, rect.h);
    this.draw();
  }

  /**
   * Show `label` and `text` over a bar filled to `readout.fraction` in `color` (a king's accent;
   * the fill turns to the warning colour when nearly empty). `null` readout: an empty bar.
   */
  set(label: string, readout: HealthReadout | null, text: string, color: number, skin: UiSkin): void {
    if (skin !== this.skin) {
      this.skin = skin;
      this.bar.setSkin(skin);
    }
    this.label.setText(label);
    this.value.setText(text);
    this.shown = { readout, color };
    this.draw();
  }

  setVisible(visible: boolean): void {
    for (const o of [this.label, this.value, this.bar.image, this.fill]) o.setVisible(visible);
    if (visible) this.zone?.setInteractive();
    else this.zone?.disableInteractive();
  }

  destroy(): void {
    this.zone?.destroy();
    this.label.destroy();
    this.value.destroy();
    this.bar.image.destroy();
    this.fill.destroy();
  }

  private draw(): void {
    const g = this.fill;
    g.clear();
    const { readout, color } = this.shown;
    if (!readout || readout.fraction <= 0) return;
    const r = this.rect;
    const b = frameBorder(this.scene, skinFrame('bar', this.skin));
    const innerW = r.w - 2 * b;
    g.fillStyle(readout.fraction <= LOW ? UI_PALETTE.bad : color, 1);
    g.fillRect(r.x + b, r.y + r.h - BAR_H + b, Math.max(1, Math.round(innerW * readout.fraction)), BAR_H - 2 * b);
  }
}
