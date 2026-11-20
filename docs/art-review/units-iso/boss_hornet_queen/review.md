# Nữ Hoàng Ong Bắp Cày (boss) (boss_hornet_queen): tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt sơ bộ ngày 20/11/2026; Claude phiên chính xem lại).

- Quy trình như các đơn vị trước (Dân Quân, Sói): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows boss_hornet_queen`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/boss_hornet_queen/poses-source.png`. Mỗi prompt dặn Codex đọc `docs/ART_STYLE.md`.
- Nguồn: `rows-se-source.png`, `rows-nw-source.png`; prompt `prompt-rows-se.md`, `prompt-rows-nw.md`. NW vẽ 2 lượt: r0 (`rows-nw-r0-source.png`, `prompt-rows-nw-r0.md`) chỉ thấy cánh bên phải và cán giáo toàn vàng; r1 thêm dòng "Back-view check" (`ROWS_NOTES_DIR`): đủ hai bên cánh, cán gỗ nâu, đạt. SE 1 lượt, nhưng nguồn có quầng hồng nhạt quanh đầu (tấm chính diện không có): `make_review.py` cắt nhân vật này bằng `WIDE_KEY` (tách thêm điểm hồng nhạt), còn sót vài điểm lẻ không đáng kể. Dòng "Body check" bay (`FLOAT_BODY`), chiều cao xin 240 px.
- Cắt: `python docs/art-review/units-iso/make_review.py --rows boss_hornet_queen` → `frames-rows/` (116×99 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: Mặt chibi, vương miện vàng giữa hai râu, cổ lông kem, đai xanh chéo ngực, bụng sọc lớn có ngòi, cánh vàng nhạt, giáo ngòi cán gỗ mũi vàng.
- Đủ 3/4/4 khung, cỡ đều, chân (hoặc điểm thấp nhất) cùng đường đáy; không chữ, không bóng; cả nhân vật và vũ khí nằm trọn trong ô.
