import { logicalSize, logicalPointer } from '../displayRuntime';
import Phaser from 'phaser';
import type { RunState } from '../../game/run/state';
import { ContentBox } from '../ContentBox';
import { MARGIN, textContent, type Rect } from '../hud/layout';
import { ENDLESS_PANEL_TITLE, endlessPanelContent } from '../modals/blessingModel';
import { createOverlay, fitOverlay } from '../modals/overlay';
import { createButton, type Button, type TooltipHost } from '../theme';

const PANEL_W = 520;
const CLOSE = { w: 120, h: 44 } as const;
const GAP = 8;
/** Screen px of drag per scrolled line. */
const DRAG_LINE = 24;

/**
 * "Phúc lành & Biến thể" (spec 2026-11-09 §7), Endless only: a HUD button and the panel it opens —
 * every blessing with its stacks and the decade modifier now and next, in a self-sizing box that
 * scrolls by lines (wheel or drag) when the screen is short, and "Đóng" under it. Read-only: it sends
 * nothing and stores nothing, so closing it returns to whatever was open (e.g. the blessing offer).
 */
export class EndlessPanel {
  private readonly button: Button;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly box: ContentBox;
  private readonly close: Button;
  private readonly modal: Phaser.GameObjects.Container;
  private state: RunState;
  private open = false;
  private drag: { id: number; y: number } | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    state: RunState,
    tooltip: TooltipHost,
    /** The HUD button asks to open (the HUD routes it through `ui:open-modal`). */
    onOpen: () => void,
    /** "Đóng" or a tap outside asks to close (`ui:close-modal`). */
    onClose: () => void,
  ) {
    this.state = state;
    this.button = createButton(scene, 0, 0, 'Phúc lành', {
      width: 96,
      height: 48,
      fontSize: 13,
      onClick: onOpen,
      tooltip: { host: tooltip, content: () => textContent([ENDLESS_PANEL_TITLE, 'Phúc lành đã chọn và biến thể thập niên.']) },
      skin: state.kingId,
    });
    this.overlay = createOverlay(scene);
    this.overlay.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, onClose);
    this.box = new ContentBox(scene, 'panel', PANEL_W, { fontSize: 13, blocking: true });
    this.close = createButton(scene, 0, 0, 'Đóng', {
      width: CLOSE.w,
      height: CLOSE.h,
      fontSize: 15,
      onClick: onClose,
      tooltip: { host: tooltip, content: () => textContent(['Đóng (Esc)']) },
      skin: state.kingId,
    });
    this.modal = scene.add.container(0, 0, [this.overlay, this.box.container, this.close.container]).setVisible(false);
    scene.input.on(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.setState(state);
  }

  get isOpen(): boolean {
    return this.open;
  }

  setDepth(buttonDepth: number, modalDepth: number): this {
    this.button.container.setDepth(buttonDepth);
    this.modal.setDepth(modalDepth);
    return this;
  }

  setState(state: RunState): void {
    this.state = state;
    if (this.open) this.box.setContent(endlessPanelContent(state));
  }

  /** The HUD button's spot (null hides it, e.g. in normal runs). */
  layoutButton(r: Rect | null): void {
    this.button.setVisible(r !== null && this.state.mode === 'endless');
    if (r) {
      this.button.resize(r.w, r.h);
      this.button.container.setPosition(r.x + r.w / 2, r.y + r.h / 2);
    }
  }

  setOpen(open: boolean): void {
    if (open && this.state.mode !== 'endless') return;
    if (open === this.open) return;
    this.open = open;
    this.drag = null;
    if (open) this.box.setContent(endlessPanelContent(this.state));
    this.modal.setVisible(open);
    this.layout();
  }

  layout(): void {
    if (!this.open) return;
    const { w: width, h: height } = logicalSize(this.scene);
    fitOverlay(this.scene, this.overlay);
    this.box.setMaxWidth(Math.min(PANEL_W, width - 2 * MARGIN));
    this.box.setMaxHeight(height - 2 * MARGIN - CLOSE.h - GAP);
    this.box.refresh();
    const total = this.box.height + GAP + CLOSE.h;
    const x = Math.round((width - this.box.width) / 2);
    const y = Math.max(MARGIN, Math.round((height - total) / 2));
    this.box.setPosition(x, y);
    this.close.container.setPosition(Math.round(width / 2), y + this.box.height + GAP + CLOSE.h / 2);
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.button.container.destroy();
    this.box.destroy();
    this.modal.destroy();
  }

  private readonly onWheel = (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number): void => {
    if (this.open && dy !== 0) this.box.scrollBy(dy > 0 ? 1 : -1);
  };

  private readonly onDown = (p: Phaser.Input.Pointer): void => {
    const point = logicalPointer(this.scene, p);
    this.drag = this.open ? { id: p.id, y: point.y } : null;
  };

  private readonly onMove = (p: Phaser.Input.Pointer): void => {
    const point = logicalPointer(this.scene, p);
    const d = this.drag;
    if (!d || d.id !== p.id || !p.isDown) return;
    const lines = Math.trunc((d.y - point.y) / DRAG_LINE);
    if (lines !== 0) {
      this.box.scrollBy(lines);
      d.y -= lines * DRAG_LINE;
    }
  };

  private readonly onUp = (p: Phaser.Input.Pointer): void => {
    if (this.drag?.id === p.id) this.drag = null;
  };
}
