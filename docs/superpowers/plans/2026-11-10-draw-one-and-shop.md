# Rút một lá và Mua thẻ: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giữ tay qua năm, rút 1/2 lá theo lịch, bắt buộc chơi/bán tới ngưỡng rồi tự vào trận; thêm Mua thẻ, camera PC mới, đạn từ mái và âm lượng 0,25; cân bằng lại 9 vua.

**Architecture:** Helper thuần trong `src/game/run` quyết định số rút, target và shop, số gameplay trong `src/data`. Controller/headless ưu tiên bước `startBattle`, shop dùng stream riêng và save v8. UI chỉ đọc state/phát intent; điểm bắn và camera không chạm mô phỏng trận.

**Tech Stack:** TypeScript strict, Vitest, Phaser 4, Vite; Python unittest cho tools.

**Spec:** `docs/superpowers/specs/2026-11-10-draw-one-and-shop-design.md`

## Global Constraints

- `RUN.handSize = 5` cho năm 1; năm 2+ thêm `RUN.yearDraw = 1`, bonus `RUN.bonusYearDraw = 2` tại 5/10/11/15/20/21/25. OR không cộng đôi; giữ bài cũ, không recycle cả tay không chơi được. Các mốc tuyệt đối cũng dùng trong Vô tận, không tự thêm 31/35/41.
- `RUN.battleHandMax = 2`; target 0 chỉ normal/full/years 30/year 30, lấy 30 từ RULES_FULL.years. Tay thiếu 0/1/2 vào ngay (final 0 vẫn bán hết). Không nút/phím chờ Ra trận, mọi rules/save `autoStart: false` đều tự vào.
- Đề xuất `DECREE_RULES.hand = 1` nghĩa rút thêm 1 mỗi năm, không tối đa 6; reroll giữ số lá trước lệnh, giá cũ và chặn `alreadyPlayed`. Thanh Lọc vẫn phải giữ 5 bản.
- Shop `RUN.shopBaseGold = 5`, đề xuất `RUN.shopStepGold = 3`; counter về 0 mỗi startYear. Bốc đều own king.cards sorted id, cho trùng, không Ngai/neutral/conquest-only. Append đúng 1 bản vào deck và hand.
- `RUN_SAVE_VERSION`7 → 8; counter `shopPurchasesThisYear` nguyên an toàn ≥ 0, `rng.shop` uint 32 từ hashSeed với salt `${seed}:shop`; migrator+fixture bắt buộc. Không đổi meta/envelope 1/IndexedDB schema.
- `src/game|data|core` thuần deterministic, không Phaser/UI/render/platform/audio/scenes; data không game. Không Math.random/Date.now/performance.now/trig/log/exp/pow/`**`; RNG qua Rng, sort id khi thứ tự ảnh hưởng kết quả. Mọi số gameplay ở data.
- PC ≥ 768: min=legacyOverviewZoom/1,6, max=legacyOverviewZoom trước thay đổi, camera context tay 5 cố định; đoạn tâm ngang giữ 60% quanh midpoint sau clamp cũ. Phone min 33/32/max 3 và pan cũ. Normal 1280×720 planning max 1,19375/min 0,74609375, battle max 1,3/min 0,8125.
- Thẻ PC 148×208, gap 12; tay dài cuộn ngang, không tối đa 6/không co PC. FONT_UI, createPanel/createButton, mục tiêu ≥ 44×44, layout resize, reset fields khi scene create lại.
- Điểm bắn render nhà ở 80% chiều cao frame đã scale tính từ chân BUILDING_FOOT_DY, nội suy về offset 6 ở đích; lính offset 6 giữ. Không sửa combat coordinates/world/setup/hash.
- `MASTER_OUTPUT`0,5 → 0,25, không sửa slider đã lưu. Giữ rage 600/step 300/+25%, hardLimit 3000 = thua, không thắng vì giờ; wounded bar công trình giữ nguyên.
- Greedy RULES_FULL/Gai 0/500 seed mỗi vua:35–65% mỗi vua, spread ≤ 15 điểm %. Không bịa số hay hạ ngưỡng.
- Không sinh art mới. Cây/đá, can thiệp riêng vua, wiki 9 Kings và tối ưu/bố cục mobile nằm Để sau, không task. Nếu mở art sau này phải theo ART_STYLE/reference/mẫu duyệt/log/manifest/CREDITS.
- Phiên tài liệu chỉ sửa đúng spec/plan, không chạy node/npm/npx, không commit. Mọi lệnh dưới đây dành cho phiên triển khai, chưa được chạy trong phiên viết plan.

## Review Focus

Năm tình huống mới chưa có assertion chuyên biệt trong các test đã đọc; gắn test mới vào task sở hữu:

1. V7 giữa năm `played=true`, tay 2/full `autoStart: false` và buy chờ sẵn: không rút lại/mua thoát ngưỡng, chỉ 1 runner sau checkpoint — Task 2/4 `v7_ready_planning_kickoff_starts_once_before_queued_buy`.
2. Trả lời quest khi piles cạn/tay không lá nào có đích: giữ lá, rút tối đa, không rút/RNG lặp, tự đánh khi ≤ target — Task 1/2 `quest_short_deck_draws_once_and_keeps_unplayable_carry`.
3. Full 30 và Endless 30 đều tay 2 không có đích: full phải bán 2, Endless vào ngay — Task 2 `full_final_zero_is_not_endless_year_thirty`.
4. Mua liên tiếp rồi reload/reroll qua năm bonus: đa tập đúng, giá/shop RNG nối tiếp, draw không bị mua tiêu thụ, không bù 5 — Task 3/4 `shop_reload_reroll_bonus_year_preserves_piles_and_streams`.
5. Resize 768 → 767 lúc PC zoom sát max rồi đổi phase/mode 7×7: clamp cả hai limits, inverse hit/snap đúng và không pan bắc wall — Task 6 `desktop_phone_resize_reclamps_both_limits_and_hit`.

