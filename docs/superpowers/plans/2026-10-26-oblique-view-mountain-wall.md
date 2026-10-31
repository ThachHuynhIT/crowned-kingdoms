# Oblique View and Mountain Wall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Giữ sân vuông và mô phỏng xác định, chặn phía bắc tại wallY = 64, cho địch/boss tiến từ S và dựng tường núi nhìn xéo 3/4 với cổng duyệt riêng từng ảnh.

**Architecture:** Biên và hàng xuất quân là luật thuần trong data/game; không dùng renderer để sửa vị trí mô phỏng. Tường là background ghép đoạn, neo chân tại biên logic, tách ảnh nguồn không giới hạn khỏi từng texture GPU có giới hạn; ảnh thiếu dùng PixelCanvas. Save chỉ chuẩn hoá giá trị edge đã kiểm hợp lệ, không thêm trường bắt buộc vào RunState.

**Tech Stack:** TypeScript strict, Vitest, Phaser 4, Vite, PixelCanvas, Python/Pillow cho crop/kiểm asset, DOM asset-admin hiện có. Không thêm engine vật lý, thư viện runtime hoặc React.

**Spec:** docs/superpowers/specs/2026-10-26-oblique-view-mountain-wall-design.md; docs/ASSET_REQUIREMENTS.md §9.1; docs/ART_STYLE.md “Góc nhìn”. Người dùng xác nhận spec đã duyệt trong yêu cầu viết plan; dòng trạng thái “chờ duyệt” trong file là metadata cũ, không yêu cầu duyệt lại §4.

## Global Constraints

1. Chỉ thực thi sau khi người dùng nhận/xác nhận plan. Phiên viết plan chỉ tạo file này; không chạy Node/npm, không sửa sản phẩm, không commit.
2. Giữ BATTLE.field = 384, plot = 32, boardOrigin = 112, bàn cờ 5×5. 3/4 là mỹ thuật, không phép chiếu isometric, không camera rotation hay đổi mô phỏng theo ảnh.
3. BATTLE.wallY = 64 world units; tâm đơn vị sống y >= wallY + radius, cả quân bay/boss. Tâm đạn/điểm tác động >= wallY. Chỉ kẹp tọa độ, không cắt radius/sửa sát thương để né test.
4. Mọi số gameplay mới nằm trong src/data/battle.ts. core/data/game không import Phaser/render/ui/platform; không Math.random, Date, performance hay hàm lượng giác. Battle không dùng RNG; duyệt id tăng dần. Compose dùng Rng/hashSeed hiện có.
5. Không đổi ngân sách, roster, level/cap, số lính, WAVES.share/spawnTick, chỉ số cờ hoặc thời điểm boss. extraEdge.count = 1 của Du Mục giữ nguyên; diễn giải thành thêm hàng S, không thêm quân.
6. Edge vẫn là 'N' | 'E' | 'S' | 'W'. edgePositions giữ phép tính N/E/W cho kiểm thử hình học/compatibility; đường production tạo mới và dựng setup chỉ dùng S. Không giữ hành vi đội hình cứng.
7. RUN_SAVE_VERSION vẫn 4, SAVE_FORMAT_VERSION vẫn 1. Decode clone → migrate → validate → normalize; không sửa dữ liệu input, không “cứu” edge rác thành S. Save battle phát lại từ đầu với setup đã chuẩn hoá.
8. Pixel nearest, camera zoom nguyên, origin chân, y-sort hiện có; 2 px ảnh = 1 world unit. Nguồn tường không có trần kích thước; mỗi trang/chunk GPU <= min(4096, GPU limit). Atlas sprites hiện có vẫn giữ giới hạn và tên frame.
9. Background tường dùng texture riêng (tương tự field/ground), không nhét ảnh dài vô hạn vào spriteList/packShelves. Đây là ngoại lệ background trong spec mới, không nới trần atlas gameplay hoặc validator của asset khác.
10. DEV sandbox vẫn MemorySaveStore; import DEV bị loại khỏi production. Không đưa marker DEV vào module shared mới. Cổng cuối giữ nguyên check-production-debug.
11. Mỗi ảnh T8 được tạo riêng → duyệt nguồn → crop/ghép kỹ thuật → duyệt sprite/preview → đăng ký. Không có phản hồi không phải chấp thuận. Không xử lý lại ảnh chưa duyệt hoặc âm thầm sửa nội dung bằng crop.
12. Lệnh dưới đây dành cho máy thực thi có Node/Python, chưa được chạy ở phiên lập plan. Trên Git Bash Windows thêm < /dev/null cho npm/npx như CLAUDE.md. Commit chỉ là đề xuất cho người thực thi, stage đúng Files của task.

## Review Focus

1. Knockback/pull/kite/separation, spawn/revive hoặc đạn ghi y phía bắc sau bước move: ghim wall_invariant_all_phases, north_wall_knockback, wall_projectiles_and_intervention ở T1; kiểm từng phase và cả prevY/homeY, không chỉ kết quả cuối trận.
2. Hàng S đông bị kẹp tại field + 32, cờ extraEdge mất tác dụng hoặc xuất sát tường: ghim south_rows_do_not_collapse, extra_edge_becomes_rows, south_spawn_progress ở T2; giữ counts/budget và có tiến triển khi không bị chặn.
3. Save v3/v4/envelope có N/E/W, edge rác, hoặc decode sửa object gốc: ghim legacy_edges_normalize_to_south, bad_edge_still_rejected, decode_does_not_mutate ở T3.
4. Đổi hướng làm hash/kịch bản can thiệp cũ vô nghĩa và cân bằng/performance trượt: ghim south_hash_trace, actual_intervention_hits, balance_report_schema ở T4; lưu baseline trước T1, không blanket snapshot update.
5. Nguồn ảnh >4096, page GPU nhỏ, thiếu chunk, seam/alpha hoặc depth dưới ground khiến mất tường: ghim oversized_wall_is_chunked, partial_wall_keeps_planned ở T8.0 và wall_depth_lifecycle ở T6; browser T9 đo visibility/seam thật.

## Thứ tự và điểm chốt triển khai

- Preflight T4/Step 0 chạy trên baseline trước T1; đây là thu bằng chứng so sánh, không triển khai renderer sớm.
- T1 → T2 → T3 → T4 là bốn increment logic có thể review/merge không phụ thuộc ảnh. Các test cũ trực tiếp bị thay luật phải chỉnh tối thiểu ngay task sở hữu, không để T1/T2 đỏ đến T4; T4 tổng duyệt trace/cân bằng.
- T5 → T6 → T7 → T8.0 → T8.1…T8.14 → T9. T5–T7 chạy được với ảnh giữ chỗ, không chờ AI; bước adopt ảnh của T8 chờ duyệt.
- Tổng 23 task thực thi: T1–T7 (7), T8.0 pipeline (1), T8.1–T8.14 từng ảnh (14), T9 (1). Mặc định làm 1 lớp xa, không tự thêm lớp xa thứ hai; có 4 vật gắn tường tùy chọn.
- Quyết định triển khai của plan: formationRows là metadata runtime của WaveSetup, không lưu ArmyPlan/RunState. Với count > 0: naturalRows = ceil(count/basePerRow), groups = min(4, (year >= 10 ? 2 : 1) + extraEdgeCount), số hàng mục tiêu = min(count, naturalRows + groups - 1). count = 0 trả 0. Đưa 10/1/2/4 thành các hằng BATTLE có tên ở T2. Như vậy cờ luôn thêm một hàng kể cả khi naturalRows đã lớn hơn 1. “Thêm hàng” thực sự phân quân qua nhiều hàng, không chỉ thêm hàng rỗng.
- Phát hiện khác spec: toàn bộ hàng 5 của 120 địch S có y tới 436, nhưng movement hiện kẹp hi = 416. T1 giữ biên S động đủ chứa vị trí xuất đã định; T2 cập nhật phép tính theo formationRows. Không nới vô hạn hay chờ sửa ở renderer.
- Đường dẫn test đúng trên checkout: src/game/sim/fullRun.test.ts; chỉ có battleSetup.test.ts và battleSetupG2.test.ts, chưa có battleSetupG3.test.ts. Không ghi lệnh tới file chưa tồn tại.

---

### Task T1: Biên núi thuần, bao phủ mọi đường tạo/ghi tọa độ

