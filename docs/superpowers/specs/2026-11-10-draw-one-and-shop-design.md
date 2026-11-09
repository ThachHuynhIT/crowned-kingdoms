# Rút một lá mỗi năm và Mua thẻ — thiết kế (10/11/2026)

## 1. Mục tiêu và phạm vi

Thay nhịp rút bù đầy tay bằng giữ bài và rút ít mỗi năm; buộc giải quyết tay bài trước trận, bổ sung mua thẻ bằng vàng. Kèm thay đổi camera PC, điểm xuất phát hình ảnh của đạn công trình và âm lượng. Văn bản người chơi bằng tiếng Việt, id/code bằng tiếng Anh.

Tài liệu này thay các phần rút bài, Bàn Tay Thứ Tư và chờ bấm Ra trận của `2026-11-10-hand-and-battle-length-design.md`. Giữ các phần trận, Cuồng Nộ, thanh máu và thẻ PC đã làm. Phiên hiện tại chỉ viết spec và plan; các file code, test, báo cáo và ROADMAP nhắc dưới đây là đầu ra của phiên triển khai sau.

## 2. Hiện trạng đã đọc trên nhánh

- `src/data/run.ts`: `RUN.handSize = 5`, `battleHandMax = 2`, `skipPlayGold = 2`, hội đồng `[5,10,15,20,25]`, boss `[10,20,30]`.
- `src/game/run/deck.ts` (không có thư mục `src/game/deck/`): `refillHand(hand, drawPile, discardPile, rng, size)` rút tới tổng `size`, xáo chồng bỏ khi hết chồng rút, dừng nếu cả hai hết.
- `finishYearStart` trong `flow.ts` rút bù theo `handLimit`, còn tự đưa cả tay không chơi được vào chồng bỏ. `handLimit` hiện là 5 hoặc 6; `DECREE_RULES.hand = RUN.handSize + 1`.
- `commands.ts`: `play` và `discard` được dùng nhiều lần; `discard` chính là bán một lá lấy 2 vàng, không có lệnh `sell`. `played` chỉ chặn `reroll` bằng `alreadyPlayed`. `startBattle` dùng `canStartBattle` và lỗi `handTooBig`.
- `RunController.shouldAutoStart` còn phụ thuộc `rules.autoStart`; `RULES_FULL` và `RULES_ENDLESS` đang false. `kickoff` dựng lại trận đã lưu từ tick 0. Persistence xếp FIFO và checkpoint trước phát state/chạy trận.
- `RunState` thực tế v7, có `mode`, `endless`, các luồng `draw/reward/calendar/council/quest/blessing`. `yearStartPendingDraw` trì hoãn rút khi có nhiệm vụ; `answerQuest` gọi `finishYearStart`. Hội đồng diễn ra sau trận, không trước lần rút cùng năm đó.
- `PlanningHudScene` tạo nút Ra trận, dùng `canFight`, `handWithFight`, `handLimit`; `HandView` có số slot cố định lúc dựng. `realmLayout.ts` có thẻ PC 148×208, `OVERVIEW_BOARD_SHARE = 0.65`, `ZOOM_MAX = 3`; min phụ thuộc chiều cao HUD và kích thước bàn thường/Vô tận.
- `FxRenderer.syncProjectiles` chiếu toạ độ pool rồi trừ `FLIGHT_H = 6`. `combat.ts` tạo đạn ở `world.x/y[attacker]`. `UnitRenderer` đặt chân nhà tại điểm chiếu cộng `BUILDING_FOOT_DY`, scale từ `imageFrameScale(frame) * ISO_SPRITE_SCALE`. `imageArt.ts` dùng `IMAGE_ART_SCALE = 0.5` và danh mục ảnh; chiều cao thực phải đọc frame texture đã nạp, không coi mọi nhà cao 99 px (99 là metadata một ảnh riêng).
- `MASTER_OUTPUT = 0.5` ở `src/data/settings.ts`; `AudioManager` nhân nó với master slider, dùng chung music/sfx.

## 3. Rút bài và giải quyết tay

### 3,1 Số rút