---

## Bản đồ file và cổng phase

Không tạo module deck mới: `refillHand` ở `src/game/run/deck.ts`. `run/decrees.ts` sở hữu số rút, `run/turn.ts` sở hữu target, module mới `run/shop.ts` sở hữu giá/pool/legality. `render/projectileModel.ts` chỉ toán hiển thị; `ui/planning/handLayoutModel.ts` mới sở hữu cửa sổ cuộn bài.

Mỗi task game/data: test có tên/assertion trước → chạy đỏ vì assertion mới → code tối thiểu → cùng lệnh xanh. Không đổi expected hash làm bước code. UI/render kiểm helper và trình duyệt.

**Gate G cuối từng Phase 1/2/3/4** là `npm run lint && npm run typecheck && npm test && npm run build`, cộng Python. Trên Git Bash Windows dùng đúng:

```bash
npm run lint < /dev/null && npm run typecheck < /dev/null && npm test < /dev/null && npm run build < /dev/null
python -m unittest discover -s tools -p "test_*.py"
```

Cả hai phải exit 0. Phase 3 có UI kiểm browser 1280×720; Phase 4 kiểm lại tích hợp UI 1280×720. Các npm riêng ở task cũng đóng stdin. Không phát hành ở phase trung gian.

**Baseline trước gate:** mọi phase làm thay đổi trace phải thực hiện thủ tục baseline Task 9 tại revision của phase đó rồi mới chạy Gate G; ghi lại riêng sau tuning Phase 4. Không để test baseline đỏ đến cuối, skip test hoặc tuyên bố gate đạt khi chưa chạy. Mỗi lần ghi phải giải thích thay đổi luật/cân bằng và không gộp sửa mã riêng Endless.

## Phase 1 — Rút bài, bắt buộc dùng và tự vào trận

### Task 1: Số rút, giữ tay, sắc lệnh và reroll

**Modify:** `src/data/run.ts`, `src/data/decrees.ts`, `src/game/run/decrees.ts`, `src/game/run/flow.ts`, `src/game/run/commands.ts`, `src/scenes/PlanningHudScene.ts` (caller handLimit tối thiểu để compile).
**Test:** `src/data/run.test.ts`, `src/game/run/decrees.test.ts`, `src/game/run/flow.test.ts`, `src/game/run/yearFlow.test.ts`, `src/game/run/quests.test.ts`, `src/game/run/commands.test.ts`, `src/game/run/deck.test.ts`, `src/game/run/council.test.ts`, `src/ui/modals/councilModel.test.ts`.
**Read:** `src/game/run/deck.ts`, `src/game/run/quests.ts`, `src/game/run/council.ts`.

**Interfaces:** `yearDrawCount(state: Pick<RunState,'year'|'decrees'>): number` trong decrees.ts, trả 5 ở năm 1 cộng bonus decree nếu fixture đã có; năm sau 1/2 cộng decree. Bỏ `handLimit`, cập nhật callers. `refillHand` giữ signature/ý nghĩa size là đích tổng; purge min deck vẫn 5.

Để kiểm trường hợp giao nhau chưa có trong lịch hiện tại, xuất helper thuần `isBonusDrawYear(year: number, councilYears: readonly number[], bossYears: readonly number[]): boolean` trong decrees.ts; yearDrawCount truyền hai arrays từ RUN. Test year 11 với councilYears chứa 11 và bossYears 10/20/30 phải true một lần, không mutate data.

- [ ] Viết `first_year_has_five_cards`, `draw_one_keeps_two_carried_cards` (year 2 tay 2 → 3, đúng 1 lá đầu drawPile, thứ tự giữ), `council_or_post_boss_draw_is_two` (table 4/5/10/11/15/20/21/25/30/31/35/41), `overlapping_bonus_is_not_additive` (test điều kiện OR với input lịch có giao nhau, không mutate global constants; tách helper nhận arrays nếu cần).
- [ ] Viết `fourth_hand_adds_one_to_annual_draw` (base 1 → 2, bonus 2 → 3, năm 1 fixture có decree 5 → 6), `enacting_fourth_hand_does_not_draw_immediately` (council sau trận, năm sau mới tăng). Kiểm text mới, purge min 5 không đổi.
- [ ] Viết Review Focus 2 `quest_short_deck_draws_once_and_keeps_unplayable_carry`: quest pending draw, giữ lá không đích, rút phần còn lại, gọi finishYearStart lần 2 không đổi piles/RNG; cả hai piles rỗng không treo. Deck test giữ xáo deterministic/đa tập.
- [ ] Viết `reroll_preserves_current_hand_count_after_purchase_or_bonus`: tay 3/4/7 rút lại đúng 3/4/7; giữ `alreadyPlayed` sau play/discard và giá cũ. Reroll không cấp lại bonus/decree của năm.
- [ ] Chạy đỏ: `npm test -- src/data/run.test.ts src/game/run/decrees.test.ts src/game/run/flow.test.ts src/game/run/yearFlow.test.ts src/game/run/quests.test.ts src/game/run/commands.test.ts src/game/run/deck.test.ts < /dev/null`.
- [ ] Implement data, helper OR/decree; flow refill tới hand.length+count, bỏ recycle no-playable; reroll target=hand.length trước bỏ tay. Cập nhật comment/text cũ. PlanningHud caller handLimit tạm dùng slot tay thực, phần trình bày do Task 5 sở hữu.
- [ ] Chạy lại xanh lệnh trên và `npm test -- src/game/run/council.test.ts src/ui/modals/councilModel.test.ts < /dev/null`.

