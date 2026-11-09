# Night run report — 10/11/2026 (02:08 → 03:30)

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
