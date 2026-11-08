# G4 — Đủ 9 vua, perk, meta-progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chơi được cả 9 vua (Ngai, bị động, 27 perk), có hai thẻ trung lập meta, Điểm Vương Miện, thông thạo, mở khoá, độ khó Gai 0–5, hồ sơ meta lưu IndexedDB, màn Vương Miện, perk và độ khó ở Chọn vua.

**Architecture:** Nâng sáu `*_ENEMY` thành `KingDef` đầy đủ (thêm Ngai, perk), không viết lại thẻ G3. Perk là dữ liệu (`PerkDef` với hiệu ứng có kiểu đóng) áp ở hai chỗ cố định: lúc tạo ván (`newRun`) và lúc dựng trận (`buildBattleSetup`) — trận không bao giờ đọc meta. Meta là một module thuần trong `src/game/meta/` (công thức điểm, mở khoá, codec có migrator) và chỉ `src/platform/session.ts` đọc/ghi nó qua `SaveStore.loadMeta/saveMeta` đã có sẵn. Ván chụp lại phần meta nó cần (perk đã chọn, độ khó, thẻ meta đã mở) vào `RunState` v6 để thưởng/tải lại deterministic.

**Tech Stack:** TypeScript strict · Phaser 4 · Vite · Vitest · IndexedDB native (`fake-indexeddb` trong test).

**Spec:** `docs/superpowers/specs/2026-10-16-crowned-kingdoms-design.md` §3.1, §3.4, §3.10, §5.1, §6.1, §6.3–6.11 (Ngai, bị động, perk), §8.6, §8.8, §9.1–9.3, §10.2, §10.3, §10.8, §10.9, §14 G4. Bố cục Chọn vua theo bản thiết kế lại đã được chủ dự án duyệt (`docs/superpowers/specs/2026-10-28-king-select-redesign-design.md`: băng chuyền + trang chi tiết), **không** theo lưới 3×3 cũ của §10.3. Bàn cờ theo `2026-11-06-iso-board-redesign-design.md` (Ngai ở plot 2).

**Ngoài phạm vi:** art isometric/chân dung mới cho sáu vua (mỗi loại art cần chủ dự án duyệt mẫu; thẻ và Ngai của họ dùng art sinh bằng code đang có), cân bằng số (G5), `SettingsScene` (G5; trường `settings` trong meta chỉ được tạo với giá trị mặc định).

## Global Constraints

- Lớp: `src/core`, `src/data`, `src/game` không import Phaser hay `scenes/render/ui/platform/audio`; `src/data` không import `src/game` (ESLint `no-restricted-imports`). Meta thuần nằm ở `src/game/meta/`; chỉ `src/platform` chạm IndexedDB.
- Deterministic (§8.12): không `Math.random`, `Date.now`, `performance.now`, `Math.hypot/sin/cos/tan/atan2/exp/log/pow` trong `src/game|data|core`; ngẫu nhiên chỉ qua `Rng`; không để thứ tự `Map`/`Set` quyết kết quả (sắp theo id). Trận không đọc meta, chỉ đọc `BattleSetup`.
- Mọi con số gameplay ở `src/data/*` (perk, giá mở khoá, mốc thông thạo, công thức điểm). Giá trị chép đúng spec:
  - `RUN.difficultyLevels = 5`, `difficultyBudgetStep = 0.1`, `difficultyCrownStep = 0.2`, `maxLives = 4`.
  - Điểm: `round((completedYears × 1 + conquered × 3 + bossesWon × 5 + (won ? 20 : 0)) × (1 + 0.2 × gai))`; tối đa ở Gai 0 = 83.
  - Mở vua: `grove`, `tide` 25 · `forge`, `clock` 40 · `moon` 60 · `nomad` 80 **và** `wins` tổng ≥ 1. `wheat`, `stone`, `arcane` mở sẵn.
  - Perk 1/2/3 mở khi thông thạo vua ≥ 10 / 30 / 60 (không tốn số dư). `neutral_duplicate` 15 điểm, `neutral_royal_seal` 20 điểm. Gai d (1..5) mở khi đã thắng ở Gai d − 1 với bất kỳ vua nào.
  - Chọn vua: tối đa 1 perk đã mở (hoặc không) và một độ khó đã mở.
- Hình học sau iso (đã có test `src/game/cards/geometryScale.test.ts`): tầm công trình/Ngai = spec px × 1.5 viết bằng `cells(specPx / 32 × 0.75)`; tốc độ đạn và tốc độ di chuyển × `SPEC_MOVE_SCALE` (= 2). Ngai mới phải theo đúng quy ước này (ví dụ `wheat_throne` tầm 72 → `cells(1.6875)`, đạn 8 → 16).
- Ô "(2,1)" trong perk của spec = plot `7` (col 2, row 1): vẫn là ô ngay trước Ngai (plot 2) và đã mở sẵn.
- Lưu (§9.3): `RUN_SAVE_VERSION` 5 → 6 cần migrator trong `src/game/save/migrate.ts` + fixture test. `META_SAVE_VERSION = 1`; meta **không bao giờ bị xoá**: mọi dữ liệu meta hỏng/thiếu trường được sửa về mặc định từng trường, không thay cả hồ sơ.
- Chữ người chơi thấy là tiếng Việt, dùng `FONT_UI`; id code tiếng Anh. UI: `createPanel`, `createButton`, `ContentBox`, `Tooltip`; vùng chạm ≥ 44×44; desktop 1280×720, mobile 375×812, `width ≥ 768` dùng bố cục desktop; tính lại vị trí trong `layout()`; reset trường per-game ở đầu `create()`.
- Mỗi task kết thúc bằng (Git Bash): `npm run lint < /dev/null && npm run typecheck < /dev/null && npm test < /dev/null && npm run build < /dev/null`, tất cả exit 0.
- Git: nhánh `g4-kings-meta` từ `develop` → PR vào `develop`. Không push thẳng `main`/`develop`. Commit kết thúc bằng dòng `Co-Authored-By` theo hướng dẫn phiên.
- Chủ dự án hiện không chơi thử được: mọi task có scene phải tự kiểm bằng trình duyệt preview (`.claude/launch.json` `dev`) ở 1280×720 và 375×812, console không lỗi, và đính ảnh chụp vào PR.