### Task 2: Target 0/2 và auto-start ưu tiên chung controller/headless

**Modify:** `src/game/run/turn.ts`, `src/game/run/commands.ts`, `src/game/run/RunController.ts`, `src/data/rules.ts`, `src/game/sim/headless.ts`, `src/ui/planning/fightRule.ts` (mở Pick để compile với predicate mới; Task 5 bỏ manual UI).
**Create test:** `src/game/run/turn.test.ts`.
**Modify tests:** `src/game/run/commands.test.ts`, `src/game/run/RunController.test.ts`, `src/game/run/RunControllerPersistence.test.ts`, `src/game/sim/headless.test.ts`, `src/platform/session.test.ts`, `src/platform/resumeIntegration.test.ts`.

**Interfaces:** `battleHandTarget(state: Pick<RunState,'mode'|'rules'|'year'>): number`; `canStartBattle(state: Pick<RunState,'mode'|'rules'|'year'|'phase'|'hand'|'yearStartPendingDraw'|'offers'|'pendingOffers'>): boolean`. `startBattle` giữ làm bước nội bộ có `handTooBig`; UI không dựng trận.

- [ ] Test `full_final_zero_is_not_endless_year_thirty`: normal/full 30 target 0, endless 30/60 target 2, full 29/G1/G2 cuối target 2; hand 0/1/2/3; pending draw/offer/queue thì false.
- [ ] Test `final_year_unplayable_cards_can_all_be_sold`: final 2 → 1 → 0, mỗi bán+2, chỉ 0 startBattle; nonfinal 3 → 2 auto. Khi ready, reducer từ chối play/discard/reroll/unlockPlot/freeMove bằng wrongPhase; tay 3 vẫn nhiều hành động, reroll chỉ chặn played.
- [ ] Test `full_and_endless_auto_start_even_when_saved_autoStart_false`, `kickoff_twice_has_one_runner`: kickoff ≤ 2 chạy, >2 không; quest/advance rút xong mới xét; resume battle tick 0 giữ speed. Kết nối Review Focus 2 từ test flow đến controller.
- [ ] Test delayed persistence `ready_sale_is_checkpointed_then_battle_before_queued_buy`: trước có buyCard dùng queued unlockPlot, Task 3 thay bằng buy thật. Thứ tự sale checkpoint → battle checkpoint → battle:started, stale command wrongPhase; whenIdle đợi cả auto, không double runner/deadlock. Không enqueue auto sau các UI command đang chờ.
- [ ] Test headless `ready_hand_starts_before_bot_is_called`: bot fixture throw nếu được hỏi khi ready; onCommand vẫn ghi startBattle rồi simulateBattle thật. Deck cạn không vòng lặp; full 30 và endless horizon qua 30 đúng target.
- [ ] Chạy đỏ: `npm test -- src/game/run/turn.test.ts src/game/run/commands.test.ts src/game/run/RunController.test.ts src/game/run/RunControllerPersistence.test.ts src/game/sim/headless.test.ts < /dev/null`.
- [ ] Implement presets `autoStart: true`, controller không phụ thuộc flag từ save; xử lý auto trong chuỗi ưu tiên trước next queued command (không await chính queue). Guard ready ở reducer, giữ setAutoFire hợp đồng cũ. Headless chọn startBattle trước gọi bot, vẫn qua apply/onCommand. Không đưa persistence vào helper.
- [ ] Sửa fixture/helper sellDown theo battleHandTarget và phase; không ép mọi fixture tay 0 để né case 2. Test play ở tay ≤ 2 cũ cần setup đủ 3, final case setup 1; giữ assertions nhiều hành động.
- [ ] Verify cùng lệnh xanh và `npm test -- src/platform/session.test.ts src/platform/resumeIntegration.test.ts < /dev/null`. Thực hiện bước baseline trung gian Task 9 có nguồn, Gate G cuối Phase 1. Nếu bot/scorer cũ bị guard mới làm lỗi, đưa sửa hợp lệ tối thiểu từ Task 8 vào phase này; không hoãn một failure tới Phase 4 rồi đóng gate.

## Phase 2 — Mua thẻ, RNG và Save 8

### Task 3: Lệnh buyCard, pool và giá

**Create:** `src/game/run/shop.ts`, `src/game/run/shop.test.ts`.
**Modify:** `src/data/run.ts`, `src/game/run/state.ts`, `src/game/run/yearFlow.ts`, `src/game/run/commands.ts`, `src/ui/realm/calendarModel.ts` (IllegalReason text), `src/game/testing/fixtures.ts`.
**Tests:** `src/data/run.test.ts`, `src/game/run/commands.test.ts`, `src/game/run/yearFlow.test.ts`, `src/game/run/quests.test.ts`, `src/game/run/RunControllerPersistence.test.ts`, `src/ui/realm/calendarModel.test.ts`.

