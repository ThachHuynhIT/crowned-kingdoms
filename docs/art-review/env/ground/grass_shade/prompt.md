Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/env/ground/grass_shade/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Góc nhìn" (khung BẮT BUỘC, mục "Texture mặt đất" và khối "Prompt texture mặt đất dùng lại") và mục "Quy tắc vẽ". Ảnh tham chiếu đã duyệt được đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): CHỈ lấy bảng màu, cỡ cụm pixel và độ hoàn thiện từ đó (texture vẽ nhìn thẳng từ trên xuống, KHÔNG isometric); KHÔNG sao chép nguyên hình dạng của nó cho công trình khác.

Ảnh cỏ hiện tại của game đính kèm (`docs/art-review/env/ground/ref-grass-existing.png`): khớp màu, cỡ búi cỏ và lưới pixel với nó. Ảnh đã duyệt đính kèm thêm để lấy bảng màu: `docs/art-review/style-references/iso-plot-open-approved.png`, `docs/art-review/style-references/iso-plot-built-approved.png`.

Create one seamless pixel-art GROUND TEXTURE for Crowned Kingdoms: SHADED GRASS.
This is a flat texture seen STRAIGHT FROM ABOVE (top-down), square, and it TILES SEAMLESSLY: the left edge
continues into the right edge and the top edge into the bottom edge, with no visible seam, border or vignette.
The game itself lays it onto the 2:1 isometric ground, so do NOT draw it in isometric or perspective.
Use the attached approved images ONLY for the warm palette, pixel-cluster size and finish (match the approved
isometric plots' earth and grass tones). Cozy warm medieval pixel art, crisp square pixel clusters about
16×16 image px (a 64×64 art-pixel grid), upper-left lighting, no antialiasing, no blur, no smooth gradients. Same family as the attached existing grass tile (ref-grass-existing.png, the current game grass): same warm mid green base, same small dark-green tuft shapes, so this variant can sit next to it on the same ground. Grass in light shade: a touch darker and cooler green overall, tufts a little longer, no flowers.
No objects that stick up (no trees, big rocks, buildings), no shadows, no text, labels or watermark.

YÊU CẦU SẢN XUẤT: ảnh VUÔNG 1024×1024, texture phủ KÍN cả ảnh (không nền đen, không khung, không viền, không khoảng trống), LẶP LIỀN MẠCH theo cả hai chiều. Đây là MỘT ô cỏ nhỏ của game (16×16 px thế giới): vẽ trên lưới 64×64 "pixel" nghệ thuật, mỗi "pixel" là một khối vuông đúng 16×16 điểm ảnh, màu phẳng trong khối (ảnh sẽ được thu nhỏ đúng 16 lần về 64×64 và 32 lần về 32×32). Cỡ búi cỏ như ảnh tham chiếu cỏ hiện tại (ảnh đó cũng là 64×64 phóng 16 lần).
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
