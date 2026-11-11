# Thương nhân — thiết kế

Ngày: 10/11/2026. Trạng thái: thiết kế theo quyết định đã chốt, chưa triển khai hoặc đo kiểm.

## 1. Mục tiêu và phạm vi

Thêm một cơ hội mua thẻ có lựa chọn sau trận, định kỳ và giá thấp, dùng hàng đợi offer hiện có. Người chơi nhìn thấy 3 thẻ, mua tối đa 1 thẻ với giá 3 vàng hoặc bỏ qua miễn phí. Thẻ được nhận theo đường thưởng hiện tại để có thể rút vào năm sau.

Phân biệt với Mua thẻ trong spec `2026-11-10-draw-one-and-shop-design.md` §4: `buyCard` vẫn mua ngẫu nhiên ngay vào tay trong planning, giá khởi điểm 5 vàng rồi tăng 3 vàng mỗi lần trong năm. Thương nhân không gọi `buyCard`, không tăng `shopPurchasesThisYear`, không đổi giá hay giới hạn Mua thẻ. Hai cơ chế cùng tiêu thụ luồng `shop`, vì vậy mua trong planning có thể thay hàng của lần ghé sau; không hứa độc lập giữa hai cơ chế này.

Phiên viết tài liệu chỉ tạo/sửa 2 file spec và plan được yêu cầu, không sửa code, không commit, không chạy node/npm/npx. Các file và lệnh triển khai dưới đây là công việc tương lai.

## 2. Ràng buộc

- Phaser 4, TypeScript strict, Vite, Vitest. `src/game`, `src/data`, `src/core` thuần, không nhập Phaser hoặc scenes/render/ui/platform/audio; data không nhập game.
- Deterministic: RNG qua `Rng`, không dùng thời gian thực, `Math.random` hoặc toán bị CLAUDE cấm. Thứ tự ảnh hưởng kết quả phải ổn định; không dựa vào thứ tự duyệt Map/Set. Mọi số gameplay ở `src/data`.
- `RUN.merchantYears = [6, 12, 18, 24]`, `RUN.merchantPrice = 3`; thêm `RUN.merchantEvery = 6` cho chu kỳ sau năm 30. Số lựa chọn dùng `REWARD.choices = 3`, không dùng `rewardCount` có thể tăng theo sắc lệnh.
- Tiếng Việt cho người chơi, id/code tiếng Anh; chữ và số cách nhau 1 dấu cách. UI dùng `FONT_UI`, `createPanel`, `createButton`, `Tooltip`; vùng chạm ít nhất 44 × 44 px, tooltip cảm ứng giữ 400 ms; layout lại khi resize.
- Không tạo art, không đổi mô phỏng trận, lịch hội đồng/phúc lành, luật rút tay, meta hoặc schema IndexedDB.

## 3. Lịch ghé và thứ tự sau trận

`isMerchantYear(state)` đọc mode/year/rules: từ chối năm cuối qua `isFinalYear`; các năm trong `RUN.merchantYears` được ghé; riêng Vô tận khi `year > RULES_FULL.years` và chia hết cho `RUN.merchantEvery` thì được ghé. Năm 30 không nằm trong lịch, kể cả Vô tận; các năm 36, 42, 48, 54, 60… có ghé. Không lấy modulo 6 cho mọi năm, vì sẽ vô tình thêm năm 30.

Lựa chọn kỹ thuật để triển khai phần chưa quy định chi tiết: áp lịch trên cho các preset cũ nếu ván chưa tới năm cuối; thương nhân ghé sau thắng hoặc thua còn mạng. Hết mạng/kết thúc ván phải kết thúc trước và không roll thương nhân.

Trong `battleResult`, giữ thứ tự settle quest/hook, tiền trận, tiền chinh phục và kiểm hết mạng hiện tại. Sau enqueue thưởng trận, enqueue merchant bằng `enqueueOffers`, trước hội đồng và phúc lành. Giữ nguyên các quest reward đã được settle trước đó. Chinh phục hiện được roll khi đóng offer `reward`, rồi prepend vào `pendingOffers`; không chuyển sang roll sớm và không đổi RNG `reward` của chinh phục.

