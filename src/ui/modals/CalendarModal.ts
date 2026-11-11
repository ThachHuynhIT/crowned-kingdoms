import { logicalSize } from '../displayRuntime';
import Phaser from 'phaser';
import { modeForRules } from '../../data/rules';
import type { Content } from '../../game/cards/registry';
import type { RunState } from '../../game/run/state';
import { CalendarCellView } from '../planning/CalendarStrip';
import { textContent } from '../hud/layout';
import { CALENDAR_PAGE_YEARS, calendarPage, calendarPageCount, calendarPageOf } from '../realm/calendarModel';
import {
  addUiText,
  createButton,
  createPanel,
  frameBorder,
  type Button,
  type TooltipHost,
  type UiBox,
} from '../theme';
import type { UiSkin } from '../skin';
import { CLOSE_BUTTON, calendarModalLayout } from './modalLayout';
import { createOverlay, fitOverlay } from './overlay';

const TITLE = 'Lịch các năm';
const PAD_DESKTOP = 12;
const PAD_MOBILE = 4;

type CalendarState = Pick<RunState, 'year' | 'rules' | 'enemyKings' | 'enemies'> & Partial<Pick<RunState, 'seed'>>;

/**
 * The run's calendar (§10.4): every year of a normal run in one grid, who attacks and which attack
 * of theirs it is, the current year marked. Endless (spec 2026-11-09 §7) shows pages of 30 years,
 * opening on the current year's page, with ‹ › to turn them: each page is built cell by cell and
 * turning one only reads the calendar. Pure display; closing goes to `onClose`. Call `layout()` on
 * resize and `destroy()` when closed.
 */
export class CalendarModal {
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly box: UiBox;
  private readonly title: Phaser.GameObjects.Text;
  private readonly close: Button;
  private readonly cells: CalendarCellView[];
  private readonly root: Phaser.GameObjects.Container;
  private readonly paged: boolean;
  private readonly prev: Button | null = null;
  private readonly next: Button | null = null;
  private readonly pageText: Phaser.GameObjects.Text | null = null;
  private page: number;

  constructor(
    private readonly scene: Phaser.Scene,
    content: Content,
    private readonly state: CalendarState,
    tooltip: TooltipHost,
    onClose: () => void,
    skin: UiSkin = 'neutral',
  ) {
    this.paged = modeForRules(state.rules) === 'endless';
    this.page = this.paged ? calendarPageOf(state.year) : 0;
    this.overlay = createOverlay(scene);
    this.overlay.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, onClose);
    this.box = createPanel(scene, 'panel', 64, 64, 0, 0, skin);
    this.box.image.setInteractive(); // a click on the panel must not reach the closing overlay
    this.title = addUiText(scene, 0, 0, TITLE, 18).setOrigin(0, 0.5).setFontStyle('bold');
    this.close = createButton(scene, 0, 0, '✕', {
      width: CLOSE_BUTTON,
      height: CLOSE_BUTTON,
      fontSize: 20,
      onClick: onClose,
      tooltip: { host: tooltip, content: () => textContent(['Đóng (Esc)']) },
      skin,
    });
    const count = this.paged ? CALENDAR_PAGE_YEARS : calendarPage(state, 0).length;
    this.cells = Array.from({ length: count }, () => new CalendarCellView(scene, content, tooltip, () => undefined));
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (this.paged) {
      this.prev = createButton(scene, 0, 0, '‹', {
        width: 44,
        height: 44,
        fontSize: 22,
        onClick: () => this.turn(-1),
        tooltip: { host: tooltip, content: () => textContent(['Trang trước']) },
        skin,
      });
      this.next = createButton(scene, 0, 0, '›', {
        width: 44,
        height: 44,
        fontSize: 22,
        onClick: () => this.turn(1),
        tooltip: { host: tooltip, content: () => textContent(['Trang sau']) },
        skin,
      });
      this.pageText = addUiText(scene, 0, 0, '', 14).setOrigin(0.5);
      parts.push(this.prev.container, this.next.container, this.pageText);
    }
    this.root = scene.add.container(0, 0, [
      this.overlay,
      this.box.image,
      this.title,
      this.close.container,
      ...this.cells.map((c) => c.container),
      ...parts,
    ]);
    this.fill();
    this.layout();
  }

  setDepth(depth: number): this {
    this.root.setDepth(depth);
    return this;
  }

  layout(): void {
    const { w: width, h: height } = logicalSize(this.scene);
    const inset = frameBorder(this.scene, 'panel') + (width >= 768 ? PAD_DESKTOP : PAD_MOBILE);
    const l = calendarModalLayout({ w: width, h: height }, inset, this.cells.length, this.paged);
    fitOverlay(this.scene, this.overlay);
    this.box.resize(l.panel.w, l.panel.h);
    this.box.image.setPosition(l.panel.x, l.panel.y);
    this.title.setPosition(l.title.x, l.title.y + l.title.h / 2);
    this.close.container.setPosition(l.close.x + l.close.w / 2, l.close.y + l.close.h / 2);
    this.cells.forEach((view, i) => {
      const r = l.cells[i];
      if (r) view.layout(r);
    });
    if (l.pager && this.prev && this.next && this.pageText) {
      this.prev.container.setPosition(l.pager.prev.x + 22, l.pager.prev.y + 22);
      this.next.container.setPosition(l.pager.next.x + 22, l.pager.next.y + 22);
      this.pageText.setPosition(l.pager.label.x + l.pager.label.w / 2, l.pager.label.y + l.pager.label.h / 2);
    }
  }

  destroy(): void {
    for (const c of this.cells) c.destroy();
    this.root.destroy();
  }

  private turn(delta: number): void {
    const last = calendarPageCount(this.state) - 1;
    const next = Math.max(0, Math.min(last, this.page + delta));
    if (next === this.page) return;
    this.page = next;
    this.fill();
  }

  /** The cells of the current page (only the shown page is ever built). */
  private fill(): void {
    const cells = calendarPage(this.state, this.page);
    this.cells.forEach((view, i) => view.set(cells[i] ?? null));
    if (!this.paged) return;
    const first = this.page * CALENDAR_PAGE_YEARS + 1;
    this.title.setText(`${TITLE} ${first}–${first + CALENDAR_PAGE_YEARS - 1}`);
    this.pageText?.setText(`Trang ${this.page + 1}`);
    this.prev?.setEnabled(this.page > 0);
    this.next?.setEnabled(this.page < calendarPageCount(this.state) - 1);
  }
}
