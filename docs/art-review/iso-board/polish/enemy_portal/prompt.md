Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/iso-board/polish/enemy_portal/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

ẢNH THAM CHIẾU GÓC NHÌN ISOMETRIC ĐÃ DUYỆT (đính kèm): `docs/art-review/style-references/iso-building-approved.png`, `docs/art-review/style-references/iso-plot-open-approved.png` — lấy đúng GÓC NHÌN, tỉ lệ thoi 2:1, cỡ cụm pixel và độ hoàn thiện từ các ảnh này.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Góc nhìn" (khung BẮT BUỘC, mục con "Isometric (trục đo 2.5D) cho sprite thế giới", khối "Prompt isometric dùng lại", "Kiểm trước khi duyệt (isometric)") và mục "Quy tắc vẽ". Ảnh tham chiếu đã duyệt được đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): CHỈ lấy phong cách, bảng màu, chất liệu và cỡ cụm pixel từ đó, KHÔNG lấy góc nhìn chính diện của nó (góc nhìn là isometric 2:1); KHÔNG sao chép nguyên hình dạng của nó cho công trình khác.

Create one isolated pixel-art asset for Crowned Kingdoms: the enemy teleport portal at the end of the road, where the enemy army steps out, 2:1 isometric.
Use the attached approved harvester house ONLY as the style reference (materials, warm palette,
pixel-cluster size, dark material-colored outlines, level of detail). Do NOT copy its front-facing camera.
ISOMETRIC view, classic 2:1 pixel-art isometric (dimetric): the ground footprint is a DIAMOND twice as
wide as it is tall; edges that run along the ground follow the two diagonal axes as clean 2-across-1-up
pixel steps; vertical edges stay vertical; parallel lines stay parallel (no perspective).
For a building: two walls are visible (left wall facing south-west, right wall facing south-east) and the
roof is seen from above; its footprint is one small diamond. The roof sits squarely on the walls: all four
eave corners are at the SAME height, so every eave line is PARALLEL to the wall top just below it and climbs at
exactly 2:1 toward the back; the left and right eave corners are level with each other on screen, and the
ridge runs parallel to one diagonal axis (never flatten one eave so that a back corner rises above the front).
For a ground tile: a flat diamond seen from
above with a few pixels of visible thickness on its two front edges.
Upper-left lighting: the left (south-west) faces are lighter than the right (south-east) faces.
Cozy warm medieval pixel art, crisp square pixel clusters. A magical gate: two weathered dark-grey stone pillars joined by a carved stone lintel, standing on a small round stone base whose footprint is one small diamond. Between the pillars a swirling violet-and-purple magic surface with a few pale glints, faint glowing violet runes carved on the pillars. The gate stands in a vertical plane along the diagonal axis that runs from the LOWER-LEFT to the UPPER-RIGHT of the image, so its glowing opening is seen at the 2:1 angle; a short worn dirt path leads into it from the upper-left side. Menacing but in the same cozy warm style as the approved buildings: no skulls, no gore. About 420 px wide and at most 560 px tall.
Whole asset visible, transparent background, padding around it.
No people, text, labels, UI, watermark, blur, soft shadows or antialiasing.
Concept preview only; native sprite size and pixel cleanup are a separate production step.

YÊU CẦU SẢN XUẤT (ghi đè phần "transparent background" ở trên): ảnh 1024×1024, nền ĐEN PHẲNG #000000 hoàn toàn (không quầng sáng, không bóng đổ lên nền, không nền đất/cỏ ngoài chính vật thể và mảng chân nhỏ của nó; trong vật thể không có điểm đen thuần). MỘT vật thể duy nhất ở giữa ảnh theo chiều ngang, chân vật thể (đáy hình thoi chân) ở khoảng y = 900. "Pixel" lớn khoảng 7×7 điểm ảnh, cạnh thoi là bậc pixel 2 ngang – 1 dọc.
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