Ví dụ thắng năm 12 có chinh phục: quest reward nếu có → reward → conquest → merchant → các bước còn lại → yearEnd. Chọn hoặc bỏ thưởng đều phải chèn conquest trước merchant. Thua năm 12 còn mạng: quest reward nếu có → merchant → các bước còn lại. Năm 60 Vô tận: reward nếu thắng → conquest nếu có → merchant → council nếu còn sắc lệnh → blessing. Bước quest cuối năm vẫn do `finishYear` xử lý sau hàng đợi, không kéo lên trước thương nhân.

Chỉ tạo hàng một lần trong lệnh `battleResult` hợp lệ. Reload/kickoff/đóng offer không roll lại; `battleResult` gửi lặp sau settlement phải `wrongPhase`. Không cần thêm lastMerchantYear vì phase và queue đã ghi checkpoint cùng kết quả trận.

## 4. Hàng và RNG

Module thuần `src/game/run/merchant.ts` sở hữu lịch, tạo offer và kiểm khả năng mua. Tái dùng `rollOffers(rng, state.year, pools, REWARD.choices)` với `new Rng(state.rng.shop)`; nguồn giống đúng nhánh thưởng trận: thẻ vua mình, `neutralRewardPool(content.neutralPool(), state.unlockedCards)` và bộ lọc `START_DECK_G1` khi calendar raiders. Tách helper pool dùng chung ở `rewards.ts` để hai nhánh không lệch quyền mở khoá hoặc thứ tự.

Giữ thứ tự mảng nguồn hiện có của `rollOffers` cho cả thưởng và thương nhân; không sort riêng một phía rồi gọi là cùng thuật toán. Không thay thuật toán thưởng hay thứ tự registry trong tính năng này. Thẻ khác id trong cùng offer, không loại thẻ chỉ vì đã có trong deck. Không có Ngai hay thẻ conquest-only từ vua khác. Meta chưa mở không xuất hiện.

Dùng nguyên `REWARD.kingShare = 0.65`: trọng số common/uncommon/rare lần lượt [60, 30, 10] trước năm 10, [45, 35, 20] trước năm 20, [30, 40, 30] từ năm 20. Giữ fallback độ hiếm/nguồn của `rollOffers`. Pool ít hơn 3 id thì bày số còn lại; pool rỗng vẫn là offer có thể bỏ qua, không vòng lặp hoặc tạo bản sao.

Chỉ bước tạo hàng cập nhật `rng.shop`. Chọn, bỏ qua và lệnh sai không tiêu thụ RNG. Không chạm `rng.reward`, draw/calendar/council/quest/blessing khi tạo thương nhân. Điều này bảo vệ luồng thưởng, không bảo đảm toàn bộ ván/tay tương lai giống ván không mua.

## 5. Offer, lệnh và nhận thẻ

Mở rộng `CardOfferState` bằng nhánh phân biệt `{ kind: 'merchant'; cardIds: CardId[]; price: number }`; `price` bắt buộc với merchant, không biến thành field tùy chọn dùng bằng non-null assertion. Giữ metadata `king?`/`questId?` tương thích các caller `Pick` hiện có qua base chung hoặc cập nhật kiểu caller tường minh.

Dùng pha `reward` cho merchant như questReward, không thêm `RunPhase` mới. `cardOffer` phải nhận diện merchant; `phaseOf` và codec `OFFER_PHASE` ánh xạ merchant → reward. `closeOffer`/`advanceAfterBattle` tiếp tục quyết định bước kế, không viết đường sang năm riêng.

Lệnh duy nhất là `{ type: 'pickOffer', index: number | null }`:

| Input | Kết quả |
| --- | --- |
| `null` trên merchant | Đóng offer, giữ nguyên vàng, `goldEarned`, deck/piles và RNG |
| Index nguyên thuộc cardIds và vàng ≥ price | Trừ đúng price, thêm 1 bản vào deck và prepend drawPile, đóng offer |
| Index hợp lệ nhưng vàng < price | `notEnoughGold`, toàn bộ input/offer/queue/RNG không đổi |
| Index âm, lẻ, NaN, vượt mảng | `badTarget`, không trừ tiền hoặc đóng offer |
| Không ở pha chọn thẻ hợp lệ | `wrongPhase` |

