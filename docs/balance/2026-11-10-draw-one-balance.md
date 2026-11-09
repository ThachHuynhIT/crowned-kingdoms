# Cân bằng sau luật rút 1 lá/năm (10/11/2026, chạy đêm, CHƯA ĐẠT)

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
