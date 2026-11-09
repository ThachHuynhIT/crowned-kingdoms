# G5 — Cân bằng, âm thanh, juice, mobile, PWA và art Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thành toàn bộ “Done khi” §1 của spec tổng, gồm cân bằng chín vua bằng greedy 500 runs/vua, âm thanh, Settings, juice, mobile, offline PWA và art isometric đã duyệt của sáu vua mới.

**Architecture:** Mở rộng headless bằng collector thuần, giữ reducer và `buildBattleSetup` làm nguồn luật; tuning chỉ sửa số trong data. WebAudio đứng ngoài game, nhận typed EventBus qua adapter scene; Settings ghi bằng queue của session, juice chỉ đọc events và snapshot. PWA viết tay dựa trên file build thật; art qua prompt script, owner gates và approval lists, giữ code fallback.

**Tech Stack:** TypeScript strict · Phaser 4 · Vite · Vitest · IndexedDB native (`fake-indexeddb` trong test) · WebAudio · `tsx` (devDependency mới) · Python/Pillow cho pipeline art; không PWA plugin, không audio file.

**Spec:** `docs/superpowers/specs/2026-11-09-g5-balance-polish-design.md`; spec tổng `docs/superpowers/specs/2026-10-16-crowned-kingdoms-design.md` §1, §8.10, §10.1, §10.10, §11–14. Camera theo `2026-11-08-iso-board-polish-design.md`; world theo `2026-11-06-iso-board-redesign-design.md`; art theo toàn bộ `docs/ART_STYLE.md` và `docs/art-review/HANDOFF.md`.

**Ngoài phạm vi:** mở lại G4 (khoá ẩn danh, ramp >40%, nomad_p 2 plot 10/14), thêm gameplay, art Stone/Arcane/lính mới, portrait/card art mới, audio file, multiplayer/native wrapper. Phiên lập kế hoạch chỉ viết hai tài liệu; mọi command bên dưới dành cho lúc thực thi, chưa được chạy.

## Global Constraints

- Layers: game/data/core không import Phaser/scenes/render/ui/platform/audio; data không import game, core không import game. Audio chỉ runtime import data/core/audio; chỉ được type-import GameEvents từ `src/game/events.ts`, cấm game import khác và Phaser/presentation/platform. Giữ restrictions cả trong test.
- Deterministic: cấm Math.random/Date.now/performance.now/hypot/sin/cos/tan/atan 2/exp/log/pow và toán tử ** trong game/data/core; giữ ngoại lệ Math.imul của RNG/hash. Sort id/plot trước khi Map/Set quyết kết quả; trận không dùng RNG; greedy không lấy mẫu.
- Mọi số gameplay ở data; mỗi số tuning có test. Telemetry/settings không vào RunState v6; nếu đổi state ngoài dự kiến phải migrator + fixture trong `src/game/save/migrate.ts`. META_SAVE_VERSION=1, decode sửa từng field, meta không xoá, newer read-only. Giữ endRun nguyên tử/credited đã có.
- API thật: ALL_KINGS ở `src/data/rules.ts`, PLAYABLE_KINGS ở `src/data/kings/index.ts`, registry cung cấp CONTENT; `newRun` ở `src/game/run/yearFlow.ts`. Headless mặc định RULES_G 1; CLI luôn truyền RULES_FULL.
- UI tiếng Việt/FONT_UI, createPanel/createButton/ContentBox/Tooltip; frame metadata qua uiFrameDef, không Rectangle làm nền. Target ≥ 44×44, Settings −/ + 48×48; layout resize, reset field đầu create(), truyền initial state qua launch data, shutdown tháo listeners.
- Nearest/pixelArt, sprite scale nguyên theo mật độ art hiện có; camera zoom tự do overview…3 và snapView, HUD không zoom. Không rotate, feet/y-sort; alpha mép 0/255 (shadow riêng 128 có khai báo), không AA/blur; atlas sprites mỗi chiều ≤ 4096. Không áp palette 32 theo checklist manifest cũ.
- Logic = Claude. UI/image/render = Codex làm, Claude review; pure UI model vẫn test trước. Audio synth/model thuần = Claude, UI wiring/browser = Codex. Trước code Phaser đọc v3-to-v4-migration và skills scenes/input/text/scale/cameras/tweens/sprites liên quan, kiểm types/phaser.d.ts.
- **Gate cuối mỗi phase**, Git Bash: `npm run lint < /dev/null && npm run typecheck < /dev/null && npm test < /dev/null && npm run build < /dev/null`, tất cả exit 0. Test-first: test mới đỏ vì thiếu hành vi, cài tối thiểu, xanh; không lấy syntax/import lỗi làm bằng chứng TDD. Mỗi phase browser 1280×720 và 375×812 console sạch; phần visible có screenshots/scenario evidence.
- Git thực thi: `git switch g4-kings-meta` rồi `git switch -c g5-balance-polish`; giữ thay đổi ngoài scope, không yêu cầu discard. Dùng duy nhất nhánh `g5-balance-polish` (từ `g4-kings-meta`) và một PR vào `develop` cho toàn G5. Mở PR dạng draft khi P1 đóng, cập nhật cuối mỗi phase; mỗi phase có commit riêng và section Pn trong PR body kèm evidence. Owner chọn lúc merge; không merge nếu chưa có owner yes, không push trực tiếp `main`/`develop`. Nếu PR #14 (`g4-kings-meta`) còn mở khi mở G5 PR, ghi dependency trong PR body. Sau #14 merge, merge `develop` vào nhánh và kiểm diff không còn các commit G4.
- **Phase-close chung:** sau Gate/browser, `git add <đúng Files của phase>`; `git commit -m "<message cuối phase>"`; `git push -u origin g5-balance-polish`. Khi đóng P1, dùng `gh pr create --draft --base develop --head g5-balance-polish --title "G5: balance and polish" --body-file <file mô tả tạm>`. Cuối mỗi phase dùng `gh pr edit <G5 PR> --body-file <file mô tả tạm>` cập nhật cùng PR, giữ các section trước và thêm/cập nhật section Pn với evidence/dependency/risks. Không git add toàn workspace, không mở PR riêng từng phase, không tự merge/release. Các bước này không chạy trong phiên lập kế hoạch.

## Review Focus

1. Seed giống nhau, lastLife/maxLevel và Map order khác → input không đổi, lệnh hợp lệ, stats giống từng byte; Task 1–2 greedy/stats/fullRun tests.
2. Meta cũ/newer, spam slider đồng thời unlock/settle, xoá khi checkpoint chờ → không mất tiến trình, newer không ghi, ván không sống lại; Task 5 codec/session/resumeIntegration tests.
3. Settings ở speed 0/2/3, restart 3 lần, chưa tap hoặc background → không click xuyên, restore speed, một context/scheduler, không leak; Task 4/7 AudioManager/settingsLauncher tests + browser.
4. Boss/boulder frame cuối ở zoom lẻ, resize giữa flight → dịch nguyên pixel, aim đúng view, không mất event/đổi hash; Task 6 presentationEvents/determinism và Task 8 juiceModel/cameraModel/juiceBridge tests.
5. Offline cold reload subpath, SW update thiếu art, landscape/notch → giữ build cũ, không trộn cache, mọi nút tới được; Task 9–10 safe-area/build/PWA tests + browser.

