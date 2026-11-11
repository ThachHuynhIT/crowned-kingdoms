# Tay bài lớn và trận không giới hạn giờ: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** tay 5 lá, chơi hoặc bán nhiều lá mỗi năm, Ra trận khi tay ≤ 2 lá; trận không thắng vì hết giờ, Cuồng Nộ cộng dồn, trần 5 phút tính thua; thanh máu công trình chỉ hiện khi đã bị đánh.

**Architecture:** luật nằm trong `src/game/run` (commands, fightRule) với hằng số trong `src/data`. Cờ `played` giữ nghĩa "đã chơi/bán ít nhất một lá năm nay", nên `RunState` không đổi dạng. Trận đổi trong `src/game/battle/step.ts` và `combat.ts`.

**Tech Stack:** TypeScript, Vitest, Phaser 4 (chỉ phần UI).

**Spec:** `docs/superpowers/specs/2026-11-10-hand-and-battle-length-design.md`

## Global Constraints

- `RUN.handSize = 5`, `RUN.battleHandMax = 2`, `DECREE_RULES.hand = RUN.handSize + 1`.
- `BATTLE.rageTick = 600`, `rageStackTicks = 300`, `rageStackDmgPct = 25`, `hardLimitTick = 3000` (tới đó = thua).
- `src/game` deterministic: không `Math.random`/trig/`**`; sort trước khi lặp Map/Set.
- Chữ cho người chơi là tiếng Việt; id tiếng Anh.
- Điện thoại không đổi bố cục ngoài việc tay có thể có 5–6 lá (thẻ tự co như hiện nay).

## Review Focus

- Tay có ≥ 3 lá mà không lá nào chơi được: người chơi vẫn phải bán được (bán luôn hợp lệ), nên không bị kẹt. Test trong Task 1.
- Bộ bài < 3 lá (sau hội đồng loại thẻ): tay ≤ 2 ngay đầu năm, Ra trận mở sẵn. Test trong Task 1.
- Ván lưu giữa năm bằng luật cũ (`played = true`, tay 2 lá): tải lại vẫn Ra trận được. Có test fixture tải lại sẵn; chạy lại.
- Perk Giờ Vàng: cộng tick vào cả `rageTick` lẫn `hardLimitTick`, các bậc Cuồng Nộ tính từ `rageTick` mới. Test trong Task 2.
- Trận boss chạm trần 5 phút: tính thua, boss không bị tính là đã hạ. Test trong Task 2.

---

### Task 1: Luật tay bài và lượt chơi

**Files:** `src/data/run.ts`, `src/data/decrees.ts`, `src/game/run/commands.ts`, `src/ui/planning/fightRule.ts`, `src/game/run/RunController.ts` (autoStart), các test cạnh từng file.

**Interfaces:**
- Produces: `canStartBattle(state: RunState): boolean` trong `src/game/run/turn.ts`, true khi `phase === 'planning'` và `hand.length <= RUN.battleHandMax`. Lệnh `startBattle` từ chối bằng `fail('handTooBig')` khi sai. `fightRule.ts` dùng nó.
- Lệnh `play`/`sell`/`discard` không còn từ chối `alreadyPlayed`; `reroll` vẫn từ chối khi `played`.

- [ ] Test: tay 5 lá → chơi 2, bán 1 → `startBattle` ok; với 3 lá trên tay → `handTooBig`.
- [ ] Test: đầu năm rút đủ 5; với Bàn Tay Thứ Tư rút đủ 6.
- [ ] Test: reroll sau lá đầu tiên → `alreadyPlayed`.
- [ ] Test: tay chỉ có lá không chơi được → bán được, rồi Ra trận.
- [ ] Code, rồi `npx vitest run src/game/run` xanh (sửa các test cũ đang giả định 1 lá/năm).
- [ ] Commit.

### Task 2: Trận không hết giờ, Cuồng Nộ cộng dồn

**Files:** `src/data/battle.ts`, `src/game/battle/step.ts`, `src/game/battle/combat.ts` (sát thương phe địch), `src/game/battle/targeting.ts` (`rageStacks(world): number`), `src/ui/help/mechanics.ts`.

**Interfaces:**
- Produces: `rageStacks(world)`: 0 trước `rageTick`, rồi `1 + floor((tick - rageTick) / rageStackTicks)`. Mọi đòn của phe địch nhân `1 + rageStackDmgPct × stacks / 100` (cộng với hệ số vào công trình đang có).

- [ ] Test: Ngai sống tới tick 3000 → `won === false`.
- [ ] Test: hết địch trước trần → thắng.
- [ ] Test: bậc ở tick 599/600/899/900 là 0/1/1/2; Giờ Vàng lùi cả hai mốc.
- [ ] Code, ghi lại baseline `endlessCompatibility`, `npx vitest run src/game` xanh.
- [ ] Commit.

### Task 3: Giao diện chuẩn bị và thanh máu

**Files:** `src/scenes/PlanningHudScene.ts`, `src/scenes/RealmScene.ts`, `src/ui/planning/HandView.ts` (6 ô), `src/ui/planning/cardFlyModel.ts`, `src/scenes/audioCues.ts`, renderer thanh máu công trình trong `src/render`.

- [ ] Các chỗ chặn theo `state.played` đổi sang "pha chuẩn bị và còn lá ở ô đó".
- [ ] Thẻ bay và tiếng chơi thẻ bắt theo lá biến khỏi tay vì được chơi (so tay trước/sau), có test model.
- [ ] Thanh máu công trình/Ngai ẩn khi máu còn đầy và chưa bị trúng đòn lần nào.
- [ ] Kiểm trình duyệt 1280×720: tay 5 lá, chơi 3 lá trong một năm, nút Ra trận sáng khi còn 2, thanh máu.
- [ ] Commit.

### Task 4: Bot và cân bằng

**Files:** `src/game/sim/bots/{greedy,random,scripted}.ts`, `src/data/battle.ts` / `src/data/scaling.ts` (sức địch), `docs/balance/2026-11-10-hand-rework-balance.md`.

- [ ] Bot chơi nhiều lá: chơi khi có nước có lợi, bán lá vô dụng khi tay > 2, vào trận khi tay ≤ 2.
- [ ] `npm run balance -- --king all --runs 500 --bot greedy --difficulty 0` đạt 35–65% mỗi vua, chênh lệch ≤ 15.
- [ ] Gate đầy đủ (`lint`, `typecheck`, `test`, `build`, test Python), cập nhật ROADMAP mục 5, 8, 9.
- [ ] Commit, push.
