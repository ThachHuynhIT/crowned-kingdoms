import type { Content } from '../cards/registry';
import type { RunState } from '../run/state';
import { encodeRun } from './codec';
import type { SaveStore, SessionPersistence } from './types';

/**
 * Xếp hàng các lần ghi checkpoint theo đúng thứ tự gọi (FIFO): lệnh A rồi B luôn lưu A rồi B dù A chậm.
 * Ván đã kết thúc không được lưu mà xoá ván đang lưu; `clearRun` / `endRun` cũng đi qua cùng hàng đợi,
 * nên không checkpoint nào gọi trước chúng có thể ghi sau chúng.
 */
export class SaveCoordinator implements SessionPersistence {
  private tail: Promise<void> = Promise.resolve();

  constructor(
    private readonly store: SaveStore,
    private readonly content: Content,
  ) {}

  checkpoint(state: RunState): Promise<void> {
    // Phong bì được dựng ngay lúc gọi: lệnh sau không đổi được thứ sắp ghi.
    const job: () => Promise<void> =
      state.phase === 'ended'
        ? () => this.store.clearRun()
        : ((envelope) => () => this.store.saveRun(envelope))(encodeRun(state, this.content));
    return this.enqueue(job);
  }

  /** Xoá ván đang lưu, sau mọi ghi đã xếp hàng. */
  clearRun(): Promise<void> {
    return this.enqueue(() => this.store.clearRun());
  }

  /** Ghi hồ sơ và xoá ván trong một giao dịch (`SaveStore.endRun`), sau mọi ghi đã xếp hàng. */
  endRun(profile: unknown): Promise<void> {
    return this.enqueue(() => this.store.endRun(profile));
  }

  private enqueue(job: () => Promise<void>): Promise<void> {
    const run = this.tail.then(job);
    this.tail = run.catch(() => undefined); // một lần ghi hỏng không làm kẹt hàng đợi
    return run;
  }

  flush(): Promise<void> {
    return this.tail;
  }
}