---

## Phần P1 — Balance tooling

### Task 1: Greedy deterministic qua reducer và setup thật (logic — Claude)

**Files:**
- Create: `src/data/balance.ts`, `src/game/sim/bots/greedy.ts`
- Test: `src/game/sim/bots/greedy.test.ts` (mới), `src/game/sim/fullRun.test.ts`
- Read: `src/game/sim/bots/random.ts`, `scripted.ts`, `src/game/run/board.ts`, `playable.ts`, `battleSetup.ts`, `src/game/battle/types.ts`

**Interfaces:**
- Consumes: `Bot = (state: RunState, content: Content, rng: Rng) => RunCommand`, applyCommand/buildBattleSetup/targetCount/cardOffer.
- Produces: `greedyBot: Bot`, `estimatePower(setup: BattleSetup): number`; data/balance có GREEDY_MAX_REROLLS=2, BALANCE_RUNS=500, BALANCE_MIN_WIN=0.35, BALANCE_MAX_WIN=0.65, BALANCE_MAX_SPREAD=0.15.

- [ ] **Step 1: Test hỏng.** `estimate_power_counts_ally_once`: spawn 2×(HP 10, dmg 4, interval 20)=40; tower HP 30, dmg 6, interval 10=180; tổng 220, không cộng waves/lặp throne. `pulse_and_start_summons`: tower HP 30/attackDps 6/multiAttack 2/pulse dmg 10 mỗi 20 tick → pulseDps = 10 × 10 / 20 = 5, nên 30 × (12 + 5) = 510; cộng triệu hồi đầu trận đúng count, không cộng pulseDps ngoài tích HP. `ties_use_hand_then_plot`, `two_targets_lexicographic`, `last_life_and_max_level_filtered`, `does_not_mutate_state_or_rng`, `rerolls_stop_at_two`, `nomad_moves_only_for_positive_gain`.
- [ ] **Step 2:** `npx vitest run src/game/sim/bots/greedy.test.ts < /dev/null` → FAIL hành vi thiếu.
- [ ] **Step 3:** Cài heuristic spec G5 §2.1: DPS=dmg×10/interval, sum count×hp×DPS sau modifiers, structures sort plot/throne một lần; tower power=`hp × (attackDps × (multiAttack ?? 1) + pulseDps)`, không đánh giá tương lai DOT/summonEvery/ramp/economy. Enumerate play targets qua reducer. Planning autoFire → play cao nhất → mua ô chỉ khi mở được play → reroll hữu hạn → discard/start hợp lệ; freeMove chỉ tăng power. Reward thử card trên planning copy, hoà index; council/quest policy scripted ổn định, đóng pendingOffers. Không sửa input/run RNG.
- [ ] **Step 4:** Tests → PASS. Thêm `full_run_greedy_9x3`: ALL_KINGS×[1, 2, 3], RULES_FULL, ended/won boolean/year ≤ 30/commands < 5000/deck multiset giữ; chạy lại so state/commands. `npx vitest run src/game/sim < /dev/null` → PASS, không 500 runs trong npm test.
- [ ] **Step 5:** Commit task `feat(sim): deterministic greedy bot` sau xanh; mở draft G5 PR ở Task 2.

### Task 2: Collector, CLI, CSV và baseline (logic — Claude)

**Files:**
- Modify: `src/game/sim/headless.ts`, `package.json`, `package-lock.json`, `vite.config.ts`, `eslint.config.js`, `.gitignore`
- Create: `src/game/sim/stats.ts`, `tools/balance.ts`, `tools/balanceModel.ts`, `docs/balance/2026-11-09-g5-balance-report.md`
- Test: `src/game/sim/stats.test.ts`, `src/game/sim/headless.test.ts`, `tools/balance.test.ts` (tạo nếu chưa có)

**Interfaces:**
- HeadlessOptions thêm `perk?: PerkId|null`, `difficulty?:number`, `onCommand?:(before:RunState,command:RunCommand,after:RunState)=>void`; giữ result `{state,commands}` và default G1.
- `createRunStats(seed:number,kingId:KingId,difficulty:number): { observe(before:RunState,command:RunCommand,after:RunState):void; finish(result:HeadlessResult):RunStats }`.
- RunStats: seed/kingId/difficulty/won/yearReached/completedYears/commands; picks/offered `Record<string,number>`; battlesReached/battlesLost `Record<number,number>`.
- tools model: `parseBalanceArgs(args:readonly string[]):BalanceOptions`, `aggregateBalance(runs:readonly RunStats[]):BalanceTables`, `csv(rows:readonly (readonly (string|number|null)[])[]):string`; BalanceOptions king/runs/bot/difficulty. balance.ts chỉ I/O.

- [ ] **Step 1: Test hỏng.** Headless truyền difficulty 3/perk từ đầu newRun, không sửa state sau. Collector chỉ đếm offer khi thành hiện hành một lần; pickOffer chọn + 1/skip + 0, conquest/questReward đúng, draw/play không tính; loss năm=thua/reached năm đó, reached 0 → rate null. Năm 30 timeout sống vẫn won. Cùng seed → stats deepEqual không timestamp. CLI invalid king/bot/N 0/fraction/d−1/6/NaN/unknown flag → throw/exit nonzero không overwrite bảng tốt. CSV escape quote/comma/newline; sort vua/card/year ổn định.
- [ ] **Step 2:** Thêm test include `['src/**/*.test.ts','tools/*.test.ts']` ở vite.config, Node globals ESLint cho tools. `npx vitest run src/game/sim/stats.test.ts src/game/sim/headless.test.ts tools/balance.test.ts < /dev/null` → FAIL.
- [ ] **Step 3:** Implement hook sau command thành công, collector không vào save. `npm install --save-dev tsx < /dev/null`; script balance=`tsx tools/balance.ts`. CLI all/500/greedy/0 mặc định, RULES_FULL, seeds 1…N, perk null/meta[]; print win/mean year/card pick/loss year. Bốn CSV `tools/out/balance-<bot>-gai-<d>-{runs,summary,cards,years}.csv`, UTF 8/escape/sorted, gitignore tools/out. Card rate=picked/offered, year rate=lost/battlesReached, ghi numerator/denominator; CSV cards chứa cả CONTENT.allCards chưa được offered (0/0, rate để trống), không lược bỏ card yếu. Progress từng vua, elapsed chỉ CLI.
- [ ] **Step 4:** Tests → PASS. `npm run balance -- --king all --runs 10 --bot greedy --difficulty 0 < /dev/null` → 90 run hợp lệ +9 summary/pilot ETA. `npm run balance -- --king all --runs 500 --bot greedy --difficulty 0 < /dev/null` → 4.500 run/baseline report, chưa cần đạt target. Chạy baseline 500 runs/vua ở background, ngoài `npm test`; report ghi elapsed time thực đo của toàn đợt. Report 9 dòng, config/revision/seed/perk/meta/autoFire/CSV/metric/elapsed thật, không bịa số.
- [ ] **Step 5: Đóng P1.** Gate + browser hai viewport smoke/console không lỗi. Ước lượng sàn 4500×65 ms=292,5 s (~4,9 phút) từ G4; greedy dự trù 10–30 phút hoặc hơn, pilot cập nhật ETA. Phase-close `feat(balance): CLI, statistics and baseline`, update the G5 PR (section P1).

