Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/units-iso/militia/rows-se-source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH và GÓC NHÌN (pixel art ấm áp, camera nhìn xuống 45°, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm, họa tiết chất liệu rõ); KHÔNG sao chép hình ngôi nhà.

Create ONE pixel-art ANIMATION SHEET for the Crowned Kingdoms unit Dân Quân (Lúa Mì) — a basic village militiaman, the weakest melee unit of the Wheat kingdom.
Attached images: (1) the approved style reference; (2) the approved ISOMETRIC building `docs/art-review/style-references/iso-building-approved.png` — its CAMERA (classic 2:1 isometric, looking down at about 30 degrees); (3) `docs/art-review/units-iso/militia/poses-se-source.png` — the approved sample of THIS unit facing this way: draw exactly the SAME character at the SAME size, camera, facing, palette, outline and pixel size.
Facing: every cell faces DOWN-RIGHT (south-east): a three-quarter FRONT view: face, chest and the front of the weapon hand turned toward the lower right of the screen; the left side of the body is nearer the viewer. Do not draw any mirrored copy.
Format: a LANDSCAPE image, aspect ratio 3:2 (target 1536x1024 px), a grid of 4 columns x 3 rows of equal cells (each 384 px wide and 341 px tall), ONE ROW PER ANIMATION. Each used cell holds ONE full-body copy of the character, the same size in every cell, the feet on the same baseline near the bottom of the cell, a margin on every side, nothing crossing into another cell, no grid lines drawn. Each art pixel is a clean square block of 6x6 source pixels.
Row 1 — IDLE, 3 frames in the first three cells (the 4th cell of row 1 stays EMPTY magenta), a gentle breathing loop:
1. standing at rest, weight on both feet, weapon upright (as the sample);
2. breathing in, shoulders and head 1 art pixel lower;
3. breathing out, halfway back (leads back into frame 1).
Row 2 — WALK, 4 frames, a smooth loop toward the facing direction:
1. contact: the near foot just landed forward, the far foot back, arms swinging, body 1 art pixel lower;
2. passing: the far foot lifted passing the near leg, body at idle height;
3. contact on the other side: the far foot forward, the near foot back, the other arm swing, body 1 art pixel lower;
4. passing on the other side (leads back into frame 1).
Row 3 — ATTACK, 4 frames:
1. anticipation: weight shifts back, the spear starts to draw back, shield up.
2. wind-up: the spear pulled fully back to the hip along the facing direction, front knee bent, shield raised in front of the chest.
3. strike: a lunge toward the facing direction, the spear thrust straight out along it with the arm fully extended.
4. recovery: pulling back from the lunge, the spear half withdrawn, returning toward the idle stance.
Neighbouring frames change only a little so the loops play smoothly. All movement follows the facing direction (diagonal on screen), never a pure left-right side view. Big simple limb and weapon movements that read at 64x64 art pixels; no motion blur, speed lines or effects.
Team colours: ALLY version, blue accents exactly as in the sample.
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting, a 1-art-pixel dark outline in a darker shade of each material (never pure black), the sample's palette.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no gradient, texture, glow, cast shadow or ground; the character must not contain magenta.
No text, letters, numbers, labels, UI, frame, watermark, blur, antialiasing or smooth gradients.