**Files:**
- Modify: src/data/battle.ts, src/game/battle/world.ts, src/game/battle/movement.ts, src/game/battle/combat.ts, src/game/battle/intervention.ts, src/game/battle/hash.ts.
- Create: src/game/battle/bounds.ts, src/game/battle/spawnLayout.ts.
- Test (Create): src/game/battle/wallBounds.test.ts.
- Test (Modify): src/game/battle/world.test.ts, src/game/battle/movement.test.ts, src/game/battle/combat.test.ts, src/game/battle/intervention.test.ts (giữ các assert còn đúng; đổi fixture can thiệp y < 64 rõ lý do).
- Read/audit: src/game/battle/behaviours.ts, structures.ts, bosses.ts, step.ts; không sửa nếu mọi spawn đi qua addUnit và kick chỉ ghi vector.

**Interfaces:**
- Consumes: moveEntities(world: BattleWorld): void; addUnit(w: BattleWorld, stats: UnitStats, team: number, x: number, y: number, homeX: number, homeY: number, sourceUid: number): number; edgePositions(edge: Edge, count: number): {x:number;y:number}[]; projectilePhase(world: BattleWorld): void.
- Consumes: tryIntervene(world: BattleWorld, input: BattleInput): boolean; pickAutoTarget(world: BattleWorld): {x:number;y:number}|null; stepBattle(world: BattleWorld, inputs: readonly BattleCommand[]): void; hitBehaviours(w: BattleWorld, source: number, target: number, dealt: number, knock?: number): void.
- Produces (mới, bounds.ts): clampNorthY(y: number, radius: number): number; spawnMaxY(setup: BattleSetup): number; BATTLE.wallY: 64; BattleWorld readonly maxY: number (runtime, không serialize). clampNorthY = max(wallY + radius, y); đạn/điểm tác động dùng radius 0.
- Để không tạo vòng import world → bounds → world, chuyển thân edgePositions nguyên vẹn sang spawnLayout.ts (chỉ import data/types), world.ts re-export cùng tên để callers cũ không đổi. bounds.ts chỉ import geometry từ spawnLayout.ts.
- spawnMaxY lấy max(field + fieldClampMargin, y lớn nhất edgePositions của từng wave theo số quân/mép và boss); T2 nối thêm formationRows. Không hardcode margin mới. hashWorld phải mix maxY vì trường runtime mới ảnh hưởng bước đi sau; thêm test hai setup chưa spawn có maxY khác cho hash khác, không đổi thuật toán băm để che fixture.

- [ ] **Step 1 — RED cases:** wallBounds.test dùng battleSetup/structure/unitStats từ game/testing/fixtures. ground/flying, ally/foe, boss, radius 4/14; addUnit nhận y = 0/63/64, homeY = 0 → x giữ, y/prevY/homeY >= 64 + radius ngay lúc phát spawn. Cả clone setup và vectors không đổi.
- [ ] **Step 2 — RED phases:** north_wall_knockback đưa victim y = 64 + radius, kbY âm trong 3 tick; moveEntities vẫn >= biên, kbTicks hết và kbX/kbY về 0. Test pull từ hitBehaviours, pulse có knock, kite, separation hai phe sát tường và hồi về home phía bắc. Spawn deathSpawn/revive/boss summons sát biên qua phase tương ứng rồi assert ngay, không đợi move.
- [ ] **Step 3 — RED projectile/input:** tạo đạn py = 0, t sống/chết, s = 0 hoặc vượt khoảng cách, kiểm cả nhánh bay/trúng/compact; không có tọa độ impact trong tường. tryIntervene input hợp lệ cũ y = 0/63 kẹp lên 64, ghi input đã kẹp giống event/boulder; y = -1, NaN, Infinity, field+1 vẫn false không đổi state. pickAutoTarget/boulderPhase không phát điểm y < 64; không đổi damage/radius/cooldown.
- [ ] **Assertions đại diện để ghim hợp đồng (dùng fixture thật, không viết helper test tự kẹp):**
  ~~~ts
  expect(BATTLE.wallY).toBe(64);
  expect(world.y[id]).toBeGreaterThanOrEqual(BATTLE.wallY + world.radius[id]!);
  expect(world.prevY[id]).toBeGreaterThanOrEqual(BATTLE.wallY + world.radius[id]!);
  expect(world.projectiles.py[p]).toBeGreaterThanOrEqual(BATTLE.wallY);
  ~~~
- [ ] **Step 4 — Run RED:** npx vitest run src/game/battle/wallBounds.test.ts. Expected: FAIL vì thiếu bounds/wallY và các invariant hiện không giữ.
- [ ] **Step 5 — GREEN:** thêm wallY data và helper. addUnit set vị trí/prev trước spawn bằng y đã kẹp, homeY cùng radius. movement áp sau separation/knockback với min north riêng, x vẫn [-margin,field+margin], y max world.maxY; đừng đổi thứ tự phase. Khởi tạo maxY trong world constructor từ setup. Clamp đường tạo/cập nhật projectile kể cả target-dead/splash/event; scheduled boulder/input được chuẩn hoá đúng một lần. Không kéo công trình khỏi ô; các ô thật luôn ở phía nam tường.
- [ ] **Step 6 — Test tiến triển:** north_wall_recovers đặt mục tiêu reachable về phía nam, speed > 0, hết stun/KB rồi 20 tick giảm khoảng cách ít nhất 1 world unit, không NaN/rung sát biên. Không đòi mọi lính phải di chuyển khi đang trong tầm hoặc speed = 0. wall_invariant_all_phases kiểm sống sau từng phase, không chỉ stepBattle.
- [ ] **Step 7 — GREEN suite:** npx vitest run src/game/battle/wallBounds.test.ts src/game/battle/world.test.ts src/game/battle/movement.test.ts src/game/battle/combat.test.ts src/game/battle/intervention.test.ts. Expected: PASS; edgePositions N/E/W oracle vẫn raw như cũ, nhưng addUnit fixture N bị kẹp theo luật mới. Cập nhật đúng test spawn raw N, không xóa kiểm id/thứ tự/stats.
- [ ] **Commit gợi ý:** feat(battle): enforce the northern mountain boundary.

### Task T2: S-only, boss S và cờ thêm hàng mà không thêm ngân sách

**Files:**
- Modify: src/data/battle.ts, src/game/battle/compose.ts, world.ts, types.ts, bounds.ts, spawnLayout.ts; src/game/run/battleSetup.ts, enemyArmy.ts.
- Test (Modify): src/game/battle/compose.test.ts, world.test.ts; src/game/run/battleSetup.test.ts, battleSetupG2.test.ts, enemyArmy.test.ts; src/game/battle/bossSpawn.test.ts.
- Test (Create): src/game/run/southFormation.test.ts.
- Không sửa count/hp/roster trong src/data/kings/nomad.ts.

**Interfaces:**
- Consumes: composeArmy(roster: readonly ComposeEntry[], budget:number, year:number, seed:number, meta?:{attacker?:ArmyPlan['attacker'];attackNo?:1|2|3;banner?:string;kings?:ArmyPlan['kings'];boss?:ArmyPlan['boss'];bossOrdinal?:ArmyPlan['bossOrdinal'];extraEdges?:number}): ArmyPlan.
- Consumes: buildYearArmy(state:RunState,content:Content):ArmyPlan; buildBattleSetup(state:RunState,content:Content):BattleSetup; bossEdge(army:NonNullable<RunState['army']>):Edge; spawnWave(world:BattleWorld,index:number):void.
- Produces: ArmyPlan shape không đổi, mọi waves[].units[].edge = 'S'; bossEdge giữ chữ ký nhưng luôn trả S (đổi tên tham số _army nếu không dùng).
- Produces runtime-only WaveSetup.formationRows?: number (vắng = 1); edgePositions(edge:Edge,count:number,formationRows?:number):{x:number;y:number}[]; formationRowsFor(year:number,extraEdges:number,count:number):number trong game/battle/bounds.ts. BATTLE thêm formationDualYear = 10, formationBaseRows = 1, formationLateRows = 2, formationMaxRows = 4.
- Algorithm mới: naturalRows = ceil(count/basePerRow), rows = max(naturalRows,min(count,formationRows)). Khi rows = naturalRows giữ nguyên perRow cũ (24 + hàng cuối lẻ); khi rows lớn hơn naturalRows chia đều: size(row) = floor(count/rows) + (row < count % rows ? 1 : 0), duyệt hàng rồi cột và căn giữa từng hàng. Khoảng cách/depth vẫn spawnSpacing/spawnOutside/spawnRowGap. count = 0 trả []; default 1 giữ geometry cũ cho mọi Edge. formationRowsFor dùng công thức naturalRows + groups - 1 ở phần thứ tự, không chỉ max(naturalRows, groups), vì cách đó sẽ làm mất hiệu lực cờ khi quân đông.

