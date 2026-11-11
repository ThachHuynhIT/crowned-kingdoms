# G5 — Đo hiệu năng (09/11/2026)

Spec §8.10 / plan G5 Task 9: mục tiêu desktop ≥ 60 fps, điện thoại hoặc CPU bóp 4× ≥ 30 fps.

## Cách đo

- **Môi trường:**
  - Dev server Vite, cấu hình `dev`. Bản dev chậm hơn bản build nên kết quả nghiêng về phía an toàn.
  - Chromium headless qua Playwright, viewport 1280×720, DPR 1.
  - Trình duyệt headless không khoá vsync, nên fps vượt 60.
- **Cảnh đo:**
  - Ván thật do bot greedy chơi: Đá Núi, seed 3, `RULES_FULL`, chụp lại ở năm 29.
  - Lúc chụp có 10 công trình, gồm Ngai.
  - Mở ván đó bằng `scene.start('Realm', { resume })`, rồi bắt đầu trận.
  - Âm thanh và juice (nháy trắng, số nổi, đá rơi, bụp khi chết) đều bật.
- **Đo:**
  - Khởi động 2 giây, rồi đo 20 giây khoảng cách giữa các `requestAnimationFrame`.
  - Theo dõi số thực thể lớn nhất của world.
  - CPU bóp bằng CDP `Emulation.setCPUThrottlingRate`.

## Kết quả

| CPU | Frame | fps TB | Frame TB | p95 | Thực thể tối đa |
|---|---:|---:|---:|---:|---:|
| ×1 | 3996 | 199,8 | 5,01 ms | 5,1 ms | 98 |
| ×4 | 3602 | 180,1 | 5,55 ms | 10,0 ms | 98 |

Cả hai đều vượt xa mục tiêu: với 60 fps, ngân sách mỗi frame là 16,7 ms; với 30 fps là 33 ms.

Benchmark mô phỏng trong `npm test` (`src/game/battle/benchmark.test.ts`) vẫn đạt; lần đo gần nhất trên máy này khoảng 0,4 ms/tick.

## Đo lại sau khi làm lại chiến trường (09/11/2026, nhánh `battle-field-rework`)

- **Thay đổi đã có lúc đo:** công trình chặn đường và đi vòng, đội hình, tầm tháp ×3, lính to 1,3 lần, FX bằng ảnh.
- **Cách đo:** cùng cảnh (Đá Núi, seed 3, bot greedy, năm 29), cùng cách đo 20 giây, nhưng trên Chromium có cửa sổ, nên vsync khoá khoảng 60 fps.

| CPU | Frame | fps TB | Frame TB | p95 | Thực thể tối đa |
|---|---:|---:|---:|---:|---:|
| ×1 | 1147 | 57,3 | 17,44 ms | 18,2 ms | 112 |
| ×4 | 1117 | 55,8 | 17,91 ms | 18,1 ms | 112 |

- **Kết quả:** khi bóp CPU 4 lần, game vẫn bám gần 60 fps. Mục tiêu điện thoại / CPU ×4 là ≥ 30 fps, nên còn dư xa.
- **Trận ép tới trần:** `src/game/battle/stress.test.ts` chạm đủ 512 thực thể, 160 lính phe mình và 400 đạn, khoảng 0,65 ms/tick khi chạy riêng.
- **Đo trên điện thoại:** bản dev có chỉ số `?fps`, và cấu hình `dev-lan` chạy game cho mạng nội bộ.

## Giới hạn

- Chưa đo trên điện thoại thật.
- Trận đo có 98–112 thực thể. Mức trần được kiểm riêng bằng `stress.test.ts`, không đo bằng khung hình.
- Kết quả từ trình duyệt headless có GPU phần mềm; trên máy thật, vsync sẽ khoá ở 60 fps.