## Review Focus

1. **Tải lại ván cũ (save v5) sau khi cập nhật** → ván chạy tiếp như cũ: `perk = null`, `unlockedCards = []` (thẻ meta không vào bể thưởng), độ khó giữ nguyên. Test: fixture v5 trong Task 4.
2. **Hồ sơ meta hỏng, thiếu trường, hoặc của bản mới hơn** → không mất tiến trình: trường hỏng về mặc định, trường tốt giữ nguyên; bản `version` cao hơn thì dùng chế độ chỉ đọc (không ghi đè). Test: `decodeMeta` trong Task 8, `session` trong Task 9.
3. **Ván kết thúc rồi tải lại trang ngay** → Điểm Vương Miện chỉ cộng đúng một lần (ghi meta trước, xoá ván sau; ván đã chấm điểm thì không chấm lại). Test: Task 9.
4. **Tải lại giữa trận hoặc giữa pha lập kế hoạch khi có perk / Lều Di Động** → hiệu ứng perk vẫn áp, số lần dời miễn phí đã dùng không reset. Test: ma trận resume Task 9 + Task 6.
5. **Bấm mở khoá khi không đủ điểm hoặc bấm hai lần** → không trừ điểm âm, không mở hai lần, nút cập nhật ngay. Test: `unlockKing`/`unlockCard` Task 8, model UI Task 12.

---

## Phần G4a — Sáu vua chơi được

### Task 1: Sáu vua thành `KingDef` đầy đủ (Ngai + blurb), registry 9 vua

**Files:**
- Modify: `src/data/kings/grove.ts`, `tide.ts`, `forge.ts`, `clock.ts`, `moon.ts`, `nomad.ts` (thêm `GROVE: KingDef` … ; giữ `*_ENEMY` = `enemyFromKing(X)` để code G3 không đổi)
- Modify: `src/data/kings/index.ts` (`PLAYABLE_KINGS: readonly KingDef[]` = 9 vua theo `ALL_KINGS`; giữ `KINGS_G2` cho test cũ), `src/data/rules.ts` (`PLAYABLE_KINGS_G2` giữ nguyên cho `RULES_G2`)
- Modify: `src/game/cards/registry.ts` (`kings()` trả 9 vua; thẻ Ngai của 9 vua vào `allCards`)
- Modify: `src/data/types.ts` (thêm `CustomEffectId` cho các bị động mới, xem Task 2/3)
- Test: `src/game/cards/registry.test.ts`, `src/game/cards/geometryScale.test.ts`, `src/game/run/calendar.test.ts`, `src/game/save/codec.test.ts`

**Interfaces:**
- Produces: `PLAYABLE_KINGS: readonly KingDef[]` (9, thứ tự `ALL_KINGS`); `CONTENT.king(id)` không còn ném cho sáu vua mới; `CONTENT.kings().length === 9`.

Ngai (chép §6.6–6.11, quy đổi hình học theo Global Constraints):

| id | HP | Giáp | Đòn |
|---|---|---|---|
| `grove_throne` | 320 | 0 | 8 vật lý, tầm 64, nhịp 10, đạn 7; trúng: độc 1/s 30 tick, tối đa 1 lớp |
| `tide_throne` | 300 | 0 | 12 vật lý, `splash 10`, tầm 72, nhịp 16, đạn 6; trúng: đẩy lùi 8 |
| `forge_throne` | 340 | 0.1 | 9 lửa, tầm 64, nhịp 12, đạn 7; trúng: bỏng 2/s 30 tick |
| `clock_throne` | 300 | 0.1 | 8 vật lý, tầm 72, nhịp 12, đạn 8 |
| `moon_throne` | 240 | 0 | 10 phép, tầm 72, nhịp 12, đạn 8 |
| `nomad_throne` | 300 | 0 | 9 vật lý, tầm 72, nhịp 10, đạn 8 |

Tên Ngai và tên bị động lấy nguyên văn từ spec (ví dụ "Ngai Cổ Thụ", bị động "Sinh Trưởng"); `textVi` theo mẫu của `wheat_throne`. `blurbVi` một dòng do implementer viết theo tiêu đề §6.x (ví dụ Rừng Xanh: "Mạnh dần theo năm: thú rừng và cây hồi máu."). `passive` để `[]` ở task này; Task 2–3 điền.

- [ ] **Step 1: Viết test hỏng.**
  - `registry.test.ts`: `it('registers all nine kings with a throne each')` — `CONTENT.kings().map(k => k.id)` bằng `ALL_KINGS`; với mỗi vua, `CONTENT.card(\`${id}_throne\`).kind === 'throne'`; mỗi vua có 9 thẻ (4 `common`, 3 `uncommon`, 2 `rare`).
  - `calendar.test.ts`: `startDeck(CONTENT.king(id)).length === 11` cho cả 9 vua.
  - `geometryScale.test.ts`: thêm 6 Ngai vào oracle (tầm spec px, tốc độ đạn spec) để kiểm quy đổi.
  - `codec.test.ts`: một save v5 có `contentHash` của bộ nội dung cũ vẫn `decodeRun` → `ok` (thêm id mới không làm ván cũ không tương thích).