- [ ] **Step 1 — RED compose:** seeds 1..20, năm 1/9/10/20/30, meta extraEdges 0/1: mọi edge S; vẫn đúng 8/7/5 từ 20 quân, tick [0,120,240], budget/level/statMult/unit order như baseline. Roster frozen và metadata không bị mutate. Boss có waves rỗng, waves chỉ N/E/W hoặc đợt 2 rỗng vẫn bossEdge S.
- [ ] **Step 2 — RED hàng:** extra_edge_becomes_rows: 8 quân S, năm 9, extra = 0 → 1 hàng; extra = 1 → hai hàng 4/4 y [396,406]. Năm 10 extra = 1 → 3 hàng; n = 0/1/2 không tạo vị trí thừa hoặc chia 0. Default edgePositions('N',25) giữ 24 tại -12 và 1 tại -22. 120 quân S không cờ có 5 hàng tự nhiên; thêm extraEdge 1 ở năm 9 thành 6 hàng, năm 10 thành 7 hàng. Không thiếu quân, maxY từ T1 đủ hàng cuối và sau tick đầu không gộp các hàng sau vào y = 416.
- [ ] **Step 3 — Run RED:** npx vitest run src/game/battle/compose.test.ts src/game/run/southFormation.test.ts. Expected: FAIL các hướng/boss/hàng, không phải thất bại import ngoài phạm vi.
- [ ] **Step 4 — GREEN:** bỏ chọn ngẫu nhiên cạnh trong compose, không thay lượt bốc unit (RNG chọn cạnh hiện chạy sau khi đã bốc toàn bộ unit). Giữ meta.extraEdges trong signature cho callers cũ nhưng không serialize trường mới. buildBattleSetup lấy extraEdge từ bannerDef.effects đã có, gọi formationRowsFor(state.year, extraEdgeCount, w.units.length) và đặt từng WaveSetup; normalize edge S ở đây cả với RunState dựng thẳng trong RAM. Xóa phép cộng/truyền meta.extraEdges thừa ở enemyArmy, không đổi dữ liệu cờ. Boss không phụ thuộc wave có lính.
- [ ] **Step 5 — GREEN spawn:** spawnWave truyền wave.formationRows vào edgePositions; giữ thứ tự spawns/entity ids/event edges, cap và sourceUid -1. spawnMaxY dùng cùng geometry/rows, không có công thức layout thứ hai. south_spawn_progress ở wave120: tọa độ khởi tạo y > field, tất cả y >= wallY + radius; sau 60 tick với stats speed > 0, ít nhất hàng đầu đã giảm y, không kẹt bởi clamp; không yêu cầu đội hình giữ cứng. Test Du Mục thực qua buildYearArmy → buildBattleSetup, đếm quân/ngân sách không đổi so cùng roster/budget không cờ.
- [ ] **Step 6 — Run GREEN:** npx vitest run src/game/battle/compose.test.ts src/game/battle/world.test.ts src/game/battle/wallBounds.test.ts src/game/run/southFormation.test.ts src/game/run/battleSetup.test.ts src/game/run/battleSetupG2.test.ts src/game/run/enemyArmy.test.ts src/game/battle/bossSpawn.test.ts. Expected: PASS. Thay assert “hai cạnh từ năm 10” ở compose và enemyArmy.test.ts:122–149 bằng S-only/hàng; sửa bossSpawn.test.ts:36–42 từ 'first edge of wave2' thành S, giữ oracle geometry legacy trong edgePositions; giữ budget/count/stat asserts.
- [ ] **Commit gợi ý:** feat(battle): deploy enemies and bosses in southern ranks.

### Task T3: Chuẩn hoá save cũ, không đổi phiên bản

**Files:**
- Modify: src/game/save/codec.ts.
- Test (Modify): src/game/save/codec.test.ts; src/platform/resumeIntegration.test.ts.
- Read: src/game/save/migrate.ts, src/game/run/state.ts, src/data/save.ts (không tăng version).

**Interfaces:**
- Consumes: decodeRun(raw:unknown,content:Content):LoadRunResult; encodeRun(state:RunState,content:Content):SaveEnvelope; contentHash(content:Content):number; buildBattleSetup(state:RunState,content:Content):BattleSetup.
- Produces cùng LoadRunResult discriminated union; state.army?.waves[].units[].edge chỉ S sau decode; không thêm hình dạng trường saved/runtime formationRows.

- [ ] **Step 1 — RED fixture:** tạo valid wire fixture từ encodeRun rồi trên clone đổi edge lần lượt N/E/W/S ở nhiều wave, cả planning/battle, army null, wave rỗng; v3 migration và v4, phong bì/trần. decode trả ok và edge S; các trường unit/count/budget/level/banner/boss/year/deck/queued offers/rng giữ nguyên. Giữ bản raw trước decode để so deep-equal.
- [ ] **Step 2 — RED validation:** edge 'Q', null, số, unknown UnitId vẫn incompatible. Không normalize trước validate khiến Q thành S. decode hai lần idempotent; encode(decode(...).state) / decode round-trip sau normalize ổn định.
- [ ] **Step 3 — Run RED:** npx vitest run src/game/save/codec.test.ts -t legacy_edges_normalize_to_south. Expected: FAIL N/E/W chưa đổi.
- [ ] **Step 4 — GREEN:** sau structuredClone → migrateRunState → validate thành công, map ArmyPlan waves/units về edge S trên state clone. Giữ EDGES validator chấp nhận bốn giá trị hợp lệ. Save không chứa setup/live BattleWorld, nên bossEdge và formationRows dựng lại ở T2, không cần bump version 4/format 1.
- [ ] **Step 5 — Run GREEN:** npx vitest run src/game/save/codec.test.ts src/platform/resumeIntegration.test.ts src/game/run/southFormation.test.ts. Expected: PASS; save cũ battle được restart từ tick 0 ở S, nhập lại input can thiệp hợp lệ được chuẩn hoá T1; không hứa giữ nguyên kết quả trận cũ. Không sửa gold/meta thật.
- [ ] **Commit gợi ý:** fix(save): normalize legacy enemy edges to south.

### Task T4: Trace, fixture và cân bằng trước/sau có bằng chứng

**Files:**
- Modify: src/game/battle/determinism.test.ts, benchmark.test.ts, world.test.ts; src/game/sim/fullRun.test.ts; src/game/run/battleSetup.test.ts, battleSetupG2.test.ts.
- Create: src/game/sim/obliqueBalance.test.ts, tools/compare_wall_balance.py, docs/art-review/oblique-wall/logic-report.md.
- Test (Create): tools/test_compare_wall_balance.py.
- Không chỉnh hash.ts để trùng hash cũ, không tự cập nhật giá trị stats/budget cho test xanh.

**Interfaces:**
- Consumes: hashWorld(world:BattleWorld):number; simulateBattle(setup:BattleSetup,inputs?:readonly BattleCommand[]):BattleResult; runHeadless(opts:HeadlessOptions,content?:Content):HeadlessResult với {seed,kingId,rules?,bot?}; Bot = (state:RunState,content:Content,rng:Rng)=>RunCommand; randomBot/scriptedBot; RULES_FULL.
- Produces harness log một dòng WALL_BALANCE_JSON với rows {seed,kingId,bot,won,year,commands,bossesDefeated}; Python CLI compare_wall_balance.py BEFORE_LOG AFTER_LOG xuất delta tổng/per king/per bot và exit nonzero khi vượt gate.
- Ngưỡng plan đề xuất: cùng 600 ca (3 vua × seeds 1..100 × 2 bot); |delta win rate| <= 10 điểm phần trăm tổng từng bot, <= 15 điểm phần trăm mỗi vua/bot; |delta median năm kết thúc| <= 3. Tất cả kết thúc hợp lệ, commands < 5000, finite, không ghi vượt cap. Nếu baseline thắng 0%, vẫn so delta tuyệt đối và median năm, không chia cho 0. Không diễn giải 3×3 seed smoke là đo cân bằng đủ.

