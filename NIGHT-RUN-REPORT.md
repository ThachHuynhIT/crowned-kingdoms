# Night run report — 10/11/2026 (lượt 1: 02:08 → 03:30; lượt 2: 06:01 →)

Nhánh `pc-king-select-cards` (chưa push, chưa PR, chưa merge — theo quy tắc chạy đêm).

## Việc dở đã hoàn thành
- Spec + plan "rút 1 lá mỗi năm, bắt buộc ra trận, Mua thẻ" (Codex viết, Claude review 2 vòng) đã commit.
- Phase 1–3 của plan `docs/superpowers/plans/2026-11-10-draw-one-and-shop.md` đã làm và commit.
- Phase 4 (cân bằng) làm một phần: chưa đạt mục tiêu.

## Commit đêm nay
| Commit | Nội dung |
|---|---|
| `ca34087` | docs: spec và plan |
| `1167491` | Phase 1–3: năm 1 có 5 lá, mỗi năm sau rút 1 lá (2 lá ở năm 5, 10, 11, 15, 20, 21, 25), bài cũ giữ lại; trận tự bắt đầu khi tay còn 2 lá (năm 30 của ván 30 năm: 0 lá), bỏ nút Ra trận, có dòng nhắc; Mua thẻ (5, 8, 11… vàng, thẻ ngẫu nhiên của vua mình, luồng RNG riêng `shop`), save v8 + migrator 7→8; Bàn Tay Thứ Tư = rút thêm 1 lá/năm; đổi bài rút lại đúng số lá đang cầm; zoom PC (xa hơn 60%, gần nhất = mức xa nhất cũ, kéo ngang hẹp 40%); đạn công trình bay từ 80% chiều cao; âm lượng 0,25; bot greedy mua tối đa 2 thẻ/năm |
| `861d2e5` | Cân bằng (dở): sức địch 1,75, hệ số máu/sát thương boss, khiên boss 3 = 1200 (sửa lỗi trận kẹt), Cuồng Nộ 60 giây/+20%, máu Ngai theo vua |
| (commit cuối) | ROADMAP + báo cáo này |

Kiểm tra cuối: lint, typecheck, build qua; 2693 test qua. Benchmark thời gian (`benchmark.test.ts`) chỉ fail khi máy đang chạy việc nặng song song; chạy riêng 3/3 qua. 83 test Python qua.

Trình duyệt (Playwright, 1280×720, ảnh trong `.superpowers/night-planning-1.png`, `night-battle-1.png`): tay 5 lá, nút "Mua thẻ · 5 vàng", dòng nhắc "Chơi hoặc bán bài tới khi còn 2 lá…", mua → tay 6 lá và -5 vàng, bán xuống 2 lá → trận tự bắt đầu. Chưa xem tay cuộn khi > 6 lá, chưa nhìn tận mắt điểm bắn đạn trong trận.

## Quyết định kèm lý do
- **Dùng các đề xuất trong plan** (giá mua +3/lần, Bàn Tay Thứ Tư = +1 lá/năm, đạn ở 80% chiều cao, đổi bài giữ số lá): chủ dự án giao toàn quyền đêm nay.
- **Bỏ "chặn mọi lệnh khi tay đã tới ngưỡng"** mà plan đề xuất: làm vỡ hàng chục test tay 1–2 lá và không cần, vì controller vào trận ngay khi tới ngưỡng; một lệnh lọt vào trước đó vô hại.
- **Bot trả `startBattle` đầu tiên khi tay tới ngưỡng**, để mọi vòng chạy bot (test, headless, controller) khớp nhau.
- **Giảm boss bằng hệ số lúc dựng trận** (`BOSS_HP_MULT`, `BOSS_DMG_MULT` trong `src/data/battle.ts`) thay vì sửa bảng `BOSSES`: giữ test cơ chế boss theo số trong bảng.
- **Khiên boss 3 = 1200**: chẩn đoán cho thấy khiên 3000 hồi đầy mỗi 100 tick không phá kịp → trận đứng tới trần 3000 tick, mà trần nay là thua. Đây là lỗi thật bị che bởi luật cũ "hết giờ = thắng".
- **Cuồng Nộ dịu hơn** (600 tick/+20%): với 300/+25%, vài địch sót lại hạ Ngai rất nhanh ở trận boss năm 20.

