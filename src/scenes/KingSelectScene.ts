import Phaser from 'phaser';
import { toCss } from '../data/palette';
import type { KingId } from '../data/types';
import type { KingTheme } from '../data/uiPalette';
import { CONTENT } from '../game/cards/registry';
import { buildSpritesTexture } from '../render/atlas';
import { CardView } from '../ui/cards/CardView';
import { textContent } from '../ui/hud/layout';
import { carouselScreen, carouselSlots } from '../ui/kingSelect/carouselLayout';
import { kingChoices, nextIndex, swipeTarget, type KingChoice } from '../ui/kingSelect/carouselModel';
import { DIFFICULTY_OPTIONS } from '../ui/kingSelect/difficulty';
import { detailLayout } from '../ui/kingSelect/detailLayout';
import { KingPortraitView } from '../ui/kingSelect/KingPortraitView';
import { kingTheme, lockedTheme } from '../ui/kingSelect/kingTheme';
import type { UiSkin } from '../ui/skin';
import { Tooltip } from '../ui/Tooltip';
import { createButton, createPanel, textStyle, type Button, type UiBox } from '../ui/theme';
import { resolveShortcut, shortcutFlags } from '../ui/input/shortcuts';
import { openHelp } from './helpLauncher';
import { SCENES } from './keys';
import { newRunSeed } from './MainMenuScene';
import type { RealmData } from './RealmScene';

/** The playable king picked last time is selected again when the screen reopens. */
let lastKing: KingId = 'wheat';

type Mode = 'carousel' | 'detail';

const PAD = 6;

/** Text on the dark themed background: light colour with a dark drop shadow. */
const themedText = (
  scene: Phaser.Scene,
  text: string,
  size: number,
  color: number,
  shadow: number,
): Phaser.GameObjects.Text =>
  scene.add
    .text(0, 0, text, textStyle(size, color))
    .setFontStyle('bold')
    .setShadow(2, 2, toCss(shadow), 0, false, true);

/**
 * Choose a king (§10.3), two steps. **Carousel:** five tall king cards, the selected one big
 * and bright in the middle (click, ←/→, arrows or a swipe to move; click the middle card or
 * Enter to open it; locked kings are grey with a "?"). **Detail:** the king's nine cards in a
 * 3×3 grid, the big king card, Đặc quyền (not available yet), the difficulty, **CHƠI** and the
 * run seed with **Đổi seed**. CHƠI starts the realm with `{ seed, kingId }`. The whole screen
 * takes the selected king's colours.
 */
export class KingSelectScene extends Phaser.Scene {
  private choices: readonly KingChoice[] = [];
  private selected = 0;
  private mode: Mode = 'carousel';
  private seed = 0;
  private starting = false;
  private tooltip!: Tooltip;
  private title!: Phaser.GameObjects.Text;
  private namePrefix!: Phaser.GameObjects.Text;
  private nameTitle!: Phaser.GameObjects.Text;
  private note!: Phaser.GameObjects.Text;
  private back!: Button;
  private previous!: Button;
  private next!: Button;
  private views: KingPortraitView[] = [];
  private detailView!: KingPortraitView;
  private grid: CardView[] = [];
  private perks!: Button;
  private diffPrev!: Button;
  private diffNext!: Button;
  private diffCaption!: Phaser.GameObjects.Text;
  private diffLabel!: Phaser.GameObjects.Text;
  private play!: Button;
  private seedBox!: UiBox;
  private seedText!: Phaser.GameObjects.Text;
  private reroll!: Button;
  private swipe: { id: number; x: number } | null = null;
  private difficulty = 0;

  constructor() {
    super(SCENES.kingSelect);
  }

