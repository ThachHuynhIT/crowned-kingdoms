# Nông Binh (peasant) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 16/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows peasant`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/peasant/poses-source.png`.
- NW: `rows-nw-source.png` từ `prompt-rows-nw.md`, đạt ngay lượt đầu.
- SE: 3 lượt Codex.
  - r0 (`rows-se-r0-source.png`, `prompt-rows-se-r0.md`) — LOẠI: đứng yên và đi cầm chĩa chúc xuống phía trước, còn NW và tấm chính diện cầm dựng đứng (đổi hướng sẽ nhảy tư thế).
  - r1 (`rows-se-r1-source.png`, `prompt-rows-se-r1.md`) — LOẠI: chĩa đã dựng đứng nhưng thân đứng gần như chính diện, không xoay ba phần tư về hướng SE như Dân Quân.
  - r2 (`rows-se-source.png`, `prompt-rows-se.md`) — ĐẠT.
- Cắt: `python docs/art-review/units-iso/make_review.py --rows peasant` → `frames-rows/` (42×33 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn đúng: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: tóc nâu bù xù, băng đô xanh buộc đuôi, áo nâu vá, đai xanh, túi vải bên hông, chĩa ba cán gỗ.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng.
- Ghi chú: ở SE r2 khung lấy đà quay ngược chĩa ra sau (răng chĩa chĩa ra sau lưng) rồi đâm tới — đọc rõ ở cỡ game.