- [ ] **Step 0 — Preflight bắt buộc TRƯỚC T1:** thêm harness thuần dùng runHeadless thật, console.info JSON, không tạo ván mẫu/giả battleResult; không filesystem/clock trong game. Chạy cả baseline suite rồi harness ở commit gốc, ghi SHA/seed/bot/rules/máy trong report. Lệnh: npx vitest run src/game/sim/obliqueBalance.test.ts --reporter=verbose > docs/art-review/oblique-wall/before.log. Expected: exit 0, đủ 600 unique rows và report parse được. Tái dùng cùng harness sau T3; nếu máy bận không so performance giữa hai môi trường khác nhau.
- [ ] **Step 1 — RED parser:** Python unittest dùng log mẫu có ca trùng/thiếu, NaN, win delta > ngưỡng và baseline 0 thắng; chênh dưới ngưỡng pass. Run: python -m unittest discover -s tools -p test_compare_wall_balance.py. Expected: FAIL trước khi có parser/gate.
- [ ] **Step 2 — GREEN parser và fixture:** chỉ parse marker JSON, yêu cầu đủ đúng 600 row keys của cả hai bên và so paired rows; không bỏ failed case. determinism.test hiện so hash cùng tick, KHÔNG có bảng hash số cố định toàn cục để “update snapshot”. Chuyển SETUP bốn cạnh → S, giữ counts/order; tính lại điểm/tick can thiệp từ trace thật sao cho event hit + kbTicks > 0, không chỉ interventionsUsed = 1. Bổ sung south_hash_trace hai world cùng input mỗi tick, đảo structures không đổi, đổi input thực trúng làm khác hash. Record SHA, final hash/tick và lý do đổi fixture trong report; nếu sau này có literal golden mới thì ghi giá trị từ hai trace độc lập sau invariants pass, không viết số đoán trước vào plan.
- [ ] **Step 3 — Kiểm fullRun/battleSetup:** giữ fullRun_real_3x3, deck invariants, finite/commands và test orchestration30 với nhãn “reducer fixture, không bằng chứng chơi thật”. Không sửa mock win để giả bot thắng. battleSetup chỉ đổi expected edge/formationRows; HP/DMG/spawn count của shipped numbers phải giữ. Test world raw geometry N/E/W vẫn tồn tại; production setup/case stress chính S-only.
- [ ] **Step 4 — Benchmark:** standardSetup giữ 160 ally/120 foe, 100 tick, G2 effects và boss scenarios; chuyển cạnh stress chính sang S, thêm stress mixed-edge chỉ là synthetic nếu cần. Giữ hard ceiling <= 2 ms/tick hiện có, mục tiêu 0.5 ms được báo, không nới để che regression. Chạy warmed 5 lần cùng máy; median sau <= 1.25× median trước, ngoài giới hạn thì điều tra. Việc gom S tăng density phải đo thật.
- [ ] **Step 5 — Run GREEN:** npx vitest run src/game/battle/determinism.test.ts src/game/battle/benchmark.test.ts src/game/battle/world.test.ts src/game/sim/fullRun.test.ts src/game/run/battleSetup.test.ts src/game/run/battleSetupG2.test.ts; python -m unittest discover -s tools -p test_compare_wall_balance.py. Expected: PASS, không test bị skip/xóa.
- [ ] **Step 6 — Cân bằng:** npx vitest run src/game/sim/obliqueBalance.test.ts --reporter=verbose > docs/art-review/oblique-wall/after.log; python tools/compare_wall_balance.py docs/art-review/oblique-wall/before.log docs/art-review/oblique-wall/after.log. Expected: đủ rows, delta trong gate; nếu vượt thì dừng merge logic T1–T4 để người dùng duyệt thay đổi cân bằng, không âm thầm đổi budget hoặc ngưỡng. Đây là ngưỡng nghiệm thu của plan, chưa có kết quả đo.
- [ ] **Commit gợi ý:** test(battle): verify southern combat traces and balance.


### Task T5: Mũi tên phía trước, Help và mô tả cờ tiếng Việt

**Files:**
- Modify: src/render/BoardRenderer.ts, src/data/help.ts, src/ui/help/mechanics.ts, src/data/kings/nomad.ts (chỉ textVi cờ).
- Test (Create): src/render/BoardRenderer.test.ts.
- Test (Modify): src/ui/help/mechanics.test.ts, helpModel.test.ts; src/ui/planning/ScoutPanel.test.ts; src/data/content.test.ts.
- Read: src/scenes/RealmScene.ts showPlanning, src/ui/planning/ScoutPanel.ts attackerBanner.
- Không đổi projection của plotAt, plotScreenRect hoặc đơn vị của realmLayout.

**Interfaces:**
- Consumes: BoardRenderer.setEdgeArrows(edges:readonly Edge[]):void; BoardRenderer.plotAt(worldX:number,worldY:number):number|null; mechanicEntries(content:Content):readonly HelpEntry[]; HELP_TABS.
- Produces cùng API mũi tên: [] xoá, input có quân bất kỳ chỉ vẽ một S; UI đọc textVi của cờ đang có. Data mới BATTLE_DIRECTION_HELP trong data/help.ts là chuỗi “Địch tiến từ phía trước (mép dưới); tường núi phía bắc không có đường đi.”, ui/help/mechanics dùng lại.
- src/data/help.ts hiện chỉ có tab labels, không có câu N/E/S/W để search-replace. Nội dung cơ chế thực ở ui/help/mechanics.ts:45; ScoutPanel/helpModel lấy banner.textVi, nên đổi đúng nguồn cờ Du Mục thay vì chép mô tả hai nơi.

- [ ] **Step 1 — RED data/text:** mechanics.test assert entry mô tả hướng chứa BATTLE_DIRECTION_HELP, nêu quân bay cũng không xuyên tường; Help/scout Du Mục nói “thêm hàng dàn quân phía trước”, không còn “thêm cạnh”; count của effect extraEdge vẫn 1, mọi số stats y nguyên.
- [ ] **Step 2 — Run RED:** npx vitest run src/ui/help/mechanics.test.ts src/data/content.test.ts -t "southern|extraEdge". Expected: FAIL thiếu câu/hợp đồng text (viết tên test khớp filter trước).
- [ ] **Step 3 — GREEN:** thêm chuỗi data, nối Help, sửa textVi cờ. Fake-Graphics test BoardRenderer: setEdgeArrows(['N','E','S','W','S']) chỉ một fillTriangle/strokeTriangle, tip ở giữa cạnh S ngoài bàn cờ; [] xoá hết. Giữ input legacy không làm hiện N/E/W, không đổi collision hoặc world coordinate để khớp hình.
- [ ] **Step 4 — GREEN và browser:** npx vitest run src/render/BoardRenderer.test.ts src/ui/help/mechanics.test.ts src/ui/help/helpModel.test.ts src/ui/planning/ScoutPanel.test.ts src/data/content.test.ts. Expected: PASS. npm run dev; mở planning/Help/scout 1280×720: mũi tên dưới, text Việt không tràn, click/placement đúng ô, chuyển battle xoá overlay như cũ.
- [ ] **Commit gợi ý:** feat(ui): explain southern attacks and rank banners.

### Task T6: Tường ghép đoạn với ảnh giữ chỗ, tách nguồn khỏi texture GPU

**Files:**
- Create: src/render/mountainWallModel.ts, mountainWallArt.ts, mountainWallAssets.ts, MountainWallRenderer.ts.
- Modify: src/render/FieldRenderer.ts, atlas.ts; src/scenes/PreloadScene.ts.
- Test (Create): src/render/mountainWallModel.test.ts, MountainWallRenderer.test.ts.
- Test (Modify): src/render/atlas.test.ts, artPolicy.test.ts, imageArt.test.ts; src/ui/realm/realmLayout.test.ts.
- Read: src/render/imageArt.ts, artPolicy.ts; src/scenes/RealmScene.ts create/teardown. FieldRenderer sở hữu renderer núi, không thêm owner thứ hai ở RealmScene.

**Interfaces:**
- Consumes (thật): FieldRenderer(scene:Phaser.Scene,seed:number), destroy():void; ensureFieldTexture(textures:Phaser.Textures.TextureManager,seed:number):string; addPixelTexture(textures:Phaser.Textures.TextureManager,key:string,art:PixelCanvas):void; imageFrameScale(frame:string):number; checkArtFrame(name:string,art:PixelCanvas,expected:{readonly w:number;readonly h:number},shadow:boolean):readonly string[].
- Consumes realmCamera(screen:Size,phase:RealmPhase):{zoom:number;scroll:Point}, screenToWorld(p:Point,scroll:Point,screen:Size,zoom:number):Point. Giữ các API/math này.
- Produces (mới, mountainWallAssets.ts):
  ~~~ts
  interface WallPart {
    id: string; texture: string; frame: string;
    sourceX: number; sourceY: number; w: number; h: number;
  }
  interface WallAsset {
    id: string;
    role: 'middle' | 'left' | 'right' | 'foot' | 'far' | 'attachment';
    w: number; h: number; baseline: number; // px nguồn
    imageScale: number; // 0.5 image art; 1 code placeholder
    parts: readonly WallPart[];
  }
  function wallAssets(textures: Phaser.Textures.TextureManager): readonly WallAsset[];
  function wallFrame(id: string): string;
  ~~~
