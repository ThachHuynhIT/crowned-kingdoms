/**
 * Nhiều bản lưu (chủ dự án 09/11/2026): ngoài bản tự lưu (khoá `current` của kho `run`), người chơi lưu thêm tối đa
 * `MAX_SAVE_SLOTS` bản có tên và thời điểm lưu, trên máy. Thuần: không đọc giờ (thời điểm do `src/platform` đưa vào),
 * không chạm IndexedDB. Mọi thứ đọc từ đĩa đều được kiểm lại (`readSlot`); ván bên trong vẫn qua `decodeRun`.
 */
import type { RunMode } from '../../data/rules';
import { MAX_SAVE_SLOTS, SLOT_NAME_MAX } from '../../data/save';
import type { KingId } from '../../data/types';
import type { RunState } from '../run/state';
import type { SaveEnvelope } from './types';

export interface SlotSummary {
  readonly id: string;
  readonly name: string;
  /** Thời điểm lưu, mili giây kể từ 1970 (do `src/platform` đo). */
  readonly savedAt: number;
  readonly kingId: KingId;
  readonly year: number;
  readonly mode: RunMode;
}

export interface SlotRecord extends SlotSummary {
  readonly save: SaveEnvelope;
}

/** Kho các bản lưu có tên; bản tự lưu vẫn ở `SaveStore`. */
export interface SlotStore {
  listSlots(): Promise<unknown[]>;
  loadSlot(id: string): Promise<unknown>;
  saveSlot(id: string, record: SlotRecord): Promise<void>;
  deleteSlot(id: string): Promise<void>;
}

/** Tên người chơi gõ: bỏ khoảng trắng thừa, tối đa `SLOT_NAME_MAX` ký tự; rỗng → null. */
export const cleanSlotName = (input: string): string | null => {
  const name = input.replace(/\s+/g, ' ').trim().slice(0, SLOT_NAME_MAX);
  return name.length > 0 ? name : null;
};

/** Tên gợi ý: tên vua và năm. */
export const defaultSlotName = (kingName: string, year: number): string => `${kingName} — Năm ${year}`;

export const makeSlot = (id: string, name: string, savedAt: number, state: RunState, save: SaveEnvelope): SlotRecord => ({
  id,
  name,
  savedAt,
  kingId: state.kingId,
  year: state.year,
  mode: state.mode,
  save,
});

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Một bản ghi từ đĩa nếu đúng hình; sai (thiếu trường, kiểu lạ, tên rỗng) → null. Ván bên trong chưa được kiểm. */
export const readSlot = (raw: unknown): SlotRecord | null => {
  if (!isObject(raw)) return null;
  const { id, name, savedAt, kingId, year, mode, save } = raw;
  if (typeof id !== 'string' || id.length === 0) return null;
  if (typeof name !== 'string' || cleanSlotName(name) === null) return null;
  if (typeof savedAt !== 'number' || !Number.isFinite(savedAt)) return null;
  if (typeof kingId !== 'string' || typeof year !== 'number' || !Number.isInteger(year) || year < 1) return null;
  if (mode !== 'normal' && mode !== 'endless') return null;
  if (!isObject(save)) return null;
  return { id, name: cleanSlotName(name)!, savedAt, kingId: kingId as KingId, year, mode, save: save as unknown as SaveEnvelope };
};

/** Phần để hiện của một bản lưu (không kèm ván). */
export const summaryOf = (r: SlotRecord): SlotSummary => ({
  id: r.id,
  name: r.name,
  savedAt: r.savedAt,
  kingId: r.kingId,
  year: r.year,
  mode: r.mode,
});

/** Danh sách để hiện: chỉ bản đúng hình, mới nhất trước (hoà → id), không kèm ván. */
export const slotSummaries = (raws: readonly unknown[]): SlotSummary[] =>
  raws
    .map(readSlot)
    .filter((s): s is SlotRecord => s !== null)
    .sort((a, b) => b.savedAt - a.savedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(summaryOf);

/**
 * Id đã dùng của mọi bản trên đĩa, kể cả bản hỏng hình (review 2026-11-09): bản hỏng không bị bản mới ghi đè và vẫn
 * tính vào trần. Bản không đọc được id thì giữ chỗ bằng một id không bao giờ được cấp.
 */
export const slotIdsOf = (raws: readonly unknown[]): string[] =>
  raws.map((raw, k) => (isObject(raw) && typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : `?${k}`));

/** Id cho bản lưu mới: số nhỏ nhất chưa dùng; null khi đã đủ `MAX_SAVE_SLOTS` bản. */
export const nextSlotId = (used: readonly string[]): string | null => {
  if (used.length >= MAX_SAVE_SLOTS) return null;
  for (let n = 1; ; n++) {
    const id = `s${n}`;
    if (!used.includes(id)) return id;
  }
};
