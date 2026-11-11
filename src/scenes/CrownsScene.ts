import Phaser from 'phaser';
import { bindSceneDisplay, displayMetrics, logicalSize, logicalPointer } from '../ui/displayRuntime';
import { toCss } from '../data/palette';
import type { CardId, KingId } from '../data/types';
import { UI_PALETTE } from '../data/uiPalette';
import { describeCard } from '../game/cards/describe';
import { CONTENT } from '../game/cards/registry';
import { defaultProfile, type MetaProfile } from '../game/meta';
import { addPixelTexture } from '../render/atlas';
import { hudTexture } from '../render/hudArtHd';
import { paintPortrait } from '../render/portraitArt';
import { portraitTextureKey } from '../render/portraitAssets';
import { CROWNS, clampScroll, crownsLayout, type CrownsLayout, type CrownsRow } from '../ui/crowns/crownsLayout';
import { crownsModel, type CrownsModel } from '../ui/crowns/crownsModel';
import { DRAG_SLOP, textContent, type Rect } from '../ui/hud/layout';
import { resolveShortcut, shortcutFlags } from '../ui/input/shortcuts';
import { kingTheme } from '../ui/kingSelect/kingTheme';
import { ToastStack } from '../ui/ToastStack';
import { Tooltip } from '../ui/Tooltip';
import { addUiText, createButton, createPanel, frameBorder, type Button, type UiBox } from '../ui/theme';
import { openHelp } from './helpLauncher';
import { SCENES } from './keys';
import { getSession } from './sessionRegistry';

/** Part of the approved 96×144 portrait shown in a row: the face, at scale 1. */
const FACE_CROP = { x: 20, y: 8, w: CROWNS.chip.w, h: CROWNS.chip.h };
const HEADER_DEPTH = 50;
const TOAST_DEPTH = 900;
/** Mouse wheel: px scrolled per wheel px. */
const WHEEL_SCALE = 0.6;

type Target = { kind: 'king'; id: KingId } | { kind: 'card'; id: CardId };

interface RowView {
  target: Target;
  box: UiBox;
  chipBg: Phaser.GameObjects.Graphics;
  chip: Phaser.GameObjects.Image;
  chipOffset: { x: number; y: number };
  name: Phaser.GameObjects.Text;
  status: Phaser.GameObjects.Text;
  mastery: Phaser.GameObjects.Text | null;
  bar: UiBox | null;
  barFill: Phaser.GameObjects.Graphics | null;
  button: Button;
}

/**
 * Vương Miện (§10.9): the Crown Point balance; the nine kings with their unlock price (or
 * "Đã mở"), an unlock button and a mastery bar marked at the perk levels 10 / 30 / 60; the two
 * meta cards for sale; the highest thorn level won. Desktop: one panel. Phones and short screens:
 * a column that scrolls (drag or wheel) under a pinned header with the 48×48 ✕. Esc or ✕ goes
 * back to the main menu. Unlocks go through the session (awaited, one at a time) and the screen
 * re-renders from the profile the session returns.
 */
export class CrownsScene extends Phaser.Scene {
  private profile: MetaProfile = defaultProfile();
  private model!: CrownsModel;
  private lay!: CrownsLayout;
  private scroll = 0;
  private drag: { id: number; y: number; scroll: number; moved: boolean } | null = null;
  private unlocking = false;
  private tooltip!: Tooltip;
  private toasts!: ToastStack;
  private panel!: UiBox;
  private header!: UiBox;
  private content!: Phaser.GameObjects.Container;
  private title!: Phaser.GameObjects.Text;
  private balance!: Phaser.GameObjects.Text;
  private close!: Button;
  private kingsTitle!: Phaser.GameObjects.Text;
  private cardsTitle!: Phaser.GameObjects.Text;
  private highest!: Phaser.GameObjects.Text;
  private rows: RowView[] = [];

  constructor() {
    super(SCENES.crowns);
  }