- Produces mountainWallModel.ts layoutWall(fieldWidth:number,wallY:number,seed:number,assets:readonly WallAsset[]):readonly WallPlacement[]; WallPlacement = {assetId:string;x:number;footY:number;flip:boolean;depth:number}. WallPlacement.x là mép trái composite ở world; mỗi chunk origin(0,0), đặt x + sourceX*imageScale và footY - baseline*imageScale + sourceY*imageScale. Baseline là đường chân đã duyệt trong nguồn, không đoán bằng chiều cao canvas. Trình bày dùng pixelHash(x,y,seed), không dùng Math.random hoặc game RNG.
- Produces paintMountainWall(id:string,w:number,h:number):PixelCanvas; ensureMountainWallTextures(textures:Phaser.Textures.TextureManager):readonly WallAsset[] (placeholder nếu ảnh thiếu), exported qua atlas.ts; class MountainWallRenderer(scene:Phaser.Scene,seed:number) có destroy():void, không cần update từng frame.

- [ ] **Step 1 — kiểm Phaser trước khi code:** đọc local skills v3-to-v4-migration, sprites-and-images, graphics-and-shapes, cameras, game-setup-and-config và types đang cài; kiểm chữ ký loader/texture frame/nearest. Không dùng API v3 hoặc FX shader nhớ từ phiên khác.
- [ ] **Step 2 — RED model:** layout phủ [0,384] liên tục, footY đúng 64, 4 middle/2 cap/3 foot hợp lệ; deterministic với seed, thay seed có thể đổi biến thể nhưng không thay biên. Fake texture thiếu một ảnh/part thì fallback trọn logical asset, không nửa thật/nửa thiếu. metadata sourceX/sourceY được áp vào world offset ở scale đúng một lần. Test nguồn 9000×256, gpuLimit 2048 (pipeline T8.0) không làm một texture 9000.
- [ ] **Step 3 — RED depth/lifecycle:** wall_depth_lifecycle dùng fake scene: ground=-1, field=0; far=0.1, middle/cap=0.2, foot=0.3, attachment=0.4; tất cả dưới PLOT_DEPTH=1 và mọi unit/building. “Thấp nhất” là trong nhóm tường, KHÔNG thấp hơn ground -1 (ground kín sẽ che tường). destroy hai lần an toàn, reload seed20 lần không tăng image/texture/listener count; shared approved texture không bị owner xoá. Test integer pixel placement và alpha 0/255 của placeholder.
- [ ] **Step 4 — Run RED:** npx vitest run src/render/mountainWallModel.test.ts src/render/MountainWallRenderer.test.ts. Expected: FAIL thiếu modules, không giả browser test đã chạy.
- [ ] **Step 5 — GREEN:** FieldRenderer tạo ground/field như cũ rồi sở hữu MountainWallRenderer. Giữ chân vách y=wallY, crop/chunk offsets phục dựng ảnh nguồn; đoạn cuối clip đúng mép, không scale ngang méo hoặc hạ mật độ ảnh cho vừa GPU. Dải chân phủ khe cỏ/tường nhưng không đổi collision radius/board. Placeholder PixelCanvas riêng (không gen ảnh AI ở task này). Không tăng chiều cao atlas sprites để chứa wall; Preload đăng ký wall chunks tách riêng, fallback khi loaderror, texture name qua helper. Phần ảnh có thật chỉ bật theo metadata đã adopted ở T8.
- [ ] **Step 6 — GREEN tests:** npx vitest run src/render/mountainWallModel.test.ts src/render/MountainWallRenderer.test.ts src/render/atlas.test.ts src/render/artPolicy.test.ts src/render/imageArt.test.ts src/ui/realm/realmLayout.test.ts. Expected: PASS; camera round-trip, tọa độ click/tầm/board, sprite scale 0.5 và zoom2 vẫn tương thích; không áp check integer sprite scale để cấm mật độ ảnh 2× hiện có.
- [ ] **Step 7 — browser:** npm run dev ở 1280×720, zoom1/2 test seam và 2× density; 1920×1080 nếu có. Expected: thấy chân/vách núi sau lâu đài; ground không che, tường không che lính/giá/nút; không có đường xuyên ở cap/hang/thác. Camera giữ nguyên: ghi ảnh phần đỉnh núi bị crop ở viewport hiện tại, chưa tự nâng camera/giảm zoom để “vừa” ảnh. Duyệt hình giữ chỗ trước khi tăng ngân sách art.
- [ ] **Commit gợi ý:** feat(render): add a tiled mountain backdrop with safe fallbacks.

### Task T7: DEV preview và production isolation không hồi quy

**Files:**
- Test (Modify): src/dev/previewRun.test.ts, previewIsolation.test.ts.
- Read/không đổi nếu không lỗi: src/dev/previewRun.ts, registerPreview.ts, src/main.ts, src/scenes/RealmScene.ts, tools/check-production-debug.mjs.
- Modify có điều kiện: src/dev/previewRun.ts (chỉ mô tả hướng nếu còn cũ), không thêm dependency từ shared code về src/dev.

**Interfaces:**
- Consumes: previewTargets():readonly PreviewTarget[]; createPreviewRun(target:PreviewTarget,content:Content):{state:RunState;persistence:SessionPersistence}; registerPreview(game:Phaser.Game):()=>void; tools scanner scan(dir) và MARKERS (JS).
- Produces cùng API/sandbox; sample boss 10/20/30 dùng buildBattleSetup thật nên luôn S. FieldRenderer chung cung cấp tường cho preview, không một bản renderer DEV khác.

- [ ] **Step 1 — regression test trước chỉnh:** createPreviewRun cho từng boss/quest/council target, build setup nơi có army → S/boss S, không đụng real store/meta, cùng seed fixture lặp lại cùng state. Cổng RED là baseline trước T2; sau T2 có thể đã GREEN, không tạo thay đổi giả chỉ để có RED cho adapter không cần code.
- [ ] **Step 2 — Run:** npx vitest run src/dev/previewRun.test.ts src/dev/previewIsolation.test.ts src/ui/help/helpIntegration.test.ts. Expected: PASS, tất cả sandbox test hiện có còn nguyên. Nếu đỏ, sửa adapter nhỏ nhất, không bỏ import.meta.env.DEV hoặc đổi persistence sang thật.
- [ ] **Step 3 — DEV browser:** đặt một save thật, chụp fingerprint/version trước/sau nhảy các mẫu; restart scene 20 lần, xem tường có đúng một instance; planning/battle/Help không chồng. Expected: save/meta không đổi và sample có nhãn xem thử, không trình bày như ván chơi thật.
- [ ] **Step 4 — production gate:** node tools/check-production-debug.mjs --self-test; npm run build; node tools/check-production-debug.mjs dist. Expected: self-test ok, build exit0, No debug preview in dist. Không sửa MARKERS hoặc bỏ scan để vượt gate.
- [ ] **Commit gợi ý:** test(dev): preserve preview isolation with mountain scenery (chỉ commit file thật sự đổi).

### Task T8.0: Pipeline tường và planned entries trước lần tạo ảnh đầu tiên

**Files:**
- Create: tools/slice_mountain_wall.py, tools/test_slice_mountain_wall.py; docs/art-review/oblique-wall/catalog.json (metadata crops/parts/adoption).
- Modify: tools/slice_art_batches.py, tools/build_planned_assets.py; tools/asset-admin/README.md.
- Generated (Modify khi thực thi): tools/asset-admin/planned.json (thêm 14 logical IDs), manifest.json (chỉ ảnh đã adopted).
- Test (Create): tools/test_wall_asset_registration.py.
- Read: docs/ASSET_PRODUCTION_RULES.md, docs/ASSET_LICENSES.md; tools/asset-admin/src/types.ts isItem/isPlannedFile; không nới max 4096 chung của admin Item.

