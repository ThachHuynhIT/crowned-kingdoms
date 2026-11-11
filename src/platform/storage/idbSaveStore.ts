/** Kho lưu IndexedDB (spec §9.3). Chỉ thuần trình duyệt: `src/game` không import file này. */
import { SAVE_DB, SLOT_KEY_PREFIX } from '../../data/save';
import type { SlotRecord, SlotStore } from '../../game/save/slots';
import type { SaveEnvelope, SaveStore } from '../../game/save/types';

const failure = (error: DOMException | null | undefined, fallback: string): Error =>
  error ?? new Error(fallback);

/** Mở cơ sở dữ liệu; từ chối ngay khi bị chặn hoặc lỗi (không hẹn giờ). */
const open = (factory: IDBFactory): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(SAVE_DB.name, SAVE_DB.version);
    } catch (e) {
      reject(e instanceof Error ? e : new Error('indexeddb open failed'));
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of [SAVE_DB.runStore, SAVE_DB.metaStore]) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(failure(request.error, 'indexeddb open failed'));
    request.onblocked = () => reject(new Error('indexeddb open blocked'));
  });

class IdbSaveStore implements SaveStore, SlotStore {
  constructor(private readonly db: IDBDatabase) {
    // Một tab khác nâng phiên bản hoặc trình duyệt đóng kết nối: đóng để không chặn họ.
    db.onversionchange = () => db.close();
  }

  /** Chạy một thao tác trên một kho; xong khi giao dịch `complete`, không phải khi request `success`. */
  private run<T>(store: string, mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return this.transact([store], mode, (tx) => work(tx.objectStore(store)));
  }

  /**
   * Một giao dịch trên `stores`; `work` đặt các request và trả request mà kết quả của nó được trả về.
   * Xong khi giao dịch `complete`; bị huỷ (abort) thì không request nào của nó có hiệu lực.
   */
  private transact<T>(stores: string[], mode: IDBTransactionMode, work: (tx: IDBTransaction) => IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let result: T;
      let tx: IDBTransaction | undefined;
      try {
        tx = this.db.transaction(stores, mode);
        const request = work(tx);
        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => reject(failure(request.error, 'indexeddb request failed'));
      } catch (e) {
        try {
          tx?.abort(); // a request placed before the throw must not commit on its own
        } catch {
          // already finished or aborted
        }
        reject(e instanceof Error ? e : new Error('indexeddb transaction failed'));
        return;
      }
      const done = tx;
      done.oncomplete = () => resolve(result);
      done.onabort = () => reject(failure(done.error, 'indexeddb transaction aborted'));
      done.onerror = () => reject(failure(done.error, 'indexeddb transaction failed'));
    });
  }

  async loadRun(): Promise<unknown> {
    return (await this.run(SAVE_DB.runStore, 'readonly', (s) => s.get(SAVE_DB.runKey))) ?? null;
  }

  async saveRun(save: SaveEnvelope): Promise<void> {
    await this.run(SAVE_DB.runStore, 'readwrite', (s) => s.put(save, SAVE_DB.runKey));
  }

  async clearRun(): Promise<void> {
    await this.run(SAVE_DB.runStore, 'readwrite', (s) => s.delete(SAVE_DB.runKey));
  }

  async loadMeta(): Promise<unknown> {
    return (await this.run(SAVE_DB.metaStore, 'readonly', (s) => s.get(SAVE_DB.metaKey))) ?? null;
  }

  async saveMeta(profile: unknown): Promise<void> {
    await this.run(SAVE_DB.metaStore, 'readwrite', (s) => s.put(profile, SAVE_DB.metaKey));
  }

  /** Hồ sơ + xoá ván trong MỘT giao dịch readwrite trên cả hai kho: cùng thành công hoặc cùng không có gì. */
  async endRun(profile: unknown): Promise<void> {
    await this.transact([SAVE_DB.runStore, SAVE_DB.metaStore], 'readwrite', (tx) => {
      tx.objectStore(SAVE_DB.metaStore).put(profile, SAVE_DB.metaKey);
      return tx.objectStore(SAVE_DB.runStore).delete(SAVE_DB.runKey);
    });
  }

  /** Mọi bản lưu có tên: khoá bắt đầu bằng `slot:` (vài chục khoá là cùng, nên đọc từng bản). */
  async listSlots(): Promise<unknown[]> {
    const keys = await this.run(SAVE_DB.runStore, 'readonly', (s) => s.getAllKeys());
    const slotKeys = keys.filter((k): k is string => typeof k === 'string' && k.startsWith(SLOT_KEY_PREFIX));
    const out: unknown[] = [];
    for (const key of slotKeys) out.push(await this.run(SAVE_DB.runStore, 'readonly', (s) => s.get(key)));
    return out.filter((v) => v !== undefined);
  }

  async loadSlot(id: string): Promise<unknown> {
    return (await this.run(SAVE_DB.runStore, 'readonly', (s) => s.get(`${SLOT_KEY_PREFIX}${id}`))) ?? null;
  }

  async saveSlot(id: string, record: SlotRecord): Promise<void> {
    await this.run(SAVE_DB.runStore, 'readwrite', (s) => s.put(record, `${SLOT_KEY_PREFIX}${id}`));
  }

  async deleteSlot(id: string): Promise<void> {
    await this.run(SAVE_DB.runStore, 'readwrite', (s) => s.delete(`${SLOT_KEY_PREFIX}${id}`));
  }
}

export async function openIdbSaveStore(factory: IDBFactory): Promise<SaveStore & SlotStore> {
  return new IdbSaveStore(await open(factory));
}