  create(): void {
    bindSceneDisplay(this, () => this.layout());
    // Scene instances are reused: reset every per-visit field first.
    this.profile = getSession(this)?.meta() ?? defaultProfile();
    this.model = crownsModel(CONTENT, this.profile);
    this.scroll = 0;
    this.drag = null;
    this.unlocking = false;
    this.rows = [];
    this.cameras.main.setBackgroundColor(toCss(UI_PALETTE.sky[3]));

    this.tooltip = new Tooltip(this);
    this.toasts = new ToastStack(this, TOAST_DEPTH);
    this.panel = createPanel(this, 'panel', 200, 200);
    this.content = this.add.container(0, 0);
    this.header = createPanel(this, 'panel', 200, 64);
    this.header.image.setDepth(HEADER_DEPTH).setInteractive(); // swallows taps on rows scrolled under it
    this.title = addUiText(this, 0, 0, 'VƯƠNG MIỆN', 24).setFontStyle('bold').setOrigin(0, 0.5).setDepth(HEADER_DEPTH + 1);
    this.balance = addUiText(this, 0, 0, '', 16).setOrigin(0, 0.5).setDepth(HEADER_DEPTH + 1);
    this.close = createButton(this, 0, 0, '✕', {
      width: CROWNS.close,
      height: CROWNS.close,
      fontSize: 20,
      onClick: () => this.leave(),
      tooltip: { host: this.tooltip, content: () => textContent(['Về menu (Esc)']) },
    });
    this.close.container.setDepth(HEADER_DEPTH + 1);

    this.kingsTitle = addUiText(this, 0, 0, 'Các vua', 18).setFontStyle('bold').setOrigin(0, 0.5);
    this.cardsTitle = addUiText(this, 0, 0, 'Thẻ trung lập', 18).setFontStyle('bold').setOrigin(0, 0.5);
    this.highest = addUiText(this, 0, 0, '', 16).setOrigin(0, 0.5);
    this.content.add([this.kingsTitle, this.cardsTitle, this.highest]);
    for (const k of this.model.kings) this.rows.push(this.createRow({ kind: 'king', id: k.id }));
    for (const c of this.model.cards) this.rows.push(this.createRow({ kind: 'card', id: c.id }));

    this.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKey, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.input.on(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this);

    this.refresh();
  }

  // ---- rows ----------------------------------------------------------------------------------

  private createRow(target: Target): RowView {
    const king = target.kind === 'king';
    const box = createPanel(this, 'slot', 100, 50);
    const chipBg = this.add.graphics();
    const { chip, chipOffset } = this.createChip(target);
    const name = addUiText(this, 0, 0, '', 16).setFontStyle('bold').setOrigin(0, 0.5);
    const status = addUiText(this, 0, 0, '', 14).setOrigin(0, 0.5);
    const mastery = king ? addUiText(this, 0, 0, '', 12).setOrigin(0, 0.5) : null;
    const bar = king ? createPanel(this, 'bar', 100, 10) : null;
    const barFill = king ? this.add.graphics() : null;
    const button = createButton(this, 0, 0, '', {
      width: 96,
      height: 44,
      fontSize: 14,
      onClick: () => void this.buy(target),
      skin: king ? target.id : 'neutral',
      tooltip: { host: this.tooltip, content: () => this.buttonTip(target) },
    });
    this.content.add([box.image, chipBg, chip, name, status, ...(mastery ? [mastery] : []), ...(bar ? [bar.image] : []), ...(barFill ? [barFill] : []), button.container]);
    return { target, box, chipBg, chip, chipOffset, name, status, mastery, bar, barFill, button };
  }

  /** A king's face (the approved portrait cropped, else the generated placeholder); a card's art frame. */
  private createChip(target: Target): { chip: Phaser.GameObjects.Image; chipOffset: { x: number; y: number } } {
    if (target.kind === 'card') {
      const chip = this.add.image(0, 0, '__DEFAULT').setOrigin(0, 0).setVisible(false);
      return { chip, chipOffset: { x: 0, y: 0 } };
    }
    const real = portraitTextureKey(target.id);
    if (this.textures.exists(real)) {
      // At display density >= 2 the HD twin when it loaded: crop in its px (×2), drawn at half the scale (same face).
      const tex = hudTexture(this.textures, real, displayMetrics(this).density);
      const f = tex.factor;
      const chip = this.add
        .image(0, 0, tex.key)
        .setOrigin(0, 0)
        .setCrop(FACE_CROP.x * f, FACE_CROP.y * f, FACE_CROP.w * f, FACE_CROP.h * f)
        .setScale(1 / f);
      return { chip, chipOffset: { x: -FACE_CROP.x, y: -FACE_CROP.y } };
    }
    const key = `portrait-${target.id}`;
    addPixelTexture(this.textures, key, paintPortrait(CONTENT.king(target.id)));
    const chip = this.add.image(0, 0, key).setOrigin(0, 0);
    return { chip, chipOffset: { x: Math.round((CROWNS.chip.w - chip.width) / 2), y: Math.round((CROWNS.chip.h - chip.height) / 2) } };
  }

