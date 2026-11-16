# Bóng Ma (wraith) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 17/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows wraith`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/wraith/poses-source.png`.
- NW: `rows-nw-source.png` từ `prompt-rows-nw.md`, đạt ngay lượt đầu
- SE r0 (`rows-se-r0-source.png`, `prompt-rows-se-r0.md`) — LOẠI: áo màu oải hương nhạt, mũ nhọn, mắt trắng, khác tấm đã duyệt và hướng NW
- SE r1 (`rows-se-r1-source.png`, `prompt-rows-se-r1.md`) — LOẠI: áo đỏ sẫm, quá tối so với hồng phấn của tấm đã duyệt
- SE r2 (`rows-se-source.png`, `prompt-rows-se.md`) — ĐẠT
- Cắt: `python docs/art-review/units-iso/make_review.py --rows wraith` → `frames-rows/` (40×33 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: bóng ma áo choàng hồng phấn trùm đầu tròn có đường khâu, khoang mũ tối với mắt hồng tím, viền và khuy cài xanh có nơ, đuôi khói thay chân.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng.
- Ghi chú: áo choàng hồng nằm gần màu khoá magenta nên `make_review.py` cắt con này bằng khoá chặt (`TIGHT_KEY`, chỉ nền gần #FF00FF); với khoá lỏng chung áo bị thủng lỗ. Cảnh báo: bản game hiện tại (`make_poses.py`) cắt bằng khoá lỏng nên khi đưa vào game cần dùng khoá chặt này.