- [ ] **Step 2:** `npx vitest run src/game/cards src/game/run/calendar.test.ts src/game/save < /dev/null` → FAIL ở các test mới.
- [ ] **Step 3:** Thêm dữ liệu Ngai + `KingDef` + registry như bảng trên.
- [ ] **Step 4:** Chạy lại → PASS; chạy full gate.
- [ ] **Step 5:** Commit `feat(kings): six new kings get thrones and join the registry (G4)`.

### Task 2: Bị động Ngai trong trận — Rừng Xanh, Lò Rèn, Đồng Hồ, Thuỷ Triều, Ánh Trăng

**Files:**
- Modify: `src/data/kings/{grove,forge,clock,tide,moon}.ts` (`passive`)
- Modify: `src/game/cards/custom/{grove,forge,clock,tide,moon}.ts` + `custom/index.ts` (chỉ những bị động không biểu diễn được bằng `EffectDef` có sẵn)
- Modify (nếu cần): `src/game/run/battleSetup.ts`, `src/game/battle/behaviours.ts`
- Test: `src/game/cards/thronePassives.test.ts` (mới)

**Interfaces:**
- Consumes: `StatHandler`, `IncomeHandler` (`src/game/cards/custom/types.ts`); `EffectDef` có sẵn: `stat` (scope `board`, `filter`), `rampAttackSpeed`, `killGold`, `summonOnKill`, `summonEvery`.
- Produces: `CustomEffectId` mới `'grove_growth'`, `'moon_soul_harvest'` (và chỉ những cái thật sự cần).

Giá trị (`a/b/c/d/e` theo cấp Ngai):
- **Sinh Trưởng** (`grove`): công trình tag `grove` +2/2/3/3/4% HP và DMG mỗi năm tuổi, tối đa +60%. Tuổi = `year − placedYear + ageBonus`.
- **Lửa Tôi** (`forge`): công trình cấp ≥ 3 +10/10/15/15/20% DMG.
- **Lên Dây** (`clock`): mọi lính và tháp của mình +0.5/0.6/0.7/0.8/1.0% tốc đánh mỗi giây, tối đa +40%.
- **Chiến Lợi Phẩm** (`tide`): mỗi 10 địch bị hạ trong trận +1 vàng, tối đa 3/3/4/4/5 vàng mỗi trận.
- **Thu Hồn** (`moon`): cứ mỗi 6/6/5/5/4 Hồn triệu hồi 1 `wraith` tại Ngai, tối đa 20 mỗi trận (Hồn = mỗi lính mình chết, kể cả triệu hồi).

- [ ] **Step 1: Viết test hỏng** trong `thronePassives.test.ts` (dùng `testing/fixtures.ts` dựng `RunState` + `buildBattleSetup` + `BattleRunner`):
  - `grove_growth`: `wolf_den` đặt năm 1, Ngai cấp 1, năm 11 → `effectiveStats` DMG ×1.20; cùng công trình tuổi 40 → kẹp ×1.60; công trình không tag `grove` → ×1.00.
  - `forge_tempered`: tháp cấp 3, Ngai cấp 5 → DMG ×1.20; tháp cấp 2 → ×1.00.
  - `clock_windup`: Ngai cấp 1, sau 300 tick tháp có tốc đánh +15%; sau 900 tick kẹp +40%.
  - `tide_spoils`: trận hạ 47 địch, Ngai cấp 1 → `battleResult.gold` có thêm 3 (kẹp), Ngai cấp 5 → thêm 4.
  - `moon_soul_harvest`: 13 lính mình chết, Ngai cấp 1 → đúng 2 `wraith` sinh tại Ngai; Ngai cấp 5 (4 Hồn) với 100 lính chết → đúng 20.
  - Mỗi test chạy `BattleRunner` hai lần, so `hashWorld` bằng nhau (deterministic).
- [ ] **Step 2:** Chạy → FAIL.
- [ ] **Step 3:** Ưu tiên `EffectDef` có sẵn (Lửa Tôi = `stat` + filter cấp nếu filter hỗ trợ; Lên Dây = `rampAttackSpeed` scope board; Chiến Lợi Phẩm = `killGold`); chỉ dùng `custom` cho `grove_growth` và `moon_soul_harvest`. Giá trị theo cấp Ngai là `PerLevel` trong `src/data/kings/*.ts`.
- [ ] **Step 4:** PASS + full gate (gồm `determinism.test.ts`, `benchmark.test.ts`).
- [ ] **Step 5:** Commit `feat(kings): throne passives for grove, forge, clock, tide and moon (G4)`.

### Task 3: Lều Di Động — dời miễn phí của Vua Du Mục

**Files:**
- Modify: `src/game/run/state.ts` (`RunCommand` thêm `{ type: 'freeMove'; from: number; to: number }`; `RunState.freeMovesUsed: number`)
- Modify: `src/game/run/commands.ts`, `src/game/run/yearFlow.ts` (reset `freeMovesUsed = 0` đầu năm)
- Modify: `src/data/kings/nomad.ts` (`passive: [{ type: 'custom', id: 'nomad_mobile_camp' }]`, số lần `[1, 1, 2, 2, 2]` theo cấp Ngai)
- Modify: `src/game/cards/custom/nomad.ts` (hàm `freeMovesAllowed(state, content): number`; Đoàn Lữ Hành `+1 vàng mỗi lần dời, tối đa 3/năm` cũng tính lượt dời miễn phí)
- Test: `src/game/run/freeMove.test.ts` (mới)

**Interfaces:**
- Produces: `freeMovesAllowed(state: RunState, content: Content): number`; lệnh `freeMove`; trường `freeMovesUsed` (được lưu, Task 4 thêm vào codec/migrate).

Luật: chỉ ở pha `planning`, chỉ khi `kingId === 'nomad'`; dời công trình (không phải Ngai) sang ô **đã mở và kề cạnh** (đổi chỗ nếu có); đặt `movedYear = year` cho công trình được dời (và công trình bị đổi chỗ); không tính là chơi thẻ (`played` không đổi); từ Ngai cấp 3: 2 lần/năm; perk "Nhổ Trại Nhanh" +1 (Task 5).

