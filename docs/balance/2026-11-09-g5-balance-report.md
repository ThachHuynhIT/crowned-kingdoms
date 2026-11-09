# G5 — Báo cáo cân bằng (09/11/2026)

Plan `docs/superpowers/plans/2026-11-09-g5-balance-polish.md` P1–P2. Mục tiêu (spec §1 #7): bot `greedy`, Gai 0, **500 ván/vua**, mỗi vua thắng 35–65%, chênh lệch cao nhất − thấp nhất ≤ 15 điểm %.

## Cách đo

- Lệnh: `npm run balance -- --king all --runs 500 --bot greedy --difficulty 0` (`tools/balance.ts`), luật `RULES_FULL` (30 năm), seed 1…500 mỗi vua, không perk, không thẻ meta, bot bật Tự bắn và không can thiệp tay.
- Bot `greedy` (`src/game/sim/bots/greedy.ts`): chấm mỗi nước đi hợp lệ bằng thay đổi Σ HP × DPS phe mình sau `buildBattleSetup` (Ngai, công trình, lính, triệu hồi đầu trận); không tính giá trị tương lai (kinh tế, triệu hồi định kỳ, tăng tiến, độc/cháy, hồi máu, nổ lan). Hội đồng, nhiệm vụ: chính sách của bot `scripted`.
- CSV: `tools/out/balance-greedy-gai-0-{runs,summary,cards,years}.csv` (git-ignore; bản lưu trong `tools/out/{baseline,final-v1,final}/`).
- Mỗi đợt 500 × 9 = 4.500 ván mất 25–28 phút trên máy phát triển (chạy cùng lúc với Codex sinh ảnh).

## Baseline (commit `badc3bf`, số liệu gốc)

| Vua | Thắng | Năm TB |
|---|---:|---:|
| arcane | 83,2% | 29,9 |
| clock | 85,2% | 30,0 |
| forge | 92,0% | 30,0 |
| grove | 86,0% | 30,0 |
| moon | 2,8% | 22,9 |
| nomad | 82,6% | 30,0 |
| stone | 100,0% | 30,0 |
| tide | 75,2% | 29,9 |
| wheat | 83,4% | 30,0 |

Chênh lệch 97,2 điểm. Hai phát hiện:

1. **Trận thường không bao giờ thua.** Mọi trận thua nằm ở năm boss: năm 10 thua 3%, năm 20 thua 80%, năm 30 thua 82%. Với 3 mạng, thua hai trận boss vẫn thắng ván, nên gần như mọi vua thắng.
2. **Ánh Trăng 2,8% là lỗi của bot, không phải của game.** Bot chọn Giao Ước Nguyệt Thực (−1 mạng, +2 cấp nhà) ở 70% số lần được mời, vì tính sức quân mà không tính mạng, rồi hết mạng ở boss. Đã sửa bot: không bao giờ chơi lá làm mất mạng (`greedy.test.ts` "never plays a card that costs a life"). Đo lại riêng Ánh Trăng: 97,2%.

## Thử nghiệm (40–60 ván/vua, chỉ để định hướng)

| Thử | Kết quả |
|---|---|
| Quân trận thường (Thổ Phỉ, Liên Quân, vua tấn công) ×1,4 | 92–100%: trận thường vẫn không thua |
| … ×2,0 | 92–100%: vẫn không thua; bỏ hướng này, trả số cũ |
| Mạng đầu ván 3 → 2 | 20–60%, riêng Đá Núi 100% |
| + Ngai Đá 450 → 360, quân hộ tống boss ×[1,5; 1,75; 2,0] → [1,4; 1,6; 1,8] | Đá Núi 72,5%, các vua khác 15–60% |
| Ba vòng chỉnh máu Ngai từng vua (máu Ngai quyết định trận boss: trận thắng nếu Ngai còn tới hết giờ) | 43–60%, chênh lệch 16,7 điểm (60 ván) |

## Số đã đổi (cũ → mới)

| Dữ liệu | Cũ | Mới | Lý do |
|---|---:|---:|---|
| `RUN.startLives` (`src/data/run.ts`) | 3 | 2 | Với 3 mạng người chơi thắng dù thua hai trận boss; 2 mạng làm trận boss 20/30 thật sự quyết định ván |
| `SLOT_MULT.boss` (`src/data/battle.ts`) | 1,5 / 1,75 / 2,0 | 1,4 / 1,6 / 1,8 | Bớt quân hộ tống boss để các vua yếu không rơi xuống dưới 35% khi chỉ còn 2 mạng |
| Máu Ngai Lúa Mì | 300 | 430 | Các vua dưới 35% với 2 mạng được thêm máu Ngai |
| Máu Ngai Đá Núi | 450 | 270 | Đá Núi thắng 100% trận boss |
| Máu Ngai Phép Thuật | 280 | 378 | |
| Máu Ngai Rừng Xanh | 320 | 330 | |
| Máu Ngai Thuỷ Triều | 300 | 470 | |
| Máu Ngai Lò Rèn | 340 | 288 | |
| Máu Ngai Đồng Hồ | 300 | 350 | |
| Máu Ngai Ánh Trăng | 240 | 465 | |
| Máu Ngai Du Mục | 300 | 470 | |

Máu Ngai là đòn bẩy trực tiếp nhất vì ở trận boss, trận chỉ thua khi Ngai bị phá trước hết giờ. Các Ngai yếu về sát thương (Thuỷ Triều, Du Mục, Ánh Trăng) cần nhiều máu hơn để sống tới hết giờ.

## Đợt 500 ván lần 1 (trước lần chỉnh cuối)

| Vua | Thắng |
|---|---:|
| arcane | 55,4% |
| clock | 44,8% |
| forge | 45,2% |
| grove | 50,8% |
| moon | 40,4% |
| nomad | 51,0% |
| stone | 50,8% |
| tide | 56,6% |
| wheat | 56,0% |

Mọi vua trong 35–65%, chênh lệch 16,2 điểm (vượt 15). Thua theo năm: năm 10 0,4%, năm 20 75,9%, năm 30 80,8%; trận thường vẫn không thua.

## Đợt 500 ván cuối

Commit `75a1448` (số liệu ở bảng "Số đã đổi"), 500 ván/vua, 4.500 ván, 21,8 phút.

| Vua | Thắng | Năm TB |
|---|---:|---:|
| arcane | 55,6% | 29,9 |
| clock | 47,8% | 30,0 |
| forge | 45,8% | 29,8 |
| grove | 50,8% | 30,0 |
| moon | 44,8% | 30,0 |
| nomad | 51,0% | 30,0 |
| stone | 50,8% | 30,0 |
| tide | 54,4% | 30,0 |
| wheat | 53,0% | 30,0 |

**Đạt mục tiêu spec §1 #7:** mọi vua trong 35–65%, chênh lệch 10,8 điểm (≤ 15). Không có ván lỗi hay lệnh bất hợp lệ. Thua theo năm: năm 10 0,4%, năm 20 76,1%, năm 30 80,5%; các năm khác 0%. Sai số lấy mẫu (95%) với 500 ván quanh 50% là khoảng ±4,4 điểm.

## Giới hạn đã biết

- Bot greedy không bao giờ thua trận thường, nên cân bằng hiện tại dựa gần như hoàn toàn vào trận boss năm 20 và 30. Người chơi thật có thể thua trận thường; độ khó cảm nhận cần chơi thử.
- Heuristic không đánh giá thẻ kinh tế; vua kinh tế (Lúa Mì) có thể mạnh hơn khi người thật chơi.
- Bot `random` và `scripted` không được dùng làm tiêu chí.
