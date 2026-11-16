# Thần Chết Trăng (moon_reaper) — tấm hoạt ảnh theo hàng, hướng SE và NW

**Kết luận: ĐẠT.** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (duyệt ngày 17/11/2026).

- Quy trình như mẫu Dân Quân (commit a0b6634): mỗi hướng một ảnh Codex, lưới 4×3 (đứng yên 3, đi 4, đánh 4). Prompt dựng bằng `python docs/art-review/units-iso/make_prompts.py --rows moon_reaper`; đính kèm mẫu phong cách nhà Thợ Gặt, nhà isometric đã duyệt, tấm hàng Dân Quân đã duyệt cùng hướng và tấm động tác chính diện đã duyệt `g3e/units/moon_reaper/poses-source.png`.
- Nguồn: `rows-se-source.png`, `rows-nw-source.png` (mỗi hướng 1 lượt Codex, không vẽ lại), prompt `prompt-rows-se.md`, `prompt-rows-nw.md`.
- Cắt: `python docs/art-review/units-iso/make_review.py --rows moon_reaper` → `frames-rows/` (74×60 ở density 2), `review-rows.png`, `anim-rows-<se|nw>-<idle|walk|attack>.gif`.

Kiểm:
- Góc nhìn: SE ba phần tư mặt trước hướng xuống-phải, NW ba phần tư lưng hướng lên-trái, cùng camera với tấm Dân Quân.
- Nhân vật khớp tấm chính diện: áo choàng trùm đầu tím đậm viền xanh, mặt nạ trăng nhạt, dải vải xanh có hình trăng, lưỡi hái trăng lưỡi liềm vàng cán tím có ngọc xanh.
- Đủ 3/4/4 khung, cỡ đều, chân cùng đường đáy; không chữ, không bóng.
- Ghi chú: áo tím nằm gần màu khoá magenta nên `make_review.py` cắt con này bằng khoá chặt (`TIGHT_KEY`); với khoá lỏng chung áo bị thủng và mũ NW mất. Khi đưa vào game cần dùng khoá chặt này. Cú quét lưỡi hái thấp ngang gối đúng hướng.