- [ ] **Step 1: Test hỏng** `freeMove.test.ts`:
  - Ngai cấp 1: lần 1 ok, lần 2 trả `IllegalReason` mới `'noFreeMove'`; năm sau dùng lại được.
  - Ô không kề → `'notAdjacent'`; ô khoá → `'locked'`; dời Ngai → `'throne'`; vua khác → `'wrongKing'` (lý do mới).
  - Đổi chỗ hai công trình giữ cấp, bùa, `placedYear`; cả hai có `movedYear = year`.
  - `played` vẫn `false` sau `freeMove`; vẫn chơi được 1 thẻ.
  - Có `nomad_caravan` trên bàn: mỗi lần dời +1 vàng, tối đa 3 trong năm (đếm chung với `neutral_move`/`nomad_relocate`).
- [ ] **Step 2:** FAIL. **Step 3:** cài đặt; thêm `'noFreeMove' | 'wrongKing'` vào `IllegalReason` và câu tiếng Việt cho lý do ở chỗ đang dịch các lý do khác.
- [ ] **Step 4:** PASS + gate. **Step 5:** Commit `feat(nomad): free relocation each planning phase (G4)`.

### Task 4: `RunState` v6 — perk, thẻ meta đã mở, lượt dời miễn phí

**Files:**
- Modify: `src/game/run/state.ts` (`RUN_SAVE_VERSION = 6`; thêm `perk: PerkId | null`, `unlockedCards: CardId[]`, `freeMovesUsed` từ Task 3)
- Modify: `src/game/run/yearFlow.ts` — `newRun(seed, kingId, content, rules = RULES_G1, options: NewRunOptions = {})`
- Modify: `src/game/save/migrate.ts` (5 → 6), `src/game/save/codec.ts` (validate trường mới)
- Modify: `src/data/types.ts` (`PerkId`, `PerkDef` — xem Task 5; ở task này chỉ cần kiểu id)
- Test: `src/game/save/migrate.test.ts`, `src/game/save/codec.test.ts`, `src/game/run/yearFlow.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface NewRunOptions {
    perk?: PerkId | null;        // mặc định null
    difficulty?: number;         // 0..RUN.difficultyLevels, mặc định 0
    unlockedCards?: readonly CardId[]; // thẻ meta đã mở lúc bắt đầu ván, mặc định []
  }
  ```
  `newRun` kẹp `difficulty` vào `[0, RUN.difficultyLevels]`, sắp `unlockedCards` theo id, ném lỗi nếu `perk` không thuộc vua đã chọn.

- [ ] **Step 1: Test hỏng.**
  - `migrate.test.ts`: fixture v5 (chép từ fixture hiện có) → v6 có `perk: null`, `unlockedCards: []`, `freeMovesUsed: 0`, mọi trường khác giữ nguyên.
  - `codec.test.ts`: v6 có `perk` không tồn tại → `incompatible`; `unlockedCards` chứa id lạ → `incompatible`; `difficulty: 7` → `incompatible`.
  - `yearFlow.test.ts`: `newRun(1, 'wheat', CONTENT, RULES_FULL, { difficulty: 3 }).difficulty === 3`; `{ perk: 'stone_p1' }` với `wheat` → ném lỗi.
- [ ] **Step 2–4:** FAIL → cài đặt → PASS + gate (gồm `src/platform/resumeIntegration.test.ts`).
- [ ] **Step 5:** Commit `feat(save): run state v6 with perk, meta cards and free moves (G4)`.

### Task 5: 27 perk — dữ liệu và áp dụng

**Files:**
- Modify: `src/data/types.ts` (`PerkDef`, `PerkEffect`), `src/data/kings/*.ts` (mỗi `KingDef.perks: readonly [PerkDef, PerkDef, PerkDef]`)
- Create: `src/game/run/perks.ts` — `applyStartPerk(state, content): RunState` (gọi trong `newRun`) và `perkBattleMods(state, content): PerkBattleMods` (gọi trong `buildBattleSetup`)
- Modify: `src/game/run/battleSetup.ts`, `src/game/battle/types.ts` (`BattleSetup.perk?: PerkBattleMods`), các hệ trận đọc mod (statuses/combat/behaviours/step)
- Modify: `src/game/run/commands.ts` (đổi bài miễn phí), `src/game/run/rewards.ts` (thua vẫn nhận vàng), `src/game/run/board.ts` (giới hạn stack bùa)
- Test: `src/game/run/perks.test.ts` (mới, một `describe` mỗi vua), `src/game/cards/perkCoverage.test.ts` (mới)

**Interfaces:**
- Produces:
  ```ts
  export type PerkId = `${KingId}_p${1 | 2 | 3}`;
  export interface PerkDef { id: PerkId; nameVi: string; textVi: string; effects: readonly PerkEffect[] }
  ```
  `PerkEffect` là union đóng; implementer đặt tên các biến thể, nhưng mỗi perk dưới đây phải biểu diễn bằng dữ liệu, không `if (perk === ...)` rải trong code trận.

Perk (id → hiệu ứng, chép §6):