## Kết quả rà soát luật
- Luật trong code, help (`src/ui/help/mechanics.ts`), GDD (`docs/GDD.md`) và ROADMAP đã khớp luật mới.
- Lỗi tìm được: khiên boss 3 làm trận kẹt (đã sửa). Luật cũ "hết giờ = thắng" che lỗi này.
- Mất cân bằng (số liệu `npm run balance`, 30 ván/vua, chi tiết trong `docs/balance/2026-11-10-draw-one-balance.md`): thắng 27–83% mỗi vua (đá 83, lò rèn 70, rừng 63, phép 57, du mục 47, đồng hồ 43, trăng 33, lúa 33, thuỷ triều 27). Gần như mọi ván thua ở trận boss năm 20 (Nữ Hoàng Ong bay, quân cận chiến không đánh được) và năm 30. Năm thường gần như không thua.

## So sánh với 9 Kings
- Wiki fandom (402) và wiki hoodedhorse (403) chặn truy cập tự động; tìm kiếm chỉ ra review chung. Phần so sánh dựa trên hiểu biết sẵn có, ở mức thể loại. Nguồn đã xem: https://store.steampowered.com/app/2784470/9_Kings/, https://www.elliotcsmith.com/9-kings-early-access-review/, https://strategyandwargaming.com/2025/05/29/9-kings-review-time-wasted-in-the-best-possible-way
- Đề xuất (chưa làm):
  1. **Phản hồi sau trận:** bảng nhỏ "công trình nào gây nhiều sát thương / Ngai mất bao nhiêu máu" để người chơi hiểu vì sao thắng thua.
  2. **Nhịp lựa chọn:** rút 1 lá/năm làm năm thường chỉ có 1 quyết định; nên thêm "thương nhân" hiếm (vài năm một lần, chọn 1 trong 3, rẻ hơn Mua thẻ mù).
  3. **Độ sâu:** thêm tương tác lân cận giữa công trình của các vua khác (thẻ chinh phục).
  4. **Boss bay:** cho Nữ Hoàng Ong đáp xuống định kỳ để quân cận chiến đánh được, hoặc tăng khả năng bắn quân bay của tháp. Đây là nguyên nhân chính của chênh lệch giữa các vua.
  5. **Vua Phép Thuật:** dữ liệu đã có lính Construct cận chiến nhưng chỉ phe địch dùng; cho một thẻ của vua này gọi Construct.

## Việc còn dở và bước tiếp theo
1. **Cân bằng (Phase 4 chưa xong):** sửa cơ chế boss 2 (bay) trước, rồi chỉnh thẻ vua mạnh (đá, lò rèn), sau đó chạy `npm run balance -- --king all --runs 500 --bot greedy --difficulty 0` tới khi đạt 35–65% mỗi vua, chênh lệch ≤ 15 điểm. Ghi lại baseline `src/game/run/endlessCompatibility.test.ts` sau mỗi lần đổi số.
2. **Kiểm giao diện bằng mắt:** tay cuộn khi > 6 lá (mua nhiều thẻ), đạn bay từ mái công trình, zoom/pan PC ở hai pha.
3. **Chủ dự án duyệt:** giá Mua thẻ (+3/lần), Bàn Tay Thứ Tư mới, mức giảm boss.
4. **Để sau:** cây/đá bỏ viền, can thiệp riêng từng vua, toàn bộ phần điện thoại.

---

## Lượt 2 (06:01 →)