  private buttonTip(target: Target) {
    if (target.kind === 'card') {
      const def = CONTENT.card(target.id);
      return textContent([def.nameVi, ...describeCard(def, 1).lines, `Dùng điểm Vương Miện (đang có ${this.profile.crownPoints}).`]);
    }
    return textContent(['Mở khoá vua', `Dùng điểm Vương Miện (đang có ${this.profile.crownPoints}).`]);
  }

  // ---- state ---------------------------------------------------------------------------------

  /** Texts and button states from the profile, then the layout. */
  private refresh(): void {
    this.model = crownsModel(CONTENT, this.profile);
    this.balance.setText(this.model.balanceLabel);
    this.highest.setText(this.model.highestLabel);
    for (const view of this.rows) {
      const row = view.target.kind === 'king'
        ? this.model.kings.find((k) => k.id === view.target.id)!
        : this.model.cards.find((c) => c.id === view.target.id)!;
      view.name.setText(row.nameVi);
      view.status.setText(row.status).setColor(toCss(row.unlocked ? UI_PALETTE.good : UI_PALETTE.text));
      view.button.setLabel(row.unlockLabel ?? '');
      view.button.setVisible(row.unlockLabel !== null);
      view.button.setEnabled(row.canUnlock && !this.unlocking);
      if (view.target.kind === 'king') {
        view.chip.setTint(row.unlocked ? 0xffffff : 0x8a8a8a);
        const k = this.model.kings.find((x) => x.id === view.target.id)!;
        view.mastery?.setText(k.masteryLabel);
      }
    }
    this.layout();
  }

  /** Buys a king or a meta card; one unlock at a time, the screen follows the saved profile. */
  private async buy(target: Target): Promise<void> {
    if (this.unlocking) return;
    const session = getSession(this);
    if (!session) {
      this.toasts.push('Không có hồ sơ để mở khoá.');
      return;
    }
    this.unlocking = true;
    this.refresh();
    const result = target.kind === 'king' ? await session.unlockKing(target.id) : await session.unlockCard(target.id);
    if (!this.sys.isActive()) return; // left the screen meanwhile
    this.unlocking = false;
    if (result.ok) {
      this.profile = result.profile;
      const name = target.kind === 'king' ? CONTENT.king(target.id).nameVi : CONTENT.card(target.id).nameVi;
      this.toasts.push(`Đã mở khoá ${name}!`);
    } else {
      this.toasts.push(result.message);
    }
    this.refresh();
  }

  private leave(): void {
    this.scene.start(SCENES.mainMenu);
  }

  // ---- layout --------------------------------------------------------------------------------

  private layout(): void {
    const screen = logicalSize(this);
    const inset = frameBorder(this, 'panel') + 16;
    const l = crownsLayout(screen, inset, this.model.kings.length, this.model.cards.length);
    this.lay = l;
    this.scroll = clampScroll(this.scroll, l.maxScroll);
    const panelMode = l.mode === 'panel';

    this.panel.image.setVisible(panelMode);
    this.panel.resize(l.panel.w, l.panel.h);
    this.panel.image.setPosition(l.panel.x, l.panel.y);
    this.header.image.setVisible(!panelMode);
    if (panelMode) this.header.image.disableInteractive();
    else this.header.image.setInteractive();
    this.header.resize(l.header.w, l.header.h);
    this.header.image.setPosition(l.header.x, l.header.y);
    this.title.setFontSize(panelMode ? 26 : 22).setPosition(l.title.x, l.title.y + l.title.h / 2);
    this.balance.setPosition(l.balance.x, l.balance.y + l.balance.h / 2);
    this.close.container.setPosition(l.close.x + l.close.w / 2, l.close.y + l.close.h / 2);

    // On the dark background (scroll mode) the loose texts are light; on the panel's cream they are dark.
    const loose = panelMode ? UI_PALETTE.text : UI_PALETTE.creamLight;
    const shadow = panelMode ? UI_PALETTE.textShadow : UI_PALETTE.outline;
    for (const t of [this.kingsTitle, this.cardsTitle, this.highest]) {
      t.setColor(toCss(loose)).setShadow(1, 1, toCss(shadow), 0, false, true);
    }
    this.kingsTitle.setPosition(l.kingsTitle.x, l.kingsTitle.y + l.kingsTitle.h / 2);
    this.cardsTitle.setPosition(l.cardsTitle.x, l.cardsTitle.y + l.cardsTitle.h / 2);
    this.highest.setWordWrapWidth(l.highest.w).setPosition(l.highest.x, l.highest.y + l.highest.h / 2);

    const parts = [...l.kings, ...l.cards];
    this.rows.forEach((view, i) => this.placeRow(view, parts[i]!));
    this.content.setY(-this.scroll);
    this.toasts.setAnchor(screen.w / 2, l.header.y + l.header.h + 8, screen.w - 32);
    this.tooltip.refresh();
  }

