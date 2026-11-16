# Đá Vụn (rubble) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 17/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows rubble`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/rubble/poses-source.png`.
- Nguồn: `rows-se-source.png`, `rows-nw-source.png` (mỗi hướng 1 lượt Codex, không vẽ lại), prompt `prompt-rows-se.md`, `prompt-rows-nw.md`.
- Cắt: `python docs/art-review/units-iso/make_review.py --rows rubble` → `frames-rows/` (26×23 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE mặt hướng xuống-phải, NW lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: đống đá nâu xám ấm, mắt xanh, rune xanh trên trán, miếng vai và đai xanh có vạt.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng.
- Ghi chú (chấp nhận): thân tròn nên ở SE độ xoay ba phần tư chỉ đọc qua mặt lệch phải và bước chân; cú nhảy của khung đánh 3 bị mất độ cao khi cắt vì công cụ đặt mọi khung chạm cùng đường đáy, nên hàng đánh ở cỡ game chủ yếu là nén thấp rồi vươn cao. Nếu cần cú nhảy rõ hơn thì nâng khung đó lên bằng code lúc phát.
