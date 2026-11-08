# Endless — Vô tận Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm Vô tận mở sau thắng 30 năm, bàn 7×7, lịch vô hạn, phúc lành, biến thể và save/resume deterministic.

**Architecture:** Rules/mode riêng giữ đường normal làm baseline. Data chứa bảng Endless và geometry descriptors; game thực hiện luật thuần, BattleSetup mang geometry theo instance chỉ khi Endless. UI đọc state/gửi intent qua bus; session ghi meta và kết thúc save nguyên tử.

**Tech Stack:** TypeScript strict · Phaser 4 · Vite · Vitest · IndexedDB native / fake-indexeddb.

**Spec:** `docs/superpowers/specs/2026-11-09-endless-mode-design.md` (đọc toàn bộ trước thực thi). Add-on ngoài G0–G5.

**Ngoài phạm vi:** ảnh/asset mới, âm thanh, leaderboard, prestige, cấp trên 5, tăng cap quân, chuyển ván thường đang chơi sang Endless. Phiên này chỉ viết hai tài liệu: **không chạy node/npm/npx, viết code hay commit**. Các command bên dưới dành cho phiên triển khai sau.

## Global Constraints

- Thứ tự E1 Claude TDD → E2 Codex UI, Claude review → E3 Codex UI → E4 headless/docs. E1 chốt data/state trước E2; E3 phụ thuộc E1/E2. Không giao hai worker sửa cùng file đồng thời.
- Core/data/game không import Phaser/scenes/render/ui/platform/audio; data không import game. Chỉ platform chạm IndexedDB. Mọi số gameplay ở src/data.
- Không Math.random/Date.now/performance.now/Math.hypot/sin/cos/tan/atan2/exp/log/pow trong core/data/game; dùng Rng/hashSeed, thứ tự id ổn định; trận 10 tick/s không RNG.
- RULES_FULL giữ nguyên; normal 25 ô, Ngai 2, 64 px, field768, origin224, wall176; BattleSetup bytes/hash/trace và điểm không đổi. Không sửa expected hash để cho test xanh.
- Endless inner id0..24, outer25..48 row-major quanh [-1,5]; không row×7 làm id. Mép[160,608), tâm384, wall112; DEPLOY_BOX[-24,24]×[18,30], road608..768, portal(384,792). Project/unproject giữ nguyên.
- RULES_ENDLESS={years:30,calendar:'endless',autoStart:false}; years là mẫu lịch, không hạn thắng. Chỉ hết mạng kết thúc. EP31=795,32=914, base cap1.000.000/final cap3.000.000; boss cycle×1,25 trần10×. Bảng literal, lookup bão hoà O(1).
- Blessing30/35/40/…: chọn1 trong3 id khác nhau, stream blessing riêng; 12 loại/stack cap theo spec§5, max stack đổi25 vàng. Modifier từ31, mỗi10 năm, bốn loại theo spec§6.
- Điểm Endless min(completedYears,60), min(bossesWon,3), conquest một lần/vua, victory0; max93/186 ở Gai0/5. Score khi chết=completedYears−1; stats thật không cắt.
- Run save6→7/envelope1; v6 migrate normal/endless=null/RNG blessing trung tính. Meta1→2, v1 flag endlessUnlocked=false vì thiếu provenance. Chỉ normal/full/30 won và completedYears30 unlock. Không xoá meta/downgrade newer.
- Normal JSON save chỉ khác schema theo spec§8; projection bỏ version/mode/endless/rng.blessing phải khớp baseline. Fixtures cũ giữ nguyên; thêm test mới thay vì rewrite dữ liệu cũ.
- UI Việt/FONT_UI/createPanel/createButton/ContentBox/Tooltip, targets≥44×44; resize1280×720,375×812, breakpoint768. Free zoom overview→3×, snapView, HUD không zoom. Reset scene trong create và cleanup listeners.
- Tái dùng art; không sửa atlas/manifest/CREDITS. Trước viết Phaser đọc v3-to-v4-migration rồi scenes/cameras/input/scale/text/sprites skills tương ứng, kiểm type Phaser4.
- Mỗi task: test FAIL đúng assertion → implement tối thiểu → PASS. Gate mỗi pha: `npm run lint && npm run typecheck && npm test && npm run build`, exit0. Git Bash Windows thêm `< /dev/null` sau mỗi npm command; PowerShell chạy riêng lệnh nếu cần.
- Thực thi trên feature branch từ develop, PR vào develop; không push main/develop, không tự merge/deploy. Planning-only dừng sau tài liệu.

## Review Focus

