import { displayMetrics, logicalPointerDistance } from '../displayRuntime';
import type Phaser from 'phaser';
import type { KingId } from '../../data/types';
import { describeCard } from '../../game/cards/describe';
import type { Content } from '../../game/cards/registry';
import { addPixelTexture, iconFrame, imageFile, SPRITES_KEY, textureArt } from '../../render/atlas';
import { hudTexture } from '../../render/hudArtHd';
import { imageArtKey, kingCardFile } from '../../render/imageArt';
import { KING_CARD_NATIVE, KING_CARD_WINDOW, kingCardDensity, lockedShade, paintKingCard } from '../../render/kingCardArt';
import { paintPortrait, PORTRAIT_SIZE } from '../../render/portraitArt';
import { PORTRAIT_ASSETS, pickPortraitCopy, portraitLargeTextureKey, portraitPlacement, portraitTextureKey } from '../../render/portraitAssets';
import type { Rect, TooltipContent } from '../hud/layout';
import type { TooltipHost } from '../theme';
import type { KingChoice } from './carouselModel';
import { lockedCardLayout } from './lockedCardLayout';

const cardKey = (id: KingId, locked: boolean, factor: number): string => `king-card-${id}${locked ? '-locked' : ''}${factor === 2 ? '-hd' : ''}`;
const portraitKey = (id: KingId): string => `portrait-${id}`;
const lockedKey = (key: string): string => `${key}-locked`;
/** A tap, not a drag: the pointer moved at most this many px. */
const TAP_PX = 8;

/**
 * The tall king card (see `paintKingCard`) with the king's portrait in its window; hover or
 * long-press shows the blurb, the throne and the banner he carries as an enemy. A locked king
 * keeps his card and portrait (owner 2026-11-10) as dark-grey copies (`lockedShade`, precomputed
 * once per texture) with the `icon_lock` padlock centred on the window. Pure display: `layout(rect)` places it (the rect's
 * width is the art width times an integer scale); the click callback decides what it means.
 */
export class KingPortraitView {
  private readonly card: Phaser.GameObjects.Image;
  private portrait: Phaser.GameObjects.Image | null = null;
  private lock: Phaser.GameObjects.Image | null = null;
  private portraitArt = { w: PORTRAIT_SIZE, h: PORTRAIT_SIZE };
  /** Art px per card px of the card texture: 2 for the HD card (drawn at half the scale), else 1. */
  private cardFactor: 1 | 2 = 1;
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
      if (logicalPointerDistance(scene, p) <= TAP_PX) this.handler?.();
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
    // The approved card picture when it loaded (2026-11-09), else the painted card; glyphs and window drawn on top either way.
    // At display density >= 2 its HD twin when that loaded: a 132×192 card drawn at half the scale (same logical size).
    const hd = hudTexture(this.scene.textures, imageArtKey(kingCardFile(choice.id)), displayMetrics(this.scene).density);
    const picture = hd.factor === 2 ? textureArt(this.scene.textures, hd.key) : imageFile(this.scene.textures, kingCardFile(choice.id));
    this.cardFactor = kingCardDensity(picture);
    const key = cardKey(choice.id, locked, this.cardFactor);
    addPixelTexture(this.scene.textures, key, paintKingCard(choice.id, locked, picture));
    this.card.setTexture(key).setVisible(this.shown);
    this.portrait?.destroy();
    this.lock?.destroy();
    this.lock = null;
    // The approved 96×144 picture when it loaded, else the generated placeholder; a locked king gets its grey copy.
    const real = this.scene.textures.exists(portraitTextureKey(choice.id));
    if (!real) addPixelTexture(this.scene.textures, portraitKey(choice.id), paintPortrait(this.content.king(choice.id)));
    this.portraitArt = real ? { w: PORTRAIT_ASSETS[choice.id].width, h: PORTRAIT_ASSETS[choice.id].height } : { w: PORTRAIT_SIZE, h: PORTRAIT_SIZE };
    const portraitTex = this.shaded(real ? portraitTextureKey(choice.id) : portraitKey(choice.id), locked);
    this.portrait = this.scene.add.image(0, 0, portraitTex).setOrigin(0, 0).setTint(this.brightness).setDepth(this.depth + 0.5).setVisible(this.shown);
    const atlas = this.scene.textures.exists(SPRITES_KEY) ? this.scene.textures.get(SPRITES_KEY) : null;
    if (locked && atlas?.has(iconFrame('lock'))) {
      this.lock = this.scene.add.image(0, 0, SPRITES_KEY, iconFrame('lock')).setOrigin(0, 0).setTint(this.brightness).setDepth(this.depth + 0.6).setVisible(this.shown);
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
    this.lock?.setTint(tint);
    this.brightness = tint;
  }

