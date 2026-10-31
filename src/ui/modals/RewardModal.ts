import Phaser from 'phaser';
import { toCss } from '../../data/palette';
import type { CardId, KingId } from '../../data/types';
import type { Content } from '../../game/cards/registry';
import { CardView } from '../cards/CardView';
import { textContent } from '../hud/layout';
import { kingTheme } from '../kingSelect/kingTheme';
import { createButton, textStyle, type Button, type TooltipHost } from '../theme';
import { rewardRerollView } from './offerModel';
import { rewardLayout, visibleRewardCards, type RewardLayout } from './modalLayout';
import { createOverlay, fitOverlay } from './overlay';
import { canConfirmReward, selectReward } from './rewardSelection';

/** Opacity of the darkened world behind the picker (it only darkens, never blurs). */
const REWARD_OVERLAY_ALPHA = 0.75;
/** Space between the layout's content and its edge (the picker has no frame of its own). */
const INSET = 4;

export interface RewardModalOptions {
  /** The playing king: the cards, buttons and headings take his colours. */
  skin: KingId;
  heading: { title: string; subtitle: string };
}

/**
 * Reward / conquest picker (§10.6): two headings floating over the darkened world, the offered
 * vertical cards, the disabled "ĐỔI THƯỞNG" line and **Nhận** (enabled once a card is chosen; the
 * reward cannot be skipped, and Nhận works once). Pure display: the choice goes to `onPick`.
 * Call `layout()` on resize and `destroy()` when the reward phase ends. When the screen is too
 * short for every card, the cards scroll (wheel or drag) and only fully visible ones show.
 */
export class RewardModal {
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly subtitle: Phaser.GameObjects.Text;
  private readonly cards: CardView[];
  private readonly reroll: Button;
  private readonly take: Button;
  private readonly root: Phaser.GameObjects.Container;
  private selected: number | null = null;
  private submitted = false;
  private scroll = 0;
  private drag: { id: number; y: number; scroll: number } | null = null;
  private lay: RewardLayout;

