# Báo cáo chạy đêm — 12/11/2026 (02:00 →)

Nhánh `feature/close-up-art` (PR #22, chưa merge). Đêm nay không push, không merge, không tạo PR, không dùng Codex.
Plan: `docs/plans/2026-11-12-night-plan.md`.

## Tóm tắt buổi sáng
- **Đã sửa lỗi Thương nhân "mất 1 thẻ"** (commit `365bc30`).
  - Nguyên nhân: thẻ mua được đặt lên đầu chồng rút. Từ khi mỗi năm chỉ rút 1 lá, lá rút năm sau chính là thẻ vừa mua, nên trả 3 vàng mà tay không có thêm lá nào.
  - Giờ thẻ mua vào thẳng tay, giống "Mua thẻ".
- **Cần bạn quyết:** thẻ thưởng, thẻ chinh phục và thẻ thưởng nhiệm vụ vẫn theo luật cũ (đặt lên đầu chồng rút, thay cho lá rút của năm), vì đó là thiết kế có test. Xem mục "Đề xuất chờ duyệt".

## Phase 1: chọn, mua, bỏ qua thẻ — XONG
- **Tái hiện lỗi:**
  - Test mới `src/game/run/merchantDeck.test.ts` chạy 3 ván 30 năm bằng bot greedy.
  - Sau mỗi lệnh, test kiểm tay + chồng rút + chồng bỏ đúng bằng bộ bài, và mỗi lần mua ở thương nhân thì bộ bài tăng 1.
  - Luật lõi luôn giữ bộ bài đúng. Lỗi nằm ở chỗ đặt thẻ, như phần nguyên nhân ở trên.
- **Sửa:** `pickOffer` trong `src/game/run/commands.ts`: thẻ mua ở thương nhân vào tay. Test `merchant.test.ts` đã cập nhật.
- **Rà thêm:**
  - Bỏ qua thương nhân: miễn phí, đúng.
  - Bỏ qua thẻ thưởng: +vàng, đúng.
  - Chỉ số sai (−1, 3, 0,5): bị từ chối, đúng.
  - Không đủ vàng: bị từ chối, đúng.
  - Mua thẻ trong pha lập kế hoạch: vào tay, đúng.
- **Baseline:** `endlessCompatibility.test.ts` được ghi lại vì ván đổi theo bản sửa (ghi chú trong file).
- **Gate:** lint, typecheck, 3077 test và build đều qua.

## Quyết định kèm lý do
- **Chỉ sửa thương nhân, không sửa thẻ thưởng:**
  - Test `commands.test.ts` ghi rõ thẻ thưởng là lá rút của năm sau (tay năm sau có đúng 1 lá, chính là thẻ thưởng).
  - Đổi cả thẻ thưởng là đổi luật và cân bằng, cần chủ dự án duyệt.
  - Thương nhân thì khác: người chơi trả vàng, nên phải được thêm lá, giống "Mua thẻ".

## Đề xuất chờ duyệt
1. **Thẻ thưởng, thẻ chinh phục, thẻ thưởng nhiệm vụ vào thẳng tay** như thương nhân. Hiện tại chúng thay cho lá rút của năm sau, nên người chơi có thể thấy cũng "mất" một lá rút. Đổi thì cần đo lại cân bằng.

## Việc còn dở và bước tiếp theo
- Phase 2 trở đi: xem plan.
