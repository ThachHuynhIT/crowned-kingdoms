Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/units-iso/militia/frames12-nw-b-source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH và GÓC NHÌN (pixel art ấm áp, camera nhìn xuống 45°, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm, họa tiết chất liệu rõ); KHÔNG sao chép hình ngôi nhà.

Create ONE pixel-art ANIMATION SHEET (part 2 of 2) for the Crowned Kingdoms unit Dân Quân (Lúa Mì) — a basic village militiaman, the weakest melee unit of the Wheat kingdom.
Attached images: (1) the approved style reference; (2) the approved ISOMETRIC building `docs/art-review/style-references/iso-building-approved.png` — its CAMERA (classic 2:1 isometric, looking down at about 30 degrees); (3) `docs/art-review/units-iso/militia/poses-nw-source.png` — the approved sample of THIS unit facing this way: draw exactly the SAME character at the SAME size, camera, facing, palette, outline and pixel size; (4) `docs/art-review/units-iso/militia/frames12-nw-a-source.png` — part 1 of this set: continue it exactly (same size, position and baseline).
Facing: every cell faces UP-LEFT (north-west): a three-quarter BACK view: the back of the head, the back and shoulders turned toward the viewer, the character looking and moving toward the upper left of the screen; the face is NOT visible (at most a sliver of cheek). Do not draw any mirrored copy.
This sheet is part of a 12-frame animation set (4 idle, 4 walk, 4 attack) played in a loop, so neighbouring frames must change only a little and the loops must close smoothly (the last frame of each loop leads back into its first).
Format: a LANDSCAPE image, aspect ratio 3:2 (target 1536x1024 px), a grid of 3 columns x 2 rows of equal square cells (each 512x512 px). Each cell holds ONE full-body copy of the character, the same size in every cell, the feet on the same baseline near the bottom of the cell, a margin on every side, nothing crossing into another cell, no grid lines drawn. Each art pixel is a clean square block of 8x8 source pixels.
Cells in reading order (left to right, top row first):
1. WALK 3: contact on the other side: the far foot forward, the near foot back, the other arm swing, body 1 art pixel lower.
2. WALK 4: passing on the other side: the near foot lifted passing, body at idle height (leads back into walk 1).
3. ATTACK 1 (anticipation): weight shifts back, the spear starts to draw back, shield up.
4. ATTACK 2 (wind-up): the spear pulled fully back to the hip along the facing direction, front knee bent, shield raised in front of the chest.
5. ATTACK 3 (strike): a lunge toward the facing direction, the spear thrust straight out along it with the arm fully extended.
6. ATTACK 4 (recovery): pulling back from the lunge, the spear half withdrawn, returning toward the idle stance.
All movement follows the facing direction (diagonal on screen), never a pure left-right side view. Big simple limb and weapon movements that read at 64x64 art pixels; no motion blur, speed lines or effects.
Team colours: ALLY version, blue accents exactly as in the sample.
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting, a 1-art-pixel dark outline in a darker shade of each material (never pure black), the sample's palette.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no gradient, texture, glow, cast shadow or ground; the character must not contain magenta.
No text, letters, numbers, labels, UI, frame, watermark, blur, antialiasing or smooth gradients.
