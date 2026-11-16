# Cung Kỵ (horse_archer) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 17/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows horse_archer`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/horse_archer/poses-source.png`.
- NW: `rows-nw-source.png` từ `prompt-rows-nw.md`, đạt ngay lượt đầu
- SE r0 (`rows-se-r0-source.png`, `prompt-rows-se-r0.md`) — LOẠI: ngựa nâu sẫm không có chăn yên xanh, người cưỡi gầy không chibi, khác tấm đã duyệt và hướng NW
- SE r1 (`rows-se-source.png`, `prompt-rows-se.md`, thêm dòng "Character check") — ĐẠT
- Cắt: `python docs/art-review/units-iso/make_review.py --rows horse_archer` → `frames-rows/` (36×41 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: cung thủ thảo nguyên chibi trên ngựa vàng nâu nhạt bờm nâu sẫm, mũ lông đỏ tròn viền kem có quả cầu đỏ, áo đỏ cổ tay lông kem, đai xanh chéo ngực, cung cong ngắn, ống tên sau lưng, chăn yên xanh viền vàng.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng.
- Ghi chú: dòng "Body check" xoay cả ngựa chéo; khung bắn thả dây cung, mũi tên do game vẽ.
