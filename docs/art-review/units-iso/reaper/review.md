# Thợ Gặt (reaper) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 16/11/2026).

- Quy trình: giống mẫu Dân Quân đã duyệt (commit a0b6634): mỗi hướng MỘT ảnh Codex, lưới 4×3, hàng 1 đứng yên 3 khung (ô thứ 4 trống), hàng 2 đi 4 khung, hàng 3 đánh 4 khung.
- Prompt: `prompt-rows-se.md`, `prompt-rows-nw.md`, dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows reaper` (đầu prompt bắt đọc `docs/ART_STYLE.md`). Ảnh đính kèm: mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng (`militia/rows-<dir>-source.png`, ảnh cùng loại) và tấm động tác chính diện đã duyệt của Thợ Gặt (`g3e/units/reaper/poses-source.png`, giữ đúng nhân vật).
- Nguồn: `rows-se-source.png`, `rows-nw-source.png` (1536×1024, mỗi hướng 1 lượt Codex, không vẽ lại).
- Cắt: `python docs/art-review/units-iso/make_review.py --rows reaper` → `frames-rows/` (38×38 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE là ba phần tư mặt trước nhìn xuống-phải, NW là ba phần tư lưng nhìn lên-trái, cùng camera với tấm Dân Quân; không phải nhìn ngang.
- Nhân vật khớp tấm chính diện: mũ rơm vành rộng có dải xanh, áo len vàng đất, đai xanh, găng da, liềm-hái cán gỗ.
- Đủ 3/4/4 khung, cỡ đều giữa các khung, chân cùng đường đáy; không có chữ, nhãn hay bóng.
- Ghi chú: ở NW cú chém quét thấp ra phía trước-trái (lưỡi xuống gần đất), đúng ý "quét thấp ngang gối"; ở SE lưỡi liềm khi đứng nằm phía sau vai trái, khác tấm chính diện (vai phải) do đổi hướng — chấp nhận.