  private placeRow(view: RowView, r: CrownsRow): void {
    view.box.resize(r.row.w, r.row.h);
    view.box.image.setPosition(r.row.x, r.row.y);
    const king = view.target.kind === 'king' ? view.target.id : null;
    view.chipBg.clear();
    if (king) {
      const theme = kingTheme(king);
      view.chipBg.fillStyle(theme.bgMid, 1).fillRect(r.chip.x, r.chip.y, r.chip.w, r.chip.h);
    } else {
      view.chipBg.fillStyle(UI_PALETTE.woodDark, 1).fillRect(r.chip.x, r.chip.y, r.chip.w, r.chip.h);
      view.chipBg.fillStyle(UI_PALETTE.creamLight, 1).fillRect(r.chip.x + 14, r.chip.y + 6, r.chip.w - 28, r.chip.h - 12);
    }
    view.chip.setPosition(r.chip.x + view.chipOffset.x, r.chip.y + view.chipOffset.y);
    this.placeText(view.name, r.name);
    this.placeText(view.status, r.status);
    if (view.mastery && r.mastery) this.placeText(view.mastery, r.mastery);
    view.button.resize(r.button.w, r.button.h);
    view.button.container.setPosition(r.button.x + r.button.w / 2, r.button.y + r.button.h / 2);
    if (view.bar && view.barFill && r.bar && king) this.drawBar(view.bar, view.barFill, r.bar, king);
  }

  /** Left-aligned, vertically centred; the font shrinks (never below 11 px) until the text fits its rect. */
  private placeText(t: Phaser.GameObjects.Text, r: Rect): void {
    const base = (t.getData('baseSize') as number | undefined) ?? Number.parseFloat(String(t.style.fontSize));
    t.setData('baseSize', base);
    let size = base;
    t.setFontSize(size);
    while (t.width > r.w && size > 11) t.setFontSize(--size);
    t.setPosition(r.x, Math.round(r.y + r.h / 2));
  }

  private drawBar(bar: UiBox, fill: Phaser.GameObjects.Graphics, r: Rect, king: KingId): void {
    const row = this.model.kings.find((k) => k.id === king)!;
    bar.resize(r.w, r.h);
    bar.image.setPosition(r.x, r.y);
    const b = frameBorder(this, 'bar');
    const innerW = r.w - 2 * b;
    fill.clear();
    if (row.masteryFraction > 0) {
      fill.fillStyle(kingTheme(king).accent, 1);
      fill.fillRect(r.x + b, r.y + b, Math.max(1, Math.round(innerW * row.masteryFraction)), r.h - 2 * b);
    }
    for (const mark of row.marks) {
      const x = Math.min(r.x + r.w - b - 2, Math.round(r.x + b + innerW * mark.at - 1));
      fill.fillStyle(mark.reached ? UI_PALETTE.gold : UI_PALETTE.outline, 1).fillRect(x, r.y - 2, 2, r.h + 4);
    }
  }

  // ---- input ---------------------------------------------------------------------------------

  private setScroll(value: number): void {
    const next = clampScroll(value, this.lay.maxScroll);
    if (next === this.scroll) return;
    this.scroll = next;
    this.content.setY(-this.scroll);
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.lay.maxScroll <= 0) return;
    const point = logicalPointer(this, pointer);
    if (point.y < this.lay.header.y + this.lay.header.h) return;
    this.drag = { id: pointer.id, y: point.y, scroll: this.scroll, moved: false };
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    const d = this.drag;
    if (!d || d.id !== pointer.id || !pointer.isDown) return;
    const point = logicalPointer(this, pointer);
    const dy = point.y - d.y;
    if (!d.moved && Math.abs(dy) <= DRAG_SLOP) return;
    d.moved = true;
    this.setScroll(d.scroll - dy);
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (this.drag?.id === pointer.id) this.drag = null;
  }

  private onWheel(_p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number): void {
    this.setScroll(this.scroll + dy * WHEEL_SCALE);
  }

  private onKey(event: KeyboardEvent): void {
    const action = resolveShortcut(event.key, 'crowns', shortcutFlags(event));
    if (action === 'help.toggle') {
      event.preventDefault();
      openHelp(this, null, null);
    } else if (action === 'back') {
      this.leave();
    }
  }

  private teardown(): void {
    this.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKey, this);
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    this.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.input.off(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    this.rows = [];
    this.drag = null;
    this.toasts.destroy();
    this.tooltip.destroy();
  }
}
