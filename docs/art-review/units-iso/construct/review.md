# Người Máy Phép (construct) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 17/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows construct`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/construct/poses-source.png`.
- NW: `rows-nw-source.png` từ `prompt-rows-nw.md`, đạt ngay lượt đầu
- SE r0 (`rows-se-r0-source.png`, `prompt-rows-se-r0.md`) — LOẠI: mặt bị vẽ thành khoang tối có mắt phát sáng, khác mặt đá sáng của tấm đã duyệt
- SE r1 (`rows-se-source.png`, `prompt-rows-se.md`, thêm dòng "Character check") — ĐẠT
- Cắt: `python docs/art-review/units-iso/make_review.py --rows construct` → `frames-rows/` (70×58 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: các phiến đá nhạt bó đai vàng, mặt đá sáng với hai mắt tím nhỏ, vòng trán vàng gắn đá tím, lõi pha lê tím trên ngực, đai chéo xanh, vạt xanh có vương miện vàng.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng.
- Ghi chú: khung đập có vài mảnh đá vụn như tấm chính diện.