## Phần P2 — Tuning

### Task 3: Đạt target 500 × 9 và giữ deterministic (logic — Claude)

**Files:**
- Modify số có evidence: `src/data/kings/wheat.ts`, `stone.ts`, `arcane.ts`, `grove.ts`, `tide.ts`, `forge.ts`, `clock.ts`, `moon.ts`, `nomad.ts`; `src/data/calendar.ts`, `battle.ts`, `run.ts`, `scaling.ts`, `bosses.ts`, `neutral.ts` chỉ khi phép đo chỉ ra cần (không phải sửa tất cả)
- Modify: `docs/balance/2026-11-09-g5-balance-report.md`
- Test: `src/game/sim/balanceValues.test.ts` (mới), `src/game/run/perks.test.ts`, `src/game/cards/geometryScale.test.ts`, `src/game/battle/determinism.test.ts`, `benchmark.test.ts` và tests effect/golden chịu tác động

**Interfaces:** Consumes baseline/aggregateBalance Task 2; produces final table cùng bot/seed/profile. Không đổi API/id/rules.

- [ ] **Step 1: Test hỏng trước mỗi edit.** Chọn một cụm số theo loss/pick tables; balanceValues khẳng định old → proposed bằng hằng/thẻ thật và buildBattleSetup cấp 1/5. Ghi đường dẫn/số cũ/số đề xuất/lý do vào report trước sửa; plan không đoán số final trước baseline. Giữ nomad_p 2 plot 10/14, khoá anonymous và ramp>40.
- [ ] **Step 2:** `npx vitest run src/game/sim/balanceValues.test.ts < /dev/null` → FAIL số cũ; sửa chỉ numeric data, cập nhật từng assertion/effect test với phép tính mới. Không sửa bot/engine/định nghĩa won để ép bảng.
- [ ] **Step 3:** `npx vitest run src/game/cards src/game/run src/game/battle < /dev/null` → PASS. Golden đổi phải có giải thích số; cùng inputs hash từng tick vẫn bằng, reversed insertion bằng, inputs khác có hash khác. Bug luật phát hiện phải tách xử lý và đo baseline lại nếu ảnh hưởng, không giấu trong tuning.
- [ ] **Step 4:** Lặp pilot 10/100 rồi 500 × 9 lệnh Task 2; chốt khi mọi rate∈[0.35, 0.65], spread ≤ 0.15, crash 0. Chạy `npm run balance -- --king all --runs 100 --bot random --difficulty 0 < /dev/null` và tương tự scripted làm cross-check, không áp target greedy cho bot khác. Báo cáo baseline/final 9 dòng, pick/loss tables, số đổi, revision/config/thời gian/sai số. Đổi bot thì baseline phải đo lại.
- [ ] **Step 5: Đóng P2.** Gate + browser hai viewport smoke; final đủ 4.500 run, không pilot. Phase-close `balance: tune nine kings against 500-run greedy cohort`, update the G5 PR (section P2).

## Phần P3 — Audio + Settings

### Task 4: Data âm thanh, synth và AudioManager (logic — Claude)

**Files:**
- Create: `src/data/sfx.ts`, `src/data/music.ts`, `src/data/settings.ts`, `src/audio/sfx.ts`, `src/audio/music.ts`, `src/audio/AudioManager.ts`
- Modify: `eslint.config.js`
- Test: `src/data/sfx.test.ts`, `src/data/music.test.ts`, `src/audio/sfx.test.ts`, `src/audio/music.test.ts`, `src/audio/AudioManager.test.ts`

**Interfaces:**
- SfxId đúng 21 id spec G5 §3; `SFX:Readonly<Record<SfxId,SfxDef>>`. SfxDef wave square/triangle/noise, frequency/endFrequency/attack/decay/sustain/release/duration/gain/seed (seconds cho time); preset đủ 21 entry, giá trị âm sắc do task thiết kế trong data, không default ngầm.
- `MusicId='planning'|'battle'`, MUSIC có 90/120 BPM, beatsPerBar 4, note tracks; `AudioSettings {master:number;music:number;sfx:number;screenShake:boolean}`, DEFAULT_SCREEN_SHAKE=true/VOLUME_STEP 10/SETTINGS_BUTTON 48.
- `synthesizeSfx(def:SfxDef,sampleRate:number):Float32Array`; `scheduleLoop(context:AudioContext,track:MusicId,output:AudioNode,startAt:number):{stop():void}`.
- AudioManager constructor nhận context factory (chưa gọi); methods `unlock():Promise<void>`, `play(id:SfxId):void`, `setMusic(track:MusicId|null):void`, `setVolumes(settings:AudioSettings):void`, `suspend():Promise<void>`, `destroy():Promise<void>`.

- [ ] **Step 1: Test hỏng.** exact 21 keys: ui_click/ui_hover/card_draw/card_play/reroll/coin/plot_unlock/level_up/battle_horn/hit_light/hit_heavy/arrow/cannon/fire/magic/death_pop/boulder_whoosh/boulder_impact/throne_hit/victory/defeat. Param finite, frequency/duration>0, ADSR ≥ 0/sustain 0…1. MUSIC hai loop planning 90 C/D/E/G/A flute+pluck; battle 120 drum+horn. PCM deterministic seed/sampleRate, finite[-1, 1], release về 0. Chưa unlock context 0; concurrent unlock context 1/buffer set 1; master 50×sfx 20 gain 0.1; mute không voice; fifth play/id bị bỏ, ended giải slot; fade 600 ms; suspend/resume/destroy không nhân scheduler/leak, resume reject có retry không unhandled.
- [ ] **Step 2:** `npx vitest run src/data/sfx.test.ts src/data/music.test.ts src/audio < /dev/null` → FAIL.
- [ ] **Step 3:** Implement waveform/ADSR/sweep và noise seed riêng, không run RNG; buffer sau gesture unlock một lần/context, không queue âm cũ. Scheduler lookahead 100 ms/horizon 200 ms, cap 4/id/drop fifth, crossfade 600 ms. Fake context/time test không sleep. Trig chỉ audio runtime, data thuần. ESLint cấm game runtime/type internals, riêng exact game/events cho type-only GameEvents; cấm Phaser/ui/render/scenes/platform.
- [ ] **Step 4:** Tests → PASS, `npm run lint < /dev/null` → 0; thêm lint-API test vào AudioManager.test để import runtime game bị lỗi/type events được phép. Không lưu file vi phạm tạm trong src.
- [ ] **Step 5:** Commit `feat(audio): generated WebAudio sounds and music` sau xanh.