Năm 1 rút 5 lá. Từ năm 2 rút thêm 1 lá vào tay giữ lại; rút 2 lá nếu năm thuộc `RUN.councilYears` hoặc bằng một năm trong `RUN.bossYears` cộng 1, trừ phần tử năm boss cuối. Hai điều kiện kết hợp bằng OR, không cộng hai lần: các mốc hiện tại là 5,10,11,15,20,21,25. Không phụ thuộc đã thắng boss hay chưa: đây là mốc lịch sau trận boss.

Quy ước triển khai: dùng các mốc tuyệt đối trên cả Vô tận, không tự lặp bonus ở 31/35/41 hoặc suy từ lịch boss mở rộng. Vô tận vẫn rút 1 lá ở các năm khác; lịch hội đồng/boss/phúc lành hiện có không đổi.

Giữ `RUN.handSize = 5` làm số tay khởi đầu và ngưỡng giữ bộ bài của Thanh Lọc hiện tại; thêm `RUN.yearDraw = 1`, `RUN.bonusYearDraw = 2`. Mọi số gameplay nằm ở data. Thêm `yearDrawCount(state): number` ở `src/game/run/decrees.ts`, dùng year/decrees và dữ liệu lịch. `finishYearStart` gọi `refillHand` với đích `hand.length + yearDrawCount(state)`; năm 1 fresh hand rỗng, count 5 (fixture có sẵn sắc lệnh cộng thêm 1 theo đề xuất bên dưới). Bỏ nhánh recycle theo `hasPlayableCard`: giữ nguyên lá không chơi được, cho phép bán. Không thay thứ tự các lá giữ lại.

Bộ bài cạn: rút tối đa số có sẵn, không tạo bản sao. Giữ đa tập `hand + drawPile + discardPile = deck`. `yearStartPendingDraw` vẫn bảo đảm chỉ rút một lần, sau khi trả lời nhiệm vụ. Ban hành sắc lệnh sau trận chỉ ảnh hưởng lần rút đầu năm kế.

**Đề xuất Bàn Tay Thứ Tư:** đổi `DECREE_RULES.hand` từ 6 thành 1, nghĩa mới là số lá rút thêm mỗi năm; giữ id `decree_fourth_hand`, tên và text “Mỗi năm rút thêm {hand} lá.” Không còn giới hạn tay 6. Nếu đã có sắc lệnh, năm thường rút 2, năm bonus rút 3; không rút tức thời lúc ban hành. Loại bỏ API `handLimit` và cập nhật mọi caller; không dùng số rút để tính slot UI.

Quyết định kỹ thuật của spec: reroll thay đúng số lá hiện có trước lệnh, không rút bù 5 và không nhận lại bonus năm. Giá, lượt miễn phí và chặn `played` giữ nguyên. Mua chưa được coi là chơi/bán; reroll sau mua chỉ hoán đổi cùng số lá, không tăng tay miễn phí.

### 3,2 Ngưỡng và tự vào trận

Thêm `battleHandTarget(state): number` trong `turn.ts`: trả 0 chỉ khi `mode === 'normal'`, `rules.calendar === 'full'`, `rules.years === 30`, `year === 30`; các trường hợp khác trả `RUN.battleHandMax = 2`. Số 30 dùng hằng `RULES_FULL.years`, không literal rải trong game/UI/bot.

`canStartBattle` true khi phase planning, không còn draw pending/offer/pendingOffers, và `hand.length <= battleHandTarget(state)`. Bình thường hành động giảm từng lá sẽ chạm đúng 2; trường hợp tay đầu năm thiếu bài 0/1/2 vẫn vào ngay, không buộc tạo thêm bài. Năm 30 thường phải về 0, kể cả chỉ có bài không có đích: bán từng lá vẫn hợp lệ. Vô tận năm 30,60… giữ ngưỡng 2.

Tự vào trận bắt buộc với mọi rules, kể cả save giữ `autoStart: false`. Đặt preset `autoStart: true`, giữ field để đọc save tương thích, bỏ vai trò quyết định trong `shouldAutoStart`. Giữ lệnh `startBattle` làm bước nội bộ dùng chung controller/headless; tay quá lớn vẫn `handTooBig`. Không có nút hay phím chờ Ra trận. `played` vẫn nghĩa đã chơi/bán ít nhất một lá; không phục hồi giới hạn một hành động.

