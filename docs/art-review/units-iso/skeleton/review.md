# Bộ Xương (skeleton) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 17/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows skeleton`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/skeleton/poses-source.png`.
- NW: `rows-nw-source.png` từ `prompt-rows-nw.md`, đạt ngay lượt đầu
- SE r0 (`rows-se-r0-source.png`, `prompt-rows-se-r0.md`) — LOẠI: bộ xương đáng sợ (sọ hẹp, mày cau, áo choàng bay), khác bộ xương dễ thương của tấm đã duyệt
- SE r1 (`rows-se-source.png`, `prompt-rows-se.md`) — ĐẠT
- Cắt: `python docs/art-review/units-iso/make_review.py --rows skeleton` → `frames-rows/` (46×33 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: bộ xương dễ thương đầu sọ to tròn có vết nứt, hốc mắt tím phát sáng, khăn và váy vải xanh rách, khiên gỗ tròn, đoản kiếm gỉ.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng.
- Ghi chú: lượt r1 thêm dòng "Character check".
