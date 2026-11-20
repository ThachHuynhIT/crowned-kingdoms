# Thổ Phỉ (bandit): tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt sơ bộ ngày 20/11/2026; Claude phiên chính xem lại).

- Quy trình như các đơn vị trước (Dân Quân, Sói): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows bandit`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/bandit/poses-source.png`. Mỗi prompt dặn Codex đọc `docs/ART_STYLE.md`.
- Nguồn: `rows-se-source.png`, `rows-nw-source.png`; prompt `prompt-rows-se.md`, `prompt-rows-nw.md`. SE vẽ 2 lượt: r0 (`rows-se-r0-source.png`, `prompt-rows-se-r0.md`) chuyển dao sang tay kia ở khung chuẩn bị và vung dao; r1 thêm dòng "Weapon check" (`ROWS_NOTES_DIR`). Ở r1 khung vung dao vẫn giơ dao qua vai bên kia như tấm chính diện đã duyệt (cùng động tác), các khung khác giữ dao cùng một tay. NW 1 lượt.
- Cắt: `python docs/art-review/units-iso/make_review.py --rows bandit` → `frames-rows/` (40×33 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: Chibi, tóc nâu rối, băng đô xanh thắt nút hai đuôi, khăn che mặt nâu, áo cộc kem, gi-lê nâu có miếng vá sao cam, đai xanh, quần vá, một con dao cong có vòng vàng.
- Đủ 3/4/4 khung, cỡ đều, chân (hoặc điểm thấp nhất) cùng đường đáy; không chữ, không bóng; cả nhân vật và vũ khí nằm trọn trong ô.
