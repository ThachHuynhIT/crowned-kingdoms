# Cướp Biển (pirate) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 17/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows pirate`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/pirate/poses-source.png`.
- SE r0 (`rows-se-r0-source.png`, `prompt-rows-se-r0.md`) — LOẠI: mất tỉ lệ chibi (đầu nhỏ, mặt kiểu người lớn)
- NW r0 (`rows-nw-r0-source.png`, `prompt-rows-nw-r0.md`) — LOẠI: khăn thành dải băng đô, tóc lộ trên đỉnh đầu, khác bandana trùm đầu của tấm đã duyệt
- SE r1 và NW r1 (`rows-se-source.png`, `rows-nw-source.png`, `prompt-rows-se.md`, `prompt-rows-nw.md`) — ĐẠT
- Cắt: `python docs/art-review/units-iso/make_review.py --rows pirate` → `frames-rows/` (38×35 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: tỉ lệ chibi đầu to, khăn bandana xanh trùm kín đỉnh đầu buộc nút sau gáy, áo sọc kem-nâu, đai xanh, quần nâu, ủng, đoản kiếm cong chuôi vàng.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng.
- Ghi chú: lượt r1 thêm dòng "Character check" của công cụ cho cả hai hướng.