**Interfaces:** `shopPrice(state: Pick<RunState,'shopPurchasesThisYear'>): number`; `shopPool(state: Pick<RunState,'kingId'>, content: Content): CardId[]`; `buyCardIllegal(state: RunState, content: Content): IllegalReason | null`. RunCommand thêm buyCard, IllegalReason thêm noShopCards. Thêm `'shop'` vào union `RngStream` trong `src/game/run/state.ts` (hiện là `'draw' | 'reward' | 'calendar' | 'council' | 'quest' | 'blessing'`) và cập nhật mọi chỗ codec/migrate liệt kê các luồng. Task 4 sở hữu codec/migration.

- [ ] TDD `shop_prices_are_five_eight_eleven`, `buy_card_appends_once_to_deck_and_hand`, `shop_only_samples_sorted_own_king_cards` (đảo order registry vẫn giống; trùng được; không Ngai/neutral/conquest-only), `buy_does_not_mark_play_or_quest_reroll`.
- [ ] TDD `failed_purchase_is_atomic`: thiếu vàng, wrong phase, ready, pool rỗng; input/gold/counter/all RNG nguyên, đúng error. `shop_advances_only_shop_stream`: draw/reward/calendar/council/quest/blessing byte-identical, cùng seed/lệnh cùng card. Không hứa deck thêm bản không đổi mọi shuffle tương lai.
- [ ] TDD `shop_counter_resets_only_at_start_year`: mua 2 giá kế 11, cùng năm reload/answerQuest không reset, năm sau 5. `purchase_before_last_sale_is_allowed_but_after_ready_is_refused`: tay 3 mua → 4, bán → 3 → 2 auto; final tay 1 mua được, tay 0 không. Nâng delayed queue test Task 2 bằng buyCard thật.
- [ ] Chạy đỏ `npm test -- src/game/run/shop.test.ts src/game/run/commands.test.ts src/game/run/yearFlow.test.ts src/game/run/quests.test.ts src/game/run/RunControllerPersistence.test.ts < /dev/null`.
- [ ] Implement hằng 5/+3, newRun init counter 0/shop hash, startYear reset 0; buy transaction clone, sort pool/Rng.shop, append 1 bản deck+hand, không cardPlayed/goldEarned/played. Thêm text noShopCards tiếng Việt. Không dùng rollOffers/draw. Nếu exhaustive quest union cần mở thì chỉ thêm no-op buy, không tăng reroll progress.
- [ ] Verify lệnh trên và data/calendarModel tests xanh. State v8 và codec phải tích hợp Task 4 ngay trước Gate Phase 2.

### Task 4: Migrator 7 → 8, decoder kín và reload

**Modify:** `src/game/save/migrate.ts`, `src/game/save/codec.ts`, `src/game/save/migrate.test.ts`, `src/game/save/codec.test.ts`, `src/game/save/endlessCodec.test.ts`, `src/platform/resumeIntegration.test.ts`, `src/game/run/RunControllerPersistence.test.ts`.
**Create fixture:** `src/game/save/drawOneV7Fixture.ts` (literal v7 thật, không cast newRun v8 rồi bỏ sót field).

**Interfaces:** migrateRunState nối 7 → 8 pure; decodeRun giữ ok/empty/incompatible. V8 counter safe integer ≥ 0, shop uint 32; envelope version/state trước migrate vẫn phải khớp. Không đổi format/meta/db.

- [ ] Test `migrate_v7_midyear_keeps_hand_played_offers_and_old_rng`: fixture planning playedtrue/tay 3 và 2, quest pendingDraw, council/pendingReward, endless 31 và battle. Thêm counter 0/shop hash, giữ mọi field cũ, gọi 2 lần không mutate/rút thêm. Kiểm chuỗi 3 → 4 → 5 → 6 → 7 → 8 đúng normal/endless.
- [ ] Test `v8_rejects_invalid_shop_counter_or_rng`: thiếu/âm/phân số/unsafe/NaN/Infinity, shop ngoài uint 32; deck mismatch/id lạ từ chối dù hash khớp, hash khác/id hợp lệ vẫn nhận. Không decoder repair field mới của v8.
- [ ] Review Focus 1 `v7_ready_planning_kickoff_starts_once_before_queued_buy`: full `autoStart: false` tay 2 migrate/kickoff không rút, battle checkpoint trước runner, buy chờ bị từ chối. Full 30 tay 2 còn phải bán, endless 30 tay 2 vào ngay; battle resume tick 0/setup nguyên, không dùng shop RNG.
- [ ] Review Focus 4 `shop_reload_reroll_bonus_year_preserves_piles_and_streams`: mua 2 → encode/decode → mua 3 cùng card/giá với chạy liền; reroll cùng số lá; quest/bonus/startYear không rút 2 lần, đa tập đúng từng checkpoint, old streams/shop nối tiếp.
- [ ] Chạy đỏ `npm test -- src/game/save src/platform/resumeIntegration.test.ts src/game/run/RunControllerPersistence.test.ts < /dev/null`.
- [ ] Implement 7 → 8/validators, default chỉ ở migrator, không production fallback v8 thiếu field. Giữ phase/tay/piles/played/offers/pendingDraw và rulesautoStart cũ; controller Task 2 xử lý flag cũ. Không tự rút lại v7 giữa năm.
- [ ] Chạy lại xanh, baseline trung gian Task 9 nếu trace đổi, Gate G cuối Phase 2.

## Phase 3 — Giao diện, zoom/pan, đạn và âm lượng

