/** Nối bus với RunState + BattleRunner: nhận `ui:command`, phát `run:*` / `battle:*` (spec §12.5). */
import type { EventBus } from '../../core/events';
import { SimClock, type GameSpeed } from '../../core/SimClock';
import { BattleRunner } from '../battle/BattleRunner';
import type { Content } from '../cards/registry';
import type { GameEvents } from '../events';
import { META_SAVE_FAILED_TEXT } from '../../data/save';
import { crownPoints } from '../meta/crowns';
import type { SessionPersistence, SettleOutcome } from '../save/types';
import { buildBattleSetup } from './battleSetup';
import { applyCommand } from './commands';
import { canStartBattle } from './turn';
import type { RunCommand, RunState } from './state';

/** Điểm tính tại chỗ khi không có hồ sơ để chấm (hoặc chấm hỏng: không được cộng). */
const localOutcome = (state: RunState, unlocks: string[]): SettleOutcome => {
  const breakdown = crownPoints(state);
  return { crownPoints: breakdown.total, breakdown, unlocks, credited: false };
};

/**
 * Tốc độ chơi (1×–3×) người chơi chọn lần gần nhất: trận sau và ván sau bắt đầu ở tốc độ này.
 * Chỉ ảnh hưởng nhịp hiển thị, không ảnh hưởng mô phỏng; tạm dừng không được nhớ.
 */
let rememberedSpeed: GameSpeed = 1;

export class RunController {
  private current: RunState;
  private active: BattleRunner | null = null;
  private readonly unsubscribe: (() => void)[];
  /** Hàng đợi lệnh khi có `persistence`: mỗi lệnh áp dụng, lưu xong rồi mới phát sự kiện. */
  private queue: Promise<void> = Promise.resolve();
  private disposed = false;

  private lastDamage: Readonly<Record<number, number>> | null = null;

  constructor(
    private readonly bus: EventBus<GameEvents>,
    private readonly content: Content,
    initial: RunState,
    private readonly persistence?: SessionPersistence,
  ) {
    this.current = initial;
    this.unsubscribe = [
      bus.on('ui:command', ({ command }) => this.handle(command)),
      bus.on('clock:speed', ({ speed }) => {
        if (speed !== 0 && this.active !== null) rememberedSpeed = speed;
      }),
      bus.on('battle:ended', ({ result }) => {
        if (this.active === null) return; // stray event: no battle in progress
        this.lastDamage = { ...(result.damageBySource ?? {}) };
        this.active?.dispose();
        this.active = null;
        this.handle({ type: 'battleResult', result });
      }),
    ];
  }

  get state(): RunState {
    return this.current;
  }

  /**
   * Damage per building uid in the last battle of this session (owner 11/11/2026: shown under buildings and in the
   * info box); null before the first battle. In memory only: a reload starts without it.
   */
  get lastBattleDamage(): Readonly<Record<number, number>> | null {
    return this.lastDamage;
  }

  get runner(): BattleRunner | null {
    return this.active;
  }

  /**
   * Kiểm tra tự vào trận cho trạng thái hiện tại (ví dụ đầu ván, khi không lá nào có mục tiêu).
   * Gọi sau khi scene đã đăng ký xong các sự kiện bus.
   */
  kickoff(): void {
    if (this.active !== null) return;
    if (this.current.phase === 'battle') this.startRunner(); // ván tải lại giữa trận: dựng lại trận từ tick 0
    else if (this.shouldAutoStart()) this.handle({ type: 'startBattle' });
  }

  /** Lưu trạng thái đầu của ván mới (không gọi khi tiếp tục ván cũ: không ghi đè checkpoint). */
  checkpointInitial(): Promise<void> {
    return this.persistence ? this.persistence.checkpoint(this.current).catch(() => undefined) : Promise.resolve();
  }

  /** Xong khi mọi lệnh đã nhận được xử lý và ghi. */
  async whenIdle(): Promise<void> {
    let seen: Promise<void>;
    do {
      seen = this.queue;
      await seen;
    } while (seen !== this.queue);
    await this.persistence?.flush();
  }

  update(deltaMs: number): void {
    this.active?.update(deltaMs);
  }

  dispose(): void {
    this.disposed = true; // lệnh đã xếp hàng vẫn được lưu, nhưng không phát sự kiện nữa
    for (const off of this.unsubscribe) off();
    this.unsubscribe.length = 0;
    this.active?.dispose();
    this.active = null;
  }

  private handle(command: RunCommand): void {
    if (this.disposed) return;
    if (!this.persistence) {
      this.process(command);
      return;
    }
    // A handler that throws must not poison the queue: log it and carry on with the next command.
    this.queue = this.queue.then(() => this.process(command)).catch((e: unknown) => {
      console.error('RunController: command failed', command.type, e);
    });
  }

  /** Áp dụng một lệnh; có `persistence` thì lưu xong mới phát `run:state` / bắt đầu trận. */
  private process(command: RunCommand): void | Promise<void> {
    const before = this.current.phase;
    const result = applyCommand(this.current, command, this.content);
    if ('error' in result) {
      if (!this.disposed) this.bus.emit('run:illegal', { reason: result.error });
      return;
    }
    this.current = result.state;
    const ended = result.state.phase === 'ended' && result.events.some((e) => e.type === 'runEnded');
    // Without a meta profile (no persistence, or none that settles) the score is still computed and shown.
    let outcome: SettleOutcome | null = null;
    const finish = (): void => {
      if (this.disposed) return;
      this.bus.emit('run:state', { state: this.current });
      for (const event of result.events) {
        if (event.type === 'runEnded') {
          // No outcome: no profile was consulted (no session), so there is nothing to say about crediting.
          const o = outcome ?? localOutcome(result.state, []);
          const credited = outcome === null ? null : outcome.credited;
          this.bus.emit('run:ended', { won: event.won, crownPoints: o.crownPoints, breakdown: o.breakdown, unlocks: o.unlocks, credited });
        }
      }
      if (command.type === 'setAutoFire') this.active?.setAutoFire(command.on);
      if (command.type === 'startBattle') this.startRunner();
      else if (this.shouldAutoStart()) this.handle({ type: 'startBattle' });
    };
    // Bật / tắt tự bắn giữa trận không đổi thứ cần lưu (tải lại sẽ dựng lại trận từ đầu).
    const save = this.persistence && !(command.type === 'setAutoFire' && before === 'battle');
    if (!save) {
      finish();
      return;
    }
    const persistence = this.persistence!;
    const write = async (): Promise<void> => {
      if (ended && persistence.settle) {
        // settle() scores the exact ended state AND ends the run save (one atomic endRun), so no checkpoint
        // follows. If it fails, the run save is kept: the next load replays to the same end and settles again.
        try {
          outcome = await persistence.settle(result.state);
        } catch (e) {
          console.error('RunController: settling the run failed', e);
          outcome = localOutcome(result.state, [META_SAVE_FAILED_TEXT]);
        }
        return;
      }
      await persistence.checkpoint(this.current).catch(() => undefined);
    };
    return write().then(finish);
  }

  private startRunner(): void {
    const setup = buildBattleSetup(this.current, this.content);
    const clock = new SimClock();
    clock.setSpeed(rememberedSpeed);
    this.active = new BattleRunner(setup, this.bus, clock);
    this.bus.emit('battle:started', { setup });
  }

  /** Trận luôn tự bắt đầu khi tay tới ngưỡng (10/11/2026), mọi luật; cờ `rules.autoStart` cũ không còn quyết định. */
  private shouldAutoStart(): boolean {
    return this.active === null && canStartBattle(this.current);
  }
}