Để không có khe mua tại ngưỡng: reducer từ chối các lệnh sửa chuẩn bị (`buyCard`, `play`, `discard`, `reroll`, `unlockPlot`, `freeMove`) bằng `wrongPhase` nếu planning đã đủ điều kiện vào trận. `startBattle` được ưu tiên; `setAutoFire` giữ hợp đồng cũ. Controller hoàn tất checkpoint lệnh làm tay chạm ngưỡng, checkpoint vào trận và khởi runner trước xử lý lệnh UI tiếp theo; không enqueue auto-start sau một lệnh mua đã chờ sẵn. Tránh deadlock tự chờ chính FIFO, không dựng hai runner khi gọi kickoff hai lần. Headless kiểm cùng predicate trước hỏi bot, ghi nhận `startBattle` qua `onCommand` rồi mô phỏng trận thật.

## 4. Mua thẻ và lưu ván v8

- Lệnh mới `{ type: 'buyCard' }`, chỉ khi còn ở pha chuẩn bị chưa đủ ngưỡng ra trận. Không menu Merchant, offer hoặc modal chọn thẻ.
- `RUN.shopBaseGold = 5`; **đề xuất** `RUN.shopStepGold = 3`. `shopPrice(state) = 5 + 3 * shopPurchasesThisYear`: 5,8,11… không giới hạn số lần riêng, giới hạn bởi vàng. Reset counter đúng một lần trong `startYear`, không reset khi reload/trả lời quest/đổi bài.
- Đề xuất kỹ thuật: bốc đồng xác suất trên `content.king(state.kingId).cards`, sort id trước bốc. Cho phép trùng; không Ngai, không neutral/meta, không thẻ vua khác hay conquest-only. Không lấy trọng số REWARD. Pool rỗng trả `noShopCards` (bổ sung `IllegalReason` và text), không trừ vàng/tiến RNG. Thiếu vàng dùng `notEnoughGold`; sai pha dùng `wrongPhase`.
- Thành công: trừ giá, tăng `shopPurchasesThisYear`, append đúng một bản vào `deck` và `hand`, không thêm cùng bản vào draw/discard. Không phát `cardPlayed`, không tăng `goldEarned`, không đổi `played` hay quest reroll progress.
- Thêm `'shop'` vào union `RngStream` trong `src/game/run/state.ts` (hiện là `'draw' | 'reward' | 'calendar' | 'council' | 'quest' | 'blessing'`) và cập nhật mọi chỗ codec/migrate liệt kê các luồng. Thêm `rng.shop` với `hashSeed(`${seed}:shop`)`, chỉ `buyCard` thành công tiêu thụ. Các luồng draw/reward/calendar/council/quest/blessing không bị mua tiêu thụ. Điều này bảo vệ luồng ngẫu nhiên; việc thêm lá vào deck vẫn có thể thay kết quả xáo/rút tương lai khi bản mua đã vào chồng bỏ, không hứa cùng toàn bộ tay tương lai.
- Thêm `shopPurchasesThisYear: number`; bắt buộc bump `RUN_SAVE_VERSION` **7 → 8**. `migrateRunState` nối 7 → 8, counter 0, thêm shop seed; giữ nguyên tay/piles, `played`, phase, pending draw/offers, rules và các RNG cũ. Không rút lại giữa năm. V7 planning tay ≤ ngưỡng tự vào trận qua kickoff; v7 battle dựng lại tick 0; v7 quest chỉ rút sau trả lời theo luật mới. Không sửa mode/endless/lịch hay save meta.
- Codec kiểm counter nguyên an toàn không âm, shop RNG uint 32, đa tập deck/piles, id hợp lệ; v8 thiếu/sai field bị từ chối thay vì âm thầm reset. Giữ envelope formatVersion 1, IndexedDB schema. Reload sau mua giữ giá và RNG; lệnh sai không checkpoint, lệnh thành công lưu FIFO theo hợp đồng hiện có.

## 5. Giao diện và camera

### Chuẩn bị

Bỏ nút/phím Ra trận và `handWithFight`/`fightOver` khỏi đường layout đang dùng; `fightRule.ts` không được giữ một nhánh Ra trận thủ công. Hiện “Chơi hoặc bán để còn 2 lá — trận tự bắt đầu.”; năm 30 thường “Chơi hoặc bán hết bài — trận tự bắt đầu.” Copy và số đọc từ helper/data. Nút “Mua thẻ · {price} vàng”, thiếu vàng disable kèm lý do; dùng `createButton`, FONT_UI, ≥ 44×44, phát intent qua bus. Slot phản ánh tay thực, không theo `handLimit` hay tối đa 6.

