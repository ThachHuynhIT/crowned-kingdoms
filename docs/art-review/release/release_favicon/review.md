# release_favicon — favicon (cắt từ release_app_icon, 20/11/2026)

- Không vẽ lại. `make_extra_assets.py release_app_icon`: cắt riêng vương miện (vùng 270,52–754,356 của ảnh 1024), đặt giữa khung vuông nền mơ có lề 12 %, thu nhỏ box về 16, 32, 48 và gộp thành `favicon.ico`.
- Kiểm: `preview.png` (16/32/48, phóng 6×). Ở 16 px vẫn đọc ra vương miện vàng có hồng ngọc đỏ; có vài pixel xám của đỉnh tháp ở hai góc dưới và một vệt mây hồng mờ ở góc trên trái, không gây rối. Không cần vẽ vương miện riêng bằng Codex.
- File: `runtime/favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `favicon.ico`. 0 lượt Codex.
- Kết luận sơ bộ: ĐẠT. Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026.