  create(): void {
    // Scene instances are reused: reset every per-visit field first.
    this.choices = kingChoices(CONTENT);
    this.selected = Math.max(0, this.choices.findIndex((c) => c.id === lastKing));
    this.mode = 'carousel';
    this.seed = newRunSeed();
    this.starting = false;
    this.views = [];
    this.grid = [];
    this.swipe = null;
    this.difficulty = 0;
    buildSpritesTexture(this.textures, CONTENT); // no-op once PreloadScene built it

    this.tooltip = new Tooltip(this);
    const theme = this.theme();
    this.title = themedText(this, 'CHỌN VUA', 30, theme.light, theme.bgDark).setOrigin(0.5);
    this.namePrefix = themedText(this, '', 26, theme.light, theme.bgDark).setOrigin(0, 0.5);
    this.nameTitle = themedText(this, '', 26, theme.accent, theme.bgDark).setOrigin(0, 0.5);
    this.note = themedText(this, '', 16, theme.light, theme.bgDark).setOrigin(0.5, 0);

    this.back = createButton(this, 0, 0, '‹ Quay lại', {
      width: 120,
      height: 48,
      fontSize: 15,
      onClick: () => this.goBack(),
      tooltip: { host: this.tooltip, content: () => textContent(['Quay lại (Esc)']) },
    });
    this.previous = this.arrow('‹', -1, 'Vua trước (←)');
    this.next = this.arrow('›', 1, 'Vua sau (→)');

    this.choices.forEach((choice, i) => {
      const view = new KingPortraitView(this, CONTENT, this.tooltip);
      view.setKing(choice);
      view.onClick(() => this.onCardClick(i));
      this.views.push(view);
    });

    this.detailView = new KingPortraitView(this, CONTENT, this.tooltip);
    for (let i = 0; i < 9; i++) this.grid.push(new CardView(this, CONTENT, { w: 84, h: 132 }, this.tooltip));
    this.perks = createButton(this, 0, 0, 'ĐẶC QUYỀN', {
      width: 140,
      height: 56,
      fontSize: 15,
      onClick: () => undefined,
      tooltip: { host: this.tooltip, content: () => textContent(['Đặc quyền', 'Sắp có']) },
    });
    this.perks.setEnabled(false);
    this.diffPrev = this.stepper('‹', -1);
    this.diffNext = this.stepper('›', 1);
    this.diffCaption = themedText(this, 'ĐỘ KHÓ', 12, theme.light, theme.bgDark).setOrigin(0.5, 1);
    this.diffLabel = themedText(this, '', 20, theme.light, theme.bgDark).setOrigin(0.5, 0);
    this.play = createButton(this, 0, 0, 'CHƠI', {
      width: 168,
      height: 56,
      fontSize: 22,
      onClick: () => this.begin(),
      tooltip: { host: this.tooltip, content: () => textContent(['Chơi (Enter)']) },
    });
    this.seedBox = createPanel(this, 'button', 300, 44);
    this.seedText = this.add.text(0, 0, '', textStyle(15)).setOrigin(0, 0.5);
    this.reroll = createButton(this, 0, 0, 'Đổi seed', {
      width: 120,
      height: 44,
      fontSize: 14,
      onClick: () => {
        this.seed = newRunSeed();
        this.refresh();
      },
      tooltip: { host: this.tooltip, content: () => textContent(['Đổi seed', 'Một seed khác cho ván khác.']) },
    });

    this.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKey, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this);