PC giữ thẻ 148×208. Với nhiều lá do mua: hàng cuộn ngang trong vùng tay, gap 12, không thu nhỏ thẻ để giấu overflow; chọn/kéo/bán được lá ngoài màn, cuộn không kích hoạt play/drop. Panel cuộn không bắt pointer ngoài vùng tay, camera không pan khi thao tác tay/modal. Điện thoại giữ kích thước/co hàng hiện hành và camera hiện hành; chỉ tích hợp control cần thiết để dùng luật chung (đặt Mua thẻ thay vị trí điều khiển Ra trận đã bỏ), không thiết kế lại toàn bộ mobile. Logic mới áp mọi thiết bị.

### Zoom/pan chỉ desktop ≥ 768 px

Đóng băng hàm tính overview cũ thành `legacyOverviewZoom(screen, phase, handSize, mode)` giữ đúng width share 0,65, height fit, floor 0,25 và cap 3 của nhánh trước thay đổi. Dùng cùng context handSize cho layout và camera, không để camera mặc định 3 còn layout theo tay mua. Đề xuất context ổn định `RUN.handSize = 5` cho khoảng trống camera PC, bất kể tay mua dài; tránh zoom tự nhảy theo số lá.

PC: `max = legacyOverviewZoom(...)`, `min = max / 1.6`. Hệ số 1,6 cho thấy rộng hơn 60%, thuộc khoảng 55–60%; không giảm zoom 60% (sẽ rộng 2,5 lần), không cộng các phần trăm trực tiếp. 1280×720 normal planning với hàng 208 px: max = 382/320 = 1,19375, min = 0,74609375. Battle normal max = 1,3, min = 0,8125. Vô tận dùng chiều rộng 896/chiều cao 448 của bàn 7×7 để tính riêng, không áp số normal.

Giữ `ZOOM_MAX = 3` cho điện thoại, min 33/32. Các đường `zoomAt`, `pinchView`, `keepView`, `resizeView`, `realmCamera`, `realmCameraMix` cùng dùng limits đúng phase/mode/screen. Resize từ PC về phone clamp cả min/max; camera view không lưu vào RunState.

“Vùng kéo trái/phải hẹp 40%” định nghĩa trên đoạn tâm hợp lệ `[lo,hi]` hiện tại của `clampView` sau map rect và ràng buộc wall tại cùng zoom/row: midpoint m, thay bằng `[m - 0.3*(hi-lo), m + 0.3*(hi-lo)]`. Giữ 60% độ dài đoạn; đoạn 0 vẫn 0, đoạn vô nghiệm giữ fallback hiện có. Không thu hẹp WORLD_BOUNDS vuông trước chiếu (sẽ vô tình đổi vùng bắc/nam). Phone dùng nguyên đoạn cũ. Giữ tới được cổng, không tâm bắc wall, snapView và realm:view đúng view hiển thị, input inverse/unproject như spec polish §4, nearest/no AA, HUD không zoom.

## 6. Điểm bắn và âm lượng

Chỉ render: helper thuần `projectileVisualHeight(sourceHeight, travelled, remaining, isStructure, footDy)` ở `src/render/projectileModel.ts`. Tính cao đầu bắn nhà bằng `0.8 * renderedFrameHeight` tính từ chân `iso(source) + BUILDING_FOOT_DY` (đề xuất vị trí 80% chiều cao để nằm phần mái/tháp), endpoint theo FLIGHT_H hiện tại. Nội suy offset từ nguồn tới đích bằng tiến độ `travelled/(travelled+remaining)` clamp 0..1; lính giữ offset 6 hiện tại. Chiều cao frame thực × imageFrameScale × ISO_SPRITE_SCALE; fallback generated frame cũng dùng chiều cao thật. Đổi hướng arrow theo vector hình ảnh nếu cần, không rotate sprite. Không dùng cache theo pool index vì pool đạn compact; đọc sourceId/label ổn định kể cả nguồn đã chết. Không dời đạn mô phỏng trong `combat.ts`, không thêm field world/setup/hash; hit tick/sát thương không đổi. Kiểm cả Ngai, hai phe, ảnh/fallback và nhiều chiều cao.

