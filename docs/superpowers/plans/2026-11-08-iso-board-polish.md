# Crowned Kingdoms Iso Board Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (hoặc superpowers:subagent-driven-development khi được yêu cầu) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện bàn isometric bằng ưu tiên đánh lính, xuất quân qua cổng nam, zoom liên tục, nền cỏ kín và chiến trường thoáng, rồi nối rừng/cổng đã duyệt.

**Architecture:** Q1–Q2 thay luật trong world vuông deterministic, dữ liệu vị trí ở src/data; Q3 thay camera/input presentation; Q4–Q5 thay nền/cảnh, không đưa cảnh vào battle/save. Renderer và HUD dùng chung view đã áp qua `realm:view`; art tách gate mẫu, sản xuất, đăng ký, runtime.

**Tech Stack:** Phaser 4 · TypeScript strict · Vite · Vitest · Python/Pillow/unittest · browser preview với `window.game`.

**Spec:** `docs/superpowers/specs/2026-11-08-iso-board-polish-design.md`. Đọc cùng CLAUDE.md, AGENTS.md, ROADMAP, GDD, ART_STYLE, spec/plan 06/11, HANDOFF mục07/11. Spec08/11 thắng các câu zoom nguyên, siege bỏ lính và đội hình mép S cũ.

## Global Constraints

- Phiên lập tài liệu chỉ tạo đúng spec và plan08/11; không runtime, commit, Node/npm/npx hay tạo/yêu cầu tạo ảnh. **Mọi checkbox/lệnh dưới đây dành cho người thực thi sau**, không phải kết quả đã chạy.
- Thực thi tuần tự trên `iso-board-redesign`, PR#13 vào `develop`; không push thẳng main/develop, không tự merge. Giữ nguyên thay đổi có sẵn; xác minh branch/worktree trước khi viết. Không tự mở agent nếu chưa được yêu cầu.
- Game/data/core không import Phaser/render/ui/scenes/platform/audio; data không import game; mọi số gameplay ở data. Trận không Rng; không Math.random/Date.now/performance.now/Math.hypot/sin/cos/tan/atan2/exp/log/pow; sort id/plot, không để Map/Set chọn kết quả, fixed10tick/s.
- World vuông: ô64, sân768, origin224, wall176, Ngai2; input inverse camera rồi `unproject`. Không đổi stats/budget/caps/tick để bù cân bằng. WAVES=[0,120,240], rage600, hard900, caps120/160/40/512/400 giữ nguyên.
- TDD game/data/core: test trước → FAIL đúng assertion → code tối thiểu → PASS. Pure presentation maths cũng test trước. Không bulk-update hash/snapshot để làm xanh; hash/benchmark/cân bằng chỉ ghi số đã chạy thật.
- RunState5/envelope1 giữ; không lưu camera/gesture/decor. Save sau command ngoài trận và vào/ra trận, không tick/speed/intervene/zoom/pan; reload battle dựng tick0. Nếu thật sự phải đổi state, dừng thiết kế lại có migrator+fixture, không bump version chỉ vì luật trận đổi.
- Camera world liên tục [min,3] là ngoại lệ chủ dự án08/11 thay zoom nguyên; HUD không zoom. Giữ pixelArt/nearest/noAA/noBlur, snap cuối render, không snap simulation; sprite feet(0.5,1), y-sort, không rotate; alpha cạnh0/255, bóng riêng128 có khai báo; một world atlas sprites≤4096/cạnh.
- FONT_UI tiếng Việt, createPanel/createButton/Tooltip400ms, touch≥44×44. Mobile min33/32 theo hình vuông nội tiếp thoi, không lấy AABB thay polygon input.
- Trước code Phaser đọc `.agents/skills/v3-to-v4-migration/SKILL.md` và cameras/input/scenes/scale/sprites/graphics/text/events theo phần sửa; kiểm signature `node_modules/phaser/types/phaser.d.ts`. Plan không giả định API Phaser3.
- Art mỗi lần đọc ART_STYLE, đính `docs/art-review/style-references/harvester-house-front-approved.png` và iso refs phù hợp/cùng loại đã duyệt. Prompt từ khối mẫu qua make_prompts.py, tự bảo Codex đọc ART_STYLE, test tools/test_art_prompts.py. Một mẫu mỗi loại → chủ dự án duyệt → bộ → review → manifest/CREDITS → runtime. Nguồn/prompt dưới docs/art-review; category theo ASSET_MANIFEST, không lấy art từ game tham khảo.
- Cuối **mỗi Q1/Q2/Q3/Q4/Q5**: `npm run lint < /dev/null && npm run typecheck < /dev/null && npm test < /dev/null && npm run build < /dev/null` (Git Bash). Mọi npx bên dưới cũng có `< /dev/null`; shell khác bỏ redirect theo môi trường. PASS nghĩa exit0, không chỉ nhìn log cuối.
- `CHECK(Qn)` = cổng bốn lệnh trên + browser1280×720,375×812,2000×994 (Q3 thêm1920×1080), screenshot/console/thao tác thật. Ghi lệnh/exit/base/seed/viewport và giới hạn kiểm vào HANDOFF, không giả duyệt hoặc số đo.

## Review Focus