1. Save v3–v6 và v7 Endless hỏng → migrate trung tính, không đổi trận normal, từ chối payload sai: Task1/5/6.
2. Mốc30/35/40/41, thua còn mạng/hết mạng, hết sắc lệnh, vua lặp → không thắng sớm, kẹt queue hoặc thưởng hai lần: Task2/3/5.
3. Outer corners/inner seams, hai world khác mode, scene tái dùng → adjacency/hit/deploy/wall đúng instance: Task1/6/7.
4. Reload offer, double-click, lỗi ghi meta/newer profile → không roll lại/hồi mạng/settle/unlock lặp, không downgrade: Task3/5/8.
5. Năm xa/budget cap/buff cap/49 nhà → finite numbers, bounded lookup/queue/pools, calendar theo trang, score/meta rõ: Task2/3/4/7/9/10.

---

## E1 — Rules/data/state/save (Claude, TDD)

### Task 1: Baseline normal, mode và descriptor bàn

**Files:**
- Create: `src/data/endless.ts`, `src/game/run/boardGeometry.ts`, `src/game/run/endlessCompatibility.test.ts`, `src/game/run/endlessBoard.test.ts`.
- Modify: `src/data/boardGeometry.ts`, `src/data/rules.ts`, `src/game/run/board.ts`, `src/game/run/state.ts`, `src/game/run/yearFlow.ts`.
- Modify: `src/game/run/modifiers.ts`, `src/game/run/income.ts`, `src/game/run/perks.ts`, `src/game/run/decrees.ts`, `src/game/run/quests.ts`.
- Modify: `src/game/cards/custom/arcane.ts`, `src/game/cards/custom/forge.ts`, `src/game/cards/custom/moon.ts`, `src/game/cards/custom/nomad.ts`, `src/game/cards/custom/clock.ts`, `src/game/cards/custom/tide.ts` (consumer row/col/neighbours, không đổi effect).
- Test: `src/game/run/board.test.ts`, `src/game/run/yearFlow.test.ts` và hai test mới.

**Interfaces:**
- Data `RunMode='normal'|'endless'`; `BoardGeometryDef` chứa id, plotCount, side, plotSize, innerOrigin, boardMin/Max, field, wallY, thronePlot, roadStartY, portal, plotCells readonly `{row:number,col:number}[]`. Export NORMAL_GEOMETRY/ENDLESS_GEOMETRY, THRONE_PLOT=2; board.ts re-export hằng cũ.
- Game `geometryFor(mode:RunMode):BoardGeometryDef`, `plotCoords(plot:number,mode:RunMode='normal'):{row:number,col:number}`, `plotAtCell(row:number,col:number,mode:RunMode='normal'):number|null`; neighbours/initialPlots/plotRow/plotCol thêm mode optional default normal.
- RunMode định nghĩa tại src/data/rules.ts; RunState mode/endless/rng.blessing theo spec§5, version7. Endless payload ban đầu: blessingStacks={}, lastBlessingYear=0, modifierId=null, modifierStartYear=0. newRun suy mode từ calendar, không thêm mode option có thể mâu thuẫn rules.

- [ ] **Step 1 — Baseline trước sửa:** chạy determinism/save/geometry tests; ghi literal normal command/gameplay trace cho wheat/stone/arcane seed1/2/3 trong endlessCompatibility.test.ts. Gameplay projection bỏ đúng trường schema mới; raw BattleSetup/hash từng tick phải giống. Không regenerate baseline sau sửa.
- [ ] **Step 2 — Test đỏ:** normal25 ô/10 mở/Ngai2; Endless49/10 mở/24 outer khoá. Mapping25=(-1,-1),31=(-1,5),32=(0,-1),33=(0,5),48=(5,5), bijection. Ô0 normal neighbours=[1,5], Endless thêm26 Bắc/32 Tây, không wrap hàng. Play/two-target/freeMove/council chấp nhận48, từ chối -1/49/fractional/NaN trước indexing.
- [ ] **Step 3 — Run:** `npm test -- src/game/run/endlessBoard.test.ts src/game/run/endlessCompatibility.test.ts` → FAIL assertions mới.
- [ ] **Step 4 — Implement:** descriptor ở data, helpers ở game; truyền mode qua consumers. Adapter legacy chỉ nhận plots được suy 25→normal/49→endless, độ dài khác từ chối; đường có state dùng state.mode. Sửa COUNT/validPlot/checkTargetStep và mọi loop để outer chơi được. Chưa nối renderer.
- [ ] **Step 5 — Verify:** Step3 PASS; `npm test -- src/game/cards src/game/run/board.test.ts src/game/run/yearFlow.test.ts` PASS, baseline normal giữ nguyên.

### Task 2: Lịch từng năm, ngân sách bão hoà, tiếp tục sau30

