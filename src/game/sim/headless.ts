/** Chạy trọn một ván không giao diện (spec §13.3): bot → applyCommand → mô phỏng trận. */
import { Rng, hashSeed } from '../../core/random';
import { RULES_G1, type Rules } from '../../data/rules';
import type { CardId, KingId, PerkId } from '../../data/types';
import { simulateBattle } from '../battle/step';
import { CONTENT } from '../cards/registry';
import type { Content } from '../cards/registry';
import { buildBattleSetup } from '../run/battleSetup';
import { applyCommand } from '../run/commands';
import type { RunCommand, RunState } from '../run/state';
import { newRun } from '../run/yearFlow';
import { randomBot } from './bots/random';
import type { Bot } from './bots/random';

export interface HeadlessOptions {
  seed: number;
  kingId: KingId;
  /** Luật ván; mặc định G1 (G2 truyền `RULES_G2`). */
  rules?: Rules;
  bot?: Bot;
  /** Lá meta đã mở (G4), truyền cho `newRun`. */
  unlockedCards?: readonly CardId[];
  /** Perk chọn lúc tạo ván (G4), truyền cho `newRun`. */
  perk?: PerkId | null;
  /** Độ khó Gai 0..5 (G4), truyền cho `newRun`. */
  difficulty?: number;
  /** Gọi đúng một lần sau mỗi lệnh thành công (bộ đếm cân bằng G5); không đổi ván. */
  onCommand?: (before: RunState, command: RunCommand, after: RunState) => void;
  /**
   * Vô tận (E4): dừng ở cuối năm N (sau trận và mọi lời mời, trước `advance`). Bắt buộc với luật Vô tận vì ván
   * đó chỉ kết thúc khi hết mạng; ván thường bỏ qua tuỳ chọn này thì chạy tới khi tự kết thúc như cũ.
   */
  stopAfterYears?: number;
  /** Trần số lệnh chống bot kẹt; mặc định 5000 (Vô tận: 200 × số năm). */
  maxCommands?: number;
}

export interface HeadlessResult {
  state: RunState;
  commands: number;
  /** `yearLimit` khi dừng vì `stopAfterYears`; vắng khi ván tự kết thúc. */
  stoppedBy?: 'yearLimit';
}

const MAX_COMMANDS = 5000;

export function runHeadless(opts: HeadlessOptions, content: Content = CONTENT): HeadlessResult {
  const bot = opts.bot ?? randomBot;
  const endless = opts.rules?.calendar === 'endless';
  const horizon = opts.stopAfterYears;
  if (horizon !== undefined && (!Number.isInteger(horizon) || horizon < 1)) {
    throw new Error(`runHeadless: the year horizon must be a positive integer, got ${horizon}`);
  }
  if (endless && horizon === undefined)
    throw new Error('runHeadless: an Endless run needs a year horizon (stopAfterYears)');
  const maxCommands = opts.maxCommands ?? (endless ? 200 * (horizon ?? 1) : MAX_COMMANDS);
  const rng = new Rng(hashSeed(`${opts.seed}:bot`));
  let state = newRun(opts.seed, opts.kingId, content, opts.rules ?? RULES_G1, {
    unlockedCards: opts.unlockedCards ?? [],
    perk: opts.perk ?? null,
    difficulty: opts.difficulty ?? 0,
  });
  let commands = 0;

  const apply = (cmd: RunCommand): void => {
    const r = applyCommand(state, cmd, content);
    if ('error' in r) {
      throw new Error(`runHeadless: illegal command ${JSON.stringify(cmd)}: ${r.error}`);
    }
    const before = state;
    state = r.state;
    commands += 1;
    opts.onCommand?.(before, cmd, state);
  };

  while (state.phase !== 'ended') {
    if (horizon !== undefined && state.phase === 'yearEnd' && state.year >= horizon) {
      return { state, commands, stoppedBy: 'yearLimit' };
    }
    if (commands >= maxCommands) throw new Error(`runHeadless: exceeded ${maxCommands} commands`);
    const cmd = bot(state, content, rng);
    apply(cmd);
    if (cmd.type === 'startBattle') {
      const result = simulateBattle(buildBattleSetup(state, content), []);
      apply({ type: 'battleResult', result });
    }
  }
  return { state, commands };
}
