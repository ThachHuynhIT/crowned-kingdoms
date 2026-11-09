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

## Giới hạn

- Chưa đo trên điện thoại thật.
- Trận đo có 98 thực thể, chưa phải mức trần (512). Chưa dựng cảnh ép tới trần quân và đạn.
- Kết quả từ trình duyệt headless có GPU phần mềm; trên máy thật, vsync sẽ khoá ở 60 fps.