Giữ thứ tự validate index trước affordability. Bỏ qua merchant không nhận `RUN.skipRewardGold = 3`. Bỏ qua reward vẫn nhận số đó; conquest và questReward vẫn không nhận `null`. Mua không thay `hand` tức thời, không phát `cardPlayed`, không tăng `goldEarned`, không đổi `played`, counter Mua thẻ hoặc RNG.

Nhận thẻ bằng chính quy ước thưởng: `deck = [...deck, picked]`, `drawPile = [picked, ...drawPile]`. Bảo toàn đa tập hand + drawPile + discardPile = deck. Đây là đưa lên đầu chồng rút, không cưỡng ép thêm vào tay: nếu một offer nhận thẻ sau đó prepend tiếp, giữ nguyên thứ tự hiện tại của hệ thống thưởng. Không thêm hàng chờ nhận thẻ mới. Với merchant là bước nhận thẻ cuối và năm kế rút ít nhất 1 lá, lá mua nằm trong phần rút đầu năm kế.

Một lựa chọn hợp lệ đóng offer nên không thể mua lá thứ 2 trong cùng lần ghé. UI chống gửi kép, reducer vẫn là nơi kiểm hợp lệ. Lệnh pickOffer không có token offer; giữ hợp đồng hiện có, không mở rộng giao thức chống lệnh stale xuyên nhiều offer trong phạm vi này.

## 6. Lưu ván

Codec hiện whitelist loại offer, vì vậy quyết định bump `RUN_SAVE_VERSION` từ 8 lên 9. Thêm `v8to9` chỉ trả bản với `version: 9`, nối sau `v7to8`; không thêm field state, không tạo hàng cho trận đã settle ở save cũ, không reset RNG/counter hoặc rút lại bài. Có fixture v8 thật ở dạng object dữ liệu trong test, bao gồm queue đang chờ; kiểm input không bị sửa và mọi field ngoài version giữ nguyên.

Codec v9 kiểm merchant ở cả `offers` và `pendingOffers`: phase mở phải reward; price nguyên an toàn và bằng `RUN.merchantPrice`; cardIds hợp lệ, khác nhau, số lượng từ 0 đến `REWARD.choices`. Từ chối thiếu price, giá âm/lẻ/sai giá, id lạ/trùng và quá 3 lá. Giá là dữ liệu offer đã lưu nhưng phiên bản này chỉ chấp nhận giá 3; thay giá tương lai phải xem lại hợp đồng save. Không từ chối offer chỉ vì người chơi đang có dưới 3 vàng.

Giữ formatVersion 1 và schema IndexedDB hiện tại. Dùng checkpoint FIFO đang có sau battleResult và pickOffer thành công. Lệnh thiếu tiền không checkpoint. Reload lúc đang thưởng, conquest hoặc merchant giữ nguyên hàng/price, vàng và RNG; reload sau mua không mua lại. Tầng game test codec/store thuần; test tích hợp session ở platform để không vi phạm tầng.

## 7. UI và bot

Dùng lại `RewardModal`, tiêu đề chính xác “Thương nhân ghé qua”, mô tả chọn tối đa 1 thẻ; mỗi lá có “3 vàng” đọc từ offer.price, nút “Mua” chỉ bật sau chọn lá đủ tiền, nút “Bỏ qua” luôn dùng được trước submit. Không hiển thị “ĐỔI THƯỞNG — Sắp có” cho thương nhân; tái dùng vùng footer đó cho bỏ qua và kiểm layout. Các offer khác giữ giao diện hiện có, không tự thêm nút bỏ qua reward trong thay đổi này.

Lá không đủ vàng hiển thị mờ, không chọn bằng click/Enter, vẫn có tooltip lý do từ `notEnoughGold` qua text lỗi hiện có. Tách trạng thái disabled chọn khỏi tương tác tooltip. Giá phải hiện riêng trên từng lá, không chỉ subtitle. `RewardModal` callback mở rộng thành `(index: number | null) => void`, có options merchant và cập nhật affordability từ state hiện tại. `offerModel` sở hữu chữ/model, `rewardSelection` sở hữu chọn/confirm thuần với mặc định tương thích.

