# menu_near — lớp gần của menu (mẫu, 20/11/2026)

- Prompt: `make_extra_prompts.py menu_near` (khung lớp menu của `make_prompts.py`, đính kèm ảnh Thợ Gặt + `sky` + `hills_mid` đã duyệt). 1 lượt Codex.
- Ảnh: dải thấp gồm cỏ, hoa vàng/trắng/hồng, hai bụi tròn, hàng rào gãy; viền cam ở đỉnh; nền magenta tách sạch.
- Thu về 256 rộng: cao 30 px ảnh; đường đỉnh mép trái/phải lệch 1 px (148/147), không thấy khi lặp. `preview.png` = trời + núi xa + lớp giữa + lớp gần, lặp 2 lần.
- Lưu ý: `review.md` của menu (09/11) đã quyết định KHÔNG vẽ `hills_near`, vì lớp gần sẽ che ruộng của lớp giữa. Mẫu này giữ thấp nên chỉ che hàng rào/đáy ruộng của lớp giữa. Nối vào game hay không là quyết định của chủ dự án.
- Kết luận sơ bộ: ĐẠT về hình. Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (chờ Claude phiên chính xem lại).

## Bản cắt (20/11/2026, Claude đã duyệt)
- `runtime/hills_near.png` 256×36 (alpha 0/255, mép lệch 1 px), `runtime/hd/hills_near.png` 512×72 (mép lệch 0 px). Cắt bằng `make_extra_assets.py menu_near` (dùng `make_assets.strip`). Chưa đặt vào `public/`.