**Files:**
- Modify: `src/data/endless.ts`, `src/data/rules.ts`, `src/game/run/calendar.ts`, `src/game/run/enemyArmy.ts`, `src/game/run/commands.ts`, `src/game/run/yearEnd.ts`, `src/game/run/yearFlow.ts`, `src/game/run/decrees.ts`.
- Create: `src/game/run/endlessRules.ts`, `src/game/run/endlessCalendar.test.ts`, `src/game/run/endlessFlow.test.ts`.
- Test: `src/game/run/fullCalendar.test.ts`, `src/game/run/fullFlow.test.ts`, `src/game/battle/compose.test.ts`.

**Interfaces:**
- `calendarSlotAt(rules:Rules,year:number):CalendarSlot`; calendarFor giữ hữu hạn, Endless trả mẫu30, caller không index nó bằng năm>30.
- endlessRules.ts: `endlessBaseBudget(year:number):number`, `endlessArmyBudget(year:number,slot:number,difficulty:number,modifierBudgetMult:number):number`, `endlessBossScale(year:number):number`; lookup literal data + arithmetic.
- `isCouncilYear(state:RunState):boolean`, `isBlessingYear(state:RunState):boolean`, `isFinalYear(state:RunState):boolean`; normal điều kiện cũ, Endless final=false, lives0 luôn kết thúc.

- [ ] **Step 1 — Test đỏ:** slot31 raiders/33 K1attack1/40ogre/50hornet/60crownless/70ogre; 1..30 khớp FULL_CALENDAR, kings không xáo lại. Endless30 có reward/council, normal30 kết thúc; hết mạng không offer. Vua lặp vẫn tấn công nhưng không conquest/gold/card lần hai, attacks≤3.
- [ ] **Step 2 — Test đỏ cap:** base30=691/31=795/32=914, mọi literal đúng recurrence đến cap; year1.000.000 tra cuối ngay; final≤3.000.000 mọi slot/Gai/modifier, quân≤120/finite statMult. Boss30=1/40=1.25/70=1.5625 và cap10. Council30/35, pool còn1/hết0 hợp lệ; không quest mới sau27.
- [ ] **Step 3 — Run:** `npm test -- src/game/run/endlessCalendar.test.ts src/game/run/endlessFlow.test.ts` → FAIL.
- [ ] **Step 4 — Implement:** literal tables data, không runtime generator/Math.pow. EnemyArmy route Endless riêng, giữ armyBudget/composeArmy normal. Thay full/final checks trong commands/yearEnd/yearFlow; không mất reward vì years30. Conquest chỉ pending→conquered một lần. Council loại owned, pool0 bỏ modal; quest schedule hữu hạn.
- [ ] **Step 5 — Verify:** Step3 PASS; `npm test -- src/game/run/fullCalendar.test.ts src/game/run/fullFlow.test.ts src/game/battle/compose.test.ts src/game/run/endlessCompatibility.test.ts` PASS.

### Task 3: Phúc lành, hàng đợi và kinh tế/giá ô

**Files:**
- Create: `src/game/run/endlessBlessings.ts`, `src/game/run/endlessBlessings.test.ts`, `src/game/run/endlessEconomy.test.ts`.
- Modify: `src/data/endless.ts`, `src/game/run/state.ts`, `src/game/run/flow.ts`, `src/game/run/commands.ts`, `src/game/run/yearFlow.ts`, `src/game/run/yearEnd.ts`, `src/game/run/income.ts`, `src/game/run/decrees.ts`, `src/game/run/perks.ts`.
- Test: `src/game/run/flow.test.ts`, `src/game/run/commands.test.ts`, `src/game/run/RunControllerPersistence.test.ts`.

**Interfaces:**
- Data EndlessBlessingId/EndlessBlessingDef/ENDLESS_BLESSINGS đúng12 dòng spec§5; typed effect discriminant/amount/maxStacks, không callbacks data.
- `rollBlessingOffer(state:RunState):RunState`, `pickBlessing(state:RunState,index:number):RunState|IllegalReason`, `blessingStacks(state:RunState,id:EndlessBlessingId):number`.
- `maxLivesForRun(state:RunState):number`, `plotPurchasePrice(state:RunState,plot:number):number`, `endlessInterest(state:RunState,balanceAfterUpkeep:number):number` ở endlessBlessings.ts; normal trả số cũ.