### Việc dở đang làm tiếp: cân bằng (Phase 4)
- Chẩn đoán trận boss năm 20 (Vua Lúa Mì, seed 1–2): Nữ Hoàng Ong và đàn ong con đều bay; quân cận chiến đứng gần mà không đánh được, đàn ong ra mỗi 50 tick tích dần rồi hạ Ngai khoảng tick 1100–1200.
- Sửa cơ chế (dữ liệu `BOSS_RULES.hornet`): đàn ong mỗi 100 tick (trước 50), boss đáp 70/150 tick (trước 40/150). Chẩn đoán lại: Lúa Mì và Thuỷ Triều seed 2 đều hạ được boss.
- Commit `63b0f96`: sửa đàn ong (mỗi 100 tick) và thời gian boss đáp (70/150 tick); `ENEMY_STAT_MULT` 2,05, `BOSS_HP_MULT` [1; 0,55; 0,27]; thêm `FOE_MULT_BY_KING` (sức địch theo vua mình chơi, giải pháp tạm). **100 ván/vua: 48–63% mỗi vua, chênh lệch 15,0 điểm → ĐẠT mục tiêu.** Baseline Endless ghi lại. Gate đầy đủ qua (2696 test, build, benchmark).
- Đang chạy nền: mẫu nghiệm thu 500 ván/vua (bắt đầu 06:28).
- Kiểm trình duyệt 1280×720: tìm ra lỗi tay cuộn (tay 9 lá, sau khi lăn chuột các lá tràn ra đè nút Mua thẻ/Đổi bài/Bộ bài; ảnh `.superpowers/morning-hand-9*.png`) → đã giao Codex sửa (review vòng 1). Trận có 3 tháp Bù Nhìn: tên bay giữa tháp và địch (`.superpowers/morning-battle-towers.png`).

### Quyết định lượt 2
- **`FOE_MULT_BY_KING`** thay vì chỉnh thẻ từng vua: chênh lệch giữa các vua ổn định qua mọi lần đổi số chung, và chỉnh thẻ cần nhiều lượt đo hơn thời gian còn lại. Ghi rõ là tạm.
- **Sửa đàn ong thay vì giảm máu boss**: giảm máu boss 2 gần như không đổi kết quả năm 20; nguyên nhân là đàn ong bay mà quân cận chiến không đánh được.
- Commit `741fd07`: sửa tay cuộn (Codex, review vòng 1). Lá không nằm trọn trong khung tay bị ẩn và không nhận chuột; cuộn từng lá; dòng nhắc chuyển lên khu HUD phía trên, không đè bàn cờ. Kiểm lại trên trình duyệt với tay 9 lá: không còn đè nút (`.superpowers/morning-hand-9-r2*.png`).
- Commit `60b635a`: **việc mới** từ đề xuất so sánh với 9 Kings, phản hồi sau trận. Bảng tóm tắt thêm "Ngai mất: N% máu" và "Giỏi nhất: <công trình> (K địch)"; Codex làm, mình review, có test. Chưa xem bằng mắt: ảnh chụp lúc ép trận chạy nhanh không vẽ kịp khung hình, console không lỗi.
  - Quyết định: không lập spec/plan qua Codex cho việc này vì nó chỉ là hai dòng chữ trong bảng có sẵn; một plan riêng sẽ tốn hơn chính việc đó.
- Commit `035c923`: mẫu nghiệm thu **500 ván/vua** (seeds 1–500, Gai 0): phép 52,4% · đồng hồ 66,2% · lò rèn 61,0% · rừng 62,8% · trăng 58,6% · du mục 51,0% · đá 53,0% · thuỷ triều 63,2% · lúa 57,0%. **Chênh lệch 15,2 điểm, gần đạt** (mục tiêu ≤ 15; Đồng Hồ vượt trần 65% thêm 1,2 điểm). Mình giữ đúng cấu hình đã đo, không chỉnh thêm số chưa đo.
- Rà chữ nhiệm vụ và sắc lệnh (`src/data/quests.ts`, `src/data/decrees.ts`): không còn câu nào giả định "chơi 1 lá/năm" hay "hết giờ là thắng".

### Commit lượt 2
| Commit | Nội dung |
|---|---|
| `63b0f96` | Sửa đàn ong và thời gian boss đáp, sức địch, `FOE_MULT_BY_KING`; 100 ván/vua đạt |
| `741fd07` | Sửa tay cuộn che nút (Codex, review vòng 1) |
| `60b635a` | Bảng tóm tắt sau trận: % máu Ngai mất và công trình giỏi nhất |
| `035c923` | Kết quả 500 ván/vua |
| (commit cuối) | Báo cáo này |

Kiểm tra lượt 2: lint, typecheck, test (2699 qua), build và benchmark đều qua ở lần chạy gate cuối; 83 test Python qua ở lượt 1, lượt 2 không đổi file Python.

