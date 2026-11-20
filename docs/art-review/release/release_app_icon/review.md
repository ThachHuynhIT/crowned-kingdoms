# release_app_icon — icon ứng dụng (mẫu, 20/11/2026)

- Prompt: `docs/art-review/g5/menu/make_extra_prompts.py release_app_icon` (HEADER của menu + khối "Prompt mẫu dùng lại"), đính kèm Thợ Gặt + `sky` + `hills_mid`. 1 lượt Codex.
- Ảnh 1024×1024: tháp lâu đài chính diện, thấy mặt trên có lỗ châu mai, cờ hiệu vương miện, cờ xanh; vương miện vàng lớn đính hồng ngọc đè lên đỉnh tháp; nền trời hoàng hôn dither + dải cỏ. Hình khối to, viền đậm.
- `preview.png`: 192 px, mặt nạ tròn đường kính 80% (vùng an toàn maskable), 32 px và 16 px (phóng 2×).
- Đọc tốt ở 192 và 32. Ở 16 px chỉ còn đốm vàng trên khối kem: favicon nên dùng bản rút gọn (chỉ vương miện) hoặc giữ favicon SVG hiện tại.
- Maskable: chóp vương miện và bậc thềm vượt vùng an toàn 80%; khi cắt bản maskable phải thu nhỏ hình vào giữa và kéo dài nền trời ra (nền đơn giản nên làm được bằng script, không cần vẽ lại).
- Kết luận sơ bộ: ĐẠT cho icon 192/512. Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (chờ Claude phiên chính xem lại). Favicon/maskable: cắt từ ảnh này theo ghi chú trên.

## Bản cắt (20/11/2026, Claude đã duyệt)
- `runtime/icon-192.png`, `runtime/icon-512.png` (box reduction). Maskable và favicon cắt từ cùng ảnh, xem `../release_maskable/` và `../release_favicon/`. Script: `docs/art-review/g5/menu/make_extra_assets.py release_app_icon`. Chưa đặt vào `public/`.