### Task 5: Meta settings tương thích và discard chỉ run (logic — Claude)

**Files:**
- Modify: `src/game/meta/profile.ts`, `src/game/meta/codec.ts`, `src/platform/session.ts`, `src/data/save.ts`
- Test: `src/game/meta/codec.test.ts`, `src/platform/session.test.ts`, `src/platform/resumeIntegration.test.ts`, `src/platform/storage/createSaveStore.test.ts`

**Interfaces:** MetaProfile.settings=AudioSettings; `GameSession.updateSettings(patch:Partial<AudioSettings>):Promise<UnlockResult>`; `discardRun():Promise<{persistent:boolean}>`. DEFAULT_VOLUME 100 vẫn data/meta, META_SAVE_VERSION 1/RunState 6. Freeze/whenIdle/stop thuộc launcher Task 7, session flush/clear qua coordinator.

- [ ] **Step 1: Test hỏng.** v1 thiếu shake → true, false giữ false, sai type sửa riêng; master 30/music 70/sfx 20 và crown/mastery/unlocks/settledRuns nguyên. Volume cũ 25 giữ 25 khi load, lần tương tác + → 30/− → 20; slider drag snap round(v/10)×10. Newer → readOnly/saveMeta 0; save failure → saveFailed/memory không đổi. Concurrent update+unlock+settle giữ mọi fields. discard chờ checkpoint chậm rồi clear, không settle/saveMeta/clearMeta; clear bền vững → reload run empty/meta nguyên. Fake IndexedDB lỗi xoá → fallback RAM/outcome persistent=false; mở session mới cùng database cho thấy run cũ có thể còn, UI không báo xoá đĩa thành công. Fallback RAM một warning/settings còn trong phiên.
- [ ] **Step 2:** `npx vitest run src/game/meta/codec.test.ts src/platform/session.test.ts src/platform/resumeIntegration.test.ts < /dev/null` → FAIL.
- [ ] **Step 3:** Decode từng field, queue queued hiện có tính patch từ profile mới nhất/validate finite 0…100 trước persist; publish sau write success. Không ép volume cũ thành bội 10. Việt copy lỗi trong data/save; discard coordinator.flush → clearRun rồi probe isPersistent() trả outcome; kho không probe chỉ cam kết trong phiên. Không delete database. Giữ one-way fallback hiện có và warning thật.
- [ ] **Step 4:** Tests → PASS gồm atomic endRun/credited/resume matrix và checkpoint race không làm run sống lại.
- [ ] **Step 5:** Commit `feat(settings): persist repaired settings and discard only the run`.

### Task 6: Battle presentation events và cue mapper thuần (logic — Claude)

**Files:**
- Modify: `src/game/events.ts`, `src/game/battle/types.ts`, `src/game/battle/combat.ts`
- Create: `src/scenes/audioCues.ts` (model thuần ngoài game, không Phaser/WebAudio)
- Test: `src/game/battle/presentationEvents.test.ts`, `src/scenes/audioCues.test.ts`, `src/game/battle/determinism.test.ts`

**Interfaces:**
- `BattleEvent.hit` thêm `sourceId: number`, `damageType: DamageType`; event mới `attack { sourceId: number }`, emit tại attackPhase/applyDamagePhase; không đổi combat queue/rules/state/save/hash.
- GameEvents thêm `presentation:sfx { id: SfxId }`, `presentation:music { track: MusicId | null }`, `presentation:settings { settings: AudioSettings }`, `presentation:battle { events: readonly BattleEvent[] }`, `ui:settings { open: boolean }`; chỉ type-import từ data/battle types.
- `battleCues(events: readonly BattleEvent[], snapshot: CueSnapshot): SfxId[]`, `transitionCues(before: RunState, after: RunState): SfxId[]`; CueSnapshot chứa dữ liệu readonly nguồn/loại đòn và id Ngai từ snapshot, không đọc/ghi live world. Music transition vẫn do bridge gửi theo spec §3.

- [ ] **Step 1: Test hỏng.** presentationEvents kiểm hit có sourceId/damageType, attack chỉ khi đòn thật xảy ra; hashWorld từng tick giống nhau khi drain/không drain; final-frame hit/death được giao đúng một lần. Cue tests: ưu tiên cannon → fire/magic → arrow, melee không arrow; throne_hit thay light/heavy; hit < 50 light, ≥ 50 heavy; boulder drop/impact và death đủ cue, nguồn −1 không thành boss. Transition thành công đúng một cue, illegal command/initial resume không play/coin; input không mutate. Cap 4 voice/id thuộc AudioManager, không cắt trong mapper.
- [ ] **Step 2:** `npx vitest run src/game/battle/presentationEvents.test.ts src/scenes/audioCues.test.ts src/game/battle/determinism.test.ts < /dev/null` → FAIL vì thiếu hành vi.
- [ ] **Step 3:** Bổ sung telemetry và GameEvents; cài mapper thuần theo spec §3, giữ thứ tự event tick. Không import audio/render/UI vào game, không đổi RNG/combat/hash để phục vụ âm thanh.
- [ ] **Step 4:** Chạy lại lệnh Step 2 → PASS; kiểm determinism/hash và final-frame delivery trước bàn giao bridge cho Task 7.
- [ ] **Step 5:** Commit `feat(presentation): battle events and pure audio cues` sau xanh.

### Task 7: Audio event bridge và SettingsScene (UI — Codex, Claude review)

**Files:**
- Create: `src/scenes/audioBridge.ts`, `src/scenes/settingsLauncher.ts`, `src/scenes/SettingsScene.ts`, `src/ui/settings/settingsModel.ts`, `src/ui/settings/settingsLayout.ts`
- Modify: `src/scenes/BootScene.ts`, `PreloadScene.ts`, `MainMenuScene.ts`, `RealmScene.ts`, `PlanningHudScene.ts`, `BattleHudScene.ts`, `keys.ts`, `sessionRegistry.ts`, `src/main.ts`, `src/ui/menuLayout.ts`, `src/ui/theme.ts`
- Test: `src/scenes/audioBridge.test.ts`, `src/scenes/settingsLauncher.test.ts`, `src/ui/settings/settingsModel.test.ts`, `settingsLayout.test.ts`, `src/ui/menuLayout.test.ts`

