import type Phaser from 'phaser';
import type { KingId } from '../../data/types';
import { describeCard } from '../../game/cards/describe';
import type { Content } from '../../game/cards/registry';
import { addPixelTexture } from '../../render/atlas';
import { KING_CARD_NATIVE, KING_CARD_WINDOW, paintKingCard } from '../../render/kingCardArt';
import { paintPortrait, PORTRAIT_SIZE } from '../../render/portraitArt';
import type { Rect, TooltipContent } from '../hud/layout';
import type { TooltipHost } from '../theme';
import type { KingChoice } from './carouselModel';

const cardKey = (id: KingId, locked: boolean): string => `king-card-${id}${locked ? '-locked' : ''}`;
const portraitKey = (id: KingId): string => `portrait-${id}`;
/** A tap, not a drag: the pointer moved at most this many px. */
const TAP_PX = 8;

/**
 * The tall king card (see `paintKingCard`) with the king's portrait in its window; hover or
 * long-press shows the blurb, the throne and the banner he carries as an enemy. A locked king
 * is grey with a "?" and shows no portrait. Pure display: `layout(rect)` places it (the rect's
 * width is the art width times an integer scale); the click callback decides what it means.
 */
export class KingPortraitView {
  private readonly card: Phaser.GameObjects.Image;
  private portrait: Phaser.GameObjects.Image | null = null;
  private choice: KingChoice | null = null;
  private rect: Rect = { x: 0, y: 0, w: KING_CARD_NATIVE.w, h: KING_CARD_NATIVE.h };
  private handler: (() => void) | null = null;
  private readonly owner = 'king-portrait';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly content: Content,
    private readonly tooltip: TooltipHost,
  ) {
    this.card = scene.add.image(0, 0, '__DEFAULT').setOrigin(0, 0).setVisible(false);
    this.card.setInteractive({ useHandCursor: true });
    this.card.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.getDistance() <= TAP_PX) this.handler?.();
    });
    this.card.on('pointerover', () => {
      const content = this.tooltipContent();
      if (content) this.tooltip.showAtPointer(content, this.owner);
    });
    this.card.on('pointerout', () => this.tooltip.hide(this.owner));
  }

  onClick(handler: () => void): void {
    this.handler = handler;
  }

  get container(): Phaser.GameObjects.Image {
    return this.card;
  }

  setKing(choice: KingChoice): void {
    this.choice = choice;
    const locked = !choice.playable;
    addPixelTexture(this.scene.textures, cardKey(choice.id, locked), paintKingCard(choice.id, locked));
    this.card.setTexture(cardKey(choice.id, locked)).setVisible(true);
    this.portrait?.destroy();
    this.portrait = null;
    if (!locked) {
      addPixelTexture(this.scene.textures, portraitKey(choice.id), paintPortrait(this.content.king(choice.id)));
      this.portrait = this.scene.add.image(0, 0, portraitKey(choice.id)).setOrigin(0, 0);
    }
    this.place();
  }

  /** `rect.w` is `66 × scale` (scale ≥ 1); the card is drawn at that integer scale. */
  layout(rect: Rect): void {
    this.rect = rect;
    this.place();
  }

  destroy(): void {
    this.tooltip.hide(this.owner);
    this.portrait?.destroy();
    this.card.destroy();
  }

  private place(): void {
    const scale = Math.max(1, Math.floor(this.rect.w / KING_CARD_NATIVE.w));
    this.card.setPosition(this.rect.x, this.rect.y).setScale(scale);
    if (!this.portrait) return;
    // The placeholder portrait is 48×48 px, as wide as the window: centred top to bottom.
    const win = KING_CARD_WINDOW;
    this.portrait
      .setPosition(this.rect.x + win.x * scale, this.rect.y + (win.y + Math.floor((win.h - PORTRAIT_SIZE) / 2)) * scale)
      .setScale(scale);
  }

  private tooltipContent(): TooltipContent | null {
    const c = this.choice;
    if (!c) return null;
    if (!c.playable) return { title: `${c.title.prefix}${c.title.title}`, lines: [[{ text: c.note ?? '' }]] };
    const king = this.content.king(c.id);
    const throne = describeCard(king.throne);
    return {
      title: c.nameVi,
      lines: [
        [{ text: king.blurbVi }],
        [{ text: `${throne.title}: ${throne.lines[0] ?? ''}` }],
        [{ text: `Khi làm địch — cờ hiệu ${king.banner.nameVi}: ${king.banner.textVi}` }],
      ],
    };
  }
}
