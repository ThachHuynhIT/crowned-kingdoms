# Cân bằng lại sau khi làm lại chiến trường (09/11/2026)

Nhánh `battle-field-rework`, spec `docs/superpowers/specs/2026-11-09-battle-field-rework-design.md`. Mục tiêu không đổi (spec §1 #7): bot `greedy`, Gai 0, 500 ván mỗi vua, mỗi vua thắng 35–65%, chênh lệch cao nhất − thấp nhất ≤ 15 điểm %.

## Vì sao phải cân bằng lại

Các thay đổi đã làm người chơi mạnh hơn nhiều:

- tầm bắn của tháp ×3;
- công trình chặn đường và địch phải phá hết công trình trước khi đánh Ngai;
- lính xếp đội hình trước bàn cờ, và cổng xa hơn 1,5 lần.

Với số cũ, bot greedy thắng 98–100% với cả chín vua (100 ván/vua).

## Thay đổi dữ liệu

- **Toàn cục:**
  - `ENEMY_STAT_MULT = 2.05` (`src/data/battle.ts`): máu và sát thương của mọi lính địch (2,25 trước khi sửa tầm đánh cận chiến ở góc nhà, xem cuối báo cáo).
  - `TOWER_SHOT_DMG_MULT = 0.6` (`src/data/scaling.ts`): sát thương đòn bắn của tháp. Tầm ×3 giữ nguyên như chủ dự án muốn. Xung, Ngai và lính không bị ảnh hưởng.
- **Máu Ngai:** Lúa Mì 1100 (cũ 430), Đồng Hồ 720 (350), Ánh Trăng 560 (465), Du Mục 520 (470), Phép Thuật 450 (378), Rừng Xanh 290 (330), Thuỷ Triều 250 (470), Lò Rèn 190 (288), Đá Núi 115 (270).
- **Đá Núi** (thắng 100% kể cả sau hai thay đổi toàn cục, vì nhà của vua này rất trâu mà địch giờ phải phá hết):
  - Người Đá: máu 130 (cũ 220), sát thương 12 (cũ 14).
  - Bùa Da Đá: +12% máu mỗi lớp (cũ +20%).
  - Ngai: tháp +5..10% sát thương (cũ +10..20%).
  - Tháp Pha Lê: cộng dồn tối đa +100% (cũ +200%).
  - Tim Núi: xung mỗi 60 tick (cũ 40), máu 450–900 (cũ 600–1200).
- **Du Mục:** Vệ Binh Khả Hãn máu 90 (cũ 110).

## Kết quả cuối (500 ván mỗi vua)

Đo sau khi lính to 1,3 lần, đội hình giãn 16 px và tầm đánh của lính tới nhà tính theo khối vuông.

| Vua | Thắng | Năm trung bình |
|---|---|---|
| Phép Thuật | 45,0% | 27,6 |
| Đồng Hồ | 47,0% | 28,5 |
| Lò Rèn | 51,6% | 28,3 |
| Rừng Xanh | 55,4% | 27,2 |
| Ánh Trăng | 50,0% | 28,7 |
| Du Mục | 50,8% | 28,4 |
| Đá Núi | 52,6% | 28,1 |
| Thuỷ Triều | 52,6% | 28,9 |
| Lúa Mì | 53,4% | 28,9 |

Chênh lệch 10,4 điểm: **đạt**. Lệnh: `npm run balance -- --king all --runs 500 --bot greedy --difficulty 0`.

**Vì sao giảm hệ số địch:**
- Trước đây lính đánh nhà dừng ở khoảng cách hình tròn, rồi bị khối vuông đẩy ra ở góc nhà, nên mất nhiều nhịp đánh và nhà lâu chết hơn thực tế.
- Sau khi tính đúng theo khối vuông, địch phá nhà nhanh hơn: tỉ lệ thắng tụt còn khoảng 31%.
- Vì vậy `ENEMY_STAT_MULT` giảm từ 2,25 xuống 2,05, và máu Ngai của năm vua được chỉnh lại.
