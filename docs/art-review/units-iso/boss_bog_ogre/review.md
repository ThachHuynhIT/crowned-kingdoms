# Ông Kẹ Đầm Lầy (boss) (boss_bog_ogre): tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt sơ bộ ngày 20/11/2026; Claude phiên chính xem lại).

- Quy trình như các đơn vị trước (Dân Quân, Sói): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows boss_bog_ogre`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/boss_bog_ogre/poses-source.png`. Mỗi prompt dặn Codex đọc `docs/ART_STYLE.md`.
- Nguồn: `rows-se-source.png`, `rows-nw-source.png`; prompt `prompt-rows-se.md`, `prompt-rows-nw.md`. Mỗi hướng 1 lượt Codex, không vẽ lại. Chiều cao xin trong ô 240 px (`ROWS_FIGURE_CAP`). Ghi chú: thân SE chỉ xoay chéo nhẹ (gần chính diện), vẫn đọc được hướng xuống-phải; vệt bùn bắn ở khung đập nằm sát chùy.
- Cắt: `python docs/art-review/units-iso/make_review.py --rows boss_bog_ogre` → `frames-rows/` (120×97 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: Yêu tinh khổng lồ phủ bùn nâu, tóc cỏ đầm lầy, con ếch nhỏ trên đầu, nanh, khố rách, đai xanh, chùy khúc gỗ nhỏ bùn.
- Đủ 3/4/4 khung, cỡ đều, chân (hoặc điểm thấp nhất) cùng đường đáy; không chữ, không bóng; cả nhân vật và vũ khí nằm trọn trong ô.
