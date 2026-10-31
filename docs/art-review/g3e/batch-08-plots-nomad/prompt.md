# Batch 08 — Vua Du Mục

Tạo bằng công cụ imagegen tích hợp; tham chiếu `../batch-07-plots-clock-moon/source.png`.
Chỉ lấy hàng 1; hàng 2 là biến thể màu viền. Chưa đưa vào runtime.

## Prompt đã gửi

Create a final production pixel art sheet for Crowned Kingdoms, NOMAD king. Use reference image ONLY as exact visual style, grass/tilled soil textures, composition reference. Save a PNG, exactly 1536x1024 pixels. Black #000000 background between tiles. Six square tiles of 448x448 px in 3 columns x 2 rows, evenly spaced with 40px clear gutters, centered on sheet. Each tile is 64x64 art pixels expanded about 7x, hard nearest pixel edges no antialiasing. Match reference's top-down richly colored pixel art detail and square decorative borders. Row 1 is Nomad: col 1 LOCKED plot, preserve the reference lush wild grassy interior and small flowers; col 2 OPEN plot, preserve reference brown tilled soil interior; col 3 THRONE plot, a multicolored woven rug over leather and packed earth, ceremonial circle and banners in center. Nomad borders: braided cloth/leather ropes, wooden tent stakes, tiny corner fabric pennants, woven carpet patterns. Row 2 repeats these same three states with a different Nomad border color palette for selection, retaining the identical grass/soil interiors. No letters, text, numerals, symbols resembling writing, labels, shadows, glow, gradients, perspective, background scenery. Keep orthogonal square borders, equal tile sizes and consistent style. Only first row will be sliced for runtime. Output must be exactly 1536x1024 PNG.

## Trạng thái kiểm tra

Đã xem ảnh: đủ 6 ô, hai phối màu, nền đen, không chữ. Ảnh sinh chưa bảo đảm
từng khối là đúng 7×7 px hoặc bounding box mỗi ô chính xác 448×448/gutter 40 px;
cần Claude kiểm tra và duyệt sau khi cắt. Không tuyên bố pixel-perfect theo ảnh tham chiếu.
Cần chạy `python tools/slice_art_batches.py` để sinh 3 tile Nomad và manifest.
