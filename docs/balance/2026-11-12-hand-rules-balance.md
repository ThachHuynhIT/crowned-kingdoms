# Cân bằng sau luật bài mới (12/11/2026)

Luật mới (chủ dự án 12/11/2026):
- thẻ thưởng, thẻ chinh phục và thẻ thưởng nhiệm vụ vào thẳng tay;
- tay tối đa 5 lá;
- Mua thẻ tối đa 3 lần mỗi năm.

Chủ dự án chọn cách chỉnh: **tăng sức địch, không tăng số lượng địch**. Chỉ đổi `ENEMY_STAT_MULT` (`src/data/battle.ts`), hệ số nhân máu và sát thương của từng kẻ địch. Số đợt, số con và ngân sách đạo quân giữ nguyên.

Lệnh đo: `npm run balance -- --king <vua> --runs N --bot greedy --difficulty 0` (seeds 1–N, `RULES_FULL`, perk null).

## Tỉ lệ thắng theo cấu hình

| Vua | Luật cũ, mult 1,5 (30 ván) | Luật mới, 1,5 (100) | 2,0 (30) | 2,4 (30) | **2,2 (100)** |
|---|---|---|---|---|---|
| Phép | 76,7% | 100% | 96,7% | 63,3% | **64%** |
| Đồng hồ | 70,0% | 98% | 83,3% | 33,3% | **55%** |
| Lò rèn | 66,7% | 95% | 73,3% | 43,3% | **62%** |
| Rừng | 40,0% | 100% | 76,7% | 43,3% | **69%** |
| Trăng | 66,7% | 100% | 76,7% | 30,0% | **54%** |
| Du mục | 63,3% | 100% | 76,7% | 50,0% | **68%** |
| Đá | 63,3% | 100% | 96,7% | 60,0% | **81%** |
| Thuỷ triều | 63,3% | 94% | 53,3% | 13,3% | **50%** |
| Lúa | 56,7% | 97% | 63,3% | 30,0% | **53%** |

## Kết quả: mult 2,2
- Trung bình khoảng 62%.
- Mục tiêu cũ là mỗi vua 35–65% và chênh lệch ≤ 15 điểm. Chưa đạt:
  - Đá 81%, Rừng 69%, Du Mục 68% vượt trần 65%;
  - chênh lệch 31 điểm (Thuỷ Triều 50% → Đá 81%).
- Chỉnh hệ số chung thì không thu hẹp được chênh lệch: ở 2,4 Thuỷ Triều chỉ còn 13% trong khi Phép vẫn 63%.

## Chỉnh riêng ba vua (chủ dự án duyệt 12/11/2026)

`KING_TUNING` (% máu và sát thương phe mình), mult 2,2, 100 ván/vua:

| Vua | Trước | Sau | Thắng trước → sau |
|---|---|---|---|
| Đá | −34 | −42 | 81% → 55% |
| Rừng | +21 | +15 | 69% → 60% |
| Du mục | +18 | +13 | 68% → 62% |

**Kết quả: ĐẠT.**
- Chín vua thắng 50–64%: Thuỷ Triều 50, Lúa 53, Trăng 54, Đá 55, Đồng Hồ 55, Rừng 60, Du Mục 62, Lò Rèn 62, Phép 64.
- Chênh lệch 14 điểm (mục tiêu ≤ 15), trung bình khoảng 57%.

## Còn lại
- Mẫu nghiệm thu 500 ván/vua chưa chạy.
