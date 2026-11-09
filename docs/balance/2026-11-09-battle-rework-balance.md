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
  - `ENEMY_STAT_MULT = 2.25` (`src/data/battle.ts`): máu và sát thương của mọi lính địch.
  - `TOWER_SHOT_DMG_MULT = 0.6` (`src/data/scaling.ts`): sát thương đòn bắn của tháp. Tầm ×3 giữ nguyên như chủ dự án muốn. Xung, Ngai và lính không bị ảnh hưởng.
- **Máu Ngai:** Lúa Mì 900 (cũ 430), Đồng Hồ 600 (350), Ánh Trăng 560 (465), Phép Thuật 450 (378), Du Mục 450 (470), Thuỷ Triều 360 (470), Lò Rèn 220 (288), Rừng Xanh 250 (330), Đá Núi 140 (270).
- **Đá Núi** (thắng 100% kể cả sau hai thay đổi toàn cục, vì nhà của vua này rất trâu mà địch giờ phải phá hết):
  - Người Đá: máu 130 (cũ 220), sát thương 12 (cũ 14).
  - Bùa Da Đá: +12% máu mỗi lớp (cũ +20%).
  - Ngai: tháp +5..10% sát thương (cũ +10..20%).
  - Tháp Pha Lê: cộng dồn tối đa +100% (cũ +200%).
  - Tim Núi: xung mỗi 60 tick (cũ 40), máu 450–900 (cũ 600–1200).
- **Du Mục:** Vệ Binh Khả Hãn máu 90 (cũ 110).

## Kết quả (500 ván mỗi vua)

| Vua | Thắng | Năm trung bình |
|---|---|---|
| Phép Thuật | 48,0% | 28,3 |
| Đồng Hồ | 43,4% | 28,5 |
| Lò Rèn | 56,2% | 28,7 |
| Rừng Xanh | 54,4% | 27,7 |
| Ánh Trăng | 48,0% | 28,7 |
| Du Mục | 49,6% | 28,3 |
| Đá Núi | 55,8% | 28,8 |
| Thuỷ Triều | 54,4% | 29,0 |
| Lúa Mì | 53,8% | 28,9 |

Chênh lệch 12,8 điểm: **đạt**. Lệnh: `npm run balance -- --king all --runs 500 --bot greedy --difficulty 0` (40 phút).