| id | Tên | Hiệu ứng |
|---|---|---|
| `wheat_p1` | Hạt Giống Tốt | bắt đầu có `wheat_field` cấp 1 ở plot 7 |
| `wheat_p2` | Thuế Nhẹ | lần đổi bài đầu mỗi năm miễn phí (lần sau tính từ `rerollCost(1)`) |
| `wheat_p3` | Toàn Dân Cầm Giáo | `militia`, `peasant` +10 HP, +1 DMG (flat, cộng trước %) |
| `stone_p1` | Nền Móng Vững | Ngai +200 HP (flat) |
| `stone_p2` | Đá Gọi Đá | bắt đầu có `stone_catapult` cấp 1 ở plot 7 |
| `stone_p3` | Tường Không Đổ | mọi công trình +30% máu |
| `arcane_p1` | Sách Phép Dày | giới hạn stack Bùa mỗi công trình = 6 |
| `arcane_p2` | Bùa Đầu Mùa | Ngai bắt đầu với 1 stack `arcane_spark_rune` |
| `arcane_p3` | Ma Lực Dồi Dào | hồi chiêu Can Thiệp −30% |
| `grove_p1` | Rễ Từ Trước | công trình `grove` đặt mới có `ageBonus = 2` |
| `grove_p2` | Sói Đầu Đàn | `grove_wolf_den` +1 sói ở mọi cấp (3/4/5/6/7 → 4/5/6/7/8; **cách đọc của Claude** cho "+1 sói mỗi cấp") |
| `grove_p3` | Đất Lành | Ngai hồi 1% HP tối đa mỗi giây trong trận |
| `tide_p1` | Túi Đầy | +5 vàng khởi đầu |
| `tide_p2` | Gió Thuận | mọi đẩy lùi +50% |
| `tide_p3` | Chuộc Tù | thua trận vẫn nhận `floor(battleGold(year) / 2)` |
| `forge_p1` | Than Hồng | mọi sát thương bỏng +30% |
| `forge_p2` | Học Việc | bắt đầu có `forge_smithy` cấp 1 ở plot 7 |
| `forge_p3` | Thép Tốt | mọi lính +0.1 giáp |
| `clock_p1` | Dây Cót Căng | mọi tăng tiến lên dây trước 5 s |
| `clock_p2` | Bánh Răng Dự Phòng | bắt đầu có `clock_gear_tower` cấp 1 ở plot 7 |
| `clock_p3` | Giờ Vàng | `BATTLE.rageTick` và `hardLimitTick` +150 tick |
| `moon_p1` | Hồn Đói | số Hồn cần cho Thu Hồn −2 |
| `moon_p2` | Trăng Non | bộ bài khởi đầu thêm 1 `moon_blood_pact` |
| `moon_p3` | Mạng Thứ Tư | bắt đầu với `RUN.maxLives` mạng, Ngai −20% HP |
| `nomad_p1` | Vó Ngựa | lính `cavalry` +10% tốc và +10% DMG |
| `nomad_p2` | Thảo Nguyên Rộng | bắt đầu với hai ô ngoài đã mở: plot 10 (0,2) và plot 14 (4,2) — **quyết định của Claude**: spec ghi (2,0) và (2,4) nhưng (2,0) giờ là ô Ngai; chọn hai ô giữa mép tây/đông cho đối xứng; chủ dự án có thể đổi |
| `nomad_p3` | Nhổ Trại Nhanh | Lều Di Động +1 lần mỗi năm |

Tên/`textVi` tiếng Việt chép từ spec; `textVi` có thể dùng placeholder `{…}` như thẻ.

- [ ] **Step 1: Test hỏng.**
  - `perkCoverage.test.ts`: mỗi vua đúng 3 perk, id `${king}_p1..3`, mọi `PerkId` xuất hiện trong `perks.test.ts` (đọc file test như `cardCoverage.test.ts` đang làm).
  - `perks.test.ts`, mỗi perk ít nhất một assertion về số đúng bảng, ví dụ:
    - `wheat_p1`: `newRun(..., { perk: 'wheat_p1' }).plots[7].building.cardId === 'wheat_field'`, cấp 1, `placedYear` 1.
    - `wheat_p2`: năm 1 đổi bài lần đầu tốn 0 vàng, lần hai tốn `rerollCost(1)` = 1; năm 2 lại miễn phí lần đầu; cộng dồn với sắc lệnh Phường Hội Thương Nhân (lượt miễn phí cộng thêm, không thay).
    - `wheat_p3`: setup lính `militia` cấp 1 HP 42, DMG 6 (trước mọi %).
    - `stone_p1`: Ngai `stone` cấp 1 HP 650. `moon_p3`: `lives === 4`, Ngai HP 192.
    - `arcane_p1`: gắn bùa thứ 5 và 6 hợp lệ, thứ 7 → `'stacksFull'` (lý do đang dùng).
    - `arcane_p3`: `intervention.cooldownTicks` = gốc × 0.7 (làm tròn như sắc lệnh đang làm); cộng với sắc lệnh Phản Xạ Nhanh theo cùng quy tắc nhân.
    - `tide_p3`: thua trận năm 10 nhận `floor(6 / 2) = 3` vàng. `tide_p2`: đẩy lùi Ngai Thuỷ Triều 8 → 12.
    - `clock_p3`: trận không có địch nào chết vẫn kết thúc ở tick 1050 (hard limit 900 + 150).
    - `moon_p1`: Ngai cấp 1 cần 4 Hồn. `nomad_p3`: Ngai cấp 1 được 2 lần dời miễn phí. `nomad_p2`: plot 10, 14 `unlocked`.
    - `grove_p2`: `grove_wolf_den` cấp 2 sinh 5 sói. `forge_p1`: bỏng 2/s → 2.6/s (sát thương tổng sau 30 tick).
  - Với mỗi perk trận: chạy hai lần, `hashWorld` bằng nhau.
- [ ] **Step 2:** FAIL. **Step 3:** cài đặt `PerkDef`/`PerkEffect`, `applyStartPerk`, `perkBattleMods`; `BattleSetup.perk` là dữ liệu thuần (không tham chiếu `RunState`).
- [ ] **Step 4:** PASS + gate (benchmark không chậm hơn 10%).
- [ ] **Step 5:** Commit `feat(kings): the 27 perks (G4)`.

### Task 6: Hai thẻ trung lập meta