1. Lính bay còn sống nhưng cận chiến không đánh được, mục tiêu đổi tag sau Hạ Cánh, quân mới sinh giữa chu kỳ: fallback không đứng yên và không giữ target bất hợp lệ (Task2).
2. Mục tiêu chính, Ném Bùn và bước nhảy chain tuân ưu tiên lính; splash/cleave/cone vẫn trúng nhà trong vùng như cũ; taunt/rage bị chặn nhầm hoặc Cuồng Vương theo HP bị hiểu là rage toàn trận (Task2).
3. 120 địch + boss cùng tick ở cổng, formationRows/Đột Kích, cap512 và triệu hồi: không mất/đúp quân, không đổi tick/tuổi boss, không tăng CPU quá ngưỡng (Task3).
4. Mobile thoi44×44, bốn thẻ, desktop bị scout/decree che bàn, zoom sát biên/resize và midpoint pinch di chuyển (Tasks4–5).
5. Ease phát view thiếu frame, snap pan mất delta nhỏ, pointer thứ hai huỷ thẻ nhưng vẫn phát click/intervene/save (Task5).
6. TileSprite cỏ thẳng lệch phase với sân iso; polygon sau núi phủ nền/rừng, footprint cây che đường/cổng và leak texture sau restart (Tasks6–8).
7. Chưa duyệt mẫu nhưng auto-approve qua DECOR_CATALOG.map, thiếu PNG hoặc atlas đầy: fallback an toàn, không nối nguồn sai category/frame (Tasks7–8).

## Thứ tự, phụ thuộc và bản đồ file

Giữ Q1→Q2→Q3→Q4→Q5 để đo riêng targeting, portal trước presentation. M=sửa file hiện có, C=tạo; các đường dẫn rút gọn trong cùng nhóm dùng thư mục đã ghi. Không tạo `realmCoordinates.ts`/`mapGestures.ts` chỉ vì plan06/11 từng nêu: **hai file này hiện không tồn tại**, gesture đang ở RealmScene, inverse ở cameraModel.

| Pha/task | Bản đồ file chính | Đầu ra |
|---|---|---|
| Q1/1 | C `src/game/sim/isoPolishMetrics.test.ts`, `docs/art-review/iso-board/polish/logic-report.md`; M HANDOFF | Baseline thật và harness tái chạy |
| Q1/2 | M `src/game/battle/{targeting,bosses,combat}.ts` và test boss/target/combat | Ưu tiên lính, mọi đường chọn mục tiêu |
| Q2/3 | M `src/data/battle.ts`, `src/game/battle/{spawnLayout,world,bounds,bosses}.ts`; C portal tests/renderer | Cổng luật + code fallback |
| Q3/4 | M `src/ui/realm/{realmLayout,cameraModel}.ts` và test | Min liên tục, neo, fit, snap |
| Q3/5 | M Realm/PlanningHud/BattleHud/main + CLAUDE/AGENTS/ART_STYLE | Gesture/view/HUD, luật mới nhất quán |
| Q4/6 | M FieldRenderer/atlas/fieldArt/decorModel/BoardRenderer/IsoWallRenderer + data/test | Cỏ kín, clear zones, bỏ dirt |
| Q5/7 | M prompt/Python test; C art-review/polish mẫu + cutter | Gate mẫu mỗi loại rồi sản xuất |
| Q5/8 | M manifest/CREDITS/imageArt/atlas/DecorationRenderer/FieldRenderer/portal; C forest model/renderer | Rừng mới + art cổng runtime |

## Bảng số cũ → mới

| Nơi/hằng | Cũ | Mới |
|---|---|---|
| cameraModel ZOOM_MAX | 3 | 3 |
| zoomSteps / floor trong zoomAt | [1,2,3] | bỏ API bước; min động→3 liên tục |
| PINCH_IN/OUT |1.25/0.8| bỏ; sqrt(nowSq/startSq) |
| Wheel RealmScene | ±1 | zoom×(1−clamp(dy,−100,100)×0.001) |
| PLANNING_ZOOM mobile |1|33/32 |
| PHONE.buttons.y |508|530 |
| enemyAggro/siegeAggro |96/192|96/192, chỉ fallback nhà |
| S edgePositions |24 quân/hàng,spacing20,rowGap20|5×5 slot miệng cổng, dx12,dy6, lặp25 |
| ENEMY_PORTAL | chưa có | tâm384,792; miệng[360,408]×[768,792] |
| FIELD_DECOR.low.count |26|12; dải x≤192 hoặc≥576 |
| combatClear/portalClear | chưa có | [256,512]×[544,832] / [328,440]×[736,848] |
| Rừng | không có | salt6811; grid64,jitter16,occupancy0.72;pine90%/rock10% |
| RunState/version |5|5 |

Giữ edgeSpan0.6/spawnSpacing20/spawnOutside24/spawnRowGap20 cho helper legacy, không đổi số vì S đã có helper riêng. `ENEMY_PORTAL.y=FIELD+BATTLE.spawnOutside` được khai báo không tạo vòng import. Miền nền/rừng và bảng zoom chính xác ở spec §§4–6 là phần bắt buộc của plan.

### Task 1 (Q1): Ghi baseline trước đổi luật

**Files:** C `src/game/sim/isoPolishMetrics.test.ts`, `docs/art-review/iso-board/polish/logic-report.md`; M `docs/art-review/HANDOFF.md`. Đọc `src/game/sim/{headless,fullRun.test}.ts`, `src/game/sim/bots/{random,scripted}.ts`, `src/game/battle/{determinism,g2Determinism,benchmark}.test.ts`; không sửa expected ở bước này.

**Interfaces:** harness Vitest opt-in theo `ISO_POLISH_MEASURE=1`, mặc định skip để npm test không chạy600ván. Sao vòng `playReal` trong fullRun.test.ts (applyCommand/buildBattleSetup/simulateBattle), cùng newRun RULES_FULL và randomBot/scriptedBot; đối chiếu state cuối/commands với runHeadless seed1. HeadlessResult hiện chỉ có state/commands, không có callback; lấy ticks/capped/throneHpLostPct từ BattleResult ngay trong vòng đo (HP báo dưới dạng % còn lại=100−throneHpLostPct, không bịa HP tuyệt đối), không sửa production API hoặc RunState. Xuất từng record JSON marker ISO_POLISH_JSON với phase baseline/Q1/Q2,seed,king,bot,won,year,HP,ticks,bossKills,capped và tổng hợp; không thêm RNG vào battle.

