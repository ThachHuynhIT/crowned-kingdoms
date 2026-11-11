import Phaser from 'phaser';
import { toCss } from '../data/palette';
import type { RunMode } from '../data/rules';
import type { KingId, PerkId } from '../data/types';
import type { KingTheme } from '../data/uiPalette';
import { CONTENT } from '../game/cards/registry';
import { defaultProfile, type MetaProfile } from '../game/meta';
import { buildSpritesTexture } from '../render/atlas';
import { CardView } from '../ui/cards/CardView';
import { textContent } from '../ui/hud/layout';
import { carouselScreen, carouselSlots, unlockButtonRect, type CarouselSlot } from '../ui/kingSelect/carouselLayout';
import { kingChoices, nextIndex, swipeTarget, unlockLabel, type KingChoice } from '../ui/kingSelect/carouselModel';
import { difficultyChoices, type DifficultyOption } from '../ui/kingSelect/difficulty';
import { detailLayout } from '../ui/kingSelect/detailLayout';
import { KingPortraitView } from '../ui/kingSelect/KingPortraitView';
import { lockedCardLayout } from '../ui/kingSelect/lockedCardLayout';
import { modeChoices, pickRunMode } from '../ui/kingSelect/modeModel';
import { kingTheme, lockedTheme } from '../ui/kingSelect/kingTheme';
import { PerkDialog } from '../ui/kingSelect/PerkDialog';
import { perkButtonCaption, perkOptions, togglePerk } from '../ui/kingSelect/perkModel';
import { ToastStack } from '../ui/ToastStack';
import type { UiSkin } from '../ui/skin';
import { Tooltip } from '../ui/Tooltip';
import { createButton, createPanel, textStyle, type Button, type UiBox } from '../ui/theme';
import { resolveShortcut, shortcutFlags } from '../ui/input/shortcuts';
import { openHelp } from './helpLauncher';
import { SCENES } from './keys';
import { newRunSeed } from './MainMenuScene';
import type { RealmData } from './RealmScene';
import { getSession } from './sessionRegistry';

/** The playable king picked last time is selected again when the screen reopens. */
let lastKing: KingId = 'wheat';

type Mode = 'carousel' | 'detail';

/** How long the king cards take to glide to their new slots. */
const SLIDE_MS = 240;

/** Launch data: a notice to show once (e.g. the realm refused to start a locked Endless run). */
export interface KingSelectData {
  notice?: string;
}