- [ ] **Step 1 — Test đỏ:** cùng seed3 id khác nhau, chỉ rng.blessing đổi; năm29 không roll,30/35/40 có. FIFO reward→conquest→council→blessing; cardOffer null cho blessing; đóng offer mở tiếp đúng pha. Pick null/NaN/3/wrongPhase không đổi state, double submit không tăng2 lần, cùng lastBlessingYear không enqueue lại.
- [ ] **Step 2 — Test đỏ economy:** đủ12 effect/cap; max stack→25 gold/goldEarned. Vitality4→5→6, hồi ngay1, mọi nguồn heal cùng trần, normal4. Thuế/free reroll nhận năm kế; interest123/1stack=2,1000/1stack=10, không tính thuế mới. Outer k0=20/k1=22; survey1:20→18,inner4→3, min1; Khai Hoang48 không tăng purchasedPlots.
- [ ] **Step 3 — Run:** `npm test -- src/game/run/endlessBlessings.test.ts src/game/run/endlessEconomy.test.ts` → FAIL.
- [ ] **Step 4 — Implement:** mở OfferState/RunPhase/RunCommand, phaseOf/cardOffer/closeOffer; roll1 lần rồi lưu offer/lastBlessingYear/RNG. Enqueue sau council, giữ quest settlement hiện hành. Upkeep→interest→tax→building, goldEarned đúng nguồn; cộng free reroll decree/perk/blessing; unlockPlot dùng chung price. Chọn buff dùng checkpoint RunController, không helper tự save.
- [ ] **Step 5 — Verify:** Step3 PASS; `npm test -- src/game/run/flow.test.ts src/game/run/commands.test.ts src/game/run/RunControllerPersistence.test.ts` PASS; checkpoint xong trước bus state.

### Task 4: Modifier và stat pipeline

**Files:**
- Create: `src/game/run/endlessModifiers.ts`, `src/game/run/endlessBattle.test.ts`.
- Modify: `src/data/endless.ts`, `src/game/run/endlessBlessings.ts`, `src/game/run/modifiers.ts`, `src/game/run/battleSetup.ts`, `src/game/run/yearFlow.ts`, `src/game/run/commands.ts`, `src/game/run/income.ts`.

**Interfaces:**
- EndlessModifierId/ENDLESS_MODIFIERS bốn dòng spec§6.
- `modifierAt(seed:number,year:number):{id:EndlessModifierId,startYear:number}|null`; state cập nhật đầu năm trước army/income, preview gọi thuần.
- `endlessStatBonuses(state:RunState,kind:'unit'|'tower'|'structure'):Partial<Record<StatKey,number>>`; ally cộng sheet trước finalStat, enemy scaling trên bản sao setup, không sửa registry.

- [ ] **Step 1 — Test đỏ:** y30null,31..40 cùng,41 đổi,71 quay lại; seed offset đúng hashSeed và không stream cũ đổi. Elite foe/boss/summon/mirror +25%HP/+10%DMG; double_edge +25%DMG hai phe; famine tax floor0 và +3 reward sau boss; siege EP×1.2 và structureHP+20%.
- [ ] **Step 2 — Test đỏ combat:** blessing unit HP/DMG/speed bao gồm death/start/kill/respawn summon; tower projectile/pulse/DOT/attackSpeed không Ngai, masonry có Ngai; interval clamp cũ giữ. Boss40 scale1.25 một lần; Ném Bùn base60→75 trước modifier và double_edge→93.75, không nhân hộ tống hai lần/mirror nhận ally blessing. Build setup2 lần bytes bằng nhau, registry unchanged, normal không property rỗng.
- [ ] **Step 3 — Run:** `npm test -- src/game/run/endlessBattle.test.ts` → FAIL.
- [ ] **Step 4 — Implement:** sheet trước finalStat, explicit DOT burn/poison/pulse; boss/summon/mirror scaling theo spec§3, modifier sau. BossSetup thêm specialDamage?:{mud:number}, chỉ Endless resolve base × bossScale × modifier damage multiplier; sửa src/game/battle/types.ts và src/game/battle/bosses.ts (Modify, thuộc Task4) đọc field này với fallback raw normal. Test Ném Bùn đi tới damageQueue xác nhận không double scale. Không runtime loop buff trong stepBattle, không tăng cap/timer.
- [ ] **Step 5 — Verify:** Step3 PASS; `npm test -- src/game/run/modifiers.test.ts src/game/battle/determinism.test.ts src/game/run/endlessCompatibility.test.ts` PASS.

### Task 5: Save7, meta2, unlock và settle

**Files:**
- Modify: `src/game/save/codec.ts`, `src/game/save/migrate.ts`, `src/game/save/codec.test.ts`, `src/game/save/migrate.test.ts`.
- Modify: `src/data/meta.ts`, `src/game/meta/profile.ts`, `src/game/meta/codec.ts`, `src/game/meta/crowns.ts`, `src/game/meta/unlocks.ts`, `src/game/meta/index.ts`, `src/game/meta/testRun.ts`.
- Modify: `src/game/meta/codec.test.ts`, `src/game/meta/crowns.test.ts`, `src/game/meta/unlocks.test.ts`, `src/platform/session.ts`, `src/platform/resumeIntegration.test.ts`.
- Create: `src/game/save/endlessCodec.test.ts`, `src/game/meta/endless.test.ts`.

