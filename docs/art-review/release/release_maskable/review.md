# release_maskable — icon maskable (cắt từ release_app_icon, 20/11/2026)

- Không vẽ lại. `make_extra_assets.py release_app_icon`: thu cả icon về 420 px đặt giữa khung 512, kéo dài các pixel mép ra ngoài (np.pad edge) để phủ kín khung; trời là các dải ngang nên phần kéo dài không lộ nối.
- Kiểm: `preview.png` (trái: vòng tròn an toàn 80 %; phải: đã che tròn). Chóp vương miện, cờ và bậc thềm nằm trong vòng tròn.
- File: `runtime/icon-maskable-512.png`. 0 lượt Codex.
- Kết luận sơ bộ: ĐẠT. Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026.