`PlanningHudScene` nhận merchant qua `cardOffer`, truyền kind/price/gold và intent `pickOffer` qua bus. Khóa modal gồm kind, cardIds, price; vàng đổi chỉ refresh eligibility, không phá modal mất lựa chọn. `retry()` sau lệnh bị từ chối mở lại thao tác với affordability mới; Enter, Mua, Bỏ qua chia sẻ khóa submitted. Reset trường khi scene create lại, destroy listener/tooltip khi chuyển offer. Kiểm trình duyệt 1280 × 720, resize và reload; không thiết kế lại điện thoại.

Greedy mở nhánh merchant trước xử lý chọn thưởng chung: chỉ mua nếu còn ít nhất `GREEDY_SHOP_RESERVE = 4` vàng sau trả giá; hiện cần ít nhất 7 vàng. Chọn `offerValue` cao nhất, hòa giữ index thấp nhất; không thêm điều kiện điểm phải dương. Pool rỗng hoặc dưới ngân sách thì bỏ qua. Không tiêu thụ bot RNG và không đổi heuristic thưởng cũ.

Random chọn đều trong tập các index mua hợp lệ cộng `null`; thiếu tiền hoặc pool rỗng chỉ có `null`, dùng RNG bot, không dùng RNG ván. Lựa chọn kỹ thuật cho scripted: luôn bỏ qua merchant để vẫn sinh lệnh hợp lệ. Kiểm các bot/headless/harness Vô tận gặp merchant dù dùng phase reward, tránh fallback pick 0 khi không đủ vàng.

## 8. Đo, hồi quy và nghiệm thu

Plan chia 3 phase: logic/save/bot với TDD; UI và trình duyệt; đo và tài liệu. Mỗi phase đóng bằng `npm run lint && npm run typecheck && npm test && npm run build`, trong Git Bash mỗi npm có `< /dev/null`. Không tuyên bố đã chạy khi chỉ viết tài liệu.

Phase 3 chạy `npm run balance -- --king all --runs 100 --bot greedy --difficulty 0`, ghi revision, cấu hình/seeds, 9 kết quả, spread và so trước/sau cùng cấu hình vào phần bằng chứng của plan này. Không bịa số, không biến 100 ván thành chứng nhận cohort chuẩn 500 ván, không chỉnh số gameplay để che kết quả.

`endlessCompatibility.test.ts` có baseline normal wheat seed 1, stone seed 2, arcane seed 3. Merchant có thể đổi trace và state do shop RNG/queue; có seed chết trước mốc nên không nhất thiết cả 3 thay đổi. Theo thủ tục trong file: đo bằng trace thật, hai lần, ghi revision/lý do, baseline riêng cho thay đổi luật chung, không trộn sửa mã riêng Endless; giữ nguyên BattleSetup và gameplay projection hiện tại. Không xóa gold/deck/hand/rng.shop/offer khỏi projection để xanh. Chỉ thay literal thực sự đo khác. Nếu baseline đỏ ngay Phase 1, thực hiện trước phần đo baseline của Phase 3 tại revision Phase 1 rồi chạy gate; Phase 3 kiểm lại, không để gate đỏ có chủ đích.

Cập nhật `docs/ROADMAP.md` về merchant/save v9 với bằng chứng thực, không đánh dấu hoàn thành nghiên cứu wiki. Help `src/ui/help/mechanics.ts` giải thích lịch, 3 lựa chọn, giá 3 vàng, tối đa 1, bỏ miễn phí, nhận theo đường thưởng và chu kỳ Vô tận; mọi số lấy data/helper.

Rủi ro: conquest roll muộn bị merchant vượt; nhánh bỏ thưởng vô tình tặng vàng; pool meta hoặc trọng số lệch; merchant dùng nhầm reward RNG; v8 đang chờ bị roll thêm; bot chọn index không mua nổi; footer/tooltip disabled chặn nhau; baseline được đổi mà chưa chứng minh nguyên nhân. Mỗi rủi ro có test/task trong plan.

## Câu hỏi mở

Không có câu hỏi thiết kế mở. Các lựa chọn kỹ thuật đã ghi rõ ở §3–7; số đo cân bằng và ảnh kiểm UI là bằng chứng cần thu khi triển khai, không phải quyết định gameplay cần hỏi lại.
