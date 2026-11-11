import { logicalSize, logicalPointer } from '../displayRuntime';
import Phaser from 'phaser';
import { toCss } from '../../data/palette';
import { UI_PALETTE } from '../../data/uiPalette';
import type { RunCommand, RunState } from '../../game/run/state';
import { textContent } from '../hud/layout';
import { addUiText, createButton, createPanel, frameBorder, type Button, type TooltipHost, type UiBox } from '../theme';
import {
  ENDLESS_PANEL_TITLE,
  blessingChoices,
  blessingCommand,
  blessingLayout,
  blessingTitle,
  visibleBlessingCards,
  type BlessingChoice,
  type BlessingLayout,
} from './blessingModel';
import { createOverlay, fitOverlay } from './overlay';

const PAD_DESKTOP = 12;
const PAD_MOBILE = 6;
/** A press that moves farther than this is a scroll drag, not a tap. */
const DRAG_SLOP = 8;

interface ChoiceView {
  box: UiBox;
  name: Phaser.GameObjects.Text;
  effect: Phaser.GameObjects.Text;
  stacks: Phaser.GameObjects.Text;
  after: Phaser.GameObjects.Text;
  pick: Button;
}

/**
 * The mandatory Endless blessing choice (spec 2026-11-09 §5, §7): "Phúc lành năm {year}", the three
 * saved choices (side by side on desktop, a scrolling column on phones) with name, effect, stacks and
 * the value after the pick (a capped one says it pays 25 gold), and "Xem tổng hợp" for the summary
 * panel. A pick sends `pickBlessing` once and waits for the controller (`retry` re-enables after a
 * refusal). It never closes by itself: the HUD drops it when the offer closes. Keyboard: 1–3 or the
 * arrows move the focus, Enter picks it (`focusBy`, `focusAt`, `pickFocused`).
 */