    this.refresh();
  }

  // ---- state ---------------------------------------------------------------------------------

  private choice(): KingChoice {
    return this.choices[this.selected]!;
  }

  private theme(): KingTheme {
    const c = this.choices[this.selected];
    return c && c.playable ? kingTheme(c.id) : lockedTheme();
  }

  private skin(): UiSkin {
    const c = this.choice();
    return c.playable ? c.id : 'neutral';
  }

  private arrow(label: string, delta: number, tip: string): Button {
    return createButton(this, 0, 0, label, {
      width: 52,
      height: 64,
      fontSize: 28,
      onClick: () => this.select(nextIndex(this.selected, delta, this.choices.length)),
      tooltip: { host: this.tooltip, content: () => textContent([tip]) },
    });
  }

  private stepper(label: string, delta: number): Button {
    return createButton(this, 0, 0, label, {
      width: 44,
      height: 56,
      fontSize: 22,
      onClick: () => {
        this.difficulty = nextIndex(this.difficulty, delta, DIFFICULTY_OPTIONS.length);
        this.refresh();
      },
      tooltip: { host: this.tooltip, content: () => textContent(['Độ khó', 'Hiện chỉ có một mức.']) },
    });
  }

  private select(index: number): void {
    if (index === this.selected || this.choices[index] === undefined) return;
    this.selected = index;
    this.refresh();
  }

  private onCardClick(index: number): void {
    if (this.mode !== 'carousel' || this.starting) return;
    if (index !== this.selected) {
      this.select(index);
    } else {
      this.openDetail();
    }
  }

  private openDetail(): void {
    const c = this.choice();
    if (!c.playable) {
      this.views[this.selected]?.shake(); // locked: it only shakes
      return;
    }
    lastKing = c.id;
    this.mode = 'detail';
    this.refresh();
  }

  private goBack(): void {
    if (this.starting) return;
    if (this.mode === 'detail') {
      this.mode = 'carousel';
      this.refresh();
    } else {
      this.scene.start(SCENES.mainMenu);
    }
  }

  private begin(): void {
    const c = this.choice();
    if (this.starting || this.mode !== 'detail' || !c.playable) return;
    this.starting = true;
    lastKing = c.id;
    const data: RealmData = { seed: this.seed, kingId: c.id };
    this.scene.start(SCENES.realm, data);
  }

  /** Everything that depends on the selected king / the mode, then the layout. */
  private refresh(): void {
    const c = this.choice();
    const theme = this.theme();
    const skin = this.skin();
    this.cameras.main.setBackgroundColor(toCss(theme.bgDark));
    for (const t of [this.title, this.namePrefix, this.nameTitle, this.note, this.diffCaption, this.diffLabel]) {
      t.setShadow(2, 2, toCss(theme.bgDark), 0, false, true);
    }
    this.title.setColor(toCss(theme.light));
    this.namePrefix.setText(c.title.prefix).setColor(toCss(theme.light));
    this.nameTitle.setText(c.title.title).setColor(toCss(theme.accent));
    this.note.setText(c.note ?? '').setColor(toCss(theme.light));
    this.diffCaption.setColor(toCss(theme.light));
    this.diffLabel.setText(DIFFICULTY_OPTIONS[this.difficulty]!.labelVi).setColor(toCss(theme.light));
    for (const b of [this.back, this.previous, this.next, this.perks, this.diffPrev, this.diffNext, this.play, this.reroll]) b.setSkin(skin);
    this.seedBox.setSkin(skin);
    this.seedText.setText(`Seed: ${this.seed}`);
    this.diffPrev.setEnabled(nextIndex(this.difficulty, -1, DIFFICULTY_OPTIONS.length) !== this.difficulty);
    this.diffNext.setEnabled(nextIndex(this.difficulty, 1, DIFFICULTY_OPTIONS.length) !== this.difficulty);
    if (c.playable) {
      this.detailView.setKing(c);
      this.grid.forEach((view, i) => {
        view.setTheme(c.id);
        view.setCard(c.cards[i] ?? null);
      });
    }
    this.layout();
  }

  // ---- layout --------------------------------------------------------------------------------

  private place(button: Button, r: { x: number; y: number; w: number; h: number }): void {
    button.resize(r.w, r.h);
    button.container.setPosition(r.x + r.w / 2, r.y + r.h / 2);
  }

  private layout(): void {
    const screen = { w: this.scale.width, h: this.scale.height };
    const carousel = this.mode === 'carousel';
    const detail = !carousel;
    const cs = carouselScreen(screen);
    const dl = detailLayout(screen, PAD);

    this.place(this.back, carousel ? cs.back : dl.back);
    this.title.setVisible(carousel);
    this.title.setFontSize(screen.w >= 768 ? 30 : 22);
    const tr = carousel ? cs.title : dl.title;
    this.title.setPosition(tr.x + tr.w / 2, tr.y + tr.h / 2);

    // King name: above the middle card, or in the title area of the detail screen.
    const slots = carouselSlots(cs.area, this.selected, this.choices.length);
    const mid = slots[this.selected];
    // Carousel: just above the middle card (never above the screen's own name row).
    const aboveCard = mid ? { ...cs.name, y: Math.max(cs.name.y, mid.rect.y - cs.name.h - 8) } : cs.name;
    const nameRect = carousel ? aboveCard : dl.title;
    const size = detail ? (screen.w >= 768 ? 32 : 22) : screen.w >= 768 ? 26 : 20;
    this.namePrefix.setFontSize(size);
    this.nameTitle.setFontSize(size);
    const total = this.namePrefix.width + this.nameTitle.width;
    const nx = nameRect.x + (nameRect.w - total) / 2;
    const ny = nameRect.y + nameRect.h / 2;
    this.namePrefix.setPosition(nx, ny);
    this.nameTitle.setPosition(nx + this.namePrefix.width, ny);

    // Carousel.
    this.views.forEach((view, i) => {
      const slot = slots[i]!;
      view.setVisible(carousel && slot.visible);
      view.layout(slot.rect, true);
      view.setBrightness(slot.brightness);
      view.setDepth(slot.depth);
    });
    this.note.setVisible(carousel && this.choice().note !== null);
    if (mid) this.note.setPosition(mid.rect.x + mid.rect.w / 2, mid.rect.y + mid.rect.h + 8);
    const last = this.choices.length - 1;
    this.previous.setVisible(carousel && this.selected > 0);
    this.next.setVisible(carousel && this.selected < last);
    this.place(this.previous, cs.previous);
    this.place(this.next, cs.next);

    // Detail.
    this.detailView.setVisible(detail);
    this.detailView.layout(dl.portrait);
    this.detailView.setDepth(10);
    this.grid.forEach((view, i) => {
      view.container.setVisible(detail);
      if (detail) view.setPosition(dl.cards[i]!.x, dl.cards[i]!.y);
    });
    for (const b of [this.perks, this.diffPrev, this.diffNext, this.play, this.reroll]) b.setVisible(detail);
    this.place(this.perks, dl.perks);
    this.place(this.diffPrev, dl.previous);
    this.place(this.diffNext, dl.next);
    this.place(this.play, dl.play);
    this.place(this.reroll, dl.reroll);
    this.diffCaption.setVisible(detail).setPosition(dl.difficulty.x + dl.difficulty.w / 2, dl.difficulty.y + dl.difficulty.h / 2 - 2);
    this.diffLabel.setVisible(detail).setPosition(dl.difficulty.x + dl.difficulty.w / 2, dl.difficulty.y + dl.difficulty.h / 2);
    this.seedBox.image.setVisible(detail);
    this.seedBox.resize(dl.seed.w, dl.seed.h);
    this.seedBox.image.setPosition(dl.seed.x, dl.seed.y);
    this.seedText.setVisible(detail).setPosition(dl.seed.x + 12, dl.seed.y + dl.seed.h / 2);
    this.tooltip.refresh();
  }

  // ---- input ---------------------------------------------------------------------------------

  private inArea(x: number, y: number): boolean {
    const a = carouselScreen({ w: this.scale.width, h: this.scale.height }).area;
    return x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.mode === 'carousel' && this.inArea(pointer.x, pointer.y)) this.swipe = { id: pointer.id, x: pointer.x };
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    const swipe = this.swipe;
    if (!swipe || swipe.id !== pointer.id) return;
    this.swipe = null;
    if (this.mode !== 'carousel') return;
    this.select(swipeTarget(this.selected, pointer.x - swipe.x, this.choices.length));
  }

  private onKey(event: KeyboardEvent): void {
    const action = resolveShortcut(event.key, 'kingSelect', shortcutFlags(event));
    switch (action) {
      case 'help.toggle':
        event.preventDefault(); // F1 must not open the browser's help
        openHelp(this, null, null);
        break;
      case 'select.1':
      case 'select.2':
      case 'select.3':
        if (this.mode === 'carousel') this.select(Number(action.slice(-1)) - 1);
        break;
      case 'king.previous':
        if (this.mode === 'carousel') this.select(nextIndex(this.selected, -1, this.choices.length));
        break;
      case 'king.next':
        if (this.mode === 'carousel') this.select(nextIndex(this.selected, 1, this.choices.length));
        break;
      case 'confirm':
        if (this.mode === 'carousel') this.openDetail();
        else this.begin();
        break;
      case 'back':
        this.goBack();
        break;
    }
  }

  private teardown(): void {
    this.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKey, this);
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    for (const v of this.views) v.destroy();
    this.detailView.destroy();
    for (const c of this.grid) c.destroy();
    this.views = [];
    this.grid = [];
    this.tooltip.destroy();
  }
}
