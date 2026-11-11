# Đo cân bằng — hoàn thiện bàn cờ isometric (plan 2026-11-08)

Công cụ: `src/game/sim/isoPolishMetrics.test.ts` (chạy theo yêu cầu, cùng vòng lặp với `runHeadless`). Mỗi pha: 3 vua × seed 1–100 × bot `random`/`scripted`, `RULES_FULL`. Lệnh:

```bash
ISO_POLISH_MEASURE=1 ISO_POLISH_PHASE=<pha> npx vitest run src/game/sim/isoPolishMetrics.test.ts --reporter=verbose
```

Baseline chạy trên commit `2840d2a` với `targeting.ts` gốc; Q1 chạy sau khi đổi luật chọn mục tiêu (cùng commit gốc + thay đổi Q1). Log thô: `metrics-baseline.log`, `metrics-Q1.log` cạnh file này.

"crashed" = ván bot gửi lệnh không hợp lệ (lỗi bot có sẵn từ trước: chơi Giao Ước Nguyệt Thực khi chỉ còn 1 mạng, lỗi `lastLife`); các ván này bị loại khỏi trung bình, không tính là thua. Seed bị crash đổi giữa hai pha vì đường đi của ván đổi.

## Q1 — đánh hết lính rồi mới đánh công trình

| Vua | Bot | Ván (crash) | Thắng % | Năm TB | Boss bị hạ TB | HP Ngai còn % TB | Tick/trận TB |
|---|---|---|---|---|---|---|---|
| wheat | random | 100 (0) → 100 (0) | 0 → 0 | 7.88 → 7.58 | 0 → 0 | 38.61 → 37.22 | 761.98 → 770.55 |
| wheat | scripted | 96 (4) → 100 (0) | 22.92 → 70 | 28.08 → 29.62 | 0 → 0 | 85.79 → 88.59 | 521.87 → 508.03 |
| stone | random | 100 (0) → 99 (1) | 1 → 2.02 | 18.43 → 18.35 | 0.01 → 0 | 67.99 → 68.15 | 702.73 → 699.92 |
| stone | scripted | 100 (0) → 100 (0) | 100 → 100 | 30 → 30 | 0.22 → 0.05 | 92.44 → 93.63 | 507.37 → 487.63 |
| arcane | random | 99 (1) → 100 (0) | 0 → 0 | 11.95 → 11.73 | 0 → 0 | 61.07 → 59.9 | 642.61 → 653.12 |
| arcane | scripted | 99 (1) → 100 (0) | 47.47 → 77 | 28.71 → 29.76 | 0.14 → 0.07 | 88.6 → 90.96 | 469.17 → 455.11 |

Nhận xét (chỉ ghi nhận, chưa chỉnh số theo quyết định của chủ dự án):

- Bot `scripted` thắng nhiều hơn hẳn với Lúa Mì và Phép Thuật: địch bị lính kéo khỏi công trình nên nhà và Ngai ít bị đánh hơn.
- Số boss bị hạ giảm (Đá Núi scripted 0,22 → 0,05): boss đuổi lính khắp sân nên ít đứng trong tầm tháp.
- Bot `random` gần như không đổi.
- Benchmark sau Q1: 0,375 ms/tick (chuẩn), 0,418 ms/tick (G2), dưới ngưỡng 2 ms.

## Q2 — địch xuất từ cổng dịch chuyển (so với Q1)

| Vua | Bot | Ván (crash) | Thắng % | Năm TB | Boss bị hạ TB | HP Ngai còn % TB | Tick/trận TB |
|---|---|---|---|---|---|---|---|
| wheat | random | 100 (0) → 100 (0) | 0 → 0 | 7.58 → 7.82 | 0 → 0 | 37.22 → 37.51 | 770.55 → 772.33 |
| wheat | scripted | 100 (0) → 100 (0) | 70 → 92 | 29.62 → 29.99 | 0 → 0 | 88.59 → 92.2 | 508.03 → 444.73 |
| stone | random | 99 (1) → 99 (1) | 2.02 → 2.02 | 18.35 → 18.42 | 0 → 0.01 | 68.15 → 68.37 | 699.92 → 690.25 |
| stone | scripted | 100 (0) → 100 (0) | 100 → 100 | 30 → 30 | 0.05 → 0.02 | 93.63 → 94.73 | 487.63 → 436.38 |
| arcane | random | 100 (0) → 98 (2) | 0 → 0 | 11.73 → 11.84 | 0 → 0 | 59.9 → 59.55 | 653.12 → 644.38 |
| arcane | scripted | 100 (0) → 100 (0) | 77 → 86 | 29.76 → 30 | 0.07 → 0.12 | 90.96 → 92.35 | 455.11 → 411.18 |

Nhận xét (chỉ ghi nhận, chưa chỉnh số):

- Quân địch giờ ra từ một cổng (đội hình 5×5 trước miệng cổng) thay cho hàng dài 24 quân/hàng, nên tụ lại một chỗ và tới bàn theo một luồng: bot `scripted` thắng nhiều hơn nữa (Lúa Mì 70 → 92%, Phép Thuật 77 → 86%), trận ngắn hơn.
- Boss bị hạ vẫn ít (Đá Núi scripted 0,05 → 0,02).
- Cờ Đột Kích và hàng quân năm muộn (`formationRows`) không còn trải rộng quân ở mép nam: đây là hệ quả chủ đích của cổng.
- Bot `random` gần như không đổi.
- Benchmark sau Q2: 0,277 ms/tick (chuẩn), 0,267 ms/tick (G2).
