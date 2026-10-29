import type Phaser from 'phaser';
import type { KingId } from '../../data/types';
import { describeCard } from '../../game/cards/describe';
import type { Content } from '../../game/cards/registry';
import { addPixelTexture } from '../../render/atlas';
import { KING_CARD_NATIVE, KING_CARD_WINDOW, paintKingCard } from '../../render/kingCardArt';
import { paintPortrait, PORTRAIT_SIZE } from '../../render/portraitArt';
import { PORTRAIT_ASSETS, portraitPlacement, portraitTextureKey } from '../../render/portraitAssets';
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
  private portraitArt = { w: PORTRAIT_SIZE, h: PORTRAIT_SIZE };
  private choice: KingChoice | null = null;
  private rect: Rect = { x: 0, y: 0, w: KING_CARD_NATIVE.w, h: KING_CARD_NATIVE.h };
  private handler: (() => void) | null = null;
  private readonly owner = 'king-portrait';
  private exact = false;
  private brightness = 0xffffff;
  private depth = 0;
  private shown = true;

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
    this.card.setTexture(cardKey(choice.id, locked)).setVisible(this.shown);
    this.portrait?.destroy();
    this.portrait = null;
    if (!locked) {
      // The approved 96×144 picture when it loaded, else the generated placeholder.
      const real = this.scene.textures.exists(portraitTextureKey(choice.id));
      if (!real) addPixelTexture(this.scene.textures, portraitKey(choice.id), paintPortrait(this.content.king(choice.id)));
      this.portraitArt = real ? { w: PORTRAIT_ASSETS[choice.id].width, h: PORTRAIT_ASSETS[choice.id].height } : { w: PORTRAIT_SIZE, h: PORTRAIT_SIZE };
      this.portrait = this.scene.add.image(0, 0, real ? portraitTextureKey(choice.id) : portraitKey(choice.id)).setOrigin(0, 0).setTint(this.brightness).setDepth(this.depth + 0.5).setVisible(this.shown);
    }
    this.place();
  }

  /**
   * Place the card in `rect`. By default `rect.w` is `66 × scale` and the card is drawn at that
   * integer scale; with `exact` the scale is `rect.w / 66` (carousel cards of any size).
   */
  layout(rect: Rect, exact = false): void {
    this.rect = rect;
    this.exact = exact;
    this.place();
  }

  /** 1 = full colour; lower dims the card and its portrait. */
  setBrightness(brightness: number): void {
    const v = Math.round(255 * brightness);
    const tint = (v << 16) | (v << 8) | v;
    this.card.setTint(tint);
    this.portrait?.setTint(tint);
    this.brightness = tint;
  }

  setDepth(depth: number): void {
    this.card.setDepth(depth);
    this.portrait?.setDepth(depth + 0.5);
    this.depth = depth;
  }

  setVisible(visible: boolean): void {
    this.shown = visible;
    this.card.setVisible(visible && this.choice !== null);
    this.portrait?.setVisible(visible);
    if (!visible) this.tooltip.hide(this.owner);
  }

  /** A short side-to-side shake: "this one cannot be chosen". */
  shake(): void {
    const x = this.card.x;
    this.scene.tweens.add({
      targets: this.card,
      x: x + 6,
      duration: 45,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.card.setX(x),
    });
  }

  destroy(): void {
    this.tooltip.hide(this.owner);
    this.portrait?.destroy();
    this.card.destroy();
  }

  private place(): void {
    const scale = this.exact ? this.rect.w / KING_CARD_NATIVE.w : Math.max(1, Math.floor(this.rect.w / KING_CARD_NATIVE.w));
    this.card.setPosition(this.rect.x, this.rect.y).setScale(scale);
    if (!this.portrait) return;
    const at = portraitPlacement(KING_CARD_WINDOW, scale, this.portraitArt);
    this.portrait.setPosition(this.rect.x + at.x, this.rect.y + at.y).setScale(at.scale);
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