Trước code Phaser đọc `.agents/skills/v3-to-v4-migration/SKILL.md`, rồi scenes/input/text/cameras/sprites phù hợp, kiểm signature `node_modules/phaser/types/phaser.d.ts`.

### Task 5: Chuẩn bị tự đánh, nút mua và tay cuộn

**Modify:** `src/scenes/PlanningHudScene.ts`, `src/scenes/RealmScene.ts`, `src/ui/realm/realmLayout.ts`, `src/ui/realm/realmLayout.test.ts`, `src/ui/planning/HandView.ts`, `src/ui/planning/fightRule.ts`, `src/ui/planning/fightRule.test.ts`, `src/ui/help/mechanics.ts`.
**Create:** `src/ui/planning/handLayoutModel.ts`, `src/ui/planning/handLayoutModel.test.ts`.
**Read/kiểm hồi quy:** `src/ui/planning/cardFlyModel.ts`, `src/scenes/audioCues.ts` và tests cạnh chúng.

**Interfaces:** `handWindow(screen: Size, count: number, scrollX: number): { viewport: Rect; cards: Rect[]; scrollMax: number }` trong handLayoutModel; PC 148×208/gap 12, viewport chừa controls, clamp scroll. HandView thêm `ensureSlots(count: number): void`, giữ click/drop index theo tay. `fightRule.ts` bỏ canFight/manual callers, đổi sang `planningHint(state: RunState): string` đọc battleHandTarget.

- [ ] Test `planning_hint_uses_final_target`, `desktop_hand_window_keeps_148_by_208_for_twelve_cards`, `all_bought_cards_are_reachable_by_scrolling`, `shop_controls_are_44px_and_clear_hand`:1280×720 tay 3/5/6/12/0, không co PC. Phone giữ sizing/co hàng cũ, buy dùng vị trí fight cũ, không thiết kế lại mobile.
- [ ] Chạy đỏ `npm test -- src/ui/planning/handLayoutModel.test.ts src/ui/planning/fightRule.test.ts src/ui/realm/realmLayout.test.ts < /dev/null`.
- [ ] Implement nút “Mua thẻ · {price} vàng”, disabled/reason từ shop helper, intent buyCard. Bỏ nút/listener/phím Ra trận và handWithFight/fightOver khỏi đường dùng. Giữ confirm đặt bài/mua ô. Help sửa rút bù/tự bấm, ghi rút 1/bonus và bán tới 2/final 0 theo spec.
- [ ] HandView tăng slots có cleanup, giữ theme/selection/drop lá mới; reset scroll/selection khi create scene tái dùng; cuộn không kích play/drop/pan map, modal không click xuyên. setHand theo tay thật, không handLimit. Mua không phát cardFly lên plot hoặc tiếng chơi thẻ; giữ mô hình cardPlayed hiện có.
- [ ] Verify test xanh, browser 1280×720: năm 1 dùng 5 → 2 tự đánh, năm 2 thêm 1, mua 5/8/11/thiếu vàng, mua>6 rồi cuộn/kéo/bán lá cuối; full 30 bán bài vô dụng → 0, reload giữ giá, phím không giữ planning ở 2. Console sạch, không chữ đè/hitbox nhỏ. Phone chỉ smoke control cần thiết, không mở việc tối ưu/bố cục mới.

### Task 6: Khoảng zoom PC và pan ngang

**Modify:** `src/ui/realm/realmLayout.ts`, `src/ui/realm/cameraModel.ts`, `src/scenes/RealmScene.ts`, `src/ui/realm/realmLayout.test.ts`, `src/ui/realm/cameraModel.test.ts`.

**Interfaces:** `legacyOverviewZoom` cùng signature overviewZoom hiện tại; giữ nguyên formula width 0,65/height fit/floor 0,25/cap 3 trước thay đổi. `zoomLimits(screen,phase,mode)` trả maxlegacy(contexthand 5 PC), minmax/1,6; phone như cũ. Để phần tính zoom trong realmLayout, cameraModel delegate, tránh circular import mới.

- [ ] TDD `desktop_zoom_limits_reference_legacy_overview`:1280×720 planning 1,19375/battle 1,3, min÷1,6; endless riêng width 896/height 448; screens 768/1280/1920×1080, hand 5/12 không làm min nhảy. Không lấy ZOOM_MAX 3 làm maxPC.
- [ ] TDD `horizontal_centre_interval_is_sixty_percent`: so `[lo,hi]` cũ cùng zoom/cy, midpoint giữ/length×0,6; đoạn 0 và lo>hi fallback hữu hạn, y/wall giữ. Không thu WORLD_BOUNDS vuông trước chiếu.
- [ ] Review Focus 5 `desktop_phone_resize_reclamps_both_limits_and_hit`:767/768, normal/endless, wheel/pinch/keep/resize/phase mix trong limits; phone min 33/32/max 3/pan cũ. Roundtrip worldToScreen → plotAtView qua snapView đúng corner 49 ô, tâm không bắc wall, cổng tới được.
- [ ] Chạy đỏ `npm test -- src/ui/realm/cameraModel.test.ts src/ui/realm/realmLayout.test.ts < /dev/null`.
- [ ] Implement overview min mới/max cũ, thu đoạn tâm sau clampRect+wall chỉ PC. Resize view thủ công cũng clamp cả zoom (code cũ chỉ clamp rect). realmCamera/realmCameraMix không bypass; phát realm:view mỗi frame theo snapView hiển thị, input inverse đúng view. Không sửa project/unproject/save.
- [ ] Verify xanh, browser 1280×720 normal/endless: mở ván min, wheel max cũ, pan hai biên/cổng, đổi pha/resize giữ tâm hợp lệ; nền không hở/rung, aim/card đúng. Smoke 767 → 768, chụp ảnh so vùng nhìn rộng 1,6 lần; không sửa geometry gameplay để che camera.

