/**
 * "Tải ván" (2026-11-09): bản tự lưu (ván đang chơi) ở trên cùng, rồi các bản lưu có tên, mới nhất trước. Mỗi hàng:
 * Mở · Đổi tên · Xoá (bản tự lưu chỉ có Mở). Mọi thao tác qua phiên (`src/platform/session.ts`); tên gõ qua hộp
 * thoại của trình duyệt; xoá cần bấm hai lần. Sau mỗi thao tác màn hình dựng lại từ đĩa.
 */
import Phaser from 'phaser';
import { toCss } from '../data/palette';
import { AUTOSAVE_NAME } from '../data/save';
import { UI_PALETTE } from '../data/uiPalette';
import { ALL_KINGS } from '../data/rules';
import type { KingId } from '../data/types';
import { CONTENT } from '../game/cards/registry';
import type { RunState } from '../game/run/state';
import type { SlotSummary } from '../game/save/slots';
import { fitName, savesLayout, slotDetail, type SavesLayout } from '../ui/saves/savesLayout';
import { addUiText, createButton, createPanel, type Button, type UiBox } from '../ui/theme';
import type { Rect } from '../ui/hud/layout';
import { SCENES } from './keys';
import type { RealmData } from './RealmScene';
import { getSession } from './sessionRegistry';

interface Row {
  /** Null for the autosave row. */
  slot: SlotSummary | null;
  bg: UiBox;
  name: Phaser.GameObjects.Text;
  detail: Phaser.GameObjects.Text;
  /** What the detail line says; laid out per screen width by `slotDetail`. */
  info: { king: string; year: number; savedAt: number | null };
  open: Button;
  rename: Button | null;
  remove: Button | null;
}

/** `text` on `obj`, shortened with "…" until its measured width fits `maxW` (glyph widths vary, so count is not enough). */
const fitText = (obj: Phaser.GameObjects.Text, text: string, maxW: number): void => {
  obj.setText(text);
  let n = text.length;
  while (obj.width > maxW && n > 2) {
    n -= 1;
    obj.setText(`${text.slice(0, n - 1)}…`);
  }
};

export class SavesScene extends Phaser.Scene {
  private panel!: UiBox;
  private title!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private back!: Button;
  private prev!: Button;
  private next!: Button;
  private rows: Row[] = [];
  private page = 0;
  /** Bumped on every visit: an async call from an earlier visit must not touch this one (review 2026-11-09). */
  private visit = 0;
  private autosave: RunState | null = null;
  private armedDelete: string | null = null;
  private busy = false;
  private notice = '';

  constructor() {
    super(SCENES.saves);
  }