**Interfaces:**
- `bindAudio(bus:EventBus<GameEvents>,manager:AudioManager):()=>void`; `bindRunPresentation(runBus:EventBus<GameEvents>,appBus:EventBus<GameEvents>):()=>void`; `openSettings(scene:Phaser.Scene,data:SettingsLaunch):void`, SettingsLaunch owner/runBus|null/settings/speed.
- `settingsLayout(screen:Size):SettingsLayout` rect slider/−+/confirm/close/scroll; `stepVolume(value:number,direction:-1|1):number`; confirm idle/confirm/busy.

- [ ] **Step 1: Test hỏng.** Bridge dùng cue mapper Task 6; mỗi transition/event fan-out một lần kể cả frame cuối; illegal command/initial resume không phát play/coin. Model 0−=0, 100+=100, 25+=30/25−=20; cancel reset confirm; busy double tap clear 1. Layout hai viewport target 48/no overlap. Launcher speed 0/2/3 → pause 0 → restore đúng; planning không giả battle; delete freeze/whenIdle/dispose trước clear, late callback không checkpoint.
- [ ] **Step 2:** `npx vitest run src/ui/settings src/scenes/audioBridge.test.ts src/scenes/settingsLauncher.test.ts src/ui/menuLayout.test.ts < /dev/null` → FAIL.
- [ ] **Step 3:** Boot/registry giữ app bus+manager, pointerdown/click unlock đầu tiên; Preload không context. Menu/primitive gửi cues app bus, run bridge unbind khi restart. Realm giữ một drainEvents fanout kể cả runner final. Gọi cue mapper thuần Task 6 cho state transitions thành công và battle events, không ánh xạ từ ui intent. Battle horn/loop, end victory/defeat/planning, 21 cues theo spec. Settings đủ sliders±48/toggle/delete 2 bước/disabled busy hoặc no-run; newer không ghi settings. Menu visible/action thật, SCENES.settings/main đăng ký, hai HUD mở overlay. Launch initial data, block input; pause/restore, reset create/shutdown. Delete freeze → await whenIdle → controller.dispose()/stop HUD → discardRun; persistent=true → menu; persistent=false → thông báo chỉ bỏ trong phiên, bản lưu thiết bị có thể còn, nút về menu; reject giữ overlay. Không báo xoá vĩnh viễn khi fallback.
- [ ] **Step 4:** Tests → PASS. Browser hai viewport: volume/mute/reload, tap unlock, fade 600 ms, pause/2×/3× restore, cancel/confirm delete giữ tiến trình; restart 3 lần và background/foreground không duplicate/burst. Listen 21 SFX/hai loop, blocked context không crash; Claude review UI/audio/race, console không lỗi.
- [ ] **Step 5: Đóng P3.** Gate + browser evidence; phase-close `feat(audio-settings): presentation audio and settings scene`, update the G5 PR (section P3).

## Phần P4 — Juice

### Task 8: Shake pixel, flash/pop và card/gold flight (UI/render — Codex, Claude review)

**Files:**
- Create: `src/data/juice.ts`, `src/render/juiceModel.ts`, `src/render/JuiceRenderer.ts`
- Modify: `src/render/FxRenderer.ts`, `src/render/UnitRenderer.ts`, `src/render/BoardRenderer.ts`, `src/render/fxArt.ts`, `src/render/atlas.ts`, `src/scenes/RealmScene.ts`, `src/scenes/PlanningHudScene.ts`, `src/scenes/BattleHudScene.ts`, `src/ui/realm/cameraModel.ts`
- Test: `src/render/juiceModel.test.ts`, `src/render/fxArt.test.ts`, `src/ui/realm/cameraModel.test.ts`, `src/scenes/juiceBridge.test.ts` (integration ngoài game để không import render vào game)

**Interfaces:** `shakeOffset(elapsedMs:number,enabled:boolean):Point`, `floatingDamage(dmg:number):boolean`, `shakenView(view:CameraView,screen:Size,offset:Point):CameraView`; JuiceRenderer nhận immutable events/endpoints, update elapsed/destroy; UnitRenderer.sync nhận optional readonly events, không tự drain.

- [ ] **Step 1: Test hỏng.** Data `SHAKE_PX=2`, `SHAKE_MS=150`, `HIT_FLASH_FRAMES=2`, `DEATH_POP_FRAMES=4`, `CARD_FLY_MS=250`, `FLOAT_DAMAGE_MIN=50`; `DEATH_FRAME_MS=45`, `PLOT_BOUNCE_MS=150`, `PLOT_BOUNCE_PX=2`, `COIN_FLY_MS=400`. Shake sequence [(2, 0),(-2, 1),(1,-2),(-1, 2),(0,-1)] mỗi 30 ms, ≥ 150/disabled → 0. damage 49.99 → false / 50 → true / gold > 0 → true. Zoom 1.29375/1.3/3 translation nguyên, input round-trip, không mutate view. Hit 2 render frames, death 4 frames, resize flight endpoint, pool ≤ 64/loại. Hai worlds cùng setup/inputs, một bên juice từ snapshot, hashWorld mỗi tick giống; final death/boulder vẫn xử lý.
- [ ] **Step 2:** `npx vitest run src/render/juiceModel.test.ts src/render/fxArt.test.ts src/ui/realm/cameraModel.test.ts src/scenes/juiceBridge.test.ts < /dev/null` → FAIL.
- [ ] **Step 3:** Render-only model, 4 death FX code vào sprites, không fade thay pop; feet/tint restore, không scale lẻ/rotate. Shake chỉ boss sourceId===bossId đã spawn hoặc boulder impact, toggle false về 0 ngay. snap base → offset screen (scroll−offset/zoom) → snap cuối, publish realm:view đúng view, không sửa pan. Success play clone bay 250 ms/bounce 2 px; coins 400 ms tới counter, không initial/resume; pool/destroy, không await tween trước command.
- [ ] **Step 4:** Tests → PASS. Browser hai viewport play/gain/boulder/boss lethal frame cuối; zoom lẻ/pan/resize/toggle giữa rung; HUD đứng yên, aim đúng, flash 2/pop 4, số chỉ ≥ 50/gold; Claude review pixel/hash, console không lỗi.
- [ ] **Step 5: Đóng P4.** Gate + screens/video timing; phase-close `feat(juice): pixel-snapped render-only feedback`, update the G5 PR (section P4).

## Phần P5 — Mobile + PWA

### Task 9: Safe-area, landscape và hiệu năng (UI — Codex, Claude review)