**Interfaces:**
- migrateRunState thêm6→7; validate theo mode/descriptor/year safe integer. contentHash normal giữ nguyên; Endless envelope hash gồm endless data version/ids, không lấy hash thay validation.
- MetaProfile.endlessUnlocked; `isEndlessUnlocked(profile:MetaProfile):boolean`; crownPoints/settleRun cùng API, defaultProfile v2; meta v1 migrate thuần trong codec, không DB upgrade.

- [ ] **Step 1 — Test đỏ:** fixture3/4/5/6→7, gameplay/RNG cũ giữ bytes, v7 decode2 lần không mutate. Roundtrip Endless65/49plots/current+pending blessing/council/questReward; vitalityStacks2/lives6 nhận, lives7 từ chối. Reject mode/rules mismatch,25plotsEndless/49normal, thiếu Ngai, NaN/Infinity/year fractional/unsafe, stack lạ/âm/quá cap, offer trùng id/sai mốc, modifier sai block, selection49. Hash khác/ids đúng nhận, hash khớp/payload sai từ chối.
- [ ] **Step 2 — Test đỏ meta:** chỉ normal/full30/won/completed30 unlock; G1/G2/Endless không. v1 wins>0 vẫn false, giữ points/mastery/settings; v2 flag hỏng sửa riêng, newer readonly. Endless years100/boss10/conquest6 Gai0=93/Gai5=186; normal win83. Settle2 lần không cộng2 lần; ghi lỗi giữ save/chưa bật flag.
- [ ] **Step 3 — Run:** `npm test -- src/game/save src/game/meta src/platform/resumeIntegration.test.ts` → FAIL assertions mới.
- [ ] **Step 4 — Implement:** decoder kín phase/offer/mode/id; validate stacks trước rồi lives theo maxLivesForRun, mở year chỉ Endless, giữ format/db. Test fakeRun thêm mode/rules defaults thay vì production fallback cho state thiếu trường. Giao dịch endRun sẵn có lưu points/flag rồi clear, readonly không ghi; không store mới.
- [ ] **Step 5 — Verify:** Step3 PASS; reload matrix planning/battleTick0/reward/council/blessing/yearEnd/ended ở31/35/40/41, setup bytes trước/sau giống, không áp lại stack/mạng. Full gate E1 exit0; Claude review hợp đồng trước E2.

## E2 — Bàn7×7, render và camera (Codex UI; Claude review)

### Task 6: Geometry simulation theo instance

**Files:**
- Modify: `src/game/battle/types.ts`, `src/game/run/battleSetup.ts`, `src/game/battle/world.ts`, `src/game/battle/deployment.ts`, `src/game/battle/bounds.ts`, `src/game/battle/spawnLayout.ts`, `src/game/battle/movement.ts`, `src/game/battle/bosses.ts`, `src/game/battle/intervention.ts`.
- Create: `src/game/battle/endlessGeometry.test.ts`.
- Test: `src/game/battle/deployment.test.ts`, `src/game/battle/wallBounds.test.ts`, `src/game/battle/portalSpawn.test.ts`, `src/game/battle/determinism.test.ts`, `src/platform/resumeIntegration.test.ts`.

**Interfaces:**
- BattleSetup `geometry?: 'endless'`, absent=normal; world.geometry readonly từ setup, không đọc session. Không thêm descriptor object vào setup/hash normal.
- `plotCenter(plot:number,mode:RunMode='normal')`, `structureFoot(plot:number,mode:RunMode='normal')`; deploymentPosition/clampNorthY thêm mode optional cuối; World truyền mode instance, API cũ default normal.

- [ ] **Step 1 — Test đỏ:** inner2=(384,256) cả mode, outer25=(192,192),48=(576,576);49 DEPLOY_BOX trong ô, count160 xác định. North clamp normal176+r/Endless112+r với unit/flying/boss/knockback. Hai world khác mode xen kẽ step không ảnh hưởng nhau. Portal(384,792) và spawnMaxY đúng.
- [ ] **Step 2 — Run:** `npm test -- src/game/battle/endlessGeometry.test.ts` → FAIL.
- [ ] **Step 3 — Implement:** setup.geometry chỉ Endless; structure/home/deployment/respawn/throne mercenary cùng descriptor. Movement/boss/intervention clamps dùng world.geometry. Giữ số học/order normal, không nhân lại speeds/ranges; hash normal không thêm field derive.
- [ ] **Step 4 — Verify:** Step2 PASS; `npm test -- src/game/battle src/game/run/endlessCompatibility.test.ts src/platform/resumeIntegration.test.ts` PASS. Cổng bắt buộc trước renderer.

### Task 7: Renderer, terrain, hit và camera49 ô