- [ ] Viết RED harness `metrics_loop_matches_headless_seed_one` cho3vua×2bot: state/commands giống runHeadless, record finite và có số trận; xác nhận FAIL nếu thiếu trường tính trong vòng đo rồi implement. Dùng Vitest đang cài, không thêm tsx/dependency. Dùng process.env qua khai báo kiểu tối thiểu như benchmark.test.ts, không đưa đồng hồ vào simulation.
- [ ] Tạo suite opt-in600ca, seed1..100×3vua wheat/stone/arcane×2bot, timeout120000 mỗi ca. Chạy Git Bash `ISO_POLISH_MEASURE=1 ISO_POLISH_PHASE=baseline npx vitest run src/game/sim/isoPolishMetrics.test.ts < /dev/null > .superpowers/iso-polish-baseline.log 2>&1`. Ghi aggregate win rate/năm trung bình/boss kills/HP/ticks/capped vào report từ record thật. Chạy lại seed1, record phải giống; timing tách khỏi kết quả deterministic. Bot lỗi là record crashed và test FAIL, không lặng lẽ tính như thua hợp lệ.
- [ ] Chạy `npx vitest run src/game/battle/determinism.test.ts src/game/battle/g2Determinism.test.ts src/game/battle/benchmark.test.ts src/game/sim/fullRun.test.ts < /dev/null`; ghi hash/trace đầu vào can thiệp, ms/tick và môi trường đo thực. Không lấy 0.364/0.461 cũ làm số hiện tại. Baseline code commit + diff hiện hữu phải được nhận diện.
- [ ] Chạy harness baseline; ghi lệnh và raw đường dẫn vào logic-report. Không yêu cầu cân bằng đạt G5, chỉ bảo đảm bộ ca tái chạy chính xác. Task này chỉ hạ tầng đo, không cần test phản chiếu nội dung báo cáo.

### Task 2 (Q1): Ưu tiên lính cho mọi địch và kỹ năng

**Files:** M `src/game/battle/targeting.ts`, `bosses.ts`, `combat.ts`, `targeting.test.ts`, `combat.test.ts`, `bogOgre.test.ts`, `hornetQueen.test.ts`, `crownlessKing.test.ts`, `behaviours.test.ts`, `determinism.test.ts`, `g2Determinism.test.ts`; M logic-report/HANDOFF. `src/data/battle.ts` chỉ cập nhật comment aggro, không số. Audit `src/game/cards/describe.ts`; nếu có câu mô tả siege ưu tiên nhà thì sửa theo luật mới, không sửa text không liên quan.

**Interfaces:** giữ `retarget(world):void`, `canHit`, `inRange`, `pickShotTarget(s)`. C trong targeting.ts các export `nearestHittableAllyUnit(w:BattleWorld,self:number):number` (−1 nếu không có) và `allowsFoeStructureTarget(w:BattleWorld,self:number):boolean` (rage hoặc taunt hợp lệ hoặc không có lính có thể đánh); bosses/mudThrow và combat/chainFrom dùng chung khi chọn đích mới, không lọc sát thương vùng hay lúc áp sát thương. `foeTarget` giữ private. Không dùng inRange để chọn pool lính toàn sân.

- [ ] Viết RED trong targeting.test: `foe_prefers_far_hittable_unit_over_near_structure` (lính ngoài96 vẫn được chọn), `siege_and_each_boss_prefer_units`, `nearest_unit_edge_distance_ties_by_id`, `only_unhittable_flyer_falls_back_to_structure`, `ranged_foe_pursues_flyer`, `invalid_flying_target_retargets_before_periodic_tick`, `new_ally_replaces_structure_by_next_retarget`, `taunt_beats_units_but_global_rage_beats_taunt`, `dead_throne_with_no_targets_returns_minus_one`. Dùng fixture unitStats/addUnit/structure, assert id cụ thể, không snapshot đoán.
- [ ] Viết RED boss/combat: `mud_skips_tower_while_hittable_ally_exists_without_catchup`, `mud_keeps_highest_damage_tower_tie_when_units_gone`, `enemy_chain_jumps_prefer_units_while_units_exist` (gần nhất chưa trúng trong bán kính, hoà id nhỏ; còn lính hợp lệ nhưng không có lính chưa trúng trong bán kính thì dừng, không nhảy nhà), `enemy_splash_cleave_cone_still_hit_structures_as_collateral` parameterized splash/cleave/cone (regression giữ hành vi cũ kể cả khi còn lính); `taunt_and_rage_keep_structure_damage`, `existing_projectile_and_dot_are_not_cancelled`, `crownless_hp_rage_does_not_override_unit_priority`, `landing_changes_target_eligibility`. behaviours regression charge/ramp/knock/pull vẫn áp lên mục tiêu mới, không buff số.
- [ ] `npx vitest run src/game/battle/targeting.test.ts src/game/battle/combat.test.ts src/game/battle/bogOgre.test.ts src/game/battle/hornetQueen.test.ts src/game/battle/crownlessKing.test.ts < /dev/null`: FAIL vì siege/ngoài aggro/mud/chain vẫn chọn nhà; regression splash/cleave/cone phải giữ PASS, không vì import/type sai.
- [ ] Implement thứ tự rage→taunt→hittable unit toàn sân→fallback nhà aggro→Ngai theo spec§2. Cho retarget ngay nếu canHit của target đã mất. Chỉ gating **lúc chọn nạn nhân mới** ở foeTarget, chainFrom và mudThrow. Chain lọc ứng viên lính hợp lệ chưa trúng trước khi chọn gần nhất trong bán kính hiện có; giữ số bước/falloff/hoà id. Giữ nguyên foesNear/splashAround và các vòng cleave/cone: nhà trong vùng vẫn trúng sát thương kèm dù còn lính. Không gating tại applyDamagePhase làm mất đạn/DOT cũ. Không đổi target logic của phe ta, không sửa dữ liệu tags siege. Cập nhật comment kỹ năng và mô tả cũ nếu có.
- [ ] Chạy lại focused PASS, rồi determinism/g2Determinism/benchmark/fullRun. Nếu hash pinned đổi, bắt tick đầu lệch và lý do target, chạy lặp cùng setup/input để bằng nhau từng tick trước khi thay expected có chủ đích. Không tăng LIMIT_MS=2; ghi timing thực và số ca chưa kết thúc ở100tick nếu test benchmark yêu cầu.
- [ ] Harness cùng lệnh Task1 với `ISO_POLISH_PHASE=Q1` và log `.superpowers/iso-polish-Q1.log`, cùng bộ600ván, so baseline; ghi riêng hiệu quả ogre/Ông Kẹ, tháp/stone_wall/lính bay, không đổi stats. `CHECK(Q1)`: trên browser trận thường và fixture boss thật, thấy địch chuyển từ lính cuối chết sang nhà, taunt/rage còn tác dụng. Ghi rõ fixture/debug so với ván chơi thật.