### Task 7: Điểm vẽ đạn và gain 0,25

**Create:** `src/render/projectileModel.ts`, `src/render/projectileModel.test.ts`.
**Modify:** `src/render/FxRenderer.ts`, `src/data/settings.ts`, `src/audio/AudioManager.test.ts`.
**Read/không đổi mô phỏng:** `src/game/battle/combat.ts`, `src/render/UnitRenderer.ts`, `src/render/imageArt.ts`, `src/render/atlas.ts`, `src/render/BoardRenderer.ts`, `src/render/isoView.ts`.

**Interfaces:** `projectileVisualHeight(sourceHeight: number, travelled: number, remaining: number, isStructure: boolean, footDy: number): number`: H đã scale, nhà nội suy cao 0,8 H từ chân về ground−6, caller tính BUILDING_FOOT_DY vào offset nguồn; unit luôn 6. Không import Phaser/world mutable trong helper.

Cụ thể caller truyền footDy=BUILDING_FOOT_DY cho nhà,0 cho lính; với t clamp travelled/(travelled+remaining), nhà trả `(0.8 * sourceHeight - footDy) * (1 - t) + 6 * t`, đặt y=iso(point).y−height. Tổng khoảng cách 0 chọn t=1. Không trừ footDy thêm lần nữa trong caller.

- [ ] Test `structure_projectile_starts_at_upper_eighty_percent`, `visual_offset_fades_to_six_at_target`, `unit_shot_keeps_six_pixel_offset`, `zero_distance_and_compacted_pool_source_are_finite`: nhiều H/scale, đầu/giữa/cuối, nguồn chết vẫn resolve label, index pool đổi không cache sai. Nếu helper chưa phủ source resolution, thêm adapter test của renderer.
- [ ] Audio test `master_output_is_quarter_for_existing_profiles`: MASTER_OUTPUT 0,25, master 100 → 0,25/master 50 → 0,125, music/sfx nhân riêng, mute 0; sửa literal 0,5 và mô tả halved cũ. Chạy đỏ `npm test -- src/render/projectileModel.test.ts src/audio/AudioManager.test.ts < /dev/null`.
- [ ] Implement frame height texture thực × imageFrameScale × ISO_SPRITE_SCALE cùng UnitRenderer, không h 99 chung từ imageArt; tiến độ từ travelled/remaining của điểm render đã nội suy, không cache pool index. Giữ source unit, boulder intervention và hit. Chỉ đổi settings hằng 0,25, không sửa hồ sơ.
- [ ] Verify xanh; `npm test -- src/game/battle/determinism.test.ts src/game/battle/combat.test.ts < /dev/null`. Cùng BattleSetup cố định trước/sau sync renderer phải cùng hash/hit tick, không dùng run trace đổi luật để chứng minh render. Browser 1280×720 tháp cao/thấp/Ngai/cả hai phe/ảnh/fallback bắn từ mái, nguồn chết đạn không giật; nghe slider/mute sau pointer. Baseline nếu trace đổi theo Task 9; Gate G cuối Phase 3.

## Phase 4 — Bot, cân bằng, baseline và ROADMAP

### Task 8: Bot tuân target, dùng shop hữu hạn và rà Arcane

**Modify:** `src/game/sim/bots/greedy.ts`, `src/game/sim/bots/random.ts`, `src/game/sim/bots/scripted.ts`, `src/data/balance.ts`, `src/data/kings/arcane.ts` (theo đo).
**Tests:** `src/game/sim/bots/greedy.test.ts`, `src/game/sim/bots/random.test.ts`, `src/game/sim/bots/scripted.test.ts`, `src/game/sim/headless.test.ts`, `src/game/sim/fullRun.test.ts`, `src/game/sim/endless.test.ts`, `src/game/sim/endlessOrchestration.test.ts`. Nhánh hiện tại dùng greedyBot cho Endless, không có `bots/endless.ts`; không tạo bot trùng chỉ vì plan Endless cũ từng nêu tên đó.
**Create test:** `src/game/run/arcaneFrontline.test.ts` nếu thay đường tạo frontline.

**Interfaces:** Bot signature giữ nguyên; headless auto trước bot. Chiến lược đề xuất để bắt đầu đo: data `GREEDY_MAX_SHOP_PURCHASES = 2`, `GREEDY_SHOP_RESERVE = 4`. Trước chơi lá cuối để chạm target, greedy mua nếu gold−price ≥ reserve/counter<cap và có ít nhất 1 own card legal play gain>0 trên bàn; không peek shop RNG. Random cap 2/năm, chance 1/4 mỗi decision khi đủ vàng/hand>target, số ở data. Scripted không mua làm đối chứng. Các số bot được tune và ghi báo cáo, không thay luật shop để bot dễ thắng.