**Files:**
- Modify: `src/render/BoardRenderer.ts`, `src/render/FieldRenderer.ts`, `src/render/fieldArt.ts`, `src/render/IsoWallRenderer.ts`, `src/render/MountainWallRenderer.ts`, `src/render/EnemyPortalRenderer.ts`, `src/render/decorationModel.ts`, `src/render/UnitRenderer.ts`.
- Modify: `src/ui/realm/realmLayout.ts`, `src/ui/realm/cameraModel.ts`, `src/ui/realm/calendarModel.ts`, `src/ui/planning/targetHints.ts`, `src/ui/planning/freeMoveModel.ts`, `src/ui/info/inspectionModel.ts`, `src/ui/info/rangeModel.ts`, `src/scenes/RealmScene.ts`.
- Create: `src/render/endlessBoardModel.ts`, `src/render/endlessBoardModel.test.ts` (helpers geometry/hit/road thuần, không Phaser).
- Test: `src/ui/realm/realmLayout.test.ts`, `src/ui/realm/cameraModel.test.ts`, `src/ui/planning/targetHints.test.ts`, `src/ui/planning/freeMoveModel.test.ts`.

**Interfaces:**
- BoardRenderer/FieldRenderer nhận mode constructor default normal; `plotAtWorld(x:number,y:number,mode:RunMode):number|null` cho BoardRenderer.plotAt. UI price gọi plotPurchasePrice(state,plot).
- realmCamera/overviewZoom/cameraModel helpers thêm mode optional cuối, default normal; Realm lấy mode state, không global mutable geometry.

- [ ] **Step 1 — Test đỏ:** project→camera→unproject hit center49 ô overview/zoom3; boardMax exclusive, projection âm hợp lệ, normal không hit outer. Extent640→896, desktop overview rộng65% có clamp chiều cao, phone giữ zoom33/32, pan wall112, resize giữ tâm trong bounds;2-target/freeMove qua inner seam đúng.
- [ ] **Step 2 — Test đỏ terrain:** road608..768 chỉ một nhánh, wall112, portal cũ; decor không đè board/road/tiêu thụ run RNG, normal terrain signature giữ baseline. Cache key seed+mode tránh dùng lại nền5×5.
- [ ] **Step 3 — Run:** `npm test -- src/render/endlessBoardModel.test.ts src/ui/realm src/ui/planning/targetHints.test.ts src/ui/planning/freeMoveModel.test.ts` → FAIL.
- [ ] **Step 4 — Implement:** iterate descriptor theo id, bỏ SIZE5/PLOTS25 trên đường Endless; giữ frames/depth/skin. UnitRenderer/inspection dùng structureFoot(mode). Wall/road/decor cùng descriptor. Camera và mọi pointer path dùng inverse/unproject hiện hành; không đổi project. Touch overview nhỏ yêu cầu zoom theo threshold hiện hành, không hit bằng AABB. HUD theo realm:view snap.
- [ ] **Step 5 — Verify/browser:** Step3 PASS;1280×720 và375×812 mua outer corner, drag/hai đích/freeMove/summon ngoài, pan/pinch/resize/modal block; normal→Endless→normal cùng session không rò geometry/listener. Nearest/integer sprite scale, HUD không zoom; chụp bằng chứng lúc thực thi.
- [ ] **Step 6 — Gate E2:** full gate exit0; Claude review trace normal và browser trước E3.

## E3 — UI phúc lành, modifier, mode và score (Codex UI)

### Task 8: Mode toggle, modal và bảng phúc lành

**Files:**
- Create: `src/ui/kingSelect/modeModel.ts`, `src/ui/kingSelect/modeModel.test.ts`, `src/ui/modals/BlessingModal.ts`, `src/ui/modals/blessingModel.ts`, `src/ui/modals/blessingModel.test.ts`, `src/ui/planning/EndlessPanel.ts`.
- Modify: `src/ui/kingSelect/detailLayout.ts`, `src/ui/kingSelect/detailLayout.test.ts`, `src/scenes/KingSelectScene.ts`, `src/scenes/RealmScene.ts`, `src/scenes/PlanningHudScene.ts`, `src/game/events.ts`.

**Interfaces:**
- `modeChoices(profile:MetaProfile):readonly {id:RunMode,labelVi:string,enabled:boolean,reasonVi:string|null}[]`.
- RealmData fresh thêm `mode?:RunMode`, thiếu=normal cho dev launch; resume chỉ đọc state. `runMode` riêng với carousel/detail `mode`.
- `blessingChoices(state:RunState)` view models từ saved current offer; không RNG. Bus modal union thêm blessing/endlessInfo khi cần, pickBlessing qua intent hiện tại.