### Task 3 (Q2): Cổng luật, bounds và hình tạm

**Files:** M `src/data/battle.ts`, `src/data/boardGeometry.test.ts`, `src/game/battle/spawnLayout.ts`, `world.ts`, `bounds.ts`, `bosses.ts`, `world.test.ts`, `bossSpawn.test.ts`, `fullCapacity.test.ts`, `wallBounds.test.ts`, `bannersFull.test.ts`, `determinism.test.ts`, `g2Determinism.test.ts`; C `src/game/battle/portalSpawn.test.ts`, `src/render/EnemyPortalRenderer.ts`, `src/render/EnemyPortalRenderer.test.ts`; M `src/render/FieldRenderer.ts`, `fieldArt.ts`, `src/ui/realm/cameraModel.ts`, `cameraModel.test.ts`, logic-report/HANDOFF. Audit `compose.ts`, `src/game/run/battleSetup.ts` (chỉ sửa comment formationRows nếu cần); triệu hồi không chuyển sang cổng.

**Interfaces:** `ENEMY_PORTAL={x,y,columns:5,rows:5,spacingX:12,spacingY:6}` ở data; `portalPositions(count:number):{x:number;y:number}[]` ở spawnLayout; `EnemyPortalRenderer(scene)` + `destroy():void`, dựng hình tạm bằng code tại tâm data, không collision. Boss dùng tâm, không phần tử đầu portalPositions (slot0 của wave là360,792). `worldAtView` mở battle bounds tới832; `plotAtView` giữ bảng25ô.

- [ ] RED `portal_centre_projects_right_and_down`: data384,792, project408,588; `portal_slots_stay_at_mouth_for_0_1_25_120`: count đúng, x360..408/y768..792, k25=k0, input count0→[]. `south_wave_uses_portal_in_spawn_order_at_exact_tick`: tick0/120/240, trước tick không sinh, id/stats đúng thứ tự; `boss_spawns_once_at_portal_centre_on_due_tick`.
- [ ] RED `raiders_and_extraedge_lateyear_use_same_portal`, `boss_and_wave_same_tick_keep_id_order_and_caps`, `boss_summons_and_death_children_stay_local`, `portal_120_plus_summons_respects_entity_cap`, `south_bounds_include_portal_without_long_rows`, `legacy_other_edges_keep_geometry`. Test count120 cùng boss/separation nhiều tick finite, north clamp và hard limit900; không assert không chồng thân ban đầu.
- [ ] `npx vitest run src/game/battle/portalSpawn.test.ts src/game/battle/bossSpawn.test.ts src/game/battle/fullCapacity.test.ts src/game/battle/wallBounds.test.ts src/game/battle/bannersFull.test.ts < /dev/null` → FAIL vì còn hàng ngang/nhầm boss slot. Viết thêm camera test `battle_aim_accepts_portal_but_plot_hit_does_not` và render test `portal_fallback_uses_data_and_destroy_is_idempotent`.
- [ ] Implement S slots trong spawnWave, boss S đúng tâm, giữ N/E/W fixture; không queue/drip, không đổi wave event/step order hoặc caps. spawnMaxY từ slots mới (ít nhất832), bỏ ảnh hưởng formationRows cho S, không xoá schema/save. `composeArmy` không sửa số quân/nhịp; ghi ảnh hưởng Đột Kích/năm muộn. Texture fieldArt.ts chỉ phủ tới768: Q2 vẽ đường từ544 tới768, cổng tạm che chỗ hở768→792; Q4 vẽ nối đoạn768→792 trên lớp nền cỏ chunk tới chân cổng, không sửa river/pond thành sim obstacle. FieldRenderer sở hữu/dọn portal; code fallback không raw UI rectangle.
- [ ] PASS focused + `npx vitest run src/game/battle/world.test.ts src/ui/realm/cameraModel.test.ts src/render/EnemyPortalRenderer.test.ts src/game/battle/determinism.test.ts src/game/battle/g2Determinism.test.ts src/game/battle/benchmark.test.ts src/game/sim/fullRun.test.ts src/platform/resumeIntegration.test.ts < /dev/null`. Reload cùng setup/can thiệp dựng đúng portal/tick0, không write mới do hình cổng.
- [ ] Chạy harness cùng lệnh Task1 với `ISO_POLISH_PHASE=Q2` và log `.superpowers/iso-polish-Q2.log`, cùng600ván, ghi so Q1 riêng; hash first divergence phải là vị trí S hoặc hậu quả của nó. Báo tụ quân/timing/capped/thời gian tới đòn đầu; giữ ngưỡng benchmark. `CHECK(Q2)`: xem đủ3đợt, raider,boss và summon, ngắm đá tại cổng, reload giữa trận; cổng tạm hiện đúng ô vuông đỏ ở cả3viewport; ảnh xác nhận đường dừng tại768 và hình cổng tạm che kín chỗ hở tới792 trước khi có chunk Q4.