## Việc còn dở và bước tiếp theo (cập nhật 07:23)
1. **Cân bằng nốt:** đổi `FOE_MULT_BY_KING.clock` 0,9 → 0,93 và `nomad` 1,04 → 1,02 (`src/data/battle.ts`), chạy lại `npm run balance -- --king all --runs 500 --bot greedy --difficulty 0` (khoảng 55 phút), rồi ghi lại baseline `src/game/run/endlessCompatibility.test.ts` nếu số đổi.
2. **Thay `FOE_MULT_BY_KING` bằng chỉnh thẻ từng vua** (cách lâu dài), đo lại.
3. **Xem bằng mắt:** bảng tóm tắt sau trận (cho trận chạy bình thường ở ×3, không ép tick), đường bay của đạn từ mái.
4. **Chủ dự án duyệt:**
   - giá Mua thẻ +3/lần;
   - Bàn Tay Thứ Tư mới (rút thêm 1 lá/năm);
   - đàn ong thưa hơn và boss đáp lâu hơn;
   - `FOE_MULT_BY_KING`: vua mạnh gặp địch mạnh hơn, giải pháp tạm.
5. **Đề xuất từ so sánh 9 Kings còn lại:** thương nhân hiếm (chọn 1 trong 3), tương tác lân cận giữa thẻ của các vua, cho Vua Phép Thuật gọi Construct.
6. **Để sau:** cây/đá bỏ viền, can thiệp riêng từng vua, toàn bộ phần điện thoại.

---

## Lượt 3 (09:00 →)
- Việc dở 1: chỉnh `FOE_MULT_BY_KING` (đồng hồ 0,93, du mục 1,02); đang chạy lại 500 ván/vua (bắt đầu 09:00).
- Việc dở 3: đã xem bảng tóm tắt sau trận trong trận chạy bình thường ở ×3 (`.superpowers/day-summary.png`): "Ngai mất: 100% máu", "Giỏi nhất: Ngai Bó Lúa (4 địch)", chữ nằm gọn trong khung, nút Tiếp tục đủ lớn.
- **Việc mới: Thương nhân** (đề xuất 2 từ so sánh 9 Kings). Codex viết spec + plan (`0a3962e`), mình review 1 vòng, không có lỗi chặn.
  - Phase 1 (logic, mình làm, có test) `16d46d4`: sau trận năm 6, 12, 18, 24 (Vô tận sau năm 30: cứ 6 năm) bày 3 thẻ như thẻ thưởng, giá 3 vàng, mua tối đa 1 hoặc bỏ qua miễn phí; luồng RNG `shop`; save v9 (migrator 8→9 chỉ đổi số phiên bản); bot greedy mua khi còn ≥ 4 vàng sau khi trả.
  - Phase 2 (giao diện, Codex làm, mình review và sửa 1 lỗi kiểu) `2efebf4`: giá dưới mỗi lá, lá không đủ vàng bị mờ, nút Mua/Bỏ qua. Kiểm trên trình duyệt (`.superpowers/day-merchant*.png`).
  - Phase 3: mục trợ giúp `Thương nhân` (đọc số từ dữ liệu, có test). Còn đo cân bằng sau khi phép đo 500 ván đang chạy xong.
  - Quyết định: các con số (năm 6/12/18/24, giá 3, 3 thẻ) do mình chọn khi chạy tự động. Giá rẻ hơn Mua thẻ (5) vì người chơi bị giới hạn 1 lá và chỉ được chọn trong 3.
- **Cân bằng sau Thương nhân (11:25 → 12:05):** phép đo 500 ván cũ (chưa có Thương nhân) đã dừng và bỏ. Đo lại 500 ván/vua: 51,2–66,2%, Lò Rèn vượt trần; tăng `FOE_MULT_BY_KING.forge` 1,07 → 1,1, đo lại Lò Rèn: 60,4%. **Kết quả: 51,2–65,0%, chênh 13,8 điểm, ĐẠT.** Chi tiết: `docs/balance/2026-11-10-draw-one-balance.md`. Gate đầy đủ qua (2713 test, build, 83 test Python).
