# Vua Không Ngai (boss) (boss_crownless_king): tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt sơ bộ ngày 20/11/2026; Claude phiên chính xem lại).

- Quy trình như các đơn vị trước (Dân Quân, Sói): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows boss_crownless_king`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/boss_crownless_king/poses-source.png`. Mỗi prompt dặn Codex đọc `docs/ART_STYLE.md`.
- Nguồn: `rows-se-source.png`, `rows-nw-source.png`; prompt `prompt-rows-se.md`, `prompt-rows-nw.md`. Mỗi hướng 1 lượt Codex, không vẽ lại. Áo choàng màu mận nằm gần màu khoá magenta nên `make_review.py` dùng `TIGHT_KEY` cho nhân vật này: áo choàng giữ nguyên, chỉ còn khoảng 12 điểm magenta lẻ ở mép lỗ rách áo choàng trong 22 khung. Chiều cao xin 240 px. Khung rộng 170 vì nhát chém vươn kiếm xa.
- Cắt: `python docs/art-review/units-iso/make_review.py --rows boss_crownless_king` → `frames-rows/` (170×100 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: Giáp tấm nâu sẫm viền vàng, mũ thùng không vương miện, mắt cam sáng, ngọc xanh ở ngực và chuôi kiếm, đai và vạt xanh viền vàng, áo choàng mận rách, một thanh đại kiếm.
- Đủ 3/4/4 khung, cỡ đều, chân (hoặc điểm thấp nhất) cùng đường đáy; không chữ, không bóng; cả nhân vật và vũ khí nằm trọn trong ô.