  constructor(
    private readonly scene: Phaser.Scene,
    content: Content,
    offers: readonly CardId[],
    tooltip: TooltipHost,
    private readonly onPick: (index: number) => void,
    { skin, heading }: RewardModalOptions,
  ) {
    const theme = kingTheme(skin);
    this.overlay = createOverlay(scene, { alpha: REWARD_OVERLAY_ALPHA });
    const heads = (text: string, color: number): Phaser.GameObjects.Text =>
      scene.add
        .text(0, 0, text, textStyle(24, color))
        .setOrigin(0.5, 0)
        .setFontStyle('bold')
        .setShadow(2, 2, toCss(theme.bgDark), 0, false, true);
    this.title = heads(heading.title, theme.light);
    this.subtitle = heads(heading.subtitle, theme.accent);
    this.cards = offers.map((id, i) => {
      const card = new CardView(scene, content, { w: 180, h: 288 }, tooltip);
      card.setTheme(skin);
      card.setCard(id);
      card.onClick(() => this.select(i));
      return card;
    });
    const view = rewardRerollView();
    this.reroll = createButton(scene, 0, 0, view.label, {
      width: 240,
      height: 44,
      fontSize: 14,
      onClick: () => undefined,
      tooltip: { host: tooltip, content: () => textContent([view.tooltip]) },
      skin,
    });
    this.reroll.setEnabled(view.enabled);
    this.take = createButton(scene, 0, 0, 'Nhận', {
      width: 150,
      height: 48,
      fontSize: 18,
      onClick: () => this.confirm(),
      tooltip: { host: tooltip, content: () => textContent(['Nhận thẻ đã chọn (Enter)']) },
      skin,
    });
    this.take.setEnabled(false);
    this.root = scene.add.container(0, 0, [
      this.overlay,
      this.title,
      this.subtitle,
      ...this.cards.map((c) => c.container),
      this.reroll.container,
      this.take.container,
    ]);
    this.lay = this.compute();
    scene.input.on(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.layout();
  }

  /** Take the selected card (Enter or Nhận); does nothing until one is chosen, and only once. */
  confirm(): void {
    if (!canConfirmReward(this.selected, this.cards.length, this.submitted)) return;
    this.submitted = true;
    this.take.setEnabled(false);
    this.onPick(this.selected!);
  }

  /** The command was refused (the offer is still open): Nhận works again with the same pick. */
  retry(): void {
    this.submitted = false;
    this.take.setEnabled(canConfirmReward(this.selected, this.cards.length, this.submitted));
  }

  setDepth(depth: number): this {
    this.root.setDepth(depth);
    return this;
  }

  layout(): void {
    this.lay = this.compute();
    this.scroll = Math.max(0, Math.min(this.scroll, this.lay.scrollMax));
    this.lay = this.compute();
    this.apply(this.lay);
  }

  destroy(): void {
    const input = this.scene.input;
    input.off(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    for (const card of this.cards) card.destroy();
    this.root.destroy();
  }

  private compute(): RewardLayout {
    const { width, height } = this.scene.scale;
    return rewardLayout({ w: width, h: height }, INSET, this.cards.length, this.scroll);
  }

  private apply(l: RewardLayout): void {
    const desktop = this.scene.scale.width >= 768;
    fitOverlay(this.scene, this.overlay);
    this.fit(this.title, l.title.w, desktop ? 34 : 24);
    this.fit(this.subtitle, l.subtitle.w, desktop ? 20 : 15);
    this.title.setPosition(l.title.x + l.title.w / 2, l.title.y);
    this.subtitle.setPosition(l.subtitle.x + l.subtitle.w / 2, l.subtitle.y);
    const shown = visibleRewardCards(l);
    this.cards.forEach((card, i) => {
      const r = l.cards[i]!;
      card.resize({ w: r.w, h: r.h }); // resize() re-renders and re-shows the card: hide after it
      card.setPosition(r.x, r.y);
      card.setSelected(i === this.selected);
      card.container.setVisible(shown[i]!);
    });
    this.reroll.resize(l.reroll.w, l.reroll.h);
    this.reroll.container.setPosition(l.reroll.x + l.reroll.w / 2, l.reroll.y + l.reroll.h / 2);
    this.take.resize(l.take.w, l.take.h);
    this.take.container.setPosition(l.take.x + l.take.w / 2, l.take.y + l.take.h / 2);
  }

  /** The heading text at `size` px, made smaller until it fits `maxWidth`. */
  private fit(text: Phaser.GameObjects.Text, maxWidth: number, size: number): void {
    let s = size;
    text.setFontSize(s);
    while (text.width > maxWidth && s > 12) text.setFontSize(--s);
  }

  private select(index: number): void {
    if (this.submitted) return;
    this.selected = selectReward(this.selected, index, this.cards.length);
    this.cards.forEach((card, i) => card.setSelected(i === this.selected));
    this.take.setEnabled(canConfirmReward(this.selected, this.cards.length, this.submitted));
  }

  private inViewport(x: number, y: number): boolean {
    const v = this.lay.viewport;
    return x >= v.x && x <= v.x + v.w && y >= v.y && y <= v.y + v.h;
  }

  private setScroll(next: number): void {
    const clamped = Math.max(0, Math.min(next, this.lay.scrollMax));
    if (clamped === this.scroll) return;
    this.scroll = clamped;
    this.lay = this.compute();
    this.apply(this.lay);
  }

  private onWheel(pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number): void {
    if (this.lay.scrollMax > 0 && this.inViewport(pointer.x, pointer.y)) this.setScroll(this.scroll + dy * 0.5);
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.lay.scrollMax > 0 && this.inViewport(pointer.x, pointer.y)) {
      this.drag = { id: pointer.id, y: pointer.y, scroll: this.scroll };
    }
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (!this.drag || this.drag.id !== pointer.id || !pointer.isDown) return;
    this.setScroll(this.drag.scroll - (pointer.y - this.drag.y));
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (this.drag?.id === pointer.id) this.drag = null;
  }
}
