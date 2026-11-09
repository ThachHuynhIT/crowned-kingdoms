# G5 — Nghiệm thu "Done khi" §1 của spec tổng (09/11/2026)

Nhánh `g5-balance-polish`, PR #15. Mỗi dòng ghi bằng chứng có thật; mục nào chưa đủ thì ghi rõ là chưa đủ.

| # | §1 Done khi | Bằng chứng | Kết luận |
|---|---|---|---|
| 1 | Ván 30 năm với cả 9 vua, thắng/thua đúng luật; lưu/tải giữa các năm; meta | `fullRun.test.ts` (9 vua × 3 seed, ván thật); `greedy.test.ts` (9 vua × 3 seed, 30 năm, chạy lại cho kết quả y hệt); `resumeIntegration.test.ts` (tải lại mọi pha); `endlessResume.test.ts` (tải lại Vô tận); meta: `crowns.test.ts`, `unlocks.test.ts`, `codec.test.ts`, `session.test.ts` | Đạt |
| 2 | Đủ nội dung §6–§7 | `cards.json` sinh từ registry: 102 thẻ = 9 Ngai + 81 thẻ vua (9 vua × 9) + 12 trung lập; 27 perk (`perkCoverage.test.ts`); 18 sắc lệnh, 13 nhiệm vụ (`src/data/decrees.ts`, `quests.ts`); 3 boss (`bosses.test.ts`); cờ hiệu và can thiệp hoàng gia đã có test từ G3/G4 | Đạt |
| 3 | Mô phỏng deterministic; headless 30 năm chạy xong không lỗi | `determinism.test.ts` (hash từng tick); `endlessCompatibility.test.ts` (dấu vết ván thường); `presentationEvents.test.ts` (rút hay không rút sự kiện thì hash vẫn như nhau); headless chạy hết 30 năm với các bot random, scripted và greedy | Đạt |
| 4 | Hiệu năng §8.10 trên desktop và điện thoại tầm trung | `benchmark.test.ts`: 0,277 ms/tick (chuẩn), 0,270 ms/tick (G2); khung hình: `docs/balance/2026-11-09-g5-performance.md` (trận thật năm 29: khoảng 200 fps ở CPU ×1, khoảng 180 fps ở CPU ×4, p95 10 ms) | Đạt trên desktop và khi bóp CPU 4×; **chưa đo trên điện thoại thật** |
| 5 | Mọi màn §10 đúng bố cục 1280×720 và 375×812, không đè/tràn, vùng chạm ≥ 44 | Test layout của từng màn (`menuLayout`, `detailLayout`, `settingsLayout`, `modalLayout`, `realmLayout`…); ảnh chụp trình duyệt trong PR #13–#15 và `.playwright-mcp/` (menu, Cài đặt, chọn vua, bàn của các vua, bàn 7×7, phúc lành, lịch Vô tận, cuối ván) | Đạt một phần: lỗi đổi kích thước NineSlice có từ trước đã sửa (`theme.ts`: bỏ qua khung đã bị huỷ); hộp nhiệm vụ trên desktop hơi tràn khung (agent E3 báo, có từ trước) |
| 6 | Art: metadata mở, pixel look, đúng các primitive UI | Art isometric cho 9 vua, lính của 9 vua và trung lập, Thổ Phỉ, quân triệu hồi, 3 boss, tranh thẻ; tất cả có trong `docs/assets.manifest.yml` và CREDITS; `tools/g5ImageArt.test.ts`; `python -m unittest discover -s tools -p "test_*.py"` | Đạt cho phần đã nối vào game; icon, FX và giao diện theo vua vẫn vẽ bằng code (plan asset còn thiếu) |
| 7 | Bot greedy Gai 0 thắng 35–65% với mỗi vua, chênh lệch ≤ 15 điểm | `docs/balance/2026-11-09-g5-balance-report.md`: 500 ván mỗi vua, 44,8–55,6%, chênh lệch 10,8 điểm | Đạt |
| 8 | lint, typecheck, test, build exit 0; CI xanh | Chạy trên máy; CI của PR #15 xanh ở lần đẩy 12:00 | Đạt (chạy lại ở lần đẩy cuối) |

## Còn lại để đóng G5 hoàn toàn

- Đo fps trên một điện thoại thật.
- Một trận ép tới trần thực thể (512) và trần đạn.
- Hộp nhiệm vụ tràn khung trên desktop.
- Phần art còn vẽ bằng code: icon và FX trong atlas, giao diện theo vua, menu.