  create(data?: { notice?: string }): void {
    // Scene instances are reused: reset every per-visit field first.
    this.rows = [];
    this.page = 0;
    this.visit += 1;
    this.autosave = null;
    this.armedDelete = null;
    this.busy = false;
    this.notice = data?.notice ?? '';
    this.cameras.main.setBackgroundColor(toCss(UI_PALETTE.sky[3]));
    this.panel = createPanel(this, 'panel', 200, 200);
    this.title = addUiText(this, 0, 0, 'Tải ván', 24).setFontStyle('bold').setOrigin(0.5);
    this.message = addUiText(this, 0, 0, this.notice, 14).setOrigin(0.5);
    this.back = createButton(this, 0, 0, 'Về menu', { onClick: () => this.scene.start(SCENES.mainMenu) });
    this.prev = createButton(this, 0, 0, '‹', { fontSize: 20, onClick: () => this.turn(-1) });
    this.next = createButton(this, 0, 0, '›', { fontSize: 20, onClick: () => this.turn(1) });
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.mainMenu));
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this));
    this.message.setText(this.notice || 'Đang đọc các bản lưu…');
    this.layout();
    void this.readSaves();
  }

  private async readSaves(): Promise<void> {
    const session = getSession(this);
    if (!session) {
      this.message.setText('Trình duyệt này không lưu được tiến trình.');
      return;
    }
    const visit = this.visit;
    const [current, slots] = await Promise.all([session.load(), session.listSlots()]);
    if (visit !== this.visit || !this.scene.isActive()) return;
    this.autosave = current.kind === 'ok' ? current.state : null;
    if (this.autosave) this.rows.push(this.makeRow(null, AUTOSAVE_NAME, { king: this.kingName(this.autosave.kingId), year: this.autosave.year, savedAt: null }));
    for (const slot of slots) this.rows.push(this.makeRow(slot, slot.name, { king: this.kingName(slot.kingId), year: slot.year, savedAt: slot.savedAt }));
    this.message.setText(this.notice || (this.rows.length === 0 ? 'Chưa có bản lưu nào.' : ''));
    this.layout();
  }

  private kingName(kingId: string): string {
    return (ALL_KINGS as readonly string[]).includes(kingId) ? CONTENT.king(kingId as KingId).nameVi : kingId;
  }

  private makeRow(slot: SlotSummary | null, name: string, info: Row['info']): Row {
    const bg = createPanel(this, 'tooltip', 100, 44);
    const id = slot?.id ?? null;
    return {
      slot,
      bg,
      name: addUiText(this, 0, 0, name, 15).setOrigin(0, 0.5).setFontStyle('bold'),
      info,
      detail: addUiText(this, 0, 0, '', 12).setOrigin(0, 0.5),
      open: createButton(this, 0, 0, 'Mở', { onClick: () => void this.open(id) }),
      rename: slot ? createButton(this, 0, 0, 'Tên', { onClick: () => void this.rename(slot) }) : null,
      remove: slot ? createButton(this, 0, 0, 'Xoá', { onClick: () => void this.remove(slot) }) : null,
    };
  }

  private async open(id: string | null): Promise<void> {
    const session = getSession(this);
    if (this.busy || !session) return;
    if (id === null) {
      if (!this.autosave) return;
      const data: RealmData = { resume: this.autosave };
      this.scene.start(SCENES.realm, data);
      return;
    }
    // Opening a slot replaces the run being played (the autosave): ask first when there is one (review 2026-11-09).
    if (this.autosave && !window.confirm('Ván đang chơi (Tự động lưu) sẽ được thay bằng bản lưu này. Mở bản lưu?')) return;
    const visit = this.visit;
    this.busy = true;
    try {
      const result = await session.loadSlot(id);
      if (visit !== this.visit) return;
      if (result.kind === 'ok') {
        const data: RealmData = { resume: result.state };
        this.scene.start(SCENES.realm, data);
      } else this.message.setText(result.kind === 'incompatible' ? result.message : 'Không tìm thấy bản lưu này.');
    } catch {
      if (visit === this.visit) this.message.setText('Không mở được bản lưu này, hãy thử lại.');
    } finally {
      if (visit === this.visit) this.busy = false;
    }
  }

  private async rename(slot: SlotSummary): Promise<void> {
    const session = getSession(this);
    if (this.busy || !session) return;
    const name = window.prompt('Tên mới của bản lưu', slot.name);
    if (name === null) return;
    const visit = this.visit;
    this.busy = true;
    try {
      const result = await session.renameSlot(slot.id, name);
      if (visit === this.visit) this.scene.restart({ notice: result.ok ? `Đã đổi tên thành "${result.slot.name}".` : result.message });
    } finally {
      if (visit === this.visit) this.busy = false;
    }
  }

  private async remove(slot: SlotSummary): Promise<void> {
    const session = getSession(this);
    if (this.busy || !session) return;
    if (this.armedDelete !== slot.id) {
      // First press only arms the button; a second press on the same row deletes.
      this.armedDelete = slot.id;
      for (const row of this.rows) row.remove?.setLabel(row.slot?.id === slot.id ? 'Chắc?' : 'Xoá');
      this.message.setText(`Bấm "Chắc?" lần nữa để xoá "${slot.name}".`);
      return;
    }
    const visit = this.visit;
    this.busy = true;
    try {
      await session.deleteSlot(slot.id);
      if (visit === this.visit) this.scene.restart({ notice: `Đã xoá "${slot.name}".` });
    } catch {
      if (visit === this.visit) this.message.setText('Chưa xoá được bản lưu này, hãy thử lại.');
    } finally {
      if (visit === this.visit) this.busy = false;
    }
  }

  private turn(by: number): void {
    const l = savesLayout({ w: this.scale.width, h: this.scale.height }, this.rows.length);
    const pages = Math.max(1, Math.ceil(this.rows.length / l.perPage));
    this.page = Math.min(pages - 1, Math.max(0, this.page + by));
    this.layout();
  }

  private layout(): void {
    const l: SavesLayout = savesLayout({ w: this.scale.width, h: this.scale.height }, this.rows.length);
    const pages = Math.max(1, Math.ceil(this.rows.length / l.perPage));
    this.page = Math.min(this.page, pages - 1);
    const first = this.page * l.perPage;
    this.panel.resize(l.panel.w, l.panel.h);
    this.panel.image.setPosition(l.panel.x, l.panel.y);
    const centre = (r: Rect): [number, number] => [r.x + r.w / 2, r.y + r.h / 2];
    this.title.setPosition(...centre(l.title));
    this.message.setPosition(...centre(l.message)).setWordWrapWidth(l.message.w);
    const place = (b: Button | null, r: Rect): void => {
      if (!b) return;
      b.resize(r.w, r.h);
      b.container.setPosition(...centre(r));
    };
    place(this.back, l.back);
    place(this.prev, l.prev);
    place(this.next, l.next);
    this.prev.setVisible(pages > 1);
    this.next.setVisible(pages > 1);
    this.prev.setEnabled(this.page > 0);
    this.next.setEnabled(this.page < pages - 1);
    this.rows.forEach((row, i) => {
      const r = i >= first ? l.rows[i - first] : undefined;
      const shown = r !== undefined;
      for (const o of [row.bg.image, row.name, row.detail]) o.setVisible(shown);
      for (const b of [row.open, row.rename, row.remove]) b?.setVisible(shown);
      if (!r) return;
      row.bg.resize(r.row.w, r.row.h);
      row.bg.image.setPosition(r.row.x, r.row.y);
      fitText(row.name, fitName(row.slot?.name ?? AUTOSAVE_NAME, l.nameChars), r.text.w - 4);
      row.name.setPosition(r.text.x, r.text.y + 14);
      fitText(row.detail, fitName(slotDetail(row.info.king, row.info.year, row.info.savedAt, l.narrow), l.detailChars), r.text.w - 4);
      row.detail.setPosition(r.text.x, r.text.y + 31);
      place(row.open, r.open);
      place(row.rename, r.rename);
      place(row.remove, r.remove);
    });
  }
}
