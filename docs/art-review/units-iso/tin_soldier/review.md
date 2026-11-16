# Lính Lên Dây (tin_soldier) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 17/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows tin_soldier`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/tin_soldier/poses-source.png`.
- NW: `rows-nw-source.png` từ `prompt-rows-nw.md`, đạt ngay lượt đầu
- SE r0 (`rows-se-r0-source.png`, `prompt-rows-se-r0.md`) — LOẠI: khung hồi thế có hai vũ khí cùng lúc (súng dựng đứng và một lưỡi lê cầm ngang)
- SE r1 (`rows-se-source.png`, `prompt-rows-se.md`, thêm dòng "Weapon check") — ĐẠT
- Cắt: `python docs/art-review/units-iso/make_review.py --rows tin_soldier` → `frames-rows/` (42×34 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: lính đồ chơi thiếc và đồng, mũ shako đỏ có chùm lông, áo xanh cúc đồng, dây đeo chéo trắng, chìa vặn dây cót bằng đồng sau lưng, súng có lưỡi lê.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng.
- Ghi chú: chìa vặn thấy bên hông ở cả hai hướng.
