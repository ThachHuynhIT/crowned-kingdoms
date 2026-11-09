# Khung giao diện theo vua — quyết định G5 (09/11/2026)

Plan `docs/superpowers/plans/2026-11-09-missing-art-assets.md` Task 7 bước 4. Quyết định: Claude theo uỷ quyền của chủ dự án (09/11/2026).

- **Hiện trạng:** 10 khung chín-ô (`SKINNABLE_FRAMES`: panel, bốn trạng thái nút, bốn độ hiếm thẻ, thanh) × 9 vua = 90 khung, tô bằng code theo `KING_THEMES` (`src/render/uiArt.ts`) trên đúng hình dạng của khung trung tính.
- **Cỡ gốc:** 8×6 tới 24×32 px, với góc chia (slice) và viền đo từng pixel; `uiFrameDef` là nguồn kích thước duy nhất.
- **Quyết định:** giữ vẽ bằng code, không vẽ lại bằng ảnh.
  - Ảnh thu nhỏ về 16–24 px không giữ được viền 1 px liền (mẫu đá tảng FX cùng ngày cho thấy viền vỡ ở 16 px), mà khung chín-ô vỡ viền thì giãn ra sẽ lộ vết.
  - Mỗi khung còn phải giữ trạng thái hover/bấm/bật và độ hiếm; tô lại từ một khung chuẩn bằng code giữ đúng các trạng thái đó cho cả chín vua.
- Khung trung tính vẫn lấy từ bộ Kenney (CC0, `src/render/uiKit.ts`) như trước.
