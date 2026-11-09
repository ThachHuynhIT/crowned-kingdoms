# Texture đường đất và cỏ hoa — duyệt G5 (09/11/2026)

Plan `docs/superpowers/plans/2026-11-09-missing-art-assets.md` Task 7 bước 3. Duyệt: Claude theo uỷ quyền của chủ dự án (09/11/2026).

- **Cách vẽ:** khối "Prompt texture mặt đất dùng lại" của `docs/ART_STYLE.md` qua `docs/art-review/g3e/buildings/make_prompts.py terrain-textures`; đính kèm ảnh phong cách Thợ Gặt và hai ô isometric đã duyệt. Cắt bằng `make_textures.py` (thu 8 lần về 128 px).
- **Mẫu đầu: `terrain_path`.**
  - Đất nện nâu, vệt bánh xe, sỏi nhỏ.
  - Màu trung bình (179, 101, 48), gần đất của ô đã duyệt (161, 102, 40).
  - Lặp 3×3 không thấy đường nối: bước màu qua mép 7,0, bên trong 9,1.
  - Trong game, con đường cùng màu với đất của bàn cờ.
- **`terrain_flowers`.**
  - Cỏ ngắn điểm hoa nhỏ màu kem, vàng, hồng, tím nhạt.
  - Màu trung bình (126, 147, 43), gần cỏ đã duyệt (114, 138, 54).
  - Bước màu qua mép 19,1, bên trong 30,3.
- **Trạng thái:** ĐÃ DUYỆT cả hai. Bảng lặp: `sheet.png`.
- **Nối vào game:** `GROUND_TEXTURES_APPROVED` trong `src/render/imageArt.ts`. Ô đường và ô cỏ hoa lấy màu từ texture theo vị trí thế giới (`paintField`); đoạn đường ra tới cổng (`paintRoadTail`) đọc cùng texture ở cùng vị trí nên nối liền con đường.
