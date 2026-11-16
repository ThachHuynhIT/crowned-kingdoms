# Người Đá (golem) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 16/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows golem`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/golem/poses-source.png`.
- NW: `rows-nw-source.png` từ `prompt-rows-nw.md`, đạt ngay lượt đầu.
- SE: 2 lượt Codex.
  - r0 (`rows-se-r0-source.png`, `prompt-rows-se-r0.md`) — LOẠI: sai thiết kế nhân vật (khối đá góc cạnh, mắt xanh phát sáng, chùm pha lê, vòng tay có hoa văn), khác người đá tròn, mặt hiền của tấm đã duyệt.
  - r1 (`rows-se-source.png`, `prompt-rows-se.md`, thêm dòng "Character check" của công cụ) — ĐẠT.
- Cắt: `python docs/art-review/units-iso/make_review.py --rows golem` → `frames-rows/` (78×70 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: đá tròn màu nâu xám ấm, mặt tròn cười, rune xanh trên ngực (sáng hơn ở khung lấy đà), đai và vòng cổ tay xanh, vạt vải xanh.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng, không bụi.
- Ghi chú nhỏ (chấp nhận): ở SE chỉ thấy một mảnh pha lê trên vai trái, ở NW mỗi vai có pha lê lớn + nhỏ như tấm chính diện; ở NW vạt vải xanh nằm sau lưng. Ở cỡ game (~70 px) không gây nhảy hình rõ khi đổi hướng.
