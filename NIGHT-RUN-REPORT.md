# Báo cáo chạy đêm — 12/11/2026 (02:00 →)

Nhánh `feature/close-up-art` (PR #22, chưa merge). Đêm nay không push, không merge, không tạo PR, không dùng Codex.
Plan: `docs/plans/2026-11-12-night-plan.md`.

## Tóm tắt buổi sáng
- **Đã sửa lỗi Thương nhân "mất 1 thẻ"** (commit `365bc30`).
  - Nguyên nhân: thẻ mua được đặt lên đầu chồng rút. Từ khi mỗi năm chỉ rút 1 lá, lá rút năm sau chính là thẻ vừa mua, nên trả 3 vàng mà tay không có thêm lá nào.
  - Giờ thẻ mua vào thẳng tay, giống "Mua thẻ".
- **Mở game nhanh hơn** (commit `03305be`): từ lúc tải xong ảnh tới lúc vào menu, máy tính giảm từ 1032 ms xuống khoảng 620 ms, điện thoại từ 403 ms xuống khoảng 290 ms. Khung hình vốn đã nhẹ (khoảng 1 ms mỗi khung kể cả trận lớn), nên không đụng tới.
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

## Phase 2: hiệu năng — XONG
Đo bằng Playwright trên server dev (`npx vite --port 5177`), Chromium headless, 2 lần mỗi số.

| Số đo | Trước | Sau |
|---|---|---|
| Tải xong ảnh → menu, máy tính 1280×720 "Cao" (UHD) | 1032 ms | 608–639 ms |
| Tải xong ảnh → menu, điện thoại 844×390 DPR 3 | 403 ms | 277–308 ms |
| Tải ảnh (vào game → tải xong), máy tính | 2,4–3,7 s | không đổi (do tải 772 file UHD) |
| Thời gian xử lý mỗi khung, lập kế hoạch, máy tính | 0,78 ms (p95 1,1) | không đổi |
| Thời gian xử lý mỗi khung, lập kế hoạch, điện thoại | 1,0 ms (p95 1,5) | không đổi |
| Thời gian xử lý mỗi khung, trận năm 30, máy tính | 1,05 ms (p95 1,6) | không đổi |

- **Cách đo khung hình:** từ sự kiện `prestep` tới `postrender` của Phaser. FPS của trình duyệt headless bị khoá theo vsync (khoảng 6,7 ms), nên không dùng được để so.
- **Tìm ra chỗ chậm** (đo tạm trong code, đã gỡ): đọc lại điểm ảnh của 772 ảnh UHD mất khoảng 605 ms, chép từng điểm vào trang atlas khoảng 170 ms, và làm mượt (mipmap) mất 135–330 ms, kể cả cho các ảnh chỉ dùng để dựng atlas.
- **Sửa** (commit `03305be`):
  - các khung ảnh được vẽ thẳng vào trang atlas bằng `drawImage`, không đọc lại điểm ảnh;
  - bỏ tạo mipmap cho các texture chỉ dùng để chép vào atlas.
- **Ảnh kiểm tra sau khi sửa:** `.superpowers/night-perf-after.png`, giống bản trước.
- **Chưa làm:** giảm thời gian tải 772 file UHD (53 MB). Muốn giảm phải gộp file hoặc tải dần khi phóng to, là thay đổi lớn. Đã ghi vào đề xuất.

## Quyết định kèm lý do
- **Chỉ sửa thương nhân, không sửa thẻ thưởng:**
  - Test `commands.test.ts` ghi rõ thẻ thưởng là lá rút của năm sau (tay năm sau có đúng 1 lá, chính là thẻ thưởng).
  - Đổi cả thẻ thưởng là đổi luật và cân bằng, cần chủ dự án duyệt.
  - Thương nhân thì khác: người chơi trả vàng, nên phải được thêm lá, giống "Mua thẻ".

## Đề xuất chờ duyệt
1. **Thẻ thưởng, thẻ chinh phục, thẻ thưởng nhiệm vụ vào thẳng tay** như thương nhân. Hiện tại chúng thay cho lá rút của năm sau, nên người chơi có thể thấy cũng "mất" một lá rút. Đổi thì cần đo lại cân bằng.

2. **Tải ảnh UHD dần:** chỉ tải bộ mật độ 8 khi người chơi phóng to lần đầu, hoặc gộp 772 file thành vài tấm atlas sẵn lúc build. Như vậy máy tính vào game nhanh thêm 1–2 giây.

## Việc còn dở và bước tiếp theo
- Phase 2 trở đi: xem plan.
