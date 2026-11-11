/**
 * Kho lưu của phiên chơi: IndexedDB nếu dùng được, nếu không (hoặc khi một lần ghi / đọc hỏng)
 * chuyển một chiều sang RAM kèm đúng một cảnh báo. Mọi ghi đều sao chép vào RAM trước, nên
 * checkpoint mới nhất vẫn đọc lại được trong phiên dù đĩa không ghi được.
 */
import { STORAGE_WARNING_TEXT } from '../../data/save';
import { MemorySaveStore } from '../../game/save/MemorySaveStore';
import type { SlotRecord, SlotStore } from '../../game/save/slots';
import type { SaveEnvelope, SaveStore } from '../../game/save/types';
import { openIdbSaveStore } from './idbSaveStore';

export interface SaveStoreOptions {
  factory: IDBFactory | null;
  onWarning: (text: string) => void;
}

/** The browser store: a `SaveStore` that also says whether writes still reach the disk. */
export interface PersistenceAwareStore extends SaveStore, SlotStore {
  /** False when IndexedDB never opened or the store has fallen back to memory (data lives until the tab closes). */
  isPersistent(): boolean;
}

export async function createSaveStore(options: SaveStoreOptions): Promise<PersistenceAwareStore> {
  const mirror = new MemorySaveStore();
  let disk: (SaveStore & SlotStore) | null = null;
  let warned = false;

  const fallBack = (): void => {
    disk = null;
    if (warned) return;
    warned = true;
    options.onWarning(STORAGE_WARNING_TEXT);
  };

  if (options.factory) {
    try {
      disk = await openIdbSaveStore(options.factory);
    } catch {
      fallBack();
    }
  } else {
    fallBack();
  }

  /** Chạy trên đĩa nếu còn; lỗi thì bỏ đĩa và trả `undefined` để người gọi dùng bản RAM. */
  const onDisk = async <T>(op: (s: SaveStore & SlotStore) => Promise<T>): Promise<{ value: T } | null> => {
    if (!disk) return null;
    try {
      return { value: await op(disk) };
    } catch {
      fallBack();
      return null;
    }
  };

  return {
    isPersistent: () => disk !== null,
    async loadRun() {
      const r = await onDisk((s) => s.loadRun());
      if (!r) return mirror.loadRun();
      if (r.value === null) await mirror.clearRun();
      else await mirror.saveRun(r.value as SaveEnvelope);
      return mirror.loadRun();
    },
    async saveRun(save) {
      await mirror.saveRun(save);
      await onDisk((s) => s.saveRun(save));
    },
    async clearRun() {
      await mirror.clearRun();
      await onDisk((s) => s.clearRun());
    },
    async loadMeta() {
      const r = await onDisk((s) => s.loadMeta());
      if (!r) return mirror.loadMeta();
      await mirror.saveMeta(r.value);
      return mirror.loadMeta();
    },
    async saveMeta(profile) {
      await mirror.saveMeta(profile);
      await onDisk((s) => s.saveMeta(profile));
    },
    async endRun(profile) {
      await mirror.endRun(profile);
      await onDisk((s) => s.endRun(profile));
    },
    // Bản lưu có tên: đĩa là nguồn khi còn; RAM giữ bản sao để vẫn dùng được trong phiên nếu đĩa hỏng.
    async listSlots() {
      const r = await onDisk((s) => s.listSlots());
      if (!r) return mirror.listSlots();
      // Keep RAM in step with the disk, so a later fall-back still lists (and never reuses the ids of) these slots.
      for (const raw of r.value) {
        const id = (raw as { id?: unknown } | null)?.id;
        if (typeof id === 'string') await mirror.saveSlot(id, raw as SlotRecord);
      }
      return r.value;
    },
    async loadSlot(id) {
      const r = await onDisk((s) => s.loadSlot(id));
      if (!r) return mirror.loadSlot(id);
      if (r.value !== null && r.value !== undefined) await mirror.saveSlot(id, r.value as SlotRecord);
      return r.value;
    },
    async saveSlot(id, record) {
      await mirror.saveSlot(id, record);
      await onDisk((s) => s.saveSlot(id, record));
    },
    async deleteSlot(id) {
      await mirror.deleteSlot(id);
      await onDisk((s) => s.deleteSlot(id));
    },
  };
}
