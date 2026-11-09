import type { SlotRecord, SlotStore } from './slots';
import type { SaveEnvelope, SaveStore } from './types';

const copy = <T>(value: T): T => (value === null || value === undefined ? value : structuredClone(value));

/** Kho trong RAM: đọc và ghi đều sao chép sâu, nên sửa bản của người gọi không đổi dữ liệu đã lưu. */
export class MemorySaveStore implements SaveStore, SlotStore {
  private run: unknown = null;
  private meta: unknown = null;
  /** Bản lưu có tên theo id (thứ tự chèn không quyết định gì: danh sách được sắp lại ở `slotSummaries`). */
  private slots = new Map<string, unknown>();

  loadRun(): Promise<unknown> {
    return Promise.resolve(copy(this.run));
  }

  saveRun(save: SaveEnvelope): Promise<void> {
    this.run = copy(save);
    return Promise.resolve();
  }

  clearRun(): Promise<void> {
    this.run = null;
    return Promise.resolve();
  }

  loadMeta(): Promise<unknown> {
    return Promise.resolve(copy(this.meta));
  }

  saveMeta(profile: unknown): Promise<void> {
    this.meta = copy(profile);
    return Promise.resolve();
  }

  endRun(profile: unknown): Promise<void> {
    this.meta = copy(profile);
    this.run = null;
    return Promise.resolve();
  }

  listSlots(): Promise<unknown[]> {
    return Promise.resolve([...this.slots.values()].map(copy));
  }

  loadSlot(id: string): Promise<unknown> {
    return Promise.resolve(copy(this.slots.get(id) ?? null));
  }

  saveSlot(id: string, record: SlotRecord): Promise<void> {
    this.slots.set(id, copy(record));
    return Promise.resolve();
  }

  deleteSlot(id: string): Promise<void> {
    this.slots.delete(id);
    return Promise.resolve();
  }
}