### Task 4 (Q3): Model camera liên tục, fit và snap

**Files:** M `src/ui/realm/cameraModel.ts`, `cameraModel.test.ts`, `realmLayout.ts`, `realmLayout.test.ts`; C `src/ui/realm/cameraPresentation.ts`, `cameraPresentation.test.ts`. Không đổi core/iso.ts hoặc RunState.

**Interfaces:** C `overviewZoom(screen:Size,phase:RealmPhase):number` và `realmUsableRect(screen,phase,handSize=3):Rect` trong realmLayout; tránh vòng gọi planningLayout. C `zoomLimits(screen,phase):{min:number;max:number}`, `pinchZoom(startZoom,startSq,nowSq):number` trong cameraModel thay zoomSteps/pinchStep; zoomAt/panBy/resizeView giữ chữ ký. C `snapView(view:CameraView,screen:Size):CameraView` trong cameraPresentation (chỉ bản hiển thị).

- [ ] RED `overview_65_percent_clamps_to_hud_height`:1280×720 planning1.29375,battle1.3;2000×994=2.03125;1920×1080=1.95; mobile375×812=1.03125,board660×330. `mobile_diamond_contains_44_square`:128*z/3≥44; `four_cards_recompute_vertical_fit`, `side_panels_collapse_when_board_overlaps`, `mobile_buttons_clear_board_and_hand`:buttons530..578,board180..510,hand640.
- [ ] RED `fractional_zoom_keeps_pointer_anchor_without_clamp`, `zoom_to_min_does_not_reset_pan`, `pinch_uses_distance_ratio_and_handles_zero`, `resize_keeps_overview_or_zoomed_centre`, `clamp_centre_stays_south_of_wall_at_fractional_zoom`, `zoom_max_is_three_on_wide_screen`, `inverse_roundtrip_all_25_plots_at_fractional_view`. Assert floating tolerance≤1e−8 trước snap, không strict float equality.
- [ ] RED cameraPresentation: `snap_translation_is_integer_and_error_at_most_half_pixel`, `repeated_subpixel_pan_accumulates_without_drift`, `snapped_view_roundtrips_hit_test`. Tính translation theo spec, không round(scroll) đơn giản. Lệch anchor sau snap≤0.5px mỗi trục nếu không clamp; clamp có thể lệch hơn nhưng phải đúng bounds.
- [ ] `npx vitest run src/ui/realm/cameraModel.test.ts src/ui/realm/realmLayout.test.ts src/ui/realm/cameraPresentation.test.ts < /dev/null` → FAIL đúng floor/steps/fit. Implement công thức spec§4, bỏ PLANNING_ZOOM1 dùng33/32, layout mobile nút530; giữ `CENTRE_BOUNDS` phía nam, tính min từ usable rect không field width. Chỉ bỏ test zoom nguyên đã bị yêu cầu thay thế, giữ pan/resizing/hit regressions.
- [ ] PASS focused; kiểm4thẻ, cửa sổ hẹp/thấp, finite zoom>0, không vô hạn recursion. Không lấy thế giới thật đã snap để cập nhật world float; giữ view float và render view riêng ở Task5.

### Task 5 (Q3): Nối wheel/pinch/ease/HUD và cập nhật luật

**Files:** M `src/scenes/RealmScene.ts`, `PlanningHudScene.ts`, `BattleHudScene.ts`, `src/main.ts`, `src/ui/realm/cameraPresentation.test.ts`; C `src/ui/realm/cameraGestures.ts`, `cameraGestures.test.ts`; M `CLAUDE.md`, `AGENTS.md`, `docs/ART_STYLE.md`, `docs/ROADMAP.md`, `docs/art-review/HANDOFF.md`. Nếu typed event payload hiện tại không đổi, không sửa `src/game/events.ts` chỉ để thêm camera state.

**Interfaces:** cameraGestures thuần C `wheelZoom(zoom:number,dy:number):number`; `pinchView(start:CameraView,startMid:Point,nowMid:Point,startSq:number,nowSq:number,screen:Size,phase:RealmPhase):CameraView` dùng inverse/projected camera và clamp. RealmScene lưu start view/spread/mid cho pinch, raw view cho pan và render view cho bus; `applyView` snap đúng một lần. Giữ giao diện `realm:view` zoom+scroll.