- [ ] **Step 1 — Test đỏ models:** locked copy theo spec; toggle giữ seed/perk/Gai, scene revisit default normal; fresh launch guard từ chối locked. Saved3 ids giữ nguyên, capped buff hiện25 vàng. Layout3 cột desktop/1 cột cuộn phone, button≥44, không che lựa chọn. Esc không skip mandatory offer.
- [ ] **Step 2 — Run:** `npm test -- src/ui/kingSelect/modeModel.test.ts src/ui/kingSelect/detailLayout.test.ts src/ui/modals/blessingModel.test.ts` → FAIL.
- [ ] **Step 3 — Implement:** mode controls trên detail, rules selection/meta guard ở fresh Realm path, không guard resume. Modal đọc state ngay launch, disable submit chờ controller; close/open theo queue; bảng xem buffs/modifier cuộn được. Reset/destroy create/teardown, chặn map/drop dưới modal, không tự sửa RunState.
- [ ] **Step 4 — Verify/browser:** Step2 PASS;2sizes keyboard/touch, lựa chọn30/35/reload trước-sau, capped buff/vitality không áp2 lần, readonly/ghi lỗi, locked launch; console sạch.

### Task 9: Calendar pages, resume và run-end score

**Files:**
- Modify: `src/ui/realm/calendarModel.ts`, `src/ui/realm/calendarModel.test.ts`, `src/ui/planning/CalendarStrip.ts`, `src/ui/planning/calendarStripLayout.ts`, `src/ui/modals/CalendarModal.ts`, `src/scenes/PlanningHudScene.ts`, `src/scenes/BattleHudScene.ts`.
- Modify: `src/game/run/endlessRules.ts`, `src/ui/info/infoLines.ts`, `src/ui/info/infoLines.test.ts`, `src/ui/resumeModel.ts`, `src/ui/resumeModel.test.ts`, `src/scenes/MainMenuScene.ts`, `src/scenes/RunEndScene.ts`, `src/ui/modals/modalLayout.ts`.
- Create: `src/ui/realm/endlessCalendar.test.ts`.

**Interfaces:**
- `calendarPage(state:RunState,pageIndex:number):CalendarCell[]`, page0=1..30; calendarCells giữ count bounded, thêm blessing/modifier fields chỉ Endless. fullCalendar normal giữ API.
- `endlessSurvivalScore(state:RunState):number` trong endlessRules.ts cho ended Endless; infoLines dùng chung. Crown tally từ session/crownPoints, resume caption từ state.mode.

- [ ] **Step 1 — Test đỏ:** year31 page1=31..60,61 page2=61..90; previous page0 disabled; future page luôn30 cells; year1.000.000 không linear allocation. Strip29 qua30/31 đủ count;40 modifier cũ/41 mới. Normal modal30 cells/copy cũ.
- [ ] **Step 2 — Test đỏ copy/layout:** chết31 completed31→score30; chết1→0. Chưa chết40 không run-ended. “Năm 41 · Vô tận”; cap60 chỉ dòng điểm, boss cap3, credited=false không nói đã cộng; resume mode/năm đúng. RunEnd long copy/large year không che buttons375×812.
- [ ] **Step 3 — Run:** `npm test -- src/ui/realm/endlessCalendar.test.ts src/ui/realm/calendarModel.test.ts src/ui/info/infoLines.test.ts src/ui/resumeModel.test.ts` → FAIL.
- [ ] **Step 4 — Implement:** page mở theo năm hiện tại, bounded calendarSlotAt mỗi cell, modifier preview không RNG; badge/council exhaustion copy. Tally/HUD helper chung, panel cuộn nếu cần; một continue slot, không thêm menu entry Endless riêng.
- [ ] **Step 5 — Verify/browser:** Step3 PASS;2sizes calendar30/31/60/61, locked/unlocked mode, resume battle/offer và EndScene score, resize. Full gate E3 exit0.

## E4 — Headless Endless + docs

### Task 10: Harness hữu hạn, run thật deterministic và nghiệm thu

**Files:**
- Modify: `src/game/sim/headless.ts`, `src/game/sim/headless.test.ts`, `src/game/sim/bots/random.ts`, `src/game/sim/bots/scripted.ts`, `src/game/sim/bots/greedy.ts`, `src/data/endless.ts`.
- Create: `src/game/sim/endless.test.ts`, `src/game/sim/bots/endless.ts`, `src/game/sim/bots/endless.test.ts`.
- Modify: `src/game/battle/benchmark.test.ts`, `src/platform/resumeIntegration.test.ts`, `docs/GDD.md`, `docs/ROADMAP.md`, `AGENTS.md`, `CLAUDE.md` (hai file hướng dẫn đồng bộ tại phiên triển khai).

