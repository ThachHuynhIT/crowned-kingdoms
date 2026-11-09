# Nền thẻ vua ở màn chọn vua — duyệt G5 (09/11/2026)

Plan `docs/superpowers/plans/2026-11-09-missing-art-assets.md` Task 7 bước 4. Duyệt: Claude theo uỷ quyền của chủ dự án (09/11/2026).

- **Cách vẽ:** `make_prompts.py`, đính kèm ảnh phong cách Thợ Gặt, tranh thẻ đã duyệt và chân dung đã duyệt của từng vua; nền magenta phẳng. Cắt bằng `make_assets.py` về đúng cỡ gốc 66×96 (`KING_CARD_NATIVE`), alpha 0/255.
- **Chỉ là nền:** ô chân dung, chân dung, chữ "K", chất bài, dấu "?" và ổ khoá vẫn do `paintKingCard` vẽ lên trên. Bố cục không đổi. Chữ ở hai góc nằm trên một mảng giấy lấy đúng màu giấy ở giữa ảnh.
- **Mẫu đầu: Lúa Mì.**
  - Viền bông lúa, liềm và ruy băng đỏ; giữa là giấy kem trơn.
  - Mảng trơn ở góc thấp hơn chỗ chữ cần, nên code lót thêm giấy; prompt các vua sau yêu cầu góc trơn cao hơn.
  - ĐÃ DUYỆT, rồi mới vẽ tám vua còn lại.
- **Tám vua còn lại:**
  - Đá Núi: khối đá và rune xanh.
  - Phép Thuật: pha lê tím và sao vàng.
  - Rừng Xanh: lá sồi và quả sồi.
  - Thuỷ Triều: sóng, vỏ sò, dây thừng.
  - Lò Rèn: tấm sắt, đinh tán, than hồng.
  - Đồng Hồ: bánh răng đồng.
  - Ánh Trăng: trăng khuyết và sao, dễ thương, không ghê rợn.
  - Du Mục: hoa văn thảm thảo nguyên và cờ đỏ.
- **Claude kiểm:** cùng một bố cục với mẫu Lúa Mì, ánh sáng trên-trái, cụm pixel vuông rõ, không chữ, không người. Màu khớp chân dung từng vua. Bảng tổng hợp: `sheet.png`.
- **Trạng thái:** ĐÃ DUYỆT cả chín. Nối vào game qua `KING_CARDS_APPROVED` (`src/render/imageArt.ts`); thẻ vua chưa mở khoá dùng bản xám của chính ảnh đó.