- [ ] RED `wheel_small_delta_changes_zoom_without_step`, `pinch_moving_midpoint_keeps_original_world_anchor`, `pinch_at_limit_still_pans_midpoint`, `zero_spread_is_safe` trong cameraGestures.test; FAIL trước code bằng `npx vitest run src/ui/realm/cameraGestures.test.ts < /dev/null`, implement đúng công thức không Math.floor.
- [ ] Nối onWheel/onPointerMove: không restart pinch mỗi ngưỡng; second pointer huỷ card/drop/press/click; release không thành click. Modal/help/scroll HUD không zoom map; resize/phase/shutdown reset gesture, scene reuse reset fields. Thêm test adapter bằng stubs trong cameraGestures.test: `second_pointer_cancels_drop`, `blocked_wheel_emits_no_view`, `pinch_release_cannot_intervene`; nếu phải tách state reducer để test, chỉ tách phần đang sửa vào cameraGestures, không dựng hệ gesture khác song song.
- [ ] Viết test `ease_emits_applied_view_each_frame`, `raw_pan_and_applied_view_do_not_diverge_in_input`, `reset_overview_is_explicit` bằng stubs cho adapter: không thêm nút/HUD hay hành động reset mới; chỉ về tổng quan khi mở ván, resize lúc đang overview và chuyển pha từ overview cũ sang overview pha mới; zoom tới min không reset pan; sửa placeCamera tween gọi applyView mọi frame (đường hiện tại set camera trực tiếp chưa emit), không ép người đang zoom/pan về overview khi mua ô/đổi bài/chuyển trận. HUD inverse đọc render view hiện hành cả click/drop/hover/confirm/aim; thả thẻ chỉ hợp lệ trong board. Không thêm command/save cho camera.
- [ ] Cập nhật **cả** CLAUDE.md/AGENTS.md mục Board and view + Pixel art, ART_STYLE Hiển thị: ngày08/11, camera world ngoại lệ zoom lẻ[min,3], nearest/noAA, translation snap, HUD không zoom, mobile33/32 và giới hạn pan; bỏ câu tuyệt đối “không bao giờ scale lẻ” cho camera. Sprite native/art scale vẫn giữ theo metadata. Main.ts đổi comment nguyên zoom, giữ pixelArt:true; ROADMAP phản ánh min mới, không tuyên bố Q5 xong sớm.
- [ ] PASS `npx vitest run src/ui/realm/cameraGestures.test.ts src/ui/realm/cameraPresentation.test.ts src/ui/realm/cameraModel.test.ts src/ui/realm/realmLayout.test.ts src/platform/resumeIntegration.test.ts < /dev/null`; `CHECK(Q3)`. Browser zoom1.03125/1.29375/1.7/2.03125/3, wheel/pinch giữ anchor, pan chậm/đứng yên không rung, restart3lần, resize đang pinch, 4thẻ, modal/longpress400ms, đặt ô sát mép/chọn2đích/can thiệp ở cổng, kiểm save writes không tăng. Chụp4viewport, đo board bbox so bảng spec. Ghi giới hạn nếu chỉ giả lập touch, không nhận đã kiểm thiết bị thật.

### Task 6 (Q4): Cỏ cùng phase, vùng chiến đấu trống và bỏ deploy dirt

**Files:** M `src/render/FieldRenderer.ts`, `atlas.ts`, `fieldArt.ts`, `decorationModel.ts`, `decorationModel.test.ts`, `DecorationRenderer.ts`, `DecorationRenderer.test.ts`, `BoardRenderer.ts`, `BoardRenderer.test.ts`, `IsoWallRenderer.ts`, `atlas.test.ts`, `isoArt.test.ts`; M `src/data/fieldDecoration.ts`; C `src/render/groundModel.ts`, `groundModel.test.ts`, `src/data/fieldDecoration.test.ts`; M HANDOFF.

**Interfaces:** groundModel C `groundSample(seed:number,x:number,y:number):{tile:number;u:number;v:number}` (world pixel/phase, modulo đúng với toạ độ âm), `visibleGroundChunks(view:CameraView,screen:Size):readonly {x:number;y:number}[]` (inverse bốn góc/cull/padding, vùng spec§5). Chunk render dùng cùng sampler với field grass; không import UI vào game/data/core. `FIELD_DECOR` thêm hai rect exclusion; helper render `isDecorAllowed(x,y,radius)` kiểm toàn footprint cùng clear zones trước seed scatter.

- [ ] RED groundModel `negative_world_coordinates_keep_tile_phase`, `inside_and_outside_field_share_grass_samples_on_both_sides_of_768`, `all_valid_view_corners_have_ground_chunks`, `chunk_keys_reuse_without_unbounded_growth`; dùng cùng tile source ở field và ngoài, kiểm pixel cạnh chunk khi `squareToIso`, không chỉ assert màu hằng. Camera min/pan extremes3viewport, texture chunk≤1024 mỗi cạnh. Focus: `npx vitest run src/render/groundModel.test.ts src/render/atlas.test.ts src/render/isoArt.test.ts < /dev/null` → FAIL vì sampler/chunk chưa có hoặc seam hiện tại.
- [ ] RED data/decor `clear_zone_numbers_are_pinned`, `no_footprint_intersects_combat_or_portal_zone`, `low_decor_only_at_edges_and_at_most_twelve`, `shuffled_asset_pool_is_same_layout`, `same_seed_is_repeatable_with_no_run_rng`; kiểm100seed và radius lớn chạm mép, kể cả tall ngoài field. RED BoardRenderer `troop_and_other_built_plots_have_same_paving_without_dirt`; giữ test `deployment.test.ts` và DEPLOY_BOX nguyên.
- [ ] Implement cỏ mở rộng x/y−4096..4864 dạng chunk cull/tái dùng, lấy mẫu world giống field; bỏ đường TileSprite thẳng khác phase khi sampler mới thay thế. Không scale/rotate texture để giả iso, không tạo bitmap toàn miền. Bỏ polygon grassDark ở cả tileArt và fallback vách (không bỏ mặt vách), để lộ cỏ chung cho Q5. Miền nền là presentation, không nới simulation bounds. Giữ water/sand textures/river/pond, vẽ nối đường world y768→792 trên lớp nền cỏ chunk tới chân cổng Q2, liền với đoạn544→768 trong field bằng cùng sampler/phase.
- [ ] Implement FIELD_DECOR số theo spec, footprint exclusions trước free(), low count12 và dải rìa. Bỏ deploy graphics/constants/import DEPLOY_BOX nếu chỉ phục vụ dirt trong BoardRenderer, không sửa game deployment/home/respawn. Đừng xoá lát đá của nhà lính.
- [ ] PASS `npx vitest run src/render/groundModel.test.ts src/render/atlas.test.ts src/render/isoArt.test.ts src/render/decorationModel.test.ts src/render/DecorationRenderer.test.ts src/render/BoardRenderer.test.ts src/data/fieldDecoration.test.ts src/game/battle/deployment.test.ts < /dev/null`; `CHECK(Q4)`: screenshot vùng hai đường đỏ, min zoom/pan4mép/3viewport, không seam/khác tông, chiến trường/cổng trống, nhà lính lát đá, đường qua ranh y768 tới792 liền mạch trên chunk, không khe hở ở chân cổng; restart3lần texture chunk không tích luỹ. Re-run determinism trace Q2 phải giữ nguyên vì Q3/Q4 chỉ presentation.

