import type Phaser from 'phaser';
import type { CardDef, CardId, KingId } from '../../data/types';
import { UI_PALETTE } from '../../data/uiPalette';
import { describeCard } from '../../game/cards/describe';
import type { Content } from '../../game/cards/registry';
import { SPRITES_KEY, iconFrame } from '../../render/atlas';
import type { IconId } from '../../render/iconArt';
import type { UiFrame } from '../../render/uiArt';
import { CARD_LIFT, DRAG_SLOP, type Rect, type Size, type TooltipContent } from '../hud/layout';
import { skinFrame, type UiSkin } from '../skin';
import { VERTICAL_CARD_ART, pickCardImage, resolveCardImage } from './cardImage';
import { cardLayout, fitArt, type CardDensity } from './cardLayout';
import { clampLines, nextLevelLine } from './cardText';
import {
  addUiText,
  bindPress,
  createPanel,
  frameBorder,
  type PressHandle,
  type TooltipHost,
  type UiBox,
} from '../theme';

/** Opacity of a card that cannot be played right now. */
const DIMMED_ALPHA = 0.55;
/** Space between the frame border and the card's contents. */
const PAD = 2;
/** Width from which a card uses the `full` density when the caller does not pick one. */
const FULL_FROM_WIDTH = 100;

/** Icon of each card kind until G2c adds dedicated art for the new kinds. */
const KIND_ICON: Record<CardDef['kind'], IconId> = {
  throne: 'throne',
  troop: 'troop',
  tower: 'tower',
  economy: 'gold',
  support: 'tower',
  enchantment: 'enchant',
  tome: 'tome',
};
/** A dragged card floats above the rest of the HUD. */
const DRAG_DEPTH = 500;
const DRAG_ALPHA = 0.85;

const RARITY_FRAME: Record<CardDef['rarity'], UiFrame> = {
  common: 'card',
  uncommon: 'cardUncommon',
  rare: 'cardRare',
};

/**
 * One vertical card face (§10.4, geometry in `cardLayout`): rarity frame (`cardSelected` while
 * selected), header with the kind icon and the name, the picture at an integer scale (from
 * `resolveCardImage`), an optional "Lên cấp" badge line, and the first description line(s).
 * `compact` cards show one description line, `full` as many as fit. Hover / 400 ms long-press shows the full text in the shared
 * Tooltip; clicks go through bindPress (same drag-slop rules as buttons). Pure display: it
 * never touches game state. Selecting lifts the card CARD_LIFT (12) px above its set position.
 */