**Files:**
- Modify: `index.html`, `src/main.ts`, `src/ui/menuLayout.ts`, `src/ui/hud/layout.ts`, `src/ui/realm/realmLayout.ts`, `src/ui/settings/settingsLayout.ts`, `src/ui/crowns/crownsLayout.ts`, `src/ui/kingSelect/carouselLayout.ts`, `src/ui/kingSelect/detailLayout.ts`, `src/ui/modals/modalLayout.ts`
- Modify scenes nhận viewport/mode: `src/scenes/MainMenuScene.ts`, `KingSelectScene.ts`, `CrownsScene.ts`, `HelpScene.ts`, `RunEndScene.ts`, `RealmScene.ts`, `PlanningHudScene.ts`, `BattleHudScene.ts`, `SettingsScene.ts`
- Create: `src/platform/safeArea.ts`, `src/ui/safeAreaModel.ts`, `docs/balance/2026-11-09-g5-performance.md`
- Test: `src/ui/safeAreaModel.test.ts`, tests cùng tên các layout trên

**Interfaces:** SafeInsets top/right/bottom/left:number; `safeViewport(screen:Size,insets:SafeInsets):Rect`; `layoutMode(viewportWidth:number):'desktop'|'mobile'`. Adapter đọc CSS env/content box; layout/input canvas-local, breakpoint viewport trước inset.

- [ ] **Step 1: Test hỏng.** 375×812 inset 44 top/34 bottom → (0, 44, 375, 734); 812×375 inset 44 hai bên vẫn desktop dù content 724; 767 mobile/768 desktop. Orientation recompute; target ≥ 44/Settings 48, menu 5 nút/footer không overlap logo landscape thấp (scroll), confirm/close luôn tới, không trừ inset 2 lần.
- [ ] **Step 2:** `npx vitest run src/ui < /dev/null` → FAIL ca mới.
- [ ] **Step 3:** CSS #game `env(safe-area-inset-*, 0px)` bốn phía, Phaser RESIZE theo content box thay window width/height; mode viewport riêng, truyền vào models. Giữ overscroll/touch-action đã có, scroll nội dung game không page; không thu nhỏ target. Kiểm pointer/pinch/pan khi inset thay.
- [ ] **Step 4:** Tests → PASS. Browser hai viewport+notch + 812×375, xoay 3 lần, không pull-to-refresh, pinch/pan đúng. Đo max entity/projectile scene 60 s sau 5 s warmup, audio/juice bật: desktop ≥ 60 fps, mobile hoặc throttle 4× ≥ 30 fps; report browser/device/DPR/counts/mean/p95/drops. `npx vitest run src/game/battle/benchmark.test.ts < /dev/null` → test ≤ 2 ms/tick, ghi mean mục tiêu ≤ 0.5 ms riêng. Không đạt thì tối ưu pool/render rồi đo lại, không giảm quân/tick để qua.
- [ ] **Step 5:** Commit `fix(mobile): safe areas and short landscape layouts` sau xanh.

### Task 10: Offline PWA theo base/build output (logic tooling — Claude; UI/icons — Codex, Claude review)

**Files:**
- Create: `public/manifest.webmanifest`, `public/sw.js`, `src/platform/pwa.ts`, `tools/buildPwa.ts`, `tools/icons.ts`, `public/icons/crown-192.png`, `public/icons/crown-512.png`, `public/icons/crown-maskable-512.png`
- Modify: `vite.config.ts`, `package.json`, `index.html`, `src/main.ts`, `src/scenes/MainMenuScene.ts`, `docs/assets.manifest.yml`, `CREDITS.md`, `docs/balance/2026-11-09-g5-performance.md`
- Test: `tools/buildPwa.test.ts`, `tools/icons.test.ts`, `src/platform/pwa.test.ts`

**Interfaces:** `buildPwa(outDir:string):Promise<void>` emits dist/sw.js; `registerPwa(baseUrl:string):Promise<ServiceWorkerRegistration|null>`; `makeIcon(size:192|512,maskable:boolean):Uint8Array` PNG. Encoder node:zlib+PNG chunks/CRC, không dependency mới; crown motif có sẵn index.html, integer grid 8 → cell 24/64, maskable trong safe-circle 80%.

- [ ] **Step 1: Test hỏng.** Build fixture hashed JS/CSS/nested PNG đủ precache, không sw/docs, sorted/digest đổi khi art đổi. Root/subpath/'./' URLs đúng. Install 1 fetch 404 → worker mới fail, worker cũ giữ; waiting không skipWaiting giữa battle; menu explicit mới kích hoạt. Activate chỉ xoá app+scope caches cũ, không cache khác; không cache cross-origin/nonGET. Icon decode đúng 192/512/deterministic/alpha 0/255; manifest start/scope'./', standalone, icons 192/512/maskable.
- [ ] **Step 2:** `npx vitest run tools/buildPwa.test.ts tools/icons.test.ts src/platform/pwa.test.ts < /dev/null` → FAIL.
- [ ] **Step 3:** Icon script `icons: tsx tools/icons.ts`, code-generated không imagegen; manifest relative, link manifest/apple-icon. SW viết tay template; Vite closeBundle hook sau public+bundle output, enumerate mọi runtime file dist, digest/version cache; không hardcode/assets. PROD register theo BASE_URL/document.baseURI. All-or-nothing install; static cache-first/navigation network-first scope-index fallback. Không auto skipWaiting/claim giữa ván; menu thông báo cập nhật/nút reload, không đụng IndexedDB; cleanup scoped old cache sau activate. Đăng ký icons custom manifest+credits.
- [ ] **Step 4:** Tests → PASS. `npm run icons < /dev/null`; `npm run build < /dev/null`; `npm run build -- --base=/crowned-kingdoms/ < /dev/null` → 0. `npx vite preview --host 127.0.0.1 < /dev/null` và host thực sự phục vụ subpath; browser warm online → offline cold reload → new/resume/portrait/UI/art, standalone install. Build B chờ giữa battle, về menu chọn update dùng B; art 404 khiến B fail vẫn A offline. Dọn test SW/cache trước dev, không xoá user IndexedDB.
- [ ] **Step 5: Đóng P5.** Gate default build lại + browser hai viewport console không lỗi; report offline/base/install/FPS. Phase-close `feat(pwa): scoped offline cache and generated icons`, update the G5 PR (section P5).

## Phần P6 — Art isometric sáu vua

### Task 11: Catalog/prompt script và 12 cổng một mẫu (pipeline — Claude; ảnh — Codex, Claude review)

