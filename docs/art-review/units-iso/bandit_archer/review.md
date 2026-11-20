# Cung Thủ Thổ Phỉ (bandit_archer): tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt sơ bộ ngày 20/11/2026; Claude phiên chính xem lại).

- Quy trình như các đơn vị trước (Dân Quân, Sói): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows bandit_archer`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/bandit_archer/poses-source.png`. Mỗi prompt dặn Codex đọc `docs/ART_STYLE.md`.
- Nguồn: `rows-se-source.png`, `rows-nw-source.png`; prompt `prompt-rows-se.md`, `prompt-rows-nw.md`. Mỗi hướng 1 lượt Codex, không vẽ lại.
- Cắt: `python docs/art-review/units-iso/make_review.py --rows bandit_archer` → `frames-rows/` (30×33 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: Chibi, mũ trùm nâu có miếng vá, khăn quàng xanh, áo rách màu be, dây đeo nâu, băng tay xanh, cung gỗ, ống tên sau lưng; hàng đánh kéo dây cung theo hướng nhìn (không vẽ mũi tên bay).
- Đủ 3/4/4 khung, cỡ đều, chân (hoặc điểm thấp nhất) cùng đường đáy; không chữ, không bóng; cả nhân vật và vũ khí nằm trọn trong ô.