- [ ] TDD `bots_do_not_play_or_buy_at_ready_target` cho 3 bot/full 30/endless 30, hand 3 → 2, final xuống 0; mọi lệnh apply hợp lệ. `greedy_shop_is_bounded_and_does_not_peek_shop_rng`, `random_shop_cap_and_seed_are_deterministic`, `scripted_is_shop_free_control`; fallback bán khi hết chỗ, không vòng mua/bán.
- [ ] TDD reward scorer: `offer_value_remains_meaningful_with_ready_guard`. `offerValue` hiện probe phaseplanning/handmột lá; guard ready có thể vô hiệu mọi lựa chọn. Đánh giá trên probe đủ>target hoặc tách đánh giá play thuần, không mở bypass reducer production. Nếu lỗi này chặn Gate Phase 1, sửa tối thiểu ngay Task 2 rồi hoàn thiện ở đây.
- [ ] Chạy đỏ `npm test -- src/game/sim/bots src/game/sim/headless.test.ts < /dev/null`; implement theo target helper, deterministic ties; đường Endless iterate state.plots.length thay PLOTS 25, delegation không thiếu blessing.
- [ ] Rà Arcane trước chỉnh: own troop `arcane_apprentices`, `arcane_frost_mages`, `arcane_archmage` chỉ sinh quân xa; `arcane_ward` khiên; construct đã có HP 90/armor 0,1/range 2 nhưng chỉ enemyRoster. Đo Arcane Task 9, xem frontline và hạn chế greedy bỏ qua shield/slow/chain. Đề xuất đầu tiên tái dùng construct qua thẻ sẵn có, không art/id mới; chọn thẻ/số theo đo và ghi lý do, không khẳng định thiếu định nghĩa unit.
- [ ] Nếu đổi data, viết đỏ `arcane_frontline_is_accessible_from_owned_card` (registry own card sinh construct/setup đúng level/count), `arcane_frontline_respects_enchants_caps_and_enemy_roster` (unitCount/level/armor đúng, không buff foe 2 lần), rồi mới sửa data/textVi. Nếu không đổi thẻ phải ghi dữ liệu chứng minh giải pháp chiến lược hiện hành đủ; không tạo test khẳng định đường spawn chưa tồn tại.
- [ ] Verify bots/headless xanh; fullRun 9 vua và Endless qua 40 bằng trận thật/horizon hữu hạn; cùng seed 2 lần trace/state/setup giống. Không fake results hoặc tăng maxCommands/hardLimit để qua. Các lần mua bot phải hữu hạn vì data cap, không do đổi luật người chơi.

### Task 9: Đo/tune, baseline có nguồn, báo cáo và ROADMAP

**Modify theo đo:** `src/data/battle.ts` (`ENEMY_STAT_MULT`…), `src/data/scaling.ts`, `src/data/kings/arcane.ts`, `src/data/balance.ts`; tests cạnh data/luật sửa.
**Read:** `tools/balance.ts`, `src/game/sim/balance.ts`, `src/game/sim/stats.ts` (seeds 1..N/RULES_FULL, CSV/onTarget đã có; không đổi công thức để đạt).
**Modify:** `src/game/run/endlessCompatibility.test.ts`, `docs/ROADMAP.md`.
**Create tại phiên triển khai:** `docs/balance/2026-11-10-draw-one-balance.md`.

- [ ] Đo trước tune sau luật/shop/bot: `npm run balance -- --king all --runs 500 --bot greedy --difficulty 0 < /dev/null`, seeds 1..500/perknull/unlockedCards[]. Lưu revision/config/bảng 9 vua/CSV; chưa đạt ghi chưa đạt. Smoke Arcane ít seed chỉ tìm lỗi, không thay mẫu 500 nghiệm thu.
- [ ] Chỉnh từng nhóm data có lý do từ năm chết/boss/capped/Arcane; mỗi gameplay edit có test đỏ đặc tính/số mới trước code, test xanh sau. Điểm đầu ENEMY_STAT_MULT 2,05/TOWER_SHOT_DMG_MULT 0,6 không phải số nghiệm thu. Giữ rage/hardLimit/tower range/HPbar. Đo cùng seeds sau từng nhóm, không trộn đổi heuristic/enemy mà không ghi tác động.
- [ ] Chạy 500 toàn 9 vua lần cuối đạt 35–65% mỗi vua, spread ≤ 15 điểm %. Ghi wins/rate/meanYear từng vua, Arcane trước/sau, capped battles. CSV hiện chưa có capped thì thu thêm từ onCommand battleResult xác định, ghi nguồn; không suy từ meanYear hoặc bịa số. Nếu chưa đạt phase vẫn mở.
- [ ] **Thủ tục baseline dùng cả ở cuối Phase 1/2/3:** đọc comment `endlessCompatibility.test.ts`, ghi revision luật/tuning có chủ đích, bước ghi tách biệt không sửa mã riêng Endless; không sửa literal vì failure chưa giải thích. Giữ wheat 1/stone 2/arcane 3, chạy trace 2 lần lấy commands/commandHash/setupHash/stateHash thực. Projection chỉ bỏ field schema trung tính có lý do (version/mode/endless/blessing như cũ; counter/shop nếu chưa tác động trong trace); không bỏ hand/deck/gold. BattleSetup so nguyên bản. Cập nhật provenance mỗi lần và chốt lại sau tuning Phase 4; không điền số dự đoán trong plan.
- [ ] Verify `npm test -- src/game/run/endlessCompatibility.test.ts src/game/sim/balance.test.ts src/game/sim/fullRun.test.ts src/game/sim/endless.test.ts src/platform/resumeIntegration.test.ts < /dev/null`; baseline lần 2 không khác; test render fixed setup Task 7 vẫn giữ hash.
- [ ] Viết báo cáo với command/config/seeds/revision, bảng 9 vua/spread/onTarget, Arcane và tuning, capped, hạn chế heuristic, baseline provenance, gate/Python/browser 1280×720 bằng chứng thật. Không dùng kết quả lịch sử 45–55% làm số mới. ROADMAP cập nhật 5/7/11, ghi 8/9 đã có và retest, luật rút/shop/save 8; giữ 6/10/12 và “Để sau: điện thoại” chưa làm. Không đánh dấu wiki xong vì đã có shop.
- [ ] Browser 1280×720 end-to-end: fresh thường → mua → chơi/bán → auto → reward/quest/council → bonus → reload; normal 30 về 0, endless 30 giữ 2; camera 2 pha, đạn nhà, volume. Chụp ảnh, console sạch.
- [ ] Gate G cuối Phase 4; verification-before-completion, requesting-code-review/finishing-a-development-branch khi triển khai theo quyền phiên đó. Review 5 focus và báo cáo thật. Không tự merge/push main/develop. Phiên tài liệu hiện tại kết thúc ở đúng hai file.

