Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g5/stone/stone_golem_forge/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

ẢNH THAM CHIẾU GÓC NHÌN ISOMETRIC ĐÃ DUYỆT (đính kèm): `docs/art-review/style-references/iso-building-approved.png` — lấy đúng GÓC NHÌN, tỉ lệ thoi 2:1, cỡ và độ hoàn thiện từ các ảnh này.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Góc nhìn" (khung BẮT BUỘC, mục con "Isometric (trục đo 2.5D) cho sprite thế giới", khối "Prompt isometric dùng lại", "Kiểm trước khi duyệt (isometric)") và mục "Quy tắc vẽ". Ảnh tham chiếu đã duyệt được đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): CHỈ lấy phong cách, bảng màu, chất liệu và cỡ cụm pixel từ đó, KHÔNG lấy góc nhìn chính diện của nó (góc nhìn là isometric 2:1); KHÔNG sao chép nguyên hình dạng của nó cho công trình khác.

Create one isolated pixel-art asset for Crowned Kingdoms: Xưởng Người Đá (golem forge, troop building of the stone king), 2:1 isometric.
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
Cozy warm medieval pixel art, crisp square pixel clusters. Card description (written for the card picture; draw ONLY the building or site as a world sprite: no soldiers, animals or people standing in front of it, a creature only if it IS the building, e.g. carved or grown into it): a slate-stone workshop with a broad slab roof and a big chimney, a half-built rune-carved stone golem standing in the open doorway, chisels, hammers and rock blocks outside, softly glowing runes. It is "Xưởng Người Đá" (golem forge), a building that trains soldiers of this kingdom (barracks, den, hall, workshop); no soldiers drawn. What it does in the game: Xưởng Người Đá | Sinh 1 Người Đá khi ra trận. The MAIN DOOR is on the RIGHT wall (facing south-east, right of the image). No deck or platform under it: the walls stand directly on the ground; it stands in the MIDDLE of its plot and its footprint is one small diamond. ROOF: sits squarely on the walls, all four eave corners at the SAME height, every eave parallel to the wall top below it at the true 2:1 slope, left and right eave corners on the same screen row; no back corner raised. Same scale, camera and finish as the attached approved isometric Reapers barn. Theme: mountain kingdom, cool slate blue-grey stone, glowing blue runes, crystals.
Whole asset visible, transparent background, padding around it.
No people, text, labels, UI, watermark, blur, soft shadows or antialiasing.
Concept preview only; native sprite size and pixel cleanup are a separate production step.

YÊU CẦU SẢN XUẤT (ghi đè phần "transparent background" ở trên): ảnh 1024×1024, nền ĐEN PHẲNG #000000 hoàn toàn (không quầng sáng, không bóng đổ lên nền, không nền đất/cỏ ngoài chính vật thể). MỘT vật thể duy nhất ở giữa ảnh. Công trình: hình thoi chân rộng khoảng 440 px, đáy hình thoi chân ở khoảng y = 900, đứng thẳng trên nền đen (không bệ, không sàn gỗ). Ô đất: hình thoi rộng khoảng 900 px, cao khoảng 450 px (đúng 2:1), nằm giữa ảnh. "Pixel" lớn khoảng 7×7 điểm ảnh, cạnh thoi là bậc pixel 2 ngang – 1 dọc.
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.


ẢNH WHEAT ĐÃ DUYỆT CÙNG LOẠI (đính kèm): `public/assets/art/ai-v1/iso/wheat_throne.png`; HAI MẪU ĐÃ DUYỆT CỦA VUA NÀY (đính kèm): `docs/art-review/g5/stone/stone_throne/source.png`, `docs/art-review/g5/stone/plot_stone_open/source.png` — giữ đúng góc nhìn isometric 2:1, cỡ, mật độ cụm pixel, viền, ánh sáng trên-trái, bảng màu và chất liệu của các mẫu này; mọi công trình của vua này phải trông cùng một bộ.
