Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/iso-board/decor/wild_fence_vertical/source.png` (sao chép vào đó nếu ảnh nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Góc nhìn" (isometric 2:1) và mục "Quy tắc vẽ". Ảnh đính kèm: `docs/art-review/style-references/harvester-house-front-approved.png` (phong cách) và `docs/art-review/style-references/iso-building-approved.png` (góc nhìn isometric đã duyệt).

Create one isolated pixel-art asset for Crowned Kingdoms: a short straight wooden fence segment running straight up the screen (toward the viewer and away) (small field decoration).
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
Cozy warm medieval pixel art, crisp square pixel clusters. three posts and two rails seen end-on in a column, warm weathered wood.
Whole asset visible, transparent background, padding around it.
No people, text, labels, UI, watermark, blur, soft shadows or antialiasing.
Concept preview only; native sprite size and pixel cleanup are a separate production step.

PRODUCTION (overrides "transparent background" above): image 1024x1024, ONE flat solid magenta #FF00FF background
filling the whole canvas, no gradient, no ground patch, no grass under the object, no cast shadow on the background;
the object itself must not contain magenta. The object is small: draw it centred, filling about 70% of the canvas.
When done, print the saved path and the image size.