const PAD = 6;
/** Draw order of the unlock button (above every carousel card) and of the perk dialog. */
const UNLOCK_DEPTH = 200;
const DIALOG_DEPTH = 1000;

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
 * Enter to open it; a locked king keeps his name and portrait under a dark-grey shade with a padlock and
 * the "Mở khoá: …" condition on the card, and only shakes when opened). **Detail:** the king's nine cards in a
 * 3×3 grid, the big king card, **Đặc quyền** (a dialog: at most one perk the king's mastery has
 * opened), the difficulty (Nông dân, then the Gai levels the profile has opened), **CHƠI** and
 * the run seed with **Đổi seed**. Lock state comes from the meta profile (`session.meta()`, or
 * the default profile without a session); a locked king the player can afford shows
 * **Mở khoá (N)**. CHƠI starts the realm with `{ seed, kingId, perk, difficulty }`. The whole
 * screen takes the selected king's colours.
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
  private slideTween: Phaser.Tweens.Tween | null = null;
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
  /** Index into `difficultyChoices(profile)`. */
  private difficulty = 0;
  private profile: MetaProfile = defaultProfile();
  private perk: PerkId | null = null;
  private perkName!: Phaser.GameObjects.Text;
  private perkDialog: PerkDialog | null = null;
  private unlock!: Button;
  private unlocking = false;
  private points!: Phaser.GameObjects.Text;
  private toasts!: ToastStack;
  /** The run mode to start (spec 2026-11-09 §2): "30 năm" every visit; not the carousel/detail `mode`. */
  private runMode: RunMode = 'normal';
  private modeButtons: Button[] = [];
  private modeNote!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.kingSelect);
  }

  create(data: KingSelectData = {}): void {
    // Scene instances are reused: reset every per-visit field first.
    this.profile = getSession(this)?.meta() ?? defaultProfile();
    this.runMode = 'normal';
    this.modeButtons = [];
    this.slideTween = null;
    this.choices = kingChoices(CONTENT, this.profile);
    this.selected = Math.max(0, this.choices.findIndex((c) => c.id === lastKing && c.playable));
    this.mode = 'carousel';
    this.seed = newRunSeed();
    this.starting = false;
    this.views = [];
    this.grid = [];
    this.swipe = null;
    this.difficulty = 0;
    this.perk = null;
    this.perkDialog = null;
    this.unlocking = false;
    buildSpritesTexture(this.textures, CONTENT); // no-op once PreloadScene built it

    this.tooltip = new Tooltip(this);
    const theme = this.theme();
    this.title = themedText(this, 'CHỌN VUA', 30, theme.light, theme.bgDark).setOrigin(0.5);
    this.namePrefix = themedText(this, '', 26, theme.light, theme.bgDark).setOrigin(0, 0.5);
    this.nameTitle = themedText(this, '', 26, theme.accent, theme.bgDark).setOrigin(0, 0.5);
    this.note = themedText(this, '', 16, theme.light, theme.bgDark).setOrigin(0.5, 0).setAlign('center').setDepth(UNLOCK_DEPTH);
    this.points = themedText(this, '', 16, theme.light, theme.bgDark).setOrigin(1, 0.5);
    this.toasts = new ToastStack(this, DIALOG_DEPTH + 50);
    this.modeNote = themedText(this, '', 13, theme.light, theme.bgDark).setOrigin(0, 0.5);

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
      onClick: () => this.openPerks(),
      tooltip: {
        host: this.tooltip,
        content: () =>
          textContent(['Đặc quyền', perkButtonCaption(CONTENT, this.choice().id, this.perk), 'Chọn tối đa một đặc quyền đã mở bằng thông thạo.']),
      },
    });
    this.perkName = themedText(this, '', 13, theme.light, theme.bgDark).setOrigin(0, 1);
    this.unlock = createButton(this, 0, 0, '', {
      width: 160,
      height: 48,
      fontSize: 15,
      onClick: () => void this.buyKing(),
      tooltip: {
        host: this.tooltip,
        content: () => textContent(['Mở khoá vua', `Dùng điểm Vương Miện (đang có ${this.profile.crownPoints}).`]),
      },
    });
    this.unlock.container.setDepth(UNLOCK_DEPTH);
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

    this.modeButtons = modeChoices(this.profile).map((choice) =>
      createButton(this, 0, 0, choice.labelVi, {
        width: 120,
        height: 44,
        fontSize: 15,
        onClick: () => this.setRunMode(choice.id),
        tooltip: {
          host: this.tooltip,
          content: () => {
            const c = modeChoices(this.profile).find((m) => m.id === choice.id)!;
            const about = c.id === 'normal' ? 'Ván 30 năm, có ba boss và chiến thắng cuối lịch.' : 'Bàn 7×7, phúc lành và biến thể; chơi đến khi hết mạng.';
            return textContent([c.labelVi, about, ...(c.reasonVi ? [c.reasonVi] : [])]);
          },
        },
      }),
    );

    this.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKey, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this);

    this.refresh();
    if (data.notice) this.toasts.push(data.notice);
  }

  // ---- state ---------------------------------------------------------------------------------

  /** A tap on "30 năm" / "Vô tận": a locked mode changes nothing; king, perk, Gai and seed stay. */
  private setRunMode(wanted: RunMode): void {
    if (this.mode !== 'detail' || this.starting || this.perkDialog) return;
    this.runMode = pickRunMode(this.profile, this.runMode, wanted);
    this.refresh();
  }

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
        this.difficulty = nextIndex(this.difficulty, delta, this.difficulties().length);
        this.refresh();
      },
      tooltip: {
        host: this.tooltip,
        content: () => textContent(['Độ khó', 'Mỗi Gai làm địch mạnh hơn và cho thêm điểm Vương Miện.', 'Thắng ở một mức để mở mức kế tiếp.']),
      },
    });
  }

  private select(index: number): void {
    if (index === this.selected || this.choices[index] === undefined) return;
    const area = carouselScreen({ w: this.scale.width, h: this.scale.height }).area;
    const from = carouselSlots(area, this.selected, this.choices.length);
    this.selected = index;
    this.perk = null; // perks belong to one king
    this.refresh();
    if (this.mode === 'carousel') this.slide(from, carouselSlots(area, index, this.choices.length));
  }

  /** The cards glide from their old slots to the new ones (owner 2026-11-10: "lướt qua trái phải"). */
  private slide(from: readonly CarouselSlot[], to: readonly CarouselSlot[]): void {
    this.slideTween?.remove();
    const lerp = (a: number, b: number, t: number): number => Math.round(a + (b - a) * t);
    const step = (t: number): void => {
      if (this.mode !== 'carousel') return;
      this.views.forEach((view, i) => {
        const a = from[i];
        const b = to[i];
        if (!a || !b) return;
        view.setVisible(a.visible || b.visible);
        view.layout({ x: lerp(a.rect.x, b.rect.x, t), y: lerp(a.rect.y, b.rect.y, t), w: lerp(a.rect.w, b.rect.w, t), h: lerp(a.rect.h, b.rect.h, t) }, true);
        view.setBrightness(a.brightness + (b.brightness - a.brightness) * t);
        // the card coming to the middle rises above the one leaving it halfway through
        view.setDepth(t < 0.5 ? a.depth : b.depth);
      });
    };
    const progress = { t: 0 };
    step(0);
    this.slideTween = this.tweens.add({
      targets: progress,
      t: 1,
      duration: SLIDE_MS,
      ease: 'Cubic.easeOut',
      onUpdate: () => step(progress.t),
      onComplete: () => {
        this.slideTween = null;
        this.layout();
      },
    });
  }

  private difficulties(): readonly DifficultyOption[] {
    return difficultyChoices(this.profile);
  }

  /** Buys the selected locked king with crown points, then shows the new profile. */
  private async buyKing(): Promise<void> {
    const c = this.choice();
    const session = getSession(this);
    if (this.unlocking || this.mode !== 'carousel' || c.unlockCost === null) return;
    if (!session) {
      this.toasts.push('Không có hồ sơ để mở khoá.');
      return;
    }
    this.unlocking = true;
    this.unlock.setEnabled(false);
    const result = await session.unlockKing(c.id);
    this.unlocking = false;
    if (!this.sys.isActive()) return; // the player left the screen meanwhile
    this.unlock.setEnabled(true);
    if (!result.ok) {
      this.toasts.push(result.message);
      return;
    }
    this.profile = result.profile;
    this.rebuildChoices(c.id);
    this.toasts.push(`Đã mở khoá ${c.nameVi}!`);
  }

  /** New lock state from `this.profile`: same nine cards, new order; `keep` stays selected. */
  private rebuildChoices(keep: KingId): void {
    this.choices = kingChoices(CONTENT, this.profile);
    this.choices.forEach((choice, i) => this.views[i]?.setKing(choice));
    this.selected = Math.max(0, this.choices.findIndex((c) => c.id === keep));
    this.difficulty = Math.min(this.difficulty, this.difficulties().length - 1);
    this.refresh();
  }

  private openPerks(): void {
    const c = this.choice();
    if (this.mode !== 'detail' || !c.playable || this.perkDialog || this.starting) return;
    this.perkDialog = new PerkDialog(
      this,
      perkOptions(CONTENT, this.profile, c.id, this.perk),
      this.tooltip,
      (id) => {
        this.perk = togglePerk(this.profile, c.id, this.perk, id);
        this.perkDialog?.setOptions(perkOptions(CONTENT, this.profile, c.id, this.perk));
        this.refresh();
      },
      () => this.closePerks(),
      c.id,
    ).setDepth(DIALOG_DEPTH);
  }

  private closePerks(): void {
    this.perkDialog?.destroy();
    this.perkDialog = null;
  }

  private onCardClick(index: number): void {
    if (this.mode !== 'carousel' || this.starting || this.unlocking) return;
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
    if (c.id !== lastKing) this.perk = null;
    lastKing = c.id;
    this.mode = 'detail';
    this.refresh();
  }

  private goBack(): void {
    if (this.starting) return;
    if (this.perkDialog) {
      this.closePerks();
      return;
    }
    if (this.mode === 'detail') {
      this.mode = 'carousel';
      this.refresh();
    } else {
      this.scene.start(SCENES.mainMenu);
    }
  }

  private begin(): void {
    const c = this.choice();
    if (this.starting || this.mode !== 'detail' || !c.playable || this.perkDialog) return;
    this.starting = true;
    lastKing = c.id;
    const difficulty = this.difficulties()[this.difficulty]?.thorn ?? 0;
    const data: RealmData = { seed: this.seed, kingId: c.id, perk: this.perk, difficulty, mode: this.runMode };
    this.scene.start(SCENES.realm, data);
  }

  /** Everything that depends on the selected king / the mode, then the layout. */
  private refresh(): void {
    const c = this.choice();
    const theme = this.theme();
    const skin = this.skin();
    this.cameras.main.setBackgroundColor(toCss(theme.bgDark));
    for (const t of [this.title, this.namePrefix, this.nameTitle, this.note, this.diffCaption, this.diffLabel, this.perkName, this.points, this.modeNote]) {
      t.setShadow(2, 2, toCss(theme.bgDark), 0, false, true);
    }
    this.title.setColor(toCss(theme.light));
    this.namePrefix.setText(c.title.prefix).setColor(toCss(theme.light));
    this.nameTitle.setText(c.title.title).setColor(toCss(theme.accent));
    this.note.setText(c.lockText ?? '').setColor(toCss(theme.light));
    this.diffCaption.setColor(toCss(theme.light));
    const levels = this.difficulties();
    this.diffLabel.setText(levels[this.difficulty]?.labelVi ?? '').setColor(toCss(theme.light));
    this.perkName.setText(c.playable ? perkButtonCaption(CONTENT, c.id, this.perk) : '').setColor(toCss(theme.light));
    this.points.setText(`Điểm Vương Miện: ${this.profile.crownPoints}`).setColor(toCss(theme.light));
    this.unlock.setLabel(c.unlockCost === null ? '' : unlockLabel(c.unlockCost));
    for (const b of [this.back, this.previous, this.next, this.perks, this.diffPrev, this.diffNext, this.play, this.reroll, this.unlock, ...this.modeButtons]) b.setSkin(skin);
    const modes = modeChoices(this.profile);
    this.modeButtons.forEach((b, i) => {
      const m = modes[i]!;
      b.setEnabled(m.enabled);
      b.setActive(m.id === this.runMode);
    });
    this.modeNote.setText(modes.find((m) => m.reasonVi !== null)?.reasonVi ?? '').setColor(toCss(theme.light));
    this.perks.setActive(this.perk !== null);
    this.seedBox.setSkin(skin);
    this.seedText.setText(`Seed: ${this.seed}`);
    this.diffPrev.setEnabled(nextIndex(this.difficulty, -1, levels.length) !== this.difficulty);
    this.diffNext.setEnabled(nextIndex(this.difficulty, 1, levels.length) !== this.difficulty);
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
    // The unlock condition sits on the locked middle card, under its padlock.
    this.note.setVisible(carousel && this.choice().lockText !== null && mid !== undefined);
    if (mid) {
      const box = lockedCardLayout(mid.rect).note;
      this.note.setFontSize(screen.w >= 768 ? 16 : 12).setWordWrapWidth(box.w, true);
      this.note.setPosition(Math.round(box.x + box.w / 2), box.y);
    }
    this.unlock.setVisible(carousel && this.choice().unlockCost !== null && mid !== undefined);
    if (mid) this.place(this.unlock, unlockButtonRect(mid.rect));
    // Crown point balance: top right, level with the back button (desktop) or just under the
    // top row (phones, where the title fills the middle); toasts hang below it.
    const wide = screen.w >= 768;
    const pointsY = wide ? cs.back.y + cs.back.h / 2 : cs.back.y + cs.back.h + 12;
    this.points.setVisible(carousel).setFontSize(wide ? 16 : 13);
    this.points.setPosition(screen.w - 12, pointsY);
    this.toasts.setAnchor(screen.w / 2, wide ? cs.back.y + cs.back.h + 8 : pointsY + 14, screen.w - 32);
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
      if (!detail) return;
      const r = dl.cards[i]!;
      if (view.container.width !== r.w || view.container.height !== r.h) view.resize({ w: r.w, h: r.h });
      view.setPosition(r.x, r.y);
    });
    for (const b of [this.perks, this.diffPrev, this.diffNext, this.play, this.reroll, ...this.modeButtons]) b.setVisible(detail);
    this.modeButtons.forEach((b, i) => this.place(b, dl.modes[i]!));
    this.modeNote
      .setVisible(detail)
      .setFontSize(dl.desktop ? 14 : 12)
      .setWordWrapWidth(dl.modeNote.w)
      .setPosition(dl.modeNote.x, dl.modeNote.y + (dl.desktop ? dl.modeNote.h / 2 : this.modeNote.height / 2));
    this.place(this.perks, dl.perks);
    this.perkName.setVisible(detail).setWordWrapWidth(dl.perkName.w).setPosition(dl.perkName.x, dl.perkName.y + dl.perkName.h);
    this.perkDialog?.layout();
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
    if (this.unlocking || this.perkDialog) return;
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
    if (this.perkDialog && action !== 'back') return; // the dialog only answers Esc
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
    this.closePerks();
    this.toasts.destroy();
    this.tooltip.destroy();
  }
}