**Interfaces:**
- Consumes metadata/image format manifest hiện có {version:1,pixelScale:2,categories:[{id,label,items}]} và PlannedItem id/category/group/kind/w/h/frames/source/priority/note.
- Produces Python functions slice_wall(source:Path,recipe:dict,output:Path,max_texture_side:int)->list[dict]; validate_wall_recipe(recipe:dict,source_size:tuple[int,int])->None; adopted_wall_items(catalog:dict,root:Path)->list[dict].
- CLI: python tools/slice_mountain_wall.py --id ID --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Chỉ crop/ghi metadata/ghép preview, không tự sửa màu/nền/nội dung; cắt phải nằm trong nguồn và không ghi đè source.
- Catalog mỗi logical ID ghi role, density=2, sourceSize, baseLine, các crop/offset nguyên, sourceHash, approval trạng thái, parts {id,src,crop,sourceX,sourceY,w,h}. Nhập thông tin chấp thuận thật, không mặc định approved.
- Normal image: item.id chính là logical ID. Oversize: chỉ các physical part IDs dạng ID_part_000… được đưa manifest (mỗi w/h <= cap); mapping alias logical→đủ parts/offsets ở metadata.catalog/metadata.aliases để build_planned_assets loại parent CHỈ khi toàn bộ parts tồn tại và adopted. Không tạo thumbnail giả làm PNG native hoặc Item width9000 bị isItem loại. planned vẫn là một việc trên mỗi ảnh nguồn, không đếm chunk như thiết kế mới.
- Source không giới hạn; max_texture_side chỉ giới hạn output page/chunk và <= 4096. Runtime lấy min với GPU thực trong loader; nếu GPU nhỏ hơn chunk, tạo/sử dụng các subframes/pages nhỏ hơn hoặc fallback toàn logical asset có cảnh báo. Không yêu cầu upload ảnh nguồn vượt cap rồi mới crop trên GPU.

- [ ] **Step 1 — RED fixtures:** sinh ảnh RGBA nhân tạo trong thư mục tạm, không AI: source9000×256, cap2048; tái ghép parts phải byte-equal source, mỗi part <= cap, offset không gap/overlap, scale/density giữ2. Test capheight nhỏ cắt cả chiều cao, nguồn kỳ số pixel không dời baseline, alpha128 bị từ chối (tường chỉ0/255), crop ngoài ảnh và output traversal bị từ chối, không overwrite source.
- [ ] **Step 2 — RED registration:** 14 ID chưa có → planned terrain/group mountain_wall; chỉ source approved nhưng chưa adopted vẫn planned; thiếu1part hoặc hash sai vẫn planned/fallback; đủ parts adopted mới không planned; chạy slice_art_batches lần sau không làm mất wall items. 73 asset cũ giữ nguyên, không trùng ID, JSON schema guard chấp nhận output physical chunks. Tests dùng temp manifest, không sửa manifest thật làm fixture.
- [ ] **Step 3 — Run RED:** python -m unittest discover -s tools -p "test_*wall*.py". Expected: FAIL trước pipeline/registration. Luật core/data/game nếu thêm helper cho wallY phải TDD riêng T1, không lẫn Python crop với simulation.
- [ ] **Step 4 — GREEN:** pipeline và catalog 14 entries chưa adopted. Bổ sung nguồn approved wall vào script sinh manifest, không chỉ sửa manifest.json bằng tay rồi bị ghi đè. build_planned_assets hỗ trợ alias coverage có kiểm đủ chunk; phân loại wall P0 cho mid/cap/foot cần cảnh, P2 cho far/attachments tùy chọn. Kích thước chưa duyệt để0/note; sau duyệt ghi số metadata thật. Footer/admin read-only existing logic không được đưa planned vào map palette.
- [ ] **Step 5 — Run GREEN:** python -m unittest discover -s tools -p "test_*wall*.py"; python tools/build_planned_assets.py; npx vitest run src/render/mountainWallModel.test.ts src/render/MountainWallRenderer.test.ts. Expected: PASS; 14 planned logical work items, không pretend có ảnh. Test source/checksum và deterministic JSON có thứ tự ổn định.
- [ ] **Step 6 — art gate chung từng T8.x:** ảnh tham chiếu phải hợp lệ theo license; dùng skill imagegen khi đến task tạo ảnh, từng ảnh một, không gen sheet gộp14việc. Nguồn và prompt trong docs/art-review/oblique-wall/ID/, cropped PNG ở public/assets/art/ai-v1/mountain-wall/. docs/assets.manifest.yml + CREDITS.md ghi provenance/trạng thái thực. Khi chờ duyệt, dừng adopt và task ảnh kế tiếp; planned chưa bị xóa.
- [ ] **Commit gợi ý:** feat(tools): add reviewed mountain wall slicing and registration.

## Hợp đồng chung của 14 task ảnh T8.1–T8.14

Từng mục bên dưới là một task riêng, không một task “gen cả batch”. Brief chung: nhìn xéo 3/4, fantasy ấm, mặt vách hướng người xem, ánh sáng trên-trái, alpha0/255, không chữ/blur/AA/shadow mềm, cùng mật độ2 px/world và baseline. Kích thước brief chỉ là đề xuất để xin duyệt, không trần nguồn. Giữ cùng profile nối/đường chân cho các mid; cap có hướng độc lập; foot không opacity nửa trong suốt. Hang/thác chỉ trang trí, không tạo lối đi logic.

Mỗi task tự có Files/Interfaces/RED/GREEN/Expected/commit; các lệnh U là viết tắt duy nhất:
- U = python -m unittest discover -s tools -p "test_*wall*.py".
- A = python tools/slice_art_batches.py, sau đó python tools/build_planned_assets.py.
- Với mọi task: chạy U trước adopt phải RED vì fixture yêu cầu ID adopted chưa tồn tại; tạo ảnh không thể chứng minh bằng unit test. Sau duyệt/crop/đăng ký chạy U rồi A phải GREEN; browser /admin thấy ảnh thật, planned ID hoặc alias không còn thiếu; viewer chưa duyệt vẫn placeholder. Không dùng chạy thành công A thay cổng duyệt mỹ thuật.


### Task T8.1: Ảnh riêng — Đoạn giữa A

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_mid_0/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_mid_0.png hoặc các terrain_mountain_wall_mid_0_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_mid_0, role 'middle', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 512×256 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Mẫu chuẩn đá/rêu, profile nối hai bên và baseline dùng chung cho toàn bộ mid.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_mid_0 và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 512×256; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_mid_0 --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; ba bản A–A–A liền nhau; mép trái/phải bằng profile duyệt. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. ba bản A–A–A liền nhau; mép trái/phải bằng profile duyệt.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-mid-0. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.2: Ảnh riêng — Đoạn giữa B

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_mid_1/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_mid_1.png hoặc các terrain_mountain_wall_mid_1_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_mid_1, role 'middle', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 512×256 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Đổi cụm đá, giữ tuyệt đối profile biên và baseline của A; không tạo khe như cổng.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_mid_1 và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 512×256; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_mid_1 --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; A–B–A và B–A–B không lộ seam. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. A–B–A và B–A–B không lộ seam.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-mid-1. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.3: Ảnh riêng — Đoạn giữa C

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_mid_2/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_mid_2.png hoặc các terrain_mountain_wall_mid_2_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_mid_2, role 'middle', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 512×256 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Biến thể mỏm/rêu; dùng A/B đã duyệt làm style reference, không sửa ảnh A/B.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_mid_2 và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 512×256; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_mid_2 --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; mọi triple dùng A/B/C ghép kín, cùng chiều cao chân. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. mọi triple dùng A/B/C ghép kín, cùng chiều cao chân.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-mid-2. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.4: Ảnh riêng — Đoạn giữa D

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_mid_3/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_mid_3.png hoặc các terrain_mountain_wall_mid_3_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_mid_3, role 'middle', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 512×256 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Biến thể cụm đá/thông đỉnh, giữ ranh giới logic không có đường xuyên.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_mid_3 và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 512×256; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_mid_3 --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; 64 triple từ 4 mid không khe/đổi baseline. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. 64 triple từ 4 mid không khe/đổi baseline.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-mid-3. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.5: Ảnh riêng — Đầu nối trái

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_cap_left/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_cap_left.png hoặc các terrain_mountain_wall_cap_left_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_cap_left, role 'left', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 256×256 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Hòa vách xuống sườn trái; đầu nối trong khớp mid, mép ngoài hòa ground.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_cap_left và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 256×256; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_cap_left --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; cap trái + từng mid phủ từ x=0, không mở lối bên hông. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. cap trái + từng mid phủ từ x=0, không mở lối bên hông.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-cap-left. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.6: Ảnh riêng — Đầu nối phải

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_cap_right/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_cap_right.png hoặc các terrain_mountain_wall_cap_right_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_cap_right, role 'right', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 256×256 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Đầu nối phải riêng; không lật cap trái thay thế ảnh được yêu cầu.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_cap_right và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 256×256; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_cap_right --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; từng mid + cap phải đến x=384, ánh sáng vẫn từ trên-trái. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. từng mid + cap phải đến x=384, ánh sáng vẫn từ trên-trái.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-cap-right. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.7: Ảnh riêng — Dải chân núi A

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_foot_0/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_foot_0.png hoặc các terrain_mountain_wall_foot_0_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_foot_0, role 'foot', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 512×64 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Đá vụn/rêu nối cỏ; dải raster opaque sát chân, chỉ alpha0/255.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_foot_0 và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 512×64; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_foot_0 --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; ba strip A liền nhau không có pixel hở giữa chân và cỏ. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. ba strip A liền nhau không có pixel hở giữa chân và cỏ.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-foot-0. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.8: Ảnh riêng — Dải chân núi B

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_foot_1/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_foot_1.png hoặc các terrain_mountain_wall_foot_1_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_foot_1, role 'foot', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 512×64 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Biến thể đá/rêu, cùng top/bottom profile và baseline strip A.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_foot_1 và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 512×64; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_foot_1 --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; A–B–A ở zoom1/2 không seam/alpha mềm. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. A–B–A ở zoom1/2 không seam/alpha mềm.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-foot-1. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.9: Ảnh riêng — Dải chân núi C

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_foot_2/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_foot_2.png hoặc các terrain_mountain_wall_foot_2_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_foot_2, role 'foot', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 512×64 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Biến thể thứ ba không lan thành vật cản phía nam wallY.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_foot_2 và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 512×64; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_foot_2 --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; mọi triple của 3 foot ghép kín; không che chân lính sát biên. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. mọi triple của 3 foot ghép kín; không che chân lính sát biên.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-foot-2. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.10: Ảnh riêng — Lớp đỉnh núi xa

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_far_0/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_far_0.png hoặc các terrain_mountain_wall_far_0_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_far_0, role 'far', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 1024×384 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Một lớp xa tùy chọn, ít tương phản hơn vách, không parallax mới.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_far_0 và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 1024×384; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_far_0 --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; nằm sau mid nhưng trên ground, không làm tăng collider/che HUD. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. nằm sau mid nhưng trên ground, không làm tăng collider/che HUD.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-far-0. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.11: Ảnh riêng — Thác nước nhỏ gắn vách

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_attach_waterfall/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_attach_waterfall.png hoặc các terrain_mountain_wall_attach_waterfall_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_attach_waterfall, role 'attachment', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 128×128 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Một ảnh tĩnh tùy chọn, pixel nước sắc; không hứa animation hoặc đường đi mới.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_attach_waterfall và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 128×128; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_attach_waterfall --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; đúng điểm gắn vách, không seam lơ lửng/nhầm cổng. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. đúng điểm gắn vách, không seam lơ lửng/nhầm cổng.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-attach-waterfall. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.12: Ảnh riêng — Hang tối trên vách

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_attach_cave/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_attach_cave.png hoặc các terrain_mountain_wall_attach_cave_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_attach_cave, role 'attachment', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 128×128 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Hốc tối trang trí kín; không cửa mở/đường mòn, không cơ chế xuất quân.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_attach_cave và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 128×128; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_attach_cave --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; ảnh đọc là hốc vách; y collision vẫn phẳng wallY. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. ảnh đọc là hốc vách; y collision vẫn phẳng wallY.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-attach-cave. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.13: Ảnh riêng — Cây mọc ngang vách

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_attach_tree/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_attach_tree.png hoặc các terrain_mountain_wall_attach_tree_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_attach_tree, role 'attachment', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 128×128 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Cây/rễ bám đá, chiều cao 3/4, không dùng sprite cây rời nếu không khớp.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_attach_tree và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 128×128; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_attach_tree --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; cây ở sau mọi quân/nhà, không alpha mềm hoặc crop rễ. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. cây ở sau mọi quân/nhà, không alpha mềm hoặc crop rễ.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-attach-tree. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T8.14: Ảnh riêng — Đá lăn gắn chân vách

