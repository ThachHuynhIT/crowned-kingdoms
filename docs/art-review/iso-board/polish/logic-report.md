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