## Inventory test cũ và task sửa (đã grep thật)

Lệnh đọc: `rg -n 'RUN.handSize|handTooBig|canFight|battleHandMax|sellDown|handLimit' src --glob '*.test.ts'`. Không phải mọi hit đều cần đổi expected.

| File / vị trí hiện tại | Luật ghi cứng / xử lý | Task |
|---|---|---|
| `src/data/run.test.ts`:21,54 | handSize 5/battleHandMax 2 giữ, thêm annual/shop | 1,3 |
| `src/game/run/decrees.test.ts`:148–149 | handLimit 5/6 đổi số rút 1/2 + bonus | 1 |
| `src/game/run/flow.test.ts`:51,76; `yearFlow.test.ts`:122; `quests.test.ts`:130 | refill RUN.handSize → carry+count, năm 1 giữ 5 | 1 |
| `src/game/run/commands.test.ts`:109/113,293/295,494,563,671,685 | init 5 giữ; reroll/advance expected refill(...,5) sửa đúng context | 1 |
| `src/game/run/commands.test.ts`:228,382–393,609 | handTooBig/ ≤ 2/loop 2, thêm final 0 và ready guard | 2 |
| `src/game/run/RunController.test.ts`:29–30,41–90,124–141 và sellDown callers | G1-only auto/false flag chờ 2, chuyển target/mọi rules | 2 |
| `src/game/run/RunControllerPersistence.test.ts`:35,249–251,282 | fixture 3 bán 1/sellDown 2, queue autosave ưu tiên | 2,4 |
| `src/platform/session.test.ts`:105–106 | G1 sellDownbattleHandMax; thêm full/endless/final | 2 |
| `src/ui/planning/fightRule.test.ts`:6–22 | canFight manualG 2 true tay 2; đổi hint target | 5 |
| `src/ui/realm/calendarModel.test.ts`:79 | text handTooBig vẫn cần; thêm final context/noShopCards | 3,5 |
| `src/game/run/council.test.ts`:281,295; `src/ui/modals/councilModel.test.ts`:127 | purge min 5 giữ, không đổi theo annual 1 | 1 regression |
| `src/ui/realm/realmLayout.test.ts`:809–815,820–854 | overview/handWithFight/group 2+button; giữ legacy assertions, thêm min/scroll | 5,6 |
| `src/audio/AudioManager.test.ts`:53–59 | literal 0,5 đổi 0,25 | 7 |
| `src/game/sim/bots/{greedy,random,scripted}.test.ts` | chơi tiếp khi ≤ 2; kiểm ready và shop | 8 |
| `src/game/run/endlessCompatibility.test.ts` | literal trace luật cũ | 9, bước có nguồn mỗi phase |

Ngoài grep: chạy lại save fixtures/version, fullRun/endless orchestration, battle deterministic, cardFly/audioCues/help tests sau task sở hữu. Không mass replace mọi số 5/2.

## Rủi ro và điều kiện kết thúc

- Auto/save có race: không để UI mua tại ready, không báo runner trước checkpoint; delayed persistence test là bằng chứng.
- Deck cạn/tay vô dụng/quest: không recycle âm thầm, bán được tới final 0, pendingDraw chỉ rút 1 lần.
- Shop stream độc lập không bảo đảm cùng future shuffle sau khi thêm bản vào deck; kiểm đúng stream isolation/đa tập.
- Greedy offer probe bị guard có thể mất mọi reward value; phải test trước đo cân bằng, không chỉ kiểm chạy hết ván.
- Gate baseline đỏ thì chưa đóng phase; ghi lại chỉ theo nguyên nhân/nguồn đo, không skip hoặc sửa expected để xanh.
- Zoom lộ nền/hit lệch/cổng không tới: test model+browser, không sửa geometry mô phỏng để che lỗi. Pool compact/source chết không được làm hình đạn giật.
- Thiếu 9×500 kết quả thật hoặc spread > 15 điểm % thì cân bằng chưa đạt; không tick checklist chưa chạy.

**Tự rà spec → task:** §3 draw/decree/reroll → 1, target/auto → 2; §4 shop → 3/save → 4; §5 HUD → 5/camera → 6; §6 render/audio → 7; §7 bot/Arcane → 8/đo-baseline → 9; §8–9 ROADMAP/deferred/gates → 9. Không task cho việc Để sau.