**Files:**
- Create: docs/art-review/oblique-wall/terrain_mountain_wall_attach_boulder/source.png, prompt.md, review.md, crops.json, preview.png.
- Create khi duyệt: public/assets/art/ai-v1/mountain-wall/terrain_mountain_wall_attach_boulder.png hoặc các terrain_mountain_wall_attach_boulder_part_NNN.png theo T8.0.
- Modify: docs/art-review/oblique-wall/catalog.json; docs/assets.manifest.yml; CREDITS.md.
- Generated Modify: tools/asset-admin/manifest.json, planned.json (qua A, không sửa generated file đơn lẻ).
- Test (Modify): tools/test_wall_asset_registration.py (fixture ID này); src/render/mountainWallModel.test.ts (coverage role/biến thể này).

**Interfaces:**
- Consumes T8.0 slice_wall/adopted_wall_items và catalog; T6 wallAssets/WallAsset.
- Produces logical ID terrain_mountain_wall_attach_boulder, role 'attachment', category terrain/group mountain_wall/kind object; chunks + source offsets nguyên, mật độ2, source dimensions thật sau duyệt. Brief đề xuất 128×128 px ảnh, không giới hạn nguồn bởi số này.
- Brief riêng: Đá trang trí tĩnh tùy chọn; không animation lăn/sát thương/đạn phát sinh.

- [ ] **Step 1 — RED trước ảnh:** thêm fixture registration riêng ID terrain_mountain_wall_attach_boulder và chạy U. Expected: FAIL vì logical asset chưa adopted/parts chưa đủ; planned còn đúng ID này. Không làm test đỏ bằng xóa ảnh đã duyệt.
- [ ] **Step 2 — Tạo đúng một ảnh và dừng duyệt:** dùng imagegen skill, lưu nguyên source/prompt, hiển thị ảnh và brief 128×128; ghi trạng thái awaiting-art-approval trong review. Expected: một ảnh duy nhất, chưa ghi public/manifest hoặc xóa planned; chờ người dùng chấp thuận nguồn. Nếu yêu cầu sửa thì tạo version mới cùng task, không chuyển task kế tiếp.
- [ ] **Step 3 — Crop/ghép kỹ thuật sau duyệt nguồn:** ghi crop/offset/dimensions/baseline bằng số thật. Run: python tools/slice_mountain_wall.py --id terrain_mountain_wall_attach_boulder --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview. Expected: source không đổi hash, parts nằm trong ảnh và <= cap, dựng lại byte-equal vùng đã duyệt; không bị hiểu là Đá Can Thiệp; không đổi boundary hay y-sort quân. Trình bày preview 1×/2× và runtime tạm, chờ người dùng chấp nhận bản xử lý trước adopt.
- [ ] **Step 4 — GREEN/adopt:** khi đã duyệt cả hai cổng, đánh dấu adopted; đăng ký license/provenance/credits; chạy U rồi A, sau đó npx vitest run src/render/mountainWallModel.test.ts. Expected: PASS, physical IDs đủ và không trùng, logical ID không còn planned (coverage alias khi nhiều parts); /admin thấy ảnh thật và /admin/map không nhận item planned. không bị hiểu là Đá Can Thiệp; không đổi boundary hay y-sort quân.
- [ ] **Commit gợi ý:** feat(art): adopt terrain-mountain-wall-attach-boulder. Chỉ commit adoption khi đã duyệt; nếu người dùng bỏ qua ảnh tùy chọn thì giữ planned/ghi deferred, không đánh dấu hoàn thành.


### Task T9: Nghiệm thu PC, invariant live và cổng cuối

