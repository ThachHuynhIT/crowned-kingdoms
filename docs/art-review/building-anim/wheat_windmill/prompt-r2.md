Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/building-anim/wheat_windmill/anim-source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Góc nhìn" (khung BẮT BUỘC, mục con "Isometric (trục đo 2.5D) cho sprite thế giới", khối "Prompt isometric dùng lại", "Kiểm trước khi duyệt (isometric)") và mục "Quy tắc vẽ".

ẢNH ĐÍNH KÈM:
1. `docs/art-review/building-anim/wheat_windmill/template.png` — KHUNG CẦN VẼ LẠI: ba bản GIỐNG HỆT NHAU của công trình đã duyệt, đặt cạnh nhau ở cùng vị trí trong ba ô rộng 512 px. Đây là ảnh gốc để CHỈNH SỬA, không phải gợi ý phong cách.
2. `docs/art-review/building-anim/wheat_windmill/source.png` — ảnh nguồn đã duyệt của chính công trình này (độ phân giải đầy đủ), để nhìn rõ chi tiết.
3. `docs/art-review/style-references/harvester-house-front-approved.png` — mẫu phong cách đã duyệt (nhà Thợ Gặt): CHỈ lấy phong cách, KHÔNG lấy góc nhìn chính diện của nó.
4. `docs/art-review/style-references/iso-building-approved.png` — mẫu góc nhìn isometric đã duyệt.

Create one isolated pixel-art asset for Crowned Kingdoms: Cối Xay Gió (windmill, economy building) — idle animation, sails turning.
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
Cozy warm medieval pixel art, crisp square pixel clusters. Materials, palette and details exactly as in the attached approved picture of this building.
Whole asset visible in every panel, flat black #000000 background, padding around it.
No people, text, labels, UI, watermark, blur, soft shadows or antialiasing.

THIS IS AN ANIMATION EDIT OF AN EXISTING APPROVED PICTURE, NOT A NEW DRAWING.
Output: ONE image 1536x1024 px, the same layout as attached image 1: three panels side by side, each 512 px wide,
flat pure black #000000 background everywhere outside the building, no panel borders or grid lines.
Each panel shows the SAME building at the SAME position, size and camera as in image 1, pixel for pixel. The three
panels are three frames of a short looping animation (frame 1 left, frame 2 middle, frame 3 right).
- Panel 1 (left): an EXACT copy of the building of image 1. Change nothing.
- Panels 2 and 3: the same exact copy, where ONLY the four cloth sails and their wooden arms move: they turn around the hub (the round wooden boss on the cap), clockwise, staying in the SAME slanted plane of the right (south-east) face of the cap. Panel 2: the sails turned 30 degrees from panel 1; panel 3: turned 60 degrees from panel 1 (a further 30 degrees turns them back onto panel 1, since the four sails repeat every 90 degrees, so the loop is seamless). Every sail keeps the same cloth, lattice, wood and colours as in panel 1 (its length on screen follows the tilted plane, see the geometry guide); the hub stays exactly in place; no sail tip goes outside the grey ellipse of the guide. Where a sail moves away, redraw the thatch, wall or black background that was behind it exactly as in panel 1. The thatched cap, tower, windows, door, stone base and flour sacks do NOT change at all.
STRICT: the footprint, outline, silhouette, walls, roof, door, windows, colours, shading and EVERY static pixel stay
IDENTICAL in all three panels; do not shift, rescale, re-render, re-shade, recolour, sharpen or "improve" the
building; do not add or remove details; no camera change. Only the moving parts listed above differ between panels,
in small readable steps (they must read at 60 px wide in the game). Same pixel-cluster size as image 1.
No motion blur, speed lines, soft glow, halo, smoke haze, gradients or antialiasing; no text, labels or numbers.
GEOMETRY GUIDE (attached image 5, `docs/art-review/building-anim/wheat_windmill/guide.png`): the same three panels dimmed, with the TARGET position of each
of the four sail arms in that panel drawn as red lines from the white hub to a yellow tip dot; the grey dotted
ellipse is the tilted circle all sail tips travel on (the sails turn IN THE SLANTED PLANE of the cap's right face,
so their tips always lie on that ellipse; they are never drawn as an upright frontal cross). Panel 1 has no red lines
because it stays the exact approved picture. In panels 2 and 3 put the sail arms exactly along the red lines, with
the hub on the white dot. Seen in this tilted plane, a sail pointing
toward a narrow end of the ellipse looks shorter and one pointing toward a wide end looks longer; keep the cloth
width consistent with that foreshortening. The guide is for geometry only: do NOT draw its lines, dots or the dim
colours in the output; the output keeps the full colours of image 1.
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