export class BlessingModal {
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly box: UiBox;
  private readonly title: Phaser.GameObjects.Text;
  private readonly view: Button;
  private readonly views: ChoiceView[] = [];
  private readonly root: Phaser.GameObjects.Container;
  private choices: BlessingChoice[] = [];
  private pending = false;
  private focus = 0;
  private scroll = 0;
  private lay: BlessingLayout | null = null;
  private drag: { id: number; y: number; scroll: number; moved: boolean } | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private state: RunState,
    tooltip: TooltipHost,
    private readonly send: (command: RunCommand) => void,
    onView: () => void,
  ) {
    const skin = state.kingId;
    this.overlay = createOverlay(scene);
    this.box = createPanel(scene, 'panel', 64, 64, 0, 0, skin);
    this.box.image.setInteractive();
    this.title = addUiText(scene, 0, 0, '', 20).setOrigin(0, 0.5).setFontStyle('bold');
    this.view = createButton(scene, 0, 0, 'Xem tổng hợp', {
      width: 150,
      height: 44,
      fontSize: 14,
      onClick: () => {
        if (!this.drag?.moved) onView();
      },
      tooltip: { host: tooltip, content: () => textContent([ENDLESS_PANEL_TITLE, 'Mọi phúc lành đang có và biến thể thập niên.']) },
      skin,
    });
    for (let i = 0; i < 3; i++) {
      const box = createPanel(scene, 'slot', 64, 64);
      box.image.setInteractive({ useHandCursor: true });
      box.image.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        if (!this.drag?.moved) this.setFocus(i);
      });
      const pick = createButton(scene, 0, 0, 'Chọn', {
        width: 120,
        height: 44,
        fontSize: 16,
        onClick: () => {
          if (!this.drag?.moved) this.pick(i);
        },
        skin,
      });
      this.views.push({
        box,
        name: addUiText(scene, 0, 0, '', 16).setFontStyle('bold'),
        effect: addUiText(scene, 0, 0, '', 13),
        stacks: addUiText(scene, 0, 0, '', 13, UI_PALETTE.woodDark),
        after: addUiText(scene, 0, 0, '', 13),
        pick,
      });
    }
    this.root = scene.add.container(0, 0, [
      this.overlay,
      this.box.image,
      this.title,
      this.view.container,
      ...this.views.flatMap((v) => [v.box.image, v.name, v.effect, v.stacks, v.after, v.pick.container]),
    ]);
    scene.input.on(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.setState(state);
  }

  setDepth(depth: number): this {
    this.root.setDepth(depth);
    return this;
  }

  /** A newer run state; a different offer (another year) drops the waiting pick. */
  setState(state: RunState): void {
    const key = (s: RunState): string => (s.offers?.kind === 'blessing' ? `${s.offers.year}:${s.offers.blessingIds.join(',')}` : '');
    if (key(state) !== key(this.state)) {
      this.pending = false;
      this.focus = 0;
      this.scroll = 0;
    }
    this.state = state;
    this.choices = blessingChoices(state);
    this.title.setText(blessingTitle(state.offers?.kind === 'blessing' ? state.offers.year : state.year));
    this.layout();
  }

  /** The pick was refused (the offer is still open): allow another one. */
  retry(): void {
    this.pending = false;
    this.refreshButtons();
  }

  focusAt(index: number): void {
    if (index >= 0 && index < this.choices.length) this.setFocus(index);
  }

  focusBy(delta: number): void {
    const n = this.choices.length;
    if (n > 0) this.setFocus((this.focus + delta + n) % n);
  }

  pickFocused(): void {
    this.pick(this.focus);
  }

  layout(): void {
    const { w: width, h: height } = logicalSize(this.scene);
    const desktop = width >= 768;
    const inset = frameBorder(this.scene, 'panel') + (desktop ? PAD_DESKTOP : PAD_MOBILE);
    let l = blessingLayout({ w: width, h: height }, inset, this.choices.length || 3, this.scroll);
    this.scroll = Math.min(this.scroll, l.scrollMax);
    l = blessingLayout({ w: width, h: height }, inset, this.choices.length || 3, this.scroll);
    this.lay = l;
    fitOverlay(this.scene, this.overlay);
    this.box.resize(l.panel.w, l.panel.h);
    this.box.image.setPosition(l.panel.x, l.panel.y);
    this.title.setFontSize(desktop ? 20 : 17).setPosition(l.title.x, l.title.y + l.title.h / 2);
    this.view.container.setPosition(l.view.x + l.view.w / 2, l.view.y + l.view.h / 2);
    const shown = visibleBlessingCards(l);
    const big = desktop ? 16 : 15;
    const small = desktop ? 13 : 12;
    this.views.forEach((v, i) => {
      const c = this.choices[i];
      const r = l.cards[i];
      const b = l.picks[i];
      const on = c !== undefined && r !== undefined && b !== undefined && shown[i] === true;
      for (const o of [v.box.image, v.name, v.effect, v.stacks, v.after]) o.setVisible(on);
      v.pick.setVisible(on);
      if (!on) return;
      v.box.resize(r.w, r.h);
      v.box.image.setPosition(r.x, r.y);
      const wrap = r.w - 20;
      let y = r.y + 10;
      const put = (t: Phaser.GameObjects.Text, text: string, size: number, gap = 4): void => {
        t.setText(text).setFontSize(size).setWordWrapWidth(wrap).setPosition(r.x + 10, y);
        y += t.height + gap;
      };
      put(v.name, c.nameVi, big, 6);
      put(v.effect, c.effectVi, small);
      put(v.stacks, c.stackVi, small);
      put(v.after, c.afterVi, small);
      v.after.setColor(toCss(c.capped ? UI_PALETTE.bad : UI_PALETTE.good));
      v.pick.container.setPosition(b.x + b.w / 2, b.y + b.h / 2);
    });
    this.refreshButtons();
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.root.destroy();
  }

  // ---- picking -----------------------------------------------------------------------------

  private setFocus(index: number): void {
    this.focus = index;
    this.refreshButtons();
  }

  private pick(index: number): void {
    if (this.pending) return; // one pick per offer: a double tap sends nothing more
    const command = blessingCommand(this.state, index);
    if (command === null) return;
    this.pending = true;
    this.focus = index;
    this.refreshButtons();
    this.send(command);
  }

  private refreshButtons(): void {
    this.views.forEach((v, i) => {
      v.box.setFrame(i === this.focus ? 'slotSelected' : 'slot');
      v.pick.setEnabled(!this.pending);
      v.pick.setActive(i === this.focus);
    });
  }

  // ---- scrolling (phones too short for the column) -----------------------------------------

  private scrollTo(scroll: number): void {
    const max = this.lay?.scrollMax ?? 0;
    const next = Math.max(0, Math.min(max, Math.round(scroll)));
    if (next === this.scroll) return;
    this.scroll = next;
    this.layout();
  }

  private readonly onWheel = (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number): void => {
    if ((this.lay?.scrollMax ?? 0) > 0) this.scrollTo(this.scroll + dy * 0.5);
  };

  private readonly onDown = (p: Phaser.Input.Pointer): void => {
    const point = logicalPointer(this.scene, p);
    const vp = this.lay?.viewport;
    if (!vp || (this.lay?.scrollMax ?? 0) === 0) {
      this.drag = null;
      return;
    }
    const inside = point.x >= vp.x && point.x <= vp.x + vp.w && point.y >= vp.y && point.y <= vp.y + vp.h;
    this.drag = inside ? { id: p.id, y: point.y, scroll: this.scroll, moved: false } : null;
  };

  private readonly onMove = (p: Phaser.Input.Pointer): void => {
    const point = logicalPointer(this.scene, p);
    const d = this.drag;
    if (!d || d.id !== p.id || !p.isDown) return;
    if (Math.abs(point.y - d.y) > DRAG_SLOP) d.moved = true;
    if (d.moved) this.scrollTo(d.scroll - (point.y - d.y));
  };

  private readonly onUp = (p: Phaser.Input.Pointer): void => {
    // Cleared on the next frame so the buttons' own pointer-up (same event) still sees `moved`.
    if (this.drag?.id === p.id) this.scene.time.delayedCall(0, () => (this.drag = null));
  };
}
