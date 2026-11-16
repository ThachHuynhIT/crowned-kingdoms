# Lính Ném Đá (slinger) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 16/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows slinger`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/slinger/poses-source.png`.
- Nguồn: `rows-se-source.png`, `rows-nw-source.png` (mỗi hướng 1 lượt Codex, không vẽ lại), prompt `prompt-rows-se.md`, `prompt-rows-nw.md`.
- Cắt: `python docs/art-review/units-iso/make_review.py --rows slinger` → `frames-rows/` (40×35 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: khăn trùm đầu xanh buộc nút, áo len nâu xám viền kem, đai xanh, túi da đựng đá, dây ná da.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng; khung ném không vẽ viên đá bay (game tự vẽ).
- Ghi chú nhỏ (chấp nhận): ở NW cổ áo chữ V bị vẽ cả ở lưng áo; ở cỡ game (~35 px) chỉ còn 1–2 pixel, không thấy rõ. Tấm NW tô bóng mềm hơn SE một chút; sau khi thu nhỏ và vẽ lại viền thì hai hướng đồng đều.
