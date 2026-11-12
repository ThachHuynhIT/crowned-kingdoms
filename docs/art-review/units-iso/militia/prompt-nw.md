Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/units-iso/militia/poses-nw-source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH và GÓC NHÌN (pixel art ấm áp, camera nhìn xuống 45°, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm, họa tiết chất liệu rõ); KHÔNG sao chép hình ngôi nhà.

Create ONE pixel-art ANIMATION SHEET for the Crowned Kingdoms unit Dân Quân (Lúa Mì) — a basic village militiaman, the weakest melee unit of the Wheat kingdom.
Attached images: (1) the approved style reference; (2) the approved ISOMETRIC building `docs/art-review/style-references/iso-building-approved.png` — use its CAMERA: classic 2:1 isometric, looking down at about 30 degrees, so the top of the head, hat and shoulders are visible; (3) `docs/art-review/g3e/units/militia/poses-source.png` — this unit's current sheet: draw exactly the SAME character (face, hair, clothes, colours, proportions, weapon and shield, outline thickness, pixel size), only the camera and the facing change.
Facing: every cell faces UP-LEFT (north-west): a three-quarter BACK view: the back of the head, the back and shoulders turned toward the viewer, the character looking and moving toward the upper left of the screen; the face is NOT visible (at most a sliver of cheek). The game mirrors this sheet horizontally for the other side, so do not draw any mirrored copy.
Format: a LANDSCAPE image, aspect ratio 3:2 (target 1536x1024 px), a grid of 3 columns x 2 rows of equal square cells (each 512x512 px). Each cell holds ONE full-body copy of the character, the same size in every cell (about the same height as in the attached sheet), the feet on the same baseline near the bottom of the cell, a margin on every side, nothing crossing into another cell, no grid lines drawn. Each art pixel is a clean square block of 8x8 source pixels, the same block size in every cell.
Cells in reading order (left to right, top row first):
1. IDLE frame 1: standing, weight on both feet, weapon held upright.
2. IDLE frame 2: identical to idle 1 but breathing in: shoulders and head 1 art pixel lower; feet do not move.
3. WALK frame 1: walking toward the facing direction, the near foot forward, arms swinging, body 1 art pixel lower than idle.
4. WALK frame 2: the other foot forward, the other arm swing, body at idle height.
5. ATTACK frame 1 (wind-up): the spear pulled back to the hip along the facing direction, front knee bent, shield raised in front of the chest.
6. ATTACK frame 2 (strike): a lunge toward the facing direction, the spear thrust straight out along it with the arm fully extended, the shield stays on the body.
All movement follows the facing direction (diagonal on screen), never a pure left-right side view. The poses must read as a silhouette at 64x64 art pixels: big simple limb and weapon movements, no motion blur, no speed lines, no effects.
Team colours: ALLY version, blue accents exactly as in the attached sheet (the red enemy version is made later by a recolour tool).
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting (the left side of each shape lighter), a 1-art-pixel dark outline in a darker shade of each material (never pure black), the same palette as the attached sheet.
Background: ONE flat solid magenta #FF00FF filling the whole canvas (every cell), no gradient, no texture, no glow, NO cast shadow and no ground; the character must not contain magenta.
No text, letters, numbers, labels, UI, frame, watermark, blur, antialiasing or smooth gradients.