**Files:**
- Create: docs/art-review/oblique-wall/browser-review.md; screenshots trong docs/art-review/oblique-wall/checks/ (planning, battle, wall/knockback, Help, seam, missing-fallback).
- Test (Modify khi phát hiện thiếu coverage): src/game/battle/wallBounds.test.ts; src/render/mountainWallModel.test.ts; src/ui/realm/realmLayout.test.ts.
- Read/check: src/main.ts, src/dev/*, tools/check-production-debug.mjs, toàn bộ Files T1–T8. Không gộp sửa gameplay/ảnh khác vào commit nghiệm thu.

**Interfaces:**
- Consumes RunController.runner: BattleRunner|null và BattleRunner.world:BattleWorld (đã có), render/asset metadata T6/T8; realmCamera/screenToWorld giữ chữ ký; production scan(dir).
- Produces checklist đo được, ảnh chụp được duyệt, logic/balance/asset/browser report gắn commit SHA và phiên bản ảnh. Không thêm debug export vào production để lấy số đo.

- [ ] **Step 1 — browser 1280×720 bắt buộc:** npm run dev; chạy ván thật ở ba vua và DEV mẫu năm 10/20/30 (ghi nhãn rõ mỗi loại). Expected: tường liền sau lâu đài, foot đúng biên64, phía bắc kín; chỉ mũi tên S, địch xuất ngoài S rồi tiến lên; boss đúng S và tick; không lính/đạn xuyên vách, bay cũng bị chặn.
- [ ] **Step 2 — va chạm/live:** fixture DEV trong RAM đặt quân sát biên, kích boulder/pulse/pull/charge bằng stats thật; đọc world qua runner hiện có ở debugger DEV, kiểm mọi live id/đạn trước/sau tick. Expected: y >= wallY + radius, prevY không nội suy xuyên núi, KB hết có thể di chuyển về mục tiêu; fixture không ghi save thật. Tạo test RED ở task sở hữu nếu phát hiện lỗi; sửa tối thiểu GREEN và chạy lại ảnh, không chữa bằng che sprite.
- [ ] **Step 3 — pixel/texture:** zoom1 và2, ghép mọi triple mid/foot qua preview script, cap hai mép, thiếu PNG/thiếu part, page GPU giới hạn nhỏ, reload/chuyển planning/battle20 lần. Expected: không đường nối/alpha mềm/mờ, không transparent gap chân cỏ; ảnh thiếu fallback nguyên logical asset; không leak/double wall, console sạch. Ground không che tường, tường dưới mọi sprite tương tác.
- [ ] **Step 4 — bố cục:** ảnh PC 1280×720; 1920×1080 nếu máy/thời gian cho phép, nếu chưa có ghi rõ pending thay vì tick. Expected: board vẫn5×5, ô click/hit/tầm và nút boulder đúng vị trí, Help/scout không tràn, integer zoom. Dùng camera hiện có; phần đỉnh ảnh bị crop được ghi cụ thể và trình duyệt, không thay world/camera để che vấn đề. Nếu đỉnh cần đầy đủ theo ảnh duyệt thì dừng nhận hình để người dùng quyết định bố cục.
- [ ] **Step 5 — save thật:** nạp fixture save legacy N/E/W ở planning và battle, reload qua IndexedDB thử nghiệm. Expected: chỉ S, không mất pending offer/gold/deck, version4/format1; kết quả battle cũ có thể đổi do luật mới đã ghi release note. Save/meta tài khoản thật không bị DEV làm thay đổi.
- [ ] **Step 6 — cổng cuối bắt buộc:**
  ~~~bash
  npm run lint && npm run typecheck && npm test && npm run build
  node tools/check-production-debug.mjs dist
  python -m unittest discover -s tools -p "test_*wall*.py"
  python -m unittest discover -s tools -p test_compare_wall_balance.py
  ~~~
  Expected: tất cả exit0, No debug preview in dist, không skip invariant/golden/balance, không sửa checker. Gắn before/after reports và các lần duyệt ảnh. Nếu balance gate T4 chưa đạt hoặc task asset đã chọn vẫn chờ duyệt, không đánh dấu trọn feature accepted.
- [ ] **Step 7 — bàn giao/commit gợi ý:** test(render): record mountain wall desktop acceptance. Chỉ stage báo cáo/test thật sự đổi. Không push/merge chỉ vì plan liệt kê commit.

## Rủi ro/Giả định

### Các quyết định §4 đã chốt, không hỏi lại

- wallY = 64 world units; radius nằm phía nam đường tường, quân bay cũng bị chặn.
- extraEdge thành thêm hàng, không đổi count1, tốc25% của cờ hoặc EP; không spawn N/E/W trên đường production.
- save cũ N/E/W → S sau validate; giữ Edge union và version4/format1, không thêm trường bắt buộc. Không giữ kết quả trận/replay cũ theo geometry cũ.
- “Đội hình đi tới” là dàn hàng xuất quân rồi targeting/movement hiện hành, không behavior giữ hàng, không tốc độ đồng bộ.
- Giữ lưới vuông, input/camera maths, camera không xoay. Cảnh 3/4 không tự biến thành isometric hay đổi tile footprint.

### Chênh lệch/tình huống thiếu trong spec và cách plan xử lý

1. Spec dòng3 còn ghi chờ duyệt và §4 có cả câu “save cũ xuất như trước” lẫn default normalize. Yêu cầu người dùng hiện tại ưu tiên: coi đã duyệt và chọn normalize S (T3); không sửa metadata spec trong phiên chỉ viết một file.
2. movement.ts:113–130 chỉ kẹp live units cuối phase; addUnit world.ts:589 đặt vị trí trước radius, còn projectilePhase combat.ts:295–319 và boulder input intervention.ts:37–44 là đường ghi riêng. T1 chặn tại các entry/phase này, không coi một clamp movement là đủ.
3. world.ts:421 mặc định24 đơn vị/hàng; với120 quân S hàng cuối y436 vượt hi416 từ data/battle.ts:66. T1/T2 giới hạn S động từ setup, hữu hạn; rủi ro thay gameplay phía S được đo ở T4.
4. ArmySpawn/ArmyWave không mang extraEdge; enemyArmy.ts:58–63 chỉ tác động lựa chọn cạnh. T2 derive rows từ year/banner vào WaveSetup runtime, không serialize field mới. Nếu sau này cần lưu một formation khác data hiện tại, phải thiết kế version/migration riêng, không lén đổi plan này.
5. Không có command chuẩn update golden/hash: determinism.test.ts hiện so hai world, fullRun.test.ts so hai lần chạy; benchmark là thời gian/count. T4 ghi trace thực và sửa fixture/assert thay đổi có lý do, không thêm số hash đoán trước hoặc --update blanket.
6. src/data/help.ts chỉ có HelpTab/HELP_TABS; nội dung nằm ui/help/mechanics.ts:45 và banner text tại data/kings/nomad.ts:174. T5 sửa đúng nguồn để Help/scout không mâu thuẫn.
7. FieldRenderer.ts:25/30 ground -1/field0: “depth thấp nhất” không thể là thấp hơn một nền opaque. T6 đặt far thấp nhất trong nhóm núi, vẫn trên ground/field và dưới plot/unit, không tuyên bố tường cần depth âm vô hạn.
8. CLAUDE/artPolicy.ts:8 và tools/asset-admin/src/types.ts:98 đang có4096; atlas.ts:244 pack một sprites texture. Spec/ASSET_REQUIREMENTS §9.1 cho nguồn tường không trần. T6/T8 dùng background pages/chunks, không nới cap GPU/atlas/game generic. Nếu catalog không thể biểu diễn source chunks thì sửa pipeline, không đưa Item9000px qua guard bằng ép kiểu.
9. slice_art_batches.py sinh đè manifest; build_planned_assets.py sẽ sinh lại planned. T8.0 đăng ký nguồn/crop/adoption và coverage alias vào generator, tránh ghi tay rồi mất dữ liệu ở lượt sinh sau.
10. Ngưỡng balance10/15 điểm phần trăm và median3năm, performance1.25×, cách thêm0/1 hàng từ mốc năm10 lên số hàng tự nhiên, và chọn1lớp xa là **quyết định của plan**, không giả là con số đã có trong spec. Cần người dùng xác nhận plan trước thực thi; nếu gate vượt không tự điều chỉnh ngưỡng.

### Cần xác nhận sau ảnh thật

- Chiều cao/baseline thực, đoạn giữa rộng bao nhiêu, profile nối và vùng opaque chân: chốt tại duyệt từng ảnh, metadata ghi px ảnh và2× rõ ràng.
- wallY64 có đủ khoảng nhìn phía sau hàng đầu không; mức crop đỉnh núi ở camera PC hiện tại chấp nhận được hay cần một thiết kế camera riêng. Không đổi wallY/camera cho vừa ảnh mà bỏ qua test cân bằng.
- Một lớp xa và bốn attachments là tùy chọn; ảnh nào bị từ chối/defer vẫn giữ planned. Nếu muốn hai lớp xa thì thêm task ảnh riêng/cổng duyệt, không lén gen hai ảnh trong T8.10.
- Bộ plots nhìn từ trên64×64 hiện có vẫn dùng, việc vẽ lại góc3/4 thuộc bộ sau theo spec; không chặn logic/fallback wall.
- Nhìn mắt không chứng minh collision; log/phase invariant không chứng minh mỹ thuật liền mạch. Chỉ accepted khi cả TDD, gate cân bằng, asset review và browser đều đạt.

## Tự rà plan trước bàn giao

- [x] Đã đọc spec, CLAUDE, mẫu plan và các chữ ký/tests thực; ghi rõ API mới so với API đang có.
- [x] T1 bao phủ spawn/prev/home/move/KB/pull/projectile/intervention; T2 ghim boss/hàng đông/cờ; T3 fixture legacy; năm Review Focus đều có task/test sở hữu.
- [x] Không dùng đường dẫn fullRun sai hoặc giả có battleSetupG3; không giả test hiện có chứa literal hash golden.
- [x] T1–T4 độc lập renderer/ảnh; T5–T7 dùng placeholder; 14 nguồn ảnh có hai cổng duyệt và registration bền qua generator.
- [x] Câu lệnh và Expected là tiêu chí cho người thực thi, không báo cáo đã chạy. Chỉ một file plan được ghi ở phiên này.