**Files:**
- Modify: `src/data/neutral.ts` (`neutral_duplicate`, `neutral_royal_seal`, cả hai `rarity: 'rare'`, `unlock: 'meta'`)
- Modify: `src/game/run/rewards.ts` (bể thưởng trung lập chỉ gồm thẻ không có `unlock`, cộng thẻ có trong `state.unlockedCards`)
- Modify: `src/game/cards/custom/neutral.ts` hoặc dùng `TomeAction` có sẵn
- Test: `src/game/cards/neutralMeta.test.ts` (mới), `src/game/run/rewards.test.ts`

Hiệu ứng (§6.1): **Nhân Bản** (`buildingThenPlot`) — đặt bản sao một công trình (không phải Ngai; cùng cấp, **không** Bùa, `placedYear = year`, `counters = {}`) lên ô trống đã mở. **Ấn Triện** (`none`) — Ngai +1 cấp (kẹp `RUN.maxLevel`; ở cấp 5 → lý do `'maxLevel'`).

- [ ] **Step 1: Test hỏng:** bể thưởng không có hai thẻ khi `unlockedCards = []`; có khi đã mở; Nhân Bản lên ô có nhà → `'occupied'`, nhân bản Ngai → `'throne'`; bản sao không mang bùa; Ấn Triện cấp 5 → `'maxLevel'`; `cardCoverage.test.ts` vẫn xanh.
- [ ] **Step 2–4:** FAIL → cài đặt → PASS + gate.
- [ ] **Step 5:** Commit `feat(cards): duplicate and royal seal meta cards (G4)`.

### Task 7: Headless 9 vua × 3 seed

**Files:**
- Modify: `src/game/sim/fullRun.test.ts` (ma trận 9 vua × seed 1/2/3, `RULES_FULL`; ván thứ hai cùng seed cho cùng `hash`)
- Modify: `src/game/sim/bots/random.ts` (sửa lỗi có từ trước: bot chọn `moon_eclipse_pact` khi còn 1 mạng → phải bỏ qua nước đi bị `applyCommand` trả `lastLife`, như mọi `IllegalReason`)
- Modify: `src/game/sim/bots/random.ts` / `scripted.ts` để bot dùng `freeMove` khi là Du Mục (tuỳ chọn theo xác suất cố định từ `Rng`)
- Test: chính các file trên; thêm test hồi quy `random.test.ts` cho ca `lastLife`

- [ ] **Step 1:** Test hồi quy `lastLife` hỏng (dựng state Ánh Trăng 1 mạng, tay chỉ có `moon_eclipse_pact` + một thẻ khác) → bot không bao giờ trả lệnh bất hợp lệ.
- [ ] **Step 2:** Mở rộng `fullRun.test.ts` → 27 ván kết thúc hợp lệ (`won !== null`, năm ≤ 30) và deterministic; nếu thời gian test vượt 60 s, đánh dấu ma trận đầy đủ chạy khi `FULL_RUN_ALL=1` và giữ mặc định 9 vua × seed 1.
- [ ] **Step 3:** Sửa bot, chạy → PASS + gate.
- [ ] **Step 4:** Commit `test(sim): headless runs for all nine kings (G4)`.

## Phần G4b — Meta-progression

### Task 8: Meta thuần — hồ sơ, điểm, mở khoá, codec

**Files:**
- Create: `src/data/meta.ts` (`META_SAVE_VERSION = 1`, `KING_UNLOCK: Record<KingId, { cost: number; needsWin?: boolean }>`, `PERK_MASTERY = [10, 30, 60] as const`, `CARD_UNLOCK: Partial<Record<CardId, number>>` = `{ neutral_duplicate: 15, neutral_royal_seal: 20 }`)
- Create: `src/game/meta/profile.ts`, `src/game/meta/crowns.ts`, `src/game/meta/unlocks.ts`, `src/game/meta/codec.ts`, `src/game/meta/index.ts`
- Test: `src/game/meta/crowns.test.ts`, `unlocks.test.ts`, `codec.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface MetaProfile {
    version: number;
    crownPoints: number;                     // số dư
    mastery: Record<KingId, number>;         // không bao giờ giảm
    unlockedKings: KingId[];                 // sắp theo id; gồm 3 vua mở sẵn
    unlockedCards: CardId[];                 // sắp theo id
    wins: Record<KingId, number>;
    highestDifficultyWon: number;            // -1 = chưa thắng ván nào
    settings: { master: number; music: number; sfx: number }; // mặc định 100/100/100 (G5 dùng)
    settledRuns: string[];                   // khoá các ván đã chấm điểm, tối đa 20 mục gần nhất
  }
  export const defaultProfile = (): MetaProfile;
  export interface CrownBreakdown { years: number; conquests: number; bosses: number; victory: number; multiplier: number; total: number }
  export const crownPoints = (state: RunState): CrownBreakdown;
  export const runKey = (state: RunState): string;   // `${seed}:${kingId}:${difficulty}:${perk ?? '-'}`
  export const settleRun = (p: MetaProfile, state: RunState): { profile: MetaProfile; breakdown: CrownBreakdown; unlocks: string[] };
  export const isKingUnlocked = (p: MetaProfile, k: KingId): boolean;
  export const canUnlockKing = (p: MetaProfile, k: KingId): boolean;
  export const unlockKing = (p: MetaProfile, k: KingId): MetaProfile;   // không đủ điều kiện → trả nguyên p
  export const unlockCard = (p: MetaProfile, c: CardId): MetaProfile;   // như trên
  export const unlockedPerks = (p: MetaProfile, k: KingId): PerkId[];
  export const availableDifficulties = (p: MetaProfile): number[];      // [0..highestDifficultyWon + 1], kẹp 5
  export type DecodeMetaResult = { kind: 'ok' | 'repaired'; profile: MetaProfile } | { kind: 'newer'; profile: MetaProfile };
  export const decodeMeta = (raw: unknown): DecodeMetaResult;
  ```
  `settleRun` khi `runKey` đã có trong `settledRuns` → trả profile không đổi, `breakdown` vẫn tính (để hiện), `unlocks = []`. `unlocks` là danh sách chuỗi tiếng Việt cho màn kết thúc (perk vừa đạt mốc thông thạo, độ khó Gai mới).