  setDepth(depth: number): void {
    this.card.setDepth(depth);
    this.portrait?.setDepth(depth + 0.5);
    this.lock?.setDepth(depth + 0.6);
    this.depth = depth;
  }

  setVisible(visible: boolean): void {
    this.shown = visible;
    this.card.setVisible(visible && this.choice !== null);
    this.portrait?.setVisible(visible);
    this.lock?.setVisible(visible);
    if (!visible) this.tooltip.hide(this.owner);
  }

  /** A short side-to-side shake: "this one cannot be chosen". */
  shake(): void {
    const parts = [this.card, this.portrait, this.lock].filter((p): p is Phaser.GameObjects.Image => p !== null);
    this.scene.tweens.add({
      targets: parts,
      x: '+=6',
      duration: 45,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.place(),
    });
  }

  destroy(): void {
    this.tooltip.hide(this.owner);
    this.portrait?.destroy();
    this.lock?.destroy();
    this.card.destroy();
  }

  private place(): void {
    const scale = this.exact ? this.rect.w / KING_CARD_NATIVE.w : Math.max(1, Math.floor(this.rect.w / KING_CARD_NATIVE.w));
    this.card.setPosition(this.rect.x, this.rect.y).setScale(scale / this.cardFactor);
    if (this.lock) {
      const at = lockedCardLayout({ x: this.rect.x, y: this.rect.y, w: KING_CARD_NATIVE.w * scale, h: KING_CARD_NATIVE.h * scale }).lock;
      this.lock.setPosition(at.x, at.y).setScale(at.scale);
    }
    if (!this.portrait) return;
    this.pickPortraitTexture(scale);
    const at = portraitPlacement(KING_CARD_WINDOW, scale, this.portraitArt);
    this.portrait.setPosition(this.rect.x + at.x, this.rect.y + at.y).setScale(at.scale);
  }

  /**
   * The approved portrait in the copy that is sharp at this card scale (only while it is at rest on a whole scale); at
   * display density >= 2 that copy's HD twin when it loaded (twice the pixels, so `portraitPlacement` halves its scale).
   */
  private pickPortraitTexture(scale: number): void {
    const c = this.choice;
    if (!this.portrait || !c || !this.scene.textures.exists(portraitTextureKey(c.id))) return;
    const large = pickPortraitCopy(scale) === 'large' && this.scene.textures.exists(portraitLargeTextureKey(c.id));
    const asset = PORTRAIT_ASSETS[c.id];
    const tex = hudTexture(this.scene.textures, large ? portraitLargeTextureKey(c.id) : portraitTextureKey(c.id), displayMetrics(this.scene).density);
    const key = this.shaded(tex.key, !c.playable);
    if (this.portrait.texture.key !== key) this.portrait.setTexture(key);
    const art = large ? { w: asset.large.width, h: asset.large.height } : { w: asset.width, h: asset.height };
    this.portraitArt = { w: art.w * tex.factor, h: art.h * tex.factor };
  }

  /** `key`, or for a locked king its dark-grey copy (made once from the texture's pixels; `key` itself if that fails). */
  private shaded(key: string, locked: boolean): string {
    if (!locked) return key;
    const grey = lockedKey(key);
    if (!this.scene.textures.exists(grey)) {
      const art = textureArt(this.scene.textures, key);
      if (art) addPixelTexture(this.scene.textures, grey, lockedShade(art));
    }
    return this.scene.textures.exists(grey) ? grey : key;
  }

  private tooltipContent(): TooltipContent | null {
    const c = this.choice;
    if (!c) return null;
    if (!c.playable) return { title: c.nameVi, lines: [[{ text: c.lockText ?? c.note ?? '' }]] };
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
