Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/env/batches/farm/source.png` (sao chép vào đó nếu ảnh nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Góc nhìn" (isometric 2:1) và mục "Quy tắc vẽ". Ảnh đính kèm: `docs/art-review/style-references/harvester-house-front-approved.png` (phong cách), `docs/art-review/style-references/iso-building-approved.png` (góc nhìn isometric đã duyệt) và `docs/art-review/env/approved-wilds-ref.png` (các vật trang trí hoang dã đã duyệt và đang dùng trong game: cùng loại, lấy góc nhìn, cỡ cụm pixel và độ hoàn thiện).

Create one isolated pixel-art asset for Crowned Kingdoms: a sheet of 8 small wild field decorations for the countryside around the kingdom board (nature and rural objects, not buildings).
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
Cozy warm medieval pixel art, crisp square pixel clusters. Cell 1: one wooden crate with plank sides and corner braces. Cell 2: two wooden crates on the ground and one stacked on top. Cell 3: one tied burlap grain sack standing upright. Cell 4: a pile of three burlap grain sacks lying together. Cell 5: one rectangular golden hay bale tied with two strings, a box shape on the diagonal axes. Cell 6: three rectangular hay bales: two on the ground and one on top. Cell 7: a scarecrow on a wooden post: straw hat, patched shirt, arms out sideways, straw sticking out. Cell 8: an unlit campfire: a ring of grey stones around a few crossed logs, no fire, no smoke.
Whole asset visible, transparent background, padding around it.
No people, text, labels, UI, watermark, blur, soft shadows or antialiasing.
Concept preview only; native sprite size and pixel cleanup are a separate production step.

PRODUCTION (overrides "transparent background" above): ONE image 1536x1024 (landscape), ONE flat solid magenta #FF00FF
background filling the whole canvas, no gradient, no ground patch, no grass carpet under the objects, no cast shadow on
the background; no object may contain magenta or hot pink. This is a SHEET of 8 separate objects laid out on an
invisible grid of 4 columns x 2 rows of equal cells (each cell 384x512 px), read left to right, top row
first. Put exactly ONE object in each cell, centred in it, as large as possible while staying fully inside its cell with
a clear magenta margin: objects must never touch each other or the canvas edge. No grid lines, no numbers, no labels.
Every object uses the SAME isometric 2:1 view, the SAME upper-left light and the SAME pixel-art finish as the attached
approved wild objects (third attachment: shipped trees, rocks, bushes, stump, log, barrel, haystack, sign, cart).
Edges are shaded with each object's own darker tones; no black or dark-red outline ring around the silhouettes.
When done, print the saved path and the image size.
