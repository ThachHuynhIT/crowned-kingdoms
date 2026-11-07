Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/iso-board/wheat/terrain_wall_iso_sample/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

ẢNH THAM CHIẾU GÓC NHÌN ISOMETRIC ĐÃ DUYỆT (đính kèm): `docs/art-review/style-references/iso-plot-open-approved.png` — lấy đúng GÓC NHÌN, tỉ lệ thoi 2:1, cỡ và độ hoàn thiện từ các ảnh này.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Góc nhìn" (khung BẮT BUỘC, mục con "Isometric (trục đo 2.5D) cho sprite thế giới", khối "Prompt isometric dùng lại", "Kiểm trước khi duyệt (isometric)") và mục "Quy tắc vẽ". Ảnh tham chiếu đã duyệt được đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): CHỈ lấy phong cách, bảng màu, chất liệu và cỡ cụm pixel từ đó, KHÔNG lấy góc nhìn chính diện của nó (góc nhìn là isometric 2:1); KHÔNG sao chép nguyên hình dạng của nó cho công trình khác.

Create one isolated pixel-art asset for Crowned Kingdoms: one segment of the rocky mountain cliff on the north edge of the battlefield, 2:1 isometric.
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
Cozy warm medieval pixel art, crisp square pixel clusters. A long rocky cliff segment: its FOOT runs along the DOWN-RIGHT diagonal of the 2:1 grid (from the UPPER-LEFT to the LOWER-RIGHT of the image, exactly 1 px down for every 2 px across, the same slope as the upper-right edges of the attached approved plots); its vertical rock face, about 300 px tall, faces the viewer on the LOWER-LEFT (south-west) side; mossy grey-brown rock in large blocks with grass tufts and a few small bushes on top; the top of the cliff is a grassy plateau seen from above. Both ends of the segment are cut cleanly along VERTICAL lines so identical segments can be placed end to end along the diagonal. No water, no sky, no buildings.
Whole asset visible, transparent background, padding around it.
No people, text, labels, UI, watermark, blur, soft shadows or antialiasing.
Concept preview only; native sprite size and pixel cleanup are a separate production step.

YÊU CẦU SẢN XUẤT (ghi đè phần "transparent background" ở trên): ảnh 1536×1024, nền ĐEN PHẲNG #000000 hoàn toàn (không quầng sáng, không bóng, không trời/biển). MỘT đoạn vách đá duy nhất: chân vách là đường chéo 2:1 đi XUỐNG từ khoảng (168, 400) tới khoảng (1368, 1000) (cứ sang phải 2 px thì xuống 1 px); mặt vách đứng thẳng cao khoảng 300 px phía trên đường chân; hai đầu đoạn cắt thẳng đứng. "Pixel" lớn khoảng 7×7 điểm ảnh.
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