- [ ] **Step 1: Test hỏng** (giá trị spec):
  - `crowns.test.ts`: thắng Gai 0 với 30 năm, 6 chinh phục, 3 boss → 83; cùng số ở Gai 5 → `round(83 × 2) = 166`; thua năm 7 với 1 chinh phục ở Gai 2 → `round((7 + 3) × 1.4) = 14`.
  - `unlocks.test.ts`: profile mặc định mở `arcane, stone, wheat`; 24 điểm không mở được `grove`, 25 mở được và số dư về 0; `nomad` với 80 điểm nhưng `wins` tổng 0 → không mở; mở lần hai không trừ điểm; mastery 29 → chỉ `[*_p1]`, 30 → `p1, p2`; `availableDifficulties` mặc định `[0]`, sau thắng Gai 0 → `[0, 1]`, sau thắng Gai 5 → `[0..5]`; `settleRun` hai lần cùng ván → điểm cộng một lần.
  - `codec.test.ts`: `undefined` → `ok` + mặc định; `crownPoints: -5` hoặc `'x'` → `repaired` về 0, các trường khác giữ; `unlockedKings` có id lạ → bỏ id lạ, giữ phần còn lại, luôn có ba vua mở sẵn; `version: 2` → `newer` (profile giải được tốt nhất có thể).
- [ ] **Step 2–4:** FAIL → cài đặt → PASS + gate.
- [ ] **Step 5:** Commit `feat(meta): crown points, mastery and unlocks (G4)`.

### Task 9: Nối meta vào phiên — chấm điểm cuối ván, lưu hồ sơ

**Files:**
- Modify: `src/platform/session.ts` (`createSession` tải meta một lần khi Boot; `session.meta(): MetaProfile`; `session.settleRun(state)`; `session.unlockKing(k)`, `session.unlockCard(c)`; chế độ chỉ đọc khi `decodeMeta` trả `newer`)
- Modify: `src/game/run/RunController.ts` (khi ván kết thúc: gọi `persistence.settle?(state)` **trước** khi xoá ván; phát `run:ended` với `crownPoints` và `unlocks` thật)
- Modify: `src/game/save/types.ts` (`SessionPersistence.settle?(state: RunState): Promise<{ crownPoints: number; unlocks: string[] }>`)
- Modify: `src/game/events.ts` (`run:ended` thêm `breakdown: CrownBreakdown`)
- Test: `src/platform/session.test.ts`, `src/platform/resumeIntegration.test.ts`, `src/game/run/RunControllerPersistence.test.ts`

- [ ] **Step 1: Test hỏng:**
  - Ván kết thúc → meta ghi trước `clearRun` (kiểm thứ tự gọi trên `MemorySaveStore` có ghi log); `run:ended.crownPoints` bằng `crownPoints(state).total`.
  - Mô phỏng tắt trang giữa "ghi meta" và "xoá ván" (store ném lỗi ở `clearRun`): tải lại → điểm không cộng lần hai (nhờ `settledRuns`).
  - Hồ sơ `newer`: phiên không gọi `saveMeta` lần nào; mở khoá bị từ chối kèm thông báo.
  - Resume matrix: ván có `perk: 'stone_p1'` tải lại giữa trận → Ngai HP 650 ở tick 0; ván Du Mục đã dùng 1 lượt dời rồi tải lại → `freeMovesUsed === 1`.
  - IndexedDB không dùng được → bộ nhớ + một cảnh báo (hành vi `createSaveStore` hiện có), meta vẫn chạy trong phiên.
- [ ] **Step 2–4:** FAIL → cài đặt → PASS + gate.
- [ ] **Step 5:** Commit `feat(meta): settle crown points at run end and keep the profile (G4)`.

## Phần G4c — Giao diện

### Task 10: Chọn vua — 9 vua, khoá, perk, độ khó Gai

**Files:**
- Modify: `src/ui/kingSelect/carouselModel.ts` (lấy trạng thái khoá từ `MetaProfile`, không hard-code; vua khoá có `note` = "25 điểm Vương Miện" / "80 điểm + thắng 1 ván"; vua đủ điểm nhưng chưa mở có nút **Mở khoá (N)**)
- Create: `src/ui/kingSelect/perkModel.ts` (3 perk: mở/khoá "Thông thạo N", đang chọn tối đa 1, bấm lại để bỏ chọn)
- Modify: `src/ui/kingSelect/difficulty.ts` (`DIFFICULTY_OPTIONS` thêm Gai 1–5: nhãn "Gai 1" … "Gai 5", `thorn` 1..5; lọc theo `availableDifficulties`)
- Modify: `src/ui/kingSelect/detailLayout.ts`, `src/scenes/KingSelectScene.ts` (nút ĐẶC QUYỀN mở hộp chọn perk; nút mở khoá; truyền `{ seed, kingId, perk, difficulty }`)
- Modify: `src/scenes/RealmScene.ts` (`RealmData` dạng mới `{ seed, kingId, perk, difficulty }`; gọi `newRun` với `NewRunOptions` gồm `unlockedCards` từ meta)
- Test: `carouselModel.test.ts`, `perkModel.test.ts`, `difficulty.test.ts`, `detailLayout.test.ts`

