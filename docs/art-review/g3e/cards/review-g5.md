# Tranh thẻ — duyệt G5 (09/11/2026)

Plan `docs/superpowers/plans/2026-11-09-missing-art-assets.md` Task 5. Duyệt: Claude theo uỷ quyền của chủ dự án (09/11/2026). Phong cách tranh thẻ đã được chủ dự án duyệt từ 29/10/2026 (bộ Lúa Mì, `docs/art-review/style-references/card-art-approved.png`).

## Đợt 1: 47 tranh vẽ từ G3e, chưa nối vào game

- **Gồm:** Đá Núi 10, Phép Thuật 10, Rừng Xanh 9, Thuỷ Triều 9, Lò Rèn 9. Bảng tổng hợp: `sheet-stone.png`, `sheet-arcane.png`, `sheet-grove.png`, `sheet-tide.png`, `sheet-forge.png`.
- **Claude kiểm:**
  - Cùng phong cách với bộ Lúa Mì: chủ thể ở giữa chiếm khoảng 70% khung, một màu chủ đạo cho mỗi vua, nền nhạt hơn chủ thể.
  - Công trình nhìn chính diện 45°; phép và bùa là một vật biểu tượng.
  - Không có chữ hay khung.
  - Đọc được ở cỡ 48×36.
- **Trạng thái:** ĐÃ DUYỆT. Đã cắt ra 96×72 và 48×36 (`make_assets.py`), đăng ký bằng `register_assets.py`, và nối trong `src/ui/cards/cardImage.ts`.