### Task 7 (Q5): Prompt, hai mẫu và gate art

**Files:** M `docs/art-review/g3e/buildings/make_prompts.py`, `tools/test_art_prompts.py`, `docs/ART_STYLE.md`; C `docs/art-review/iso-board/polish/make_polish_assets.py`, `tools/test_iso_polish_assets.py`, `docs/art-review/iso-board/polish/review.md`; C `docs/art-review/iso-board/polish/{enemy_portal,forest_pine_a,forest_pine_b,forest_rock}/prompt.md`, `source.png`, `native.png` **chỉ trong phiên thực thi art tương ứng**; M HANDOFF. Tham khảo cutter iso-board/make_assets.py, wilds/make_wilds.py và terrain/make_textures.py, không sửa pipeline cũ chỉ để sinh asset mới.

**Interfaces:** mode `polish-samples [enemy_portal|forest_pine_a]`, `polish-forest [forest_pine_b|forest_rock]`; sample mode bắt buộc id, đúng1asset/invocation. Cutter CLI `python docs/art-review/iso-board/polish/make_polish_assets.py <id>` ghi native/review, không tự đăng ký runtime.

- [ ] Python RED `test_polish_sample_is_exactly_one_kind`, `test_polish_prompt_uses_exact_iso_block_and_read_doc_instruction`, `test_polish_runner_attaches_style_and_iso_refs`, `test_forest_batch_refuses_without_approved_pine`, `test_missing_doc_or_reference_refuses_generation`. `python tools/test_art_prompts.py` → FAIL trước thêm mode; không chạy runner tạo ảnh trong test. Test dùng temp directory/mock output để không viết lại prompt thật như một side effect.
- [ ] Implement prompt mode từ `iso_template()`, refs front-style + iso-building/iso-plot, sample cùng loại khi duyệt; không lấy front template hoặc tự viết prompt từ nhớ. Bổ sung ART_STYLE phần cổng/rừng mô tả silhouette/mật độ, không ghi “đã duyệt” trước gate. Prompt không sao chép game tham khảo.
- [ ] Người thực thi đọc lại ART_STYLE mỗi lần tạo ảnh, tạo đúng **1 mẫu cổng** và **1 mẫu thông** bằng hai lần sample riêng, log nguyên prompt/refs/nguồn; native cổng vừa vùng hình spec, thông đọc được cùng nhà/tường ở min và3×. Alpha mép0/255, feet, ánh sáng trên trái, cluster, không blur. Bày review native cạnh mẫu iso đã duyệt và bản code cổng hiện tại.
- [ ] **DỪNG tại gate riêng từng loại:** chủ dự án duyệt cổng/thông trong review.md kèm ngày/bằng chứng. Chưa duyệt thông không tạo pine_b/rock; chưa duyệt cổng không nối portal art. Bị loại chỉ sửa mẫu cùng loại, không cả bộ. Q1–Q4 có thể nghiệm thu riêng, Q5 chưa done.
- [ ] Sau duyệt thông, tạo pine_b và rock, mỗi nhóm review trước adopting; cổng chỉ1asset nên không tạo bộ biến thể không cần. Viết cutter test trước `test_polish_alpha_is_binary`, `test_foot_anchor_and_sizes_match_metadata`, `test_no_rotation_or_soft_resample`, `test_portal_and_forest_frame_names_are_unique`; `python -m unittest discover -s tools -p test_iso_polish_assets.py` → FAIL rồi cutter → PASS. Native size thực ghi theo duyệt, không bịa số đã kiểm. Nếu artwork không đạt silhouette ở min, sửa mẫu trước đăng ký.
- [ ] `python tools/test_art_prompts.py` PASS; ghi duyệt từng asset/native/refs vào review.md và HANDOFF. Chưa nối imageArt/DECOR_APPROVED trong task này.

### Task 8 (Q5): Đăng ký, hậu cảnh rừng và art cổng

**Files:** M `docs/assets.manifest.yml`, `CREDITS.md`, `src/render/imageArt.ts`, `imageArt.test.ts`, `atlas.ts`, `atlas.test.ts`, `DecorationRenderer.ts`, `DecorationRenderer.test.ts`, `FieldRenderer.ts`, `EnemyPortalRenderer.ts`, `EnemyPortalRenderer.test.ts`, `IsoWallRenderer.ts`, `src/data/fieldDecoration.ts`; C `src/render/forestModel.ts`, `forestModel.test.ts`, `ForestRenderer.ts`, `ForestRenderer.test.ts`; C `public/assets/art/ai-v1/iso/polish/{enemy_portal,forest_pine_a,forest_pine_b,forest_rock}.png`; M `docs/art-review/HANDOFF.md`, `docs/ROADMAP.md`, logic-report/review. Audit `src/scenes/PreloadScene.ts` (IMAGE_ART_FILES loader hiện có đủ thì không sửa).

