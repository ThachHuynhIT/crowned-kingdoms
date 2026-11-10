Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/levels/wheat_scarecrow/l2/source.png` (sao chép vào đó nếu ảnh nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Góc nhìn" (isometric 2:1, mái đúng trục) và mục "Quy tắc vẽ". Ảnh đính kèm: `docs/art-review/style-references/harvester-house-front-approved.png` (phong cách), `docs/art-review/style-references/iso-building-approved.png` (góc nhìn isometric đã duyệt) và `docs/art-review/iso-board/wheat/building_wheat_scarecrow/source.png` (CHÍNH công trình này ở cấp 1, đã duyệt: giữ nguyên công trình, chất liệu, bảng màu, hướng cửa; chỉ nâng cấp).

Create one isolated pixel-art asset for Crowned Kingdoms: wheat_scarecrow building, LEVEL 2 (upgraded once).
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
Cozy warm medieval pixel art, crisp square pixel clusters. the SAME building after one upgrade: about 15% taller, a sturdier stone foundation course, one extra detail that shows growth (an added side room or lean-to, a second window row, a small banner or lantern in the kingdom colour), better roof (neater tiles or thicker thatch). Same footprint diamond, same materials, palette and door on the right (south-east) wall.
Whole asset visible, transparent background, padding around it.
No people, text, labels, UI, watermark, blur, soft shadows or antialiasing.
Concept preview only; native sprite size and pixel cleanup are a separate production step.

PRODUCTION (overrides "transparent background" above): image 1024x1024, ONE flat solid magenta #FF00FF background
filling the whole canvas, no gradient, no ground patch outside the building's own footprint, no cast shadow on the
background; the building itself must not contain magenta. Draw it centred with padding, the whole building visible.
When done, print the saved path and the image size.