- [ ] **Step 1: Test hỏng** (model thuần): profile mặc định → 3 vua chơi được, 6 khoá với ghi chú giá đúng bảng; profile 40 điểm → `grove`, `tide`, `forge`, `clock` có nút mở khoá, `moon` không; perk mastery 30 → 2 mở, 1 khoá ghi "Thông thạo 60"; chọn perk 1 rồi perk 2 → chỉ perk 2; độ khó mặc định chỉ "Nông dân" (Gai 0); bố cục chi tiết có hộp perk vừa cả 1280×720 và 375×812, vùng chạm ≥ 44.
- [ ] **Step 2–4:** FAIL → cài đặt → PASS + gate.
- [ ] **Step 5: Kiểm trình duyệt** 1280×720 và 375×812: mở khoá một vua bằng profile thử (đặt qua `window.game` registry trong dev), chọn perk + Gai 1, bắt đầu ván; console không lỗi; ảnh chụp vào PR.
- [ ] **Step 6:** Commit `feat(king-select): nine kings, perks and thorn levels (G4)`.

### Task 11: Nút dời miễn phí của Du Mục ở pha lập kế hoạch

**Files:**
- Modify: `src/ui/planning/*` (nút "Dời trại (N)" chỉ hiện cho `nomad`, N = lượt còn lại), `src/scenes/PlanningHudScene.ts`, `src/scenes/RealmScene.ts` (chọn công trình rồi ô kề; ô hợp lệ viền `good`, không hợp lệ viền `bad` + lý do; ✓/✕ như chơi thẻ)
- Test: model thuần mới `src/ui/planning/freeMoveModel.test.ts` (trạng thái chọn, ô hợp lệ lấy từ cùng hàm luật Task 3)

- [ ] **Step 1–4:** test hỏng → cài đặt → PASS + gate. Ô hợp lệ của UI phải tính bằng cùng hàm luật của Task 3 (không viết lại luật).
- [ ] **Step 5: Kiểm trình duyệt** hai kích thước: dời một công trình, số lượt giảm, tải lại trang giữ số lượt; ảnh chụp vào PR.
- [ ] **Step 6:** Commit `feat(planning): nomad free relocation controls (G4)`.

### Task 12: Kết thúc ván, màn Vương Miện, nút menu

**Files:**
- Create: `src/ui/crowns/crownsModel.ts` (+ test), `src/scenes/CrownsScene.ts`; đăng ký scene trong `src/main.ts`/`scenes/keys.ts`
- Modify: `runSummary` trong `src/ui/info/infoLines.ts` + `src/scenes/RunEndScene.ts` (bảng cộng điểm theo `CrownBreakdown`: Năm × 1, Chinh phục × 3, Boss × 5, Thắng ván +20, Gai ×(1 + 0,2 × d), Tổng; danh sách mở khoá mới)
- Modify: `src/scenes/MainMenuScene.ts`, `src/ui/menuLayout.ts` (nút **Vương Miện** giữa Ván mới và Cài đặt; Cài đặt vẫn ẩn đến G5)
- Test: `crownsModel.test.ts`, `src/ui/info/infoLines.test.ts`, `menuLayout.test.ts`

Nội dung `CrownsScene` (§10.9): số dư điểm; hàng 9 vua: chân dung nhỏ, nút mở khoá (giá) hoặc "Đã mở", thanh thông thạo (`bar`) có mốc 10/30/60; hai thẻ trung lập meta với nút mở khoá (15/20); độ khó cao nhất đã thắng. Mobile cuộn dọc; nút ✕ 48×48, Esc đóng.

- [ ] **Step 1: Test hỏng:** `crownsModel` với profile mặc định → 3 "Đã mở", 6 giá, thẻ meta 15/20, "Độ khó cao nhất: chưa thắng"; bấm mở khi thiếu điểm → nút khoá, không đổi profile; `runSummary` hiện đúng các dòng và tổng khớp `crownPoints`; menu có nút Vương Miện ở cả hai bố cục, không chồng nhau.
- [ ] **Step 2–4:** FAIL → cài đặt → PASS + gate.
- [ ] **Step 5: Kiểm trình duyệt** hai kích thước: kết thúc một ván (đẩy bằng bot `scripted` qua bus như G3), thấy bảng điểm; vào Vương Miện, mở một vua, tải lại trang → vẫn mở; ảnh chụp vào PR.
- [ ] **Step 6:** Commit `feat(meta): run-end crown tally and the Crowns screen (G4)`.

### Task 13: Nghiệm thu G4 và tài liệu

**Files:**
- Modify: `docs/ROADMAP.md` (G4 ✔, ghi bằng chứng; sửa dòng zoom "1–3×" cũ thành zoom tự do), `CLAUDE.md` + `AGENTS.md` (RunState v6, `src/game/meta/`, 9 vua chơi được, `CrownsScene`), `docs/GDD.md` nếu có mô tả vua/meta lệch
- Test: không thêm; chạy toàn bộ

- [ ] **Step 1:** Đối chiếu "Done khi" §14 G4: 9 vua chơi được (Task 1–3, 7, 10); Du Mục khoá đúng điều kiện (Task 8, 10); mọi thẻ/perk G4 có test (`perkCoverage`, `cardCoverage`); điểm khớp công thức (Task 8); mở khoá còn sau tải lại (Task 9, 12); headless 9 vua × 3 seed (Task 7).
- [ ] **Step 2:** Gate đầy đủ + `FULL_RUN_ALL=1 npx vitest run src/game/sim < /dev/null`.
- [ ] **Step 3:** Kiểm trình duyệt cuối: một ván mỗi vua mới tới năm 3 (bằng bot qua bus), Ngai hiện được (art sinh bằng code), console không lỗi, 1280×720 và 375×812.
- [ ] **Step 4:** Commit `docs: G4 acceptance` và mở PR `g4-kings-meta` → `develop` (không merge khi chủ dự án chưa đồng ý).