**Interfaces:** C `layoutForest(seed:number,assets:readonly DecorAsset[]):readonly DecorPlacement[]` dùng riêng config forest trong FIELD_DECOR; `ForestRenderer(scene,seed)` + `updateView(view,screen)` + `destroy()`. Phân lớp rừng ở sau đỉnh vách, `EnemyPortalRenderer` lấy frame `doodad_enemy_portal` nếu có, thiếu thì code fallback. atlas thêm getter frame name cho4doodad, không filename trong scene. DecorationRenderer chỉ nhận asset rìa sân cũ, không random portal.

- [ ] Trước runtime: chỉ copy asset đã duyệt và kiểm; ghi manifest category=doodad/origin=custom/projection=iso_2_1/anchor=feet, actual nativeSize/finalSize, notes camera zoom exception; CREDITS nguồn AI/log review đúng thực tế. Kiểm từng path/frame không trùng, không tự gọi tất cả catalog là approved. Đăng ký xong mới sửa imageArt/atlas/renderer.
- [ ] RED forestModel `forest_is_dense_only_north_of_wall`, `forest_uses_own_salt_sorted_assets`, `forest_chunk_boundary_has_no_duplicate`, `forest_jittered_footprint_keeps_24px_wall_gap` (sau jitter y+radius≤152), `forest_does_not_touch_combat_or_portal`, `forest_coverage_reaches_all_valid_north_view_corners`. Thêm RED `forest_config_values_are_pinned` vào src/data/fieldDecoration.test.ts trước sửa data. Config spec§6: x−2048..2816,y−3072..152,grid64,jitter16,occupancy0.72,pine90%/rock10%; không assert tổng count cứng khi asset footprint bị loại. Test thống kê vùng đủ lớn trong khoảng dung sai đã tính trước cho hash, không lấy ảnh tham khảo làm expected.
- [ ] RED renderer `forest_feet_stay_behind_cliff_top`, `forest_never_occludes_front_board`, `portal_art_and_fallback_share_world_anchor`, `missing_png_is_safe`, `forest_and_ground_cleanup_after_three_restarts`, `world_atlas_stays_below_4096_and_has_named_doodad_frames`. `npx vitest run src/render/forestModel.test.ts src/render/ForestRenderer.test.ts src/render/EnemyPortalRenderer.test.ts src/render/imageArt.test.ts src/render/atlas.test.ts src/data/fieldDecoration.test.ts < /dev/null` → FAIL trước implement (không vì dùng asset chưa có phép).
- [ ] Implement rừng theo chunks+cull/pixelHash riêng, không per-frame sinh lại toàn miền; toạ độ plateau render nâng theo mặt vách, clip phía sau đỉnh; không dùng depth foot lớn khiến cây hậu cảnh đè quân. Dùng feet/y-sort trong layer hậu cảnh, tường phía trước layer đó. Xoá mọi lớp fill phẳng còn che rừng. Portal hình tại tâm data, miệng nhìn ra bắc world, quân sinh đúng vị trí Q2; art không làm đổi spawn.
- [ ] PASS focused + `python tools/test_art_prompts.py` + `python -m unittest discover -s tools -p test_iso_polish_assets.py`; `CHECK(Q5)`: vùng X thành rừng thông dày trên cỏ, vách rõ, không cây che nhà/cổng, không sao chép art/UI tham khảo, missing PNG fallback, atlas size và texture count sau3restart. Kiểm zoom min/3× trên3viewport, native và zoom lẻ; console sạch.
- [ ] Kiểm cuối so trace Q2 (Q3–Q5 không đổi sim), fullRun/resume, review5–7điểm ở trên; logic-report ghi bảng baseline/Q1/Q2 với số chạy thật và nguồn raw, không cân bằng lại. HANDOFF/ROADMAP mô tả phần hoàn tất và hạn chế còn thật. Chỉ hoàn tất khi art cả2loại đã duyệt và runtime nghiệm thu; không tự merge PR#13.

## Rủi ro và cách quyết định khi kiểm không đạt

- Portal lặp25slot có thể làm separation/splash đắt hoặc dồn quân mạnh: đo tại Task3, giữ caps/tick/stats, báo số đo để chủ dự án quyết định thiết kế tiếp; không thêm drip queue ngầm.
- Ưu tiên toàn sân có thể khiến trận kéo dài, boss yếu đi vì mud hoãn và chain ưu tiên lính; splash/cleave/cone giữ sát thương kèm lên nhà như cũ; ghi win/year/boss/ticks trước–sau, không sửa HP/damage/rageTick/limit để làm đẹp báo cáo.
- Zoom lẻ không thể đảm bảo mỗi pixel nguồn có cùng bề rộng màn hình; nearest và translation snap chỉ bỏ blur/drift, cần owner xem ảnh thật. Không revert về integer vì thấy pixel không đều.
- Camera65% chiếm chỗ panel cũ; test collapse theo bbox, không thu bàn xuống mức screenshot cũ để giữ panel. Mobile ưu tiên vùng chạm và pan, không ép vừa ngang.
- Rừng plateau và chunk nền dễ sai depth/phase hoặc leak; test sampler/cull/cleanup và screenshot pan tới4mép. PNG thiếu không làm hỏng ván; art chưa duyệt không được runtime tự fallback sang nguồn chưa đăng ký.

## Câu hỏi mở

Không có câu hỏi cần mở lại bảy quyết định của chủ dự án. Gate Q5 còn chờ duyệt sản phẩm mẫu cổng/thông, rồi bộ native; hash, timing, cân bằng và kích thước native cuối sẽ được ghi sau chạy/duyệt thật. Chưa có số đo trong tài liệu này.