**Files:**
- Modify: `docs/art-review/g3e/buildings/make_prompts.py`, `tools/test_art_prompts.py`
- Create: `docs/art-review/g5/catalog.json`, `docs/art-review/g5/make_assets.py`, `docs/art-review/g5/make_sheet.py`, `tools/test_g5_art.py`
- Create theo catalog: `docs/art-review/g5/<king>/sample-review.md`, `<asset>/prompt.md`, `<asset>/source.png`, `<asset>/native.png`, `sample-sheet.png`
- Read trước mỗi ảnh: toàn ART_STYLE, HANDOFF, iso-board/make_assets.py/sample-review.md/wheat/review.md/polish/review.md, approved PNG references

**Interfaces:** CLI mới `python docs/art-review/g3e/buildings/make_prompts.py g5-iso --king <king> --kind building|plot --sample <asset-id>` nhận đúng 1 id; `--group --approval <sample-review.md>` chỉ sau owner sample approved. `make_assets.py --king <king> --stage` không publish; `make_sheet.py --king <king> --samples`. Catalog king/assetId/cardId/kind/refs/nativeSize/foot/projection, throne+troop/tower/economy/support, không tome/enchantment; số asset mỗi vua phải **đếm từ catalog** lúc thực thi: 1 throne + số card troop/tower/economy/support của vua đó lấy từ `CONTENT` + 4 plot skins. Ghi số building, plot và tổng riêng từng vua trong catalog/review, không hard-code số đoán; TS test Task 12 đối chiếu CONTENT, Python không tự import TS.

- [ ] **Step 1: Test hỏng.** test_art_prompts exact sáu king/2 kind; sample rejects 0/2 ids/missing doc/ref, prompt nguyên iso_template+read-doc instruction/style ref+approved Wheat cùng kind; runner có từng -i, không chỉ text; group reject pending/rejected/wrong king/kind. Dùng tempfile để không ghi đè prompt cũ.
- [ ] **Step 2:** `python -m unittest discover -s tools -p test_art_prompts.py` → FAIL; implement generator đọc iso_template từ ART_STYLE. Refs harvester-house-front-approved.png + public/assets/art/ai-v1/iso/wheat_throne.png cho building, iso/plots/wheat_open/built/locked/throne.png tương ứng plot; kèm iso-building/plot approved references. Prompt bắt Codex đọc doc, world 2:1/right door/roof axis/sáng trái/đất trống không luống/cọc thấp, nguồn đen theo override. Không viết prompt từ trí nhớ.
- [ ] **Step 3:** Tests → PASS. `test_g5_art` alpha 0/255/centre_plot widest row giữa/plot width 128/scale mật độ Wheat-Reapers 64/foot/projection; implement keyed/reduce/centre_plot reuse từ iso-board helper tương đương, chưa publish. `python -m unittest discover -s tools -p test_g5_art.py` → PASS. Không ép RGB 32.
- [ ] **Step 4 — STOP GROVE-BUILDING:** generator --king grove --kind building --sample grove_throne; Codex tạo đúng 1 ảnh, stage/sheet/Claude review; **DỪNG chờ owner duyệt**, ghi câu duyệt/ngày/source/native trước group.
- [ ] **Step 5 — STOP GROVE-PLOT:** đúng 1 plot_grove_open; **DỪNG chờ owner duyệt** trước group plot.
- [ ] **Step 6 — STOP TIDE-BUILDING:** đúng 1 tide_throne; **DỪNG chờ owner duyệt** trước group building.
- [ ] **Step 7 — STOP TIDE-PLOT:** đúng 1 plot_tide_open; **DỪNG chờ owner duyệt** trước group plot.
- [ ] **Step 8 — STOP FORGE-BUILDING:** đúng 1 forge_throne; **DỪNG chờ owner duyệt** trước group building.
- [ ] **Step 9 — STOP FORGE-PLOT:** đúng 1 plot_forge_open; **DỪNG chờ owner duyệt** trước group plot.
- [ ] **Step 10 — STOP CLOCK-BUILDING:** đúng 1 clock_throne; **DỪNG chờ owner duyệt** trước group building.
- [ ] **Step 11 — STOP CLOCK-PLOT:** đúng 1 plot_clock_open; **DỪNG chờ owner duyệt** trước group plot.
- [ ] **Step 12 — STOP MOON-BUILDING:** đúng 1 moon_throne; **DỪNG chờ owner duyệt** trước group building.
- [ ] **Step 13 — STOP MOON-PLOT:** đúng 1 plot_moon_open; **DỪNG chờ owner duyệt** trước group plot.
- [ ] **Step 14 — STOP NOMAD-BUILDING:** đúng 1 nomad_throne; **DỪNG chờ owner duyệt** trước group building.
- [ ] **Step 15 — STOP NOMAD-PLOT:** đúng 1 plot_nomad_open; **DỪNG chờ owner duyệt** trước group plot.
- [ ] **Step 16:** Mỗi gate chỉ chặn group tương ứng; không runner cả 12 mẫu hoặc group trước duyệt, không adopt vì Claude đã review. P1–P5 không chờ art, vẫn audit P7 độc lập. Commit tooling/mẫu trạng thái chính xác, không nối ảnh pending.

### Task 12: Groups từng vua → review → adoption (UI/image — Codex, Claude review)

**Files:**
- Create theo catalog: `docs/art-review/g5/{grove,tide,forge,clock,moon,nomad}/<asset>/{prompt.md,source.png,native.png}`, `group-review.md`, `sheet.png`
- Create approved only: `public/assets/art/ai-v1/iso/<king>/<cardId>.png`, `public/assets/art/ai-v1/iso/<king>/plots/<king>_{open,locked,throne,built}.png`
- Modify: `src/render/imageArt.ts`, `docs/assets.manifest.yml`, `CREDITS.md`, `docs/art-review/g5/make_assets.py`
- Test: `src/render/g5ImageArt.test.ts`, `tools/test_g5_art.py`

**Interfaces:** explicit BUILDINGS_APPROVED/PLOTS_APPROVED readonly string[], filter G5 catalog không ảnh hưởng Wheat/neutral; IMAGE_PLOTS thêm vua khi đủ 4 skin, IMAGE_BUILDINGS từng card approved. `make_assets.py --king <king> --publish --approval <group-review.md>` reject pending. Catalog là exact file scope, không add wildcard asset khác.

