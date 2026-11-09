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

## Đợt 2: 45 tranh vẽ mới (09/11/2026)

- **Gồm:**
  - 10 thẻ mỗi vua Đồng Hồ, Ánh Trăng, Du Mục.
  - 12 thẻ trung lập, gồm 2 thẻ meta Nhân Bản và Ấn Triện.
  - Ngai của Rừng Xanh, Thuỷ Triều, Lò Rèn.
- **Cách vẽ:**
  - Gợi ý hình mới nằm trong `VISUAL` của `make_prompts.py`. Mỗi prompt đính kèm ảnh phong cách, tranh thẻ đã duyệt và chân dung vua sở hữu thẻ.
  - Mẫu duyệt trước khi vẽ cả nhóm: Nhân Bản (trung lập), Tháp Bánh Răng, Hầm Mộ, Trại Kỵ Binh.
- **Bảng tổng hợp:** `sheet-clock.png`, `sheet-moon.png`, `sheet-nomad.png`, `sheet-neutral.png` (bảng `neutral` có kèm ba Ngai).
- **Claude kiểm:**
  - Cùng khuôn với các bộ đã duyệt, mỗi vua một màu chủ đạo: đồng thau cho Đồng Hồ, tím đêm cho Ánh Trăng, thảo nguyên vàng cho Du Mục, cỏ xanh ấm cho trung lập.
  - Ánh Trăng dễ thương, không ghê rợn.
  - Phép và bùa là một vật biểu tượng; Ngai là một chiếc ghế ngai.
- **Trạng thái:** ĐÃ DUYỆT. Cả 102 thẻ của registry nay đều có tranh (`tools/g5ImageArt.test.ts` kiểm 204 file).