**Interfaces:**
- HeadlessOptions thêm stopAfterYears?:number/maxCommands?:number; HeadlessResult giữ state/commands, thêm stoppedBy?:'yearLimit'. Normal mặc định5000 commands/đến ended giữ nguyên. Endless bắt buộc horizon nguyên dương, thiếu thì throw rõ ràng.
- Stop sau battleResult và toàn bộ offers nămN, trước advance; state yearEnd/lives>0/won=null, không fake ended/settle meta. Chết sớm trả ended, không báo reachedN. Harness limits đặt data; MAX_COMMANDS vẫn chặn bot kẹt.
- endlessBot:Bot dùng chiến lược hợp lệ scripted/greedy và pickBlessing deterministic; RNG bot riêng, không mutate state/fake battleResult. Bot cũ thêm phase blessing cho exhaustive union.

- [ ] **Step 1 — Test đỏ:** Endless thiếu horizon từ chối, N1 stop sau offers, maxCommands bắt bot kẹt; normal defaults/outcome giữ nguyên. Bot chọn index blessing hợp lệ và mua ô ngoài.
- [ ] **Step 2 — Run:** `npm test -- src/game/sim/headless.test.ts src/game/sim/bots/endless.test.ts src/game/sim/endless.test.ts` → FAIL.
- [ ] **Step 3 — Implement và tìm run thật:** N=40/Gai0, vua/perk hợp lệ, đo ứng viên seed1..20 rồi freeze config sống được trong test. Phải có ≥1 run sống qua40 bằng simulateBattle thật, không tăng mạng/vàng hay fake results. Nếu chưa sống được, sửa chiến lược bot; vẫn chưa đạt thì báo gate chưa đạt với dữ liệu, không giảmN hay dùng fixture thay run thật.
- [ ] **Step 4 — Assertions:** cùng config2 lần command trace/RNG/state/setup/hash giống; completed40/lives>0/won=null/yearEnd, buffs30/35/40, boss40. Roundtrip save35 rồi tiếp tục cùng bot context/RNG bằng run liền; giữ bot RNG trong harness test, không production save. Fixture orchestration65 kiểm boss40/50/60 và queue, ghi rõ không phải run thật.
- [ ] **Step 5 — Capacity/performance:**49 buildings/player160/foe120/bossSummon40, entity≤512/projectile≤400, finite/deterministic đến hardLimit900; đo tick p95 mục tiêu≤2ms, so baseline cùng máy, không bịa số. Kiểm cap ordering/summon không ghi quá pool, không tăng cap để test pass. Normal hash/benchmark expected giữ nguyên.
- [ ] **Step 6 — Docs:** GDD/ROADMAP ghi add-onE1–E4, unlock provenancev1, score/meta caps,7×7 chỉ Endless,12buffs/4modifiers, save7/meta2. AGENTS/CLAUDE đồng bộ versions/APIs/layers; không sửa art assets. Ghi seed/test/benchmark thực đo và browser evidence trong PR sau triển khai.
- [ ] **Step 7 — Verify:** `npm run lint && npm run typecheck && npm test && npm run build` exit0. Git Bash: `npm run lint < /dev/null && npm run typecheck < /dev/null && npm test < /dev/null && npm run build < /dev/null`. Browser1280×720/375×812: normal win unlock→fresh Endless→outer buy→30blessing→31modifier→40boss→reload→chết→score/meta đúng. Debug forced-result chỉ kiểm UI, không bằng chứng headless thật.
- [ ] **Step 8 — Review/handoff:** requesting-code-review toàn nhánh,5 Review Focus và normal baseline; sửa findings, verify lại checks liên quan, finishing-a-development-branch. Chuẩn bị PR vào develop theo quyền phiên triển khai, không auto merge. Phiên lập kế hoạch dừng tại hai tài liệu.

## Rủi ro và cổng nghiệm thu

- Bảng cân bằng ban đầu không hứa độ khó tăng mãi sau cap; UI nói rõ buff bão hoà. Giữ budget/queue/pools bounded.
- Id inner giữ nguyên nhưng phép id÷7 sai: E1 neighbour/target và E2 deploy/hit là gate bắt buộc.
- Baseline phải lấy trước sửa; thiếu baseline hoặc phải đổi expected hash là chưa đạt. JSONv7 chỉ khác schema trung tính đã liệt kê.
- Meta v1 thiếu provenance: không backfill flag từ wins. Đây là quyết định trong spec, không để UI tự suy.
- E1/E2 chưa phải add-on hoàn chỉnh; phát hành sau E1–E4, headless40 và ma trận reload đều đạt.

**Tự rà soát spec→task:** §2 mode/unlock→5,8; §3 lịch/EP/finish→2,4; §4 board→1,6,7; §5 blessing→3,4,8; §6 modifiers→4,9; §7 UI→7,8,9; §8 persistence/meta→5,9; §9 acceptance→10. Không có yêu cầu để TBD.