`MASTER_OUTPUT` đổi 0,5 → 0,25; master 100 cho gain 0,25, master 50 cho 0,125; sfx/music tiếp tục nhân slider riêng. Giữ settings đã lưu, mute và khởi tạo AudioContext sau pointer đầu.

## 7. Cân bằng và tương thích

Chạy lại bot theo luật bắt buộc; bot không được chơi tiếp ở tay 2 (trừ final 0), không được mua sau khi đã đủ ngưỡng. Greedy cần chiến lược mua hữu hạn, deterministic, đánh giá lợi ích và giữ ngân sách mua ô; hằng chiến lược ở `src/data/balance.ts`. Không tăng trần lệnh để che vòng lặp mua/bán. Random/scripted/endless bot và headless dùng cùng predicate; không sửa luật riêng để bot thắng.

Rà `src/data/kings/arcane.ts`: `construct` đã có HP 90, armor 0,1, range 2 và nằm enemyRoster; các thẻ troop hiện chỉ sinh apprentice/frost_mage/archmage đánh xa. Xem đường tiếp cận tuyến chịu đòn từ thẻ hiện có (ưu tiên tái dùng construct/art đã duyệt), thời điểm có được và giá trị greedy đang bỏ qua shield/slow/chain; không kết luận thiếu định nghĩa đơn vị. Ghi lựa chọn, số trước/sau và test trước chỉnh thẻ. Không sinh art trong phạm vi này.

Điều kiện: `npm run balance -- --king all --runs 500 --bot greedy --difficulty 0` (seeds 1..500, RULES_FULL, perk null, unlockedCards rỗng) đạt 35–65% mỗi vua, spread ≤ 15 điểm %. Dữ liệu hiện có `ENEMY_STAT_MULT = 2.05`, `TOWER_SHOT_DMG_MULT = 0.6` là điểm xuất phát, không phải số sau cân bằng. Ưu tiên data enemy/scaling và thẻ arcane theo số đo; giữ rage 600/step 300/+25%, hardLimit 3000 = thua, không quay lại thắng vì giờ. Báo cáo `docs/balance/2026-11-10-draw-one-balance.md` chứa config, kết quả từng vua, spread, arcane, capped battles, quyết định tuning, hạn chế heuristic và bằng chứng thật.

`endlessCompatibility.test.ts` cố ý sẽ đổi trace vì nhịp chơi mới. Theo thủ tục comment trong file: ghi baseline riêng cho thay đổi luật/cân bằng có chủ đích, không sửa literal chỉ để xanh, không gộp sửa mã riêng Endless vào bước ghi baseline. Giữ nguyên BattleSetup trong phép so; projection chỉ loại trường schema trung tính (thêm counter/shop RNG phải giải thích rõ, không loại hand/gold/deck). Ghi nguồn revision, commandHash/setupHash/stateHash thực đo của wheat 1/stone 2/arcane 3, chạy hai lần; snapshot tại thời điểm này là quy tắc chung mới cho cả hai mode.

## 8. Đối chiếu ROADMAP “Việc tiếp theo” 1–12

Đây là trạng thái đọc code, không phải khẳng định đã chạy test/trình duyệt trong phiên tài liệu.