export class CardView {
  readonly container: Phaser.GameObjects.Container;
  private readonly box: UiBox;
  private readonly parts: Phaser.GameObjects.GameObject[] = [];
  private def: CardDef | null = null;
  private badge: string | null = null;
  private selected = false;
  private dimmed = false;
  private skin: UiSkin = 'neutral';
  private handler: (() => void) | null = null;
  private readonly press: PressHandle;
  private base = { x: 0, y: 0 };
  private dropHandler: ((x: number, y: number) => void) | null = null;
  private dragFrom: { id: number } | null = null;
  private dragging = false;
  private clip: Rect | null = null;
  private clipGraphics: Phaser.GameObjects.Graphics | null = null;
  private readonly clipMasks = new WeakMap<Phaser.GameObjects.GameObject, Phaser.Filters.Mask>();
  private scrolling = false;
  private scrollLastX = 0;
  private scrollHandler: ((delta: number) => void) | null = null;
  private readonly onResize = (): void => { this.render(); this.applyClip(); };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly content: Content,
    private size: Size,
    tooltip?: TooltipHost,
    private readonly density?: CardDensity,
  ) {
    this.box = createPanel(scene, 'card', size.w, size.h);
    this.container = scene.add.container(0, 0, [this.box.image]).setSize(size.w, size.h);
    this.press = bindPress(scene, this.box.image, {
      onClick: () => this.handler?.(),
      tooltip: tooltip ? { host: tooltip, content: () => this.tooltipContent() } : undefined,
    });
    this.box.image.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.dropHandler) this.dragFrom = { id: pointer.id };
      this.scrolling = false;
      this.scrollLastX = pointer.x;
    });
    scene.input.on('pointermove', this.onDragMove);
    scene.input.on('pointerup', this.onDragEnd);
    // Borders switch between 1× and 2× when the viewport crosses 600 px.
    scene.scale.on('resize', this.onResize);
    this.container.once('destroy', () => {
      this.clipGraphics?.destroy();
      scene.scale.off('resize', this.onResize);
      scene.input.off('pointermove', this.onDragMove);
      scene.input.off('pointerup', this.onDragEnd);
    });
    this.render();
    this.applyClip();
  }

  /** `badge`: a short green line under the picture ("Lên cấp 2"), or null. */
  setCard(cardId: CardId | null, opts: { badge?: string | null } = {}): void {
    this.def = cardId === null ? null : this.content.card(cardId);
    this.badge = opts.badge ?? null;
    this.press.cancel();
    this.render();
    this.applyClip();
  }

  /** Paint the frame in a king's colours (`null`: the neutral wood frame). */
  setTheme(king: KingId | null): void {
    this.skin = king ?? 'neutral';
    this.box.setSkin(this.skin);
    this.render();
    this.applyClip();
  }

  setSelected(selected: boolean): void {
    if (selected === this.selected) return;
    this.selected = selected;
    this.render();
    this.applyClip();
    this.place();
  }

  setDimmed(dimmed: boolean): void {
    this.dimmed = dimmed;
    this.container.setAlpha(dimmed ? DIMMED_ALPHA : 1);
  }

  setPosition(x: number, y: number): void {
    this.base = { x: Math.round(x), y: Math.round(y) };
    this.place();
  }

  /** New logical size (the hand switches 120×176 ↔ 108×162 between layouts). */
  resize(size: Size): void {
    this.size = size;
    this.render();
    this.applyClip();
  }

  onClick(handler: () => void): void {
    this.handler = handler;
  }

  /** Drag the card by more than DRAG_SLOP and release: `handler` gets the release point (screen px). */
  onDrop(handler: (x: number, y: number) => void): void {
    this.dropHandler = handler;
  }

  destroy(): void {
    this.press.cancel();
    this.container.destroy();
  }

  setWindow(viewport: Rect | null): void {
    this.clip = viewport;
    this.applyClip();
  }

  private applyClip(): void {
    const viewport = this.clip;
    const clipping = viewport !== null && !(this.dragging && !this.scrolling);
    const left = clipping ? Math.max(0, viewport.x - this.base.x) : 0;
    const right = clipping ? Math.min(this.size.w, viewport.x + viewport.w - this.base.x) : this.size.w;
    this.container.setVisible(this.def !== null && right > left);
    if (this.box.image.input) {
      const hit = this.box.image.input.hitArea as Phaser.Geom.Rectangle;
      hit.setTo(left, 0, Math.max(0, right - left), this.size.h);
    }
    const partial = clipping && (left > 0 || right < this.size.w);
    if (partial && !this.clipGraphics) {
      this.clipGraphics = this.scene.add.graphics().removeFromDisplayList();
    }
    if (partial && viewport) {
      this.clipGraphics!.clear().fillStyle(0xffffff).fillRect(viewport.x, viewport.y - CARD_LIFT, viewport.w, viewport.h + CARD_LIFT);
    }
    for (const child of [this.box.image, ...this.parts]) {
      let mask = this.clipMasks.get(child);
      if (partial && !mask) {
        const filters = (child as Phaser.GameObjects.Image | Phaser.GameObjects.Text).filters;
        mask = filters?.external.addMask(this.clipGraphics!, false, this.scene.cameras.main);
        if (mask) this.clipMasks.set(child, mask);
      }
      mask?.setActive(partial);
    }
  }

  onScroll(handler: ((delta: number) => void) | null): void {
    this.scrollHandler = handler;
  }

  private readonly onDragMove = (pointer: Phaser.Input.Pointer): void => {
    const from = this.dragFrom;
    if (!from || from.id !== pointer.id || !pointer.isDown) return;
    if (!this.dragging) {
      if (pointer.getDistance() <= DRAG_SLOP) return;
      this.scrolling = this.scrollHandler !== null && Math.abs(pointer.x - pointer.downX) > Math.abs(pointer.y - pointer.downY);
      this.dragging = true;
      this.press.cancel();
      if (!this.scrolling) {
        this.applyClip();
        this.container.setDepth(DRAG_DEPTH).setAlpha(DRAG_ALPHA);
      }
    }
    if (this.scrolling) {
      this.scrollHandler?.(this.scrollLastX - pointer.x);
      this.scrollLastX = pointer.x;
      return;
    }
    this.container.setPosition(Math.round(pointer.x - this.size.w / 2), Math.round(pointer.y - this.size.h / 2));
  };

  private readonly onDragEnd = (pointer: Phaser.Input.Pointer): void => {
    const from = this.dragFrom;
    if (!from || from.id !== pointer.id) return;
    this.dragFrom = null;
    if (!this.dragging) return;
    this.dragging = false;
    this.container.setDepth(0).setAlpha(this.dimmed ? DIMMED_ALPHA : 1);
    this.place();
    this.applyClip();
    if (!this.scrolling) this.dropHandler?.(pointer.x, pointer.y);
    this.scrolling = false;
  };

  private place(): void {
    this.container.setPosition(this.base.x, this.base.y - (this.selected ? CARD_LIFT : 0));
  }

  private tooltipContent(): TooltipContent | null {
    if (!this.def) return null;
    const { title, lines } = describeCard(this.def);
    const next = nextLevelLine(this.def, 1);
    const all = next === null ? lines : [...lines, next];
    return { title, lines: all.map((text) => [{ text }]) };
  }

  private render(): void {
    for (const part of this.parts) part.destroy();
    this.parts.length = 0;
    const { w, h } = this.size;
    this.container.setSize(w, h);
    const def = this.def;
    this.container.setVisible(def !== null);
    if (!def) {
      this.box.image.disableInteractive();
      return;
    }
    this.box.image.setInteractive();
    const frame = this.selected ? 'cardSelected' : RARITY_FRAME[def.rarity];
    this.box.setFrame(frame);
    this.box.resize(w, h);
    this.container.setAlpha(this.dimmed ? DIMMED_ALPHA : 1);

    const inset = frameBorder(this.scene, skinFrame(frame, this.skin)) + PAD;
    const density = this.density ?? (w >= FULL_FROM_WIDTH ? 'full' : 'compact');
    const full = density === 'full';
    const l = cardLayout(this.size, inset, density);

    this.addAtlasImage(iconFrame(KIND_ICON[def.kind]), l.icon.x, l.icon.y)?.setOrigin(0, 0);

    const name = addUiText(this.scene, l.name.x + l.name.w / 2, l.header.y + l.header.h / 2, '', full ? 12 : w < 80 ? 9 : 10)
      .setOrigin(0.5)
      .setAlign('center')
      .setFontStyle('bold');
    const measureName = (s: string): number => name.setText(s).width;
    name.setText(clampLines(def.nameVi, l.name.w, 2, measureName).join('\n'));
    this.add(name);

    const ref = pickCardImage(l.art, resolveCardImage(def.id, VERTICAL_CARD_ART));
    const fit = fitArt(l.art, ref);
    if (this.scene.textures.exists(ref.key) && this.scene.textures.get(ref.key).has(ref.frame)) {
      this.add(this.scene.add.image(fit.x, fit.y, ref.key, ref.frame).setOrigin(0, 0).setScale(fit.scale));
    }

    if (this.badge) {
      const badge = addUiText(this.scene, l.badge.x + l.badge.w / 2, l.badge.y + l.badge.h / 2, this.badge, full ? 12 : 10, UI_PALETTE.good)
        .setOrigin(0.5)
        .setFontStyle('bold');
      this.add(badge);
    }

    const lines = full ? Math.max(2, Math.floor(l.description.h / 13)) : 1;
    const text = addUiText(this.scene, l.description.x + l.description.w / 2, l.description.y, '', full ? 11 : 10).setOrigin(0.5, 0);
    const measure = (s: string): number => text.setText(s).width;
    text.setAlign('center').setText(clampLines(describeCard(def).lines[0] ?? '', l.description.w, lines, measure).join('\n'));
    this.add(text);
  }

  /** Image from the sprites atlas, or null (nothing drawn) if the frame is missing. */
  private addAtlasImage(frame: string, x: number, y: number): Phaser.GameObjects.Image | null {
    const textures = this.scene.textures;
    if (!textures.exists(SPRITES_KEY) || !textures.get(SPRITES_KEY).has(frame)) return null;
    const image = this.scene.add.image(x, y, SPRITES_KEY, frame);
    this.add(image);
    return image;
  }

  private add(part: Phaser.GameObjects.GameObject): void {
    this.parts.push(part);
    this.container.add(part);
  }
}
