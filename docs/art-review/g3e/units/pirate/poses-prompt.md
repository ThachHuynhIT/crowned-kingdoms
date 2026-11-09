Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g3e/units/pirate/poses-source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH và GÓC NHÌN (pixel art ấm áp, camera nhìn xuống 45°, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm, họa tiết chất liệu rõ); KHÔNG sao chép hình ngôi nhà.

Create ONE pixel-art ANIMATION SHEET for the Crowned Kingdoms unit Cướp Biển (Thuỷ Triều) — a basic pirate brawler of the Tide kingdom.
The second attached image (`docs/art-review/g3e/units/pirate/source.png`) is this unit's standing sample: draw exactly the SAME character in every cell — same face, hair, clothes, colours, proportions, outline thickness, pixel size and the same weapon — only the pose changes.
Format: a LANDSCAPE image, aspect ratio 3:2 (target 1536x1024 px), a grid of 3 columns x 2 rows of equal square cells (each 512x512 px). Each cell holds ONE full-body copy of the character, the same size in every cell, the feet on the same baseline near the bottom of the cell, a margin on every side, nothing crossing into another cell, no grid lines drawn. Each art pixel is a clean square block of 8x8 source pixels; the character is about 50 art pixels tall (about 400 source pixels) in every cell, the same block size in every cell.
Cells in reading order (left to right, top row first):
1. IDLE frame 1: the same standing pose as the attached sample, facing the viewer.
2. IDLE frame 2: identical to idle frame 1 but breathing in: shoulders and head 1 art pixel lower, the weapon tip 1 art pixel lower; feet do not move.
3. WALK frame 1: body turned three-quarter to the RIGHT, LEFT foot stepping forward, right foot back, arms swinging, body 1 art pixel lower than idle.
4. WALK frame 2: body turned three-quarter to the RIGHT, RIGHT foot stepping forward, left foot back, the other arm swing, body at idle height.
5. ATTACK frame 1 (wind-up): body turned three-quarter to the RIGHT, the cutlass raised back over the shoulder, weight on the back foot.
6. ATTACK frame 2 (strike): body turned three-quarter to the RIGHT, a slash forward to the right at chest height, front foot forward.
View: the same camera as the approved buildings: looking DOWN at the character at 45 degrees, so a little of the top of the head, hat and shoulders is visible. NOT a pure side view, NOT a back view, NOT isometric. The poses must read clearly as a silhouette at 64x64 art pixels: big simple limb and weapon movements, no motion blur, no speed lines, no effects.
Team colours: ALLY version, blue accents exactly as in the sample (the red enemy version is made later by a recolour tool).
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting, a 1-art-pixel dark outline in a darker shade of each material (never pure black), the same palette as the sample.
Background: ONE flat solid magenta #FF00FF filling the whole canvas (every cell), no gradient, no texture, no glow, NO cast shadow and no ground; the character must not contain magenta.
No text, letters, numbers, labels, UI, frame, watermark, blur, antialiasing or smooth gradients.
