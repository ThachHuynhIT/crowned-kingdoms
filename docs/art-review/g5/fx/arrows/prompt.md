Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g5/fx/arrows/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH (pixel art ấm áp, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm); KHÔNG sao chép hình ngôi nhà. Ảnh thứ hai (`docs/art-review/g3e/icons/icon_boulder/source.png`) là icon đá tảng đã duyệt: lấy cỡ cụm pixel và độ đậm của khối.

Create one pixel-art SPRITE SHEET of ARROWS IN FLIGHT for Crowned Kingdoms: the arrows archers and towers shoot.
Format: a SQUARE image (1:1, 1024x1024 px) split into a 3x3 grid of equal cells. Each arrow is reduced to 16x16 art pixels later (about 21 source px per art pixel inside a cell), so draw each as a short bold arrow with big clusters: a 1-art-pixel dark outline, a wooden shaft, a grey iron triangular head and small red-and-white fletching at the tail.
Eight cells hold one arrow each, pointing AWAY from the centre cell, each DRAWN SEPARATELY for its own direction (do not just rotate one picture): top-left points up-left, top-middle points straight up, top-right points up-right, middle-left points left, middle-right points right, bottom-left points down-left, bottom-middle points straight down, bottom-right points down-right. The centre cell stays empty.
Each arrow is centred in its cell, the same length in every cell (about 70% of the cell), fully inside its cell with a margin.
Style: warm cozy medieval fantasy pixel art, upper-left lighting, crisp square pixel clusters.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no grid lines, no gradient, no shadow; the arrows must not contain magenta.
No text, letters, numbers, bows, people, watermark, blur or antialiasing.
