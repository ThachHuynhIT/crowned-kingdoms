Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/units-iso/ogre/rows-nw-source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH và GÓC NHÌN (pixel art ấm áp, camera nhìn xuống 45°, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm, họa tiết chất liệu rõ); KHÔNG sao chép hình ngôi nhà.

Create ONE pixel-art ANIMATION SHEET for the Crowned Kingdoms unit Yêu Tinh Khổng Lồ — a huge slow ogre brute of the raiders.
Attached images: (1) the approved style reference; (2) the approved ISOMETRIC building `docs/art-review/style-references/iso-building-approved.png` — its CAMERA (classic 2:1 isometric, looking down at about 30 degrees); (3) `docs/art-review/units-iso/militia/rows-nw-source.png` — the APPROVED animation sheet of another unit (the Wheat militia) facing this same way: copy its camera, facing, grid layout, cell spacing, feet baseline, outline, shading and finish exactly, but NOT its character; (4) `docs/art-review/g3e/units/ogre/poses-source.png` — this unit's own approved front-view pose sheet: draw exactly THIS character (face, hair, body shape, clothes, colours, proportions, weapon, team-colour areas), only the camera and the facing change to match image 3. Character check for this unit: a huge, chunky, friendly-goofy OLIVE-GREEN ogre exactly as in image 4: a pot belly, darker green spots, a small tuft of brown hair, two small lower tusks, a big round nose, a ragged tan loincloth with blue dots and a BLUE sash, a wooden club with iron studs. Keep the raised club of the wind-up INSIDE its own cell.
Facing: every cell faces UP-LEFT (north-west): a three-quarter BACK view: the back of the head, the back and shoulders turned toward the viewer, the character looking and moving toward the upper left of the screen; the face is NOT visible (at most a sliver of cheek). Do not draw any mirrored copy.
Format: a LANDSCAPE image, aspect ratio 3:2 (target 1536x1024 px), a grid of 4 columns x 3 rows of equal cells (each 384 px wide and 341 px tall), ONE ROW PER ANIMATION, laid out like image 3. Each used cell holds ONE full-body copy of the character, about 240 px tall in every cell (the SAME size in every cell), the feet on the same baseline near the bottom of the cell, a margin on every side, nothing (weapon included) crossing into another cell, no grid lines drawn. Every art pixel is a clean square block, the same block size in every cell.
Row 1 — IDLE, 3 frames in the first three cells (the 4th cell of row 1 stays EMPTY magenta), a gentle breathing loop:
1. standing at rest as in the idle pose of image 4, weight on both feet;
2. breathing in, shoulders and head 1 art pixel lower;
3. breathing out, halfway back (leads back into frame 1).
Row 2 — WALK, 4 frames, a smooth loop toward the facing direction:
1. contact: the near foot just landed forward, the far foot back, body 1 art pixel lower;
2. passing: the far foot lifted passing the near leg, body at idle height;
3. contact on the other side: the far foot forward, the near foot back, body 1 art pixel lower;
4. passing on the other side (leads back into frame 1).
Row 3 — ATTACK, 4 frames:
1. anticipation: the first small move into the wind-up below (weight shifting back).
2. wind-up: the club raised high over the head with both hands.
3. strike: the club slammed down forward along the facing direction at ground level.
4. recovery: coming back out of the strike, returning toward the idle stance.
Neighbouring frames change only a little so the loops play smoothly. All movement follows the facing direction (diagonal on screen), never a pure left-right side view. Big simple limb and weapon movements that read at 64x64 art pixels; no motion blur, speed lines, dust or effects.
Team colours: ALLY version, blue accents exactly as in image 4.
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting, a 1-art-pixel dark outline in a darker shade of each material (never pure black), the palette of image 4.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no gradient, texture, glow, cast shadow or ground; the character must not contain magenta.
No text, letters, numbers, labels, UI, frame, watermark, blur, antialiasing or smooth gradients.
