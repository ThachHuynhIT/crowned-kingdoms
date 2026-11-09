# Cân bằng sau luật rút 1 lá/năm (10/11/2026)

Lệnh: `npm run balance -- --king all --runs 30 --bot greedy --difficulty 0` (seeds 1–30, `RULES_FULL`, perk null). Chỉ là mẫu nhanh 30 ván/vua (mỗi lượt ~4 phút); mẫu nghiệm thu 500 ván/vua chưa chạy.

| Lượt | Thay đổi | Thắng mỗi vua | Ghi chú |
|---|---|---|---|
| 0 | luật mới, `ENEMY_STAT_MULT` 2,05 | 6,7–16,7% | quá khó |
| 1 | mult 1,45 | 10–23% | năm thường không thua trận nào; gần như mọi ván thua ở boss năm 20 và 30 |
| 2–3 | máu boss 2/3 giảm; Cuồng Nộ 600 tick/+20% (trước 300/+25%) | 10–47% | chẩn đoán: boss 3 kẹt ở pha khiên (3000, hồi mỗi 100 tick) → trận kéo tới trần 3000 tick = thua; boss 2 bay, quân cận chiến không đánh được |
| 4 | khiên boss 3 = 1200 | 13–67% | |
| 5/7 | mult 1,75, `BOSS_HP_MULT` [1; 0,39; 0,27], `BOSS_DMG_MULT` [1; 0,64; 1] | 27–83% (TB ~50%) | |
| 8 | máu Ngai theo vua (đá 90, lò rèn 150, rừng 230, phép 400, thuỷ triều 330, trăng 720, lúa 1300, đồng hồ 850, du mục 600) | 27–83%: đá 83, lò rèn 70, rừng 63, phép 57, du mục 47, đồng hồ 43, trăng 33, lúa 33, thuỷ triều 27 | chênh lệch 57 điểm; máu Ngai gần như không đổi kết quả |

Tỉ lệ thua theo năm (lượt 8): năm 10: 20%, năm 20: 75%, năm 30: 49% ván còn sống; các năm khác < 2%.

## Kết luận và việc tiếp theo
- Trung bình đã về khoảng 50%, nhưng chênh lệch giữa các vua còn quá lớn (mục tiêu ≤ 15 điểm).
- Độ khó dồn hết vào trận boss năm 20 (Nữ Hoàng Ong bay): vua nào thiếu quân bắn xa thua gần như chắc. Cần sửa ở cơ chế (ví dụ boss đáp xuống định kỳ để cận chiến đánh được, hoặc tháp bắn được quân bay mạnh hơn), không phải chỉnh số chung.
- Máu Ngai theo vua ít tác dụng vì thua năm 20 thường là thua trắng; chỉnh sức mạnh thẻ của vua mạnh (đá, lò rèn) hiệu quả hơn.
- Phải chạy lại 500 ván/vua sau khi sửa.

## Lượt 2 (sáng 10/11/2026)

Chẩn đoán trận boss năm 20 (Lúa Mì seed 1–2, script tạm theo dõi máu Ngai, máu boss, số quân): Nữ Hoàng Ong và đàn ong con đều bay, quân cận chiến không đánh được. Đàn ong ra mỗi 50 tick, tích dần rồi hạ Ngai quanh tick 1100–1200.

| Lượt | Thay đổi | Thắng mỗi vua (30 ván) |
|---|---|---|
| c1 | `BOSS_RULES.hornet`: đàn ong mỗi 100 tick (trước 50), boss đáp 70/150 tick (trước 40/150) | 53–100% (năm 20 chỉ còn thua 15%) |
| c2 | `ENEMY_STAT_MULT` 2,05, `BOSS_HP_MULT[1]` 0,6 | 23–83% |
| c3 | thêm `FOE_MULT_BY_KING` (sức địch theo vua mình chơi) | 47–87% (lệch quá đà) |
| c4–c5 | giảm nửa độ lệch, chỉnh nhẹ: lúa 0,92 · đá 1,18 · phép 1,03 · rừng 0,95 · thuỷ triều 0,85 · lò rèn 1,07 · đồng hồ 0,9 · trăng 0,92 · du mục 1,04; `BOSS_HP_MULT` [1; 0,55; 0,27] | — |

**100 ván/vua (cấu hình c5): ĐẠT.** Thắng: phép 48%, đồng hồ 63%, lò rèn 57%, rừng 54%, trăng 50%, du mục 48%, đá 50%, thuỷ triều 59%, lúa 53%; chênh lệch 15,0 điểm. Thua theo năm (ván còn sống): năm 10: 21%, năm 20: 51%, năm 30: 64%; năm thường ≤ 2%.

Mẫu nghiệm thu 500 ván/vua: xem mục bên dưới (chạy sau commit này).

Ghi chú: `FOE_MULT_BY_KING` là giải pháp tạm. Cách lâu dài là chỉnh thẻ của từng vua để các vua mạnh ngang nhau khi gặp cùng một đạo quân địch.
