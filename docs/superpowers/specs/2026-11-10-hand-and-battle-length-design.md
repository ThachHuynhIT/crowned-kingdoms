# Tay bài lớn, chơi nhiều lá, trận không giới hạn giờ (10/11/2026)

Phản hồi của chủ dự án (ROADMAP mục 5, 8, 9), chỉ trên PC; bố cục điện thoại để sau.

## Vì sao

- Mỗi năm chỉ được chơi 1 trong 3 lá nên ít lựa chọn. Chủ dự án muốn cầm nhiều bài hơn và chơi nhiều lá mỗi năm.
- Trận hiện thắng khi Ngai sống qua 1 phút 30 (900 tick), làm game "khó chết". Chủ dự án muốn trận đánh tới khi một bên thật sự thua.
- Thanh máu công trình hiện cả khi chưa bị đánh, làm rối màn hình.

## Luật mới (chủ dự án đã chọn)

1. **Tay bài 5 lá.**
   - Đầu năm giữ bài cũ, rút cho đủ 5 lá (`RUN.handSize` 3 → 5).
   - Sắc lệnh Bàn Tay Thứ Tư thành +1: tay 6 lá (`DECREE_RULES.hand` = `handSize + 1`). Tên sắc lệnh giữ nguyên, chữ "Rút {hand} thẻ mỗi năm" tự đúng.
2. **Chơi và bán bao nhiêu lá cũng được** trong pha chuẩn bị.
   - Mỗi lá bán ra vẫn +2 vàng (`skipPlayGold`).
   - Lệnh "bỏ" (`discard`) cũng không còn giới hạn một lần.
3. **Nút Ra trận** chỉ sáng khi trên tay còn ≤ 2 lá. Người chơi tự bấm, và có thể chơi tiếp tới 0 lá rồi mới bấm.
   - Ngưỡng nằm trong `src/data` (`RUN.battleHandMax = 2`).
   - Luật G1 (`autoStart`) tự vào trận ngay khi tay xuống ≤ 2.
4. **Đổi bài** (reroll) chỉ được trước lá đầu tiên của năm, như hiện nay. Cờ `played` giữ nghĩa "năm nay đã chơi hoặc bán ít nhất một lá". `RunState` không đổi dạng, không bump save version.
5. **Trận không còn thắng vì hết giờ.**
   - Thắng: đã ra hết các đợt, boss đã xong, và không còn địch nào sống.
   - Thua: Ngai về 0.
   - Cuồng Nộ vẫn bắt đầu ở tick 600 (1 phút). Từ đó cứ 300 tick (30 giây) địch mạnh thêm một bậc: sát thương +25% mỗi bậc, cộng dồn (`BATTLE.rageStackTicks`, `rageStackDmgPct`).
   - Trần an toàn 3000 tick (5 phút, `hardLimitTick`): tới đó trận chưa xong thì **tính thua**.
   - Giờ Vàng (perk cộng tick) vẫn lùi cả Cuồng Nộ lẫn trần.
6. **Thanh máu công trình** (và Ngai) chỉ hiện sau lần đầu bị trúng đòn. Lính giữ như hiện nay.

## Ảnh hưởng

- **Giao diện:**
  - Tay bài trên PC tới 6 lá 148×208, nằm vừa giữa Đổi bài/Bán bài và Bộ bài ở 1280 px.
  - Mọi chỗ đang chặn theo `state.played` (chọn lá, kéo thả, bán, xem trước ô) đổi sang "còn bài trên tay và đang ở pha chuẩn bị".
  - Hiệu ứng thẻ bay và tiếng chơi thẻ bắt theo việc tay bớt đi một lá vì được chơi, không theo cờ `played`.
- **Bot** `greedy`, `random`, `scripted` chơi nhiều lá:
  - chơi các lá có lợi khi còn chỗ;
  - bán lá vô dụng khi tay > 2;
  - vào trận khi tay ≤ 2.
- **Cân bằng:**
  - Người chơi mạnh lên rất nhiều (khoảng 3 lá/năm thay vì 1), trận lại khó hơn (không thắng vì hết giờ).
  - Chỉnh lại sức mạnh địch rồi chạy `npm run balance` 500 ván/vua, mục tiêu 35–65% mỗi vua, chênh lệch ≤ 15 điểm.
  - Ghi báo cáo `docs/balance/2026-11-10-hand-rework-balance.md`.
  - Ghi lại baseline `endlessCompatibility`.
- **Trợ giúp:** câu "Hết 900 tick mà Ngai còn sống là thắng" đổi theo luật mới.
- **Lưu ván:** không đổi định dạng. Ván cũ đang ở giữa năm vẫn tải được; năm sau rút đủ 5.

## Không làm

- Bố cục điện thoại cho tay 5–6 lá (để sau, khi chủ dự án bảo).
- Đổi luật boss, phần thưởng hay giá đổi bài.
