# Thợ Mỏ (miner) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 16/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows miner`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/miner/poses-source.png`.
- Nguồn: `rows-se-source.png`, `rows-nw-source.png` (mỗi hướng 1 lượt Codex, không vẽ lại), prompt `prompt-rows-se.md`, `prompt-rows-nw.md`.
- Cắt: `python docs/art-review/units-iso/make_review.py --rows miner` → `frames-rows/` (44×41 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: râu nâu rậm, mũ mỏ đồng có đèn, khăn quàng xanh, cổ tay xanh, tạp dề da có quai, cuốc chim sắt cầm hai tay.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng.
- Ghi chú: lấy đà giơ cuốc qua vai, bổ xuống trước mặt ngang gối, đọc rõ ở cỡ game.
