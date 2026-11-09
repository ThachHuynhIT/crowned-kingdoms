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
- **Máu Ngai:** Lúa Mì 900 (cũ 430), Đồng Hồ 720 (350), Ánh Trăng 560 (465), Phép Thuật 450 (378), Du Mục 450 (470), Thuỷ Triều 360 (470), Lò Rèn 220 (288), Rừng Xanh 250 (330), Đá Núi 115 (270).
- **Đá Núi** (thắng 100% kể cả sau hai thay đổi toàn cục, vì nhà của vua này rất trâu mà địch giờ phải phá hết):
  - Người Đá: máu 130 (cũ 220), sát thương 12 (cũ 14).
  - Bùa Da Đá: +12% máu mỗi lớp (cũ +20%).
  - Ngai: tháp +5..10% sát thương (cũ +10..20%).
  - Tháp Pha Lê: cộng dồn tối đa +100% (cũ +200%).
  - Tim Núi: xung mỗi 60 tick (cũ 40), máu 450–900 (cũ 600–1200).
- **Du Mục:** Vệ Binh Khả Hãn máu 90 (cũ 110).

## Kết quả (500 ván mỗi vua, sau khi lính to 1,3 lần và đội hình giãn 16 px)

| Vua | Thắng | Năm trung bình |
|---|---|---|
| Phép Thuật | 46,8% | 28,2 |
| Đồng Hồ | 47,2% | 28,9 |
| Lò Rèn | 57,8% | 28,8 |
| Rừng Xanh | 54,4% | 27,4 |
| Ánh Trăng | 47,2% | 28,6 |
| Du Mục | 49,8% | 28,5 |
| Đá Núi | 56,8% | 29,0 |
| Thuỷ Triều | 53,8% | 29,0 |
| Lúa Mì | 52,0% | 28,9 |

Chênh lệch 11,0 điểm: **đạt**. Lần chạy đầu sau khi lính to ra lệch 17,6 điểm (Đồng Hồ 41,0%, Đá Núi 58,6%), nên Ngai Đồng Hồ tăng lên 720 và Ngai Đá Núi giảm còn 115; hai vua này chạy lại 500 ván, các vua khác không đổi dữ liệu nên giữ kết quả. Lệnh: `npm run balance -- --king all --runs 500 --bot greedy --difficulty 0` (40 phút).