| Mục | Trạng thái | Bằng chứng / phạm vi |
|---|---|---|
| 1 Trượt chọn vua | Đã xong | `KingSelectScene.ts`: SLIDE_MS 240, slideTween |
| 2 Thẻ vua nhỏ PC | Đã xong | `ui/kingSelect/carouselLayout.ts`: native 66×96, centre×3, bên×2 ở vùng chuẩn; màn cao có×4; chân dung lớn qua `render/portraitAssets.ts` và `KingPortraitView.ts` |
| 3 Khối chi tiết giữa màn | Đã xong | `ui/kingSelect/detailLayout.ts`: block giữa, PC cards 116×180/cols 5 (9 lá thành 5+4) |
| 4 Tranh/thẻ lớn PC | Đã xong | `realmLayout.ts` DESK.card 148×208; `HandView` qua CardView; ảnh/bố cục deck/reward hiện có giữ nguyên |
| 5 Tay lớn/chơi nhiều/bắt đầu khi ≤ 2 | Làm trong plan này (phần còn lại) | `play/discard` đã nhiều lần, handSize 5 đã có; flow còn rút bù, FULL còn `autoStart: false`; thay bằng §3–5 |
| 6 Cây/đá bỏ viền, dày hơn | Còn lại | `src/render/decorationModel.ts` rải approved assets theo `FIELD_DECOR`, tránh vùng chiến đấu/cổng, bàn, đường và nước; `src/render/forestModel.ts` rải rừng theo grid/occupancy của `FIELD_DECOR.forest`, lọc theo khoảng hở tường và vùng nhìn. Cả hai dùng `pixelHash` với seed/salt riêng, không dùng RNG của ván. Có rừng dày chưa chứng minh đã bỏ viền toàn bộ cây/đá; không có bước sửa contour trong renderer này |
| 7 Zoom/pan | Làm trong plan này | `cameraModel.ts` max 3, chưa thu đoạn ngang 40%; §5 thay đúng yêu cầu mới 60% |
| 8 Thanh máu nhà | Đã xong | `UnitRenderer.sync`: slot.wounded chỉ bật khi hp<maxHp, giữ hiện sau hồi; reset khi world mới |
| 9 Trận dài và trần | Đã xong (cân bằng lại trong plan) | `battle/step.ts`: hardLimit → false; `targeting.ts` rageStacks, `combat.ts` hệ số; BATTLE 600/300/25/3000 |
| 10 Can thiệp riêng từng vua | Còn lại | `battleSetup.ts` chỉ truyền số interventionStats; `FxRenderer.syncBoulders` chung frame boulder/shadow, chưa variant theo vua |
| 11 Arcane và cân bằng | Làm trong plan này | arcane có construct nhưng cards chưa sinh construct; §7 yêu cầu rà thẻ và đo 9 vua |
| 12 Wiki 9 Kings | Còn lại | Không có thư mục `docs/research/` trên nhánh; chưa có ghi chép nguồn wiki kiểm chứng được. Mua thẻ ở đây là quyết định chủ dự án, không bằng chứng hoàn thành mục nghiên cứu |

## 9. Rủi ro, nghiệm thu và Để sau

Rủi ro chính: deck cạn; quest trả lời/reroll gây rút lặp; mua/bán kẹt hoặc lệnh mua xếp hàng vượt auto-start; năm 30 không có đích phải bán; save v7 giữa năm có played=true; slot tay dài và drag nhầm cuộn; min mới thấp lộ nền/cổng, max phụ thuộc phase; projectile pool compaction và nguồn chết; cân bằng bị heuristic greedy che yếu điểm arcane. Plan phải gắn test vào từng chủ sở hữu.

Đóng mỗi phase bằng lint/typecheck/test/build và Python unittest tools, exit 0; phase có UI kiểm trình duyệt 1280×720, console sạch, không chồng chữ/hitbox, lưu ảnh khi thực thi. Không ghi kết quả trước chạy. Duy trì tests trận không thắng vì giờ, rage cộng dồn, trần 3000 thua và thanh máu như nhánh hiện tại.

Để sau, không task: bỏ viền/rải thêm cây đá; can thiệp riêng từng vua và art của nó; nghiên cứu wiki 9 Kings (chỉ ý tưởng cơ chế chung, không sao chép nội dung); toàn bộ tối ưu tải/FPS/cảm ứng/bố cục điện thoại trong ROADMAP. Nếu về sau sinh ảnh phải đọc ART_STYLE, đính reference được duyệt, thử một mẫu và duyệt trước cả nhóm, log prompt/nguồn, manifest/CREDITS theo CLAUDE; plan này không yêu cầu ảnh mới.

## Câu hỏi mở

Hai đề xuất thiết kế cần chủ dự án duyệt cùng tài liệu: bước giá mua +3 và Bàn Tay Thứ Tư rút thêm 1/năm. Quy ước reroll cùng số lá, pool shop đồng xác suất và vị trí bắn 80% là lựa chọn kỹ thuật được ghi rõ để review. Không có câu hỏi nào mở lại mười quyết định đã chốt; số cân bằng cuối cùng chỉ điền sau đo.