- [ ] **Step 1: Test hỏng.** `g5ImageArt` đối chiếu CONTENT sáu king throne+kind troop/tower/economy/support đủ catalog, không tome/enchantment; pending không IMAGE_ART_FILES, approved có PNG/manifest/CREDITS/projection/size/anchor/provenance. Frame name không đổi, missing PNG code fallback. Python publish rejects thiếu owner approval/metadata/alpha sai; atlas pack cuối ≤ 4096 mỗi chiều.
- [ ] **Step 2:** `npx vitest run src/render/g5ImageArt.test.ts < /dev/null`; `python -m unittest discover -s tools -p test_g5_art.py` → FAIL trước publish/wiring.
- [ ] **Step 3:** Sau sample owner-approved từng kind, generate --group, Codex vẽ phần còn lại từng asset. Stage/sheet, Claude kiểm 2 mặt/roof axes/right door/light/pixel/alpha/native/foot/readability 1×. Log prompt/source/output, giữ rejected versions, không thêm units.
- [ ] **Step 4 — STOP GROUP GROVE:** trình sheet/source/native buildings + 4 plots; **DỪNG chờ owner duyệt từng group trước publish**.
- [ ] **Step 5 — STOP GROUP TIDE:** như trên, **DỪNG chờ owner duyệt**.
- [ ] **Step 6 — STOP GROUP FORGE:** như trên, **DỪNG chờ owner duyệt**.
- [ ] **Step 7 — STOP GROUP CLOCK:** như trên, **DỪNG chờ owner duyệt**.
- [ ] **Step 8 — STOP GROUP MOON:** như trên, **DỪNG chờ owner duyệt**.
- [ ] **Step 9 — STOP GROUP NOMAD:** như trên, **DỪNG chờ owner duyệt**. Không suy từ approval vua khác/Wheat.
- [ ] **Step 10:** Approved group mới publish, register mỗi PNG custom/source/creator/evidence/projection iso_2_1/nativeSize/finalSize/anchor/notes và CREDITS; plots centre giải thích, nhà feet. Bật approval lists → IMAGE_BUILDINGS/IMAGE_PLOTS/IMAGE_ART_FILES, giữ code fallback/frame API. Chạy Step 2 tests → PASS và `python -m unittest discover -s tools -p test_art_prompts.py` → PASS, build atlas thật.
- [ ] **Step 11:** Browser từng vua trong sáu vua ở hai viewport: mọi nhà/Ngai/skin/cấp, depth, zoom 3/lẻ, missing PNG fallback; console không lỗi bình thường. PWA rebuild/offline art mới, cache digest mới. Claude review/screenshots PR.
- [ ] **Step 12: Đóng P6.** Gate khi đủ sáu vua; có thể commit từng vua `art(iso): adopt approved <king> set`; phase-close `art: six approved isometric king sets`, update the G5 PR (section P6). Thiếu approval phase chưa đóng/G5 chưa Done.

## Phần P7 — Acceptance + docs

### Task 13: Chứng minh đủ §1 và cập nhật docs (logic audit — Claude; browser — Codex, Claude review)

**Files:**
- Create: `docs/balance/2026-11-09-g5-acceptance.md`
- Modify: `CLAUDE.md`, `AGENTS.md`, `docs/ROADMAP.md`, `docs/GDD.md`, `docs/art-review/HANDOFF.md`, `docs/balance/2026-11-09-g5-balance-report.md`, `docs/balance/2026-11-09-g5-performance.md`
- Test: `src/game/cards/g5Acceptance.test.ts` mới nếu registry count/coverage hiện có chưa đủ; chạy tests thật, không dùng fixture thắng giả làm real-run evidence

**Interfaces:** report 8 mục theo ma trận spec G5 §9: revision/commands/date/machine/evidence/status, không API mới.

- [ ] **Step 1: Test trước nếu thiếu.** `g5Acceptance` đếm 9 Ngai/81 thẻ vua/12 neutral/27 perk/9 banner/18 decree/13 quest/3 boss/royal_boulder và handler/placeholder coverage. FAIL → khắc phục thiếu đúng data, không nới count; dùng CONTENT/constants thật, không duplicate card list.
- [ ] **Step 2:** `npx vitest run src/game/cards src/game/sim src/game/battle src/platform/resumeIntegration.test.ts < /dev/null` → PASS. Evidence 9 × 3 greedy/random real runs, deterministic inputs/reversed order/hash, thắng 30/thua 0 mạng, save mọi pha/meta. orchestration 30 fixture không thay real run.
- [ ] **Step 3:** Final 500 × 9 revision cuối, target 35–65/spread ≤ 15 pp/crash 0; data không đổi có thể tái dùng P2 kèm revision/content hash chứng minh tương đương, không giả đo mới. Kiểm seed/perk/meta/bot không lẫn. Long runs ngoài npm test.
- [ ] **Step 4:** Browser toàn §10: Boot/Preload/menu/king select carousel+detail/Realm hai HUD/reward/conquest/council/quest/deck/calendar/scout/help/run end/crowns/settings. Hai viewport + landscape/notch: no overlap/clipping, target ≥ 44/FONT_UI glyph Việt. Chơi tay boss 1/hội đồng, reload planning/midbattle tick 0 cùng setup; unlock/settings tồn tại, delete chỉ run. Sáu vua approvals/fallback, max count FPS audio+juice+art cuối, atlas ≤ 4096, console không lỗi. Ghi thiếu evidence trung thực.
- [ ] **Step 5:** Offline/root/subpath/update/install checks trên production final, CI xanh PR revision; pending CI/FPS/art → chưa Done.
- [ ] **Step 6:** Acceptance 8 dòng links/tests/ảnh/CSV/metrics. Đồng bộ CLAUDE/AGENTS audio/pwa/settings/greedy/stats và architecture; ROADMAP G5✔ chỉ đủ 8 mục; GDD tóm tắt hành vi thật; HANDOFF approval/source/native/fallback, sửa zoom nguyên cũ thành free zoom/snapView. Ghi chú atomic endRun/credited/lastLife cũ chỉ sửa theo code/regression, không làm lại owner decisions.
- [ ] **Step 7: Đóng P7.** Gate exit 0 + browser hai viewport console không lỗi; review diff/spec; phase-close `docs: G5 full-game acceptance evidence`, update the G5 PR (section P7). Chờ owner yes trước merge, không tự release.

## Rủi ro

- HP×DPS thiên combat, bỏ economics/summons tương lai: công khai giới hạn, card/loss tables và random/scripted cross-check; không sửa won/bot để ép target.
- ~4,9 phút là sàn từ 65 ms/run G4; greedy 10–30 phút hoặc hơn: pilot ETA/progress và chạy dài ngoài test suite.
- Events bổ sung nguồn đòn chỉ telemetry: hash/final-drain tests bắt buộc, không audio import vào game.
- Settings/delete race: concurrent queue/checkpoint tests và newer read-only giữ meta.
- Safe-area dễ trừ 2 lần và 812 → 724 đổi breakpoint: viewport mode riêng/canvas-local tests.
- SW cache art lớn/quota: install fail giữ worker cũ, báo chưa sẵn offline, không xoá meta; report cache size.
- Art approvals/atlas dung lượng: từng group độc lập, không chặn phase khác, không báo Done khi pending.

## Câu hỏi mở

Không có quyết định sản phẩm còn chặn thực thi. Số tuning cuối/runtime/owner art approvals là kết quả evidence từng phase, không đoán trước.



