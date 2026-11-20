Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/env/ground/_sheets/sheet_dry_marks_3/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

ẢNH THAM CHIẾU GÓC NHÌN ISOMETRIC ĐÃ DUYỆT (đính kèm): `docs/art-review/style-references/iso-plot-open-approved.png`, `docs/art-review/style-references/iso-building-approved.png` — lấy đúng GÓC NHÌN 2:1, cỡ cụm pixel, bảng màu đất/cỏ và độ hoàn thiện từ các ảnh này.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Góc nhìn" (khung BẮT BUỘC, mục con "Isometric (trục đo 2.5D) cho sprite thế giới", khối "Prompt isometric dùng lại", "Kiểm trước khi duyệt (isometric)") và mục "Quy tắc vẽ". Ảnh tham chiếu đã duyệt được đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): CHỈ lấy phong cách, bảng màu, chất liệu và cỡ cụm pixel từ đó, KHÔNG lấy góc nhìn chính diện của nó (góc nhìn là isometric 2:1); KHÔNG sao chép nguyên hình dạng của nó cho công trình khác.

Create one isolated pixel-art asset for Crowned Kingdoms: a sheet of nine FLAT GROUND DECALS (fairy rings, cracked earth, sand and marks, third variants) for the land around the board.
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
Cozy warm medieval pixel art, crisp square pixel clusters. Every patch lies FLAT on the ground and is seen in the 2:1 isometric view, so its overall outline is squashed to about twice as wide as it is tall. It has NO height, NO thickness, NO cast shadow and is NOT a diamond tile; its outer edge is a natural irregular edge (no dark outline ring).
Whole asset visible, transparent background, padding around it.
No people, text, labels, UI, watermark, blur, soft shadows or antialiasing.
Concept preview only; native sprite size and pixel cleanup are a separate production step.

YÊU CẦU SẢN XUẤT (ghi đè "one isolated asset", "For a building"/"For a ground tile" và "transparent background" ở trên): ảnh 1024×1024, nền ĐEN PHẲNG #000000 hoàn toàn (không quầng sáng, không bóng đổ lên nền, không nền cỏ quanh vật). Ảnh là một BẢNG 3 cột × 3 hàng, mỗi ô khoảng 341×341 px (KHÔNG vẽ đường kẻ ô, không chữ số). Mỗi ô chứa ĐÚNG MỘT mảng trang trí mặt đất, nằm giữa ô, cách mép ô ít nhất 30 px, không chạm sang ô khác. Mảng là vật PHẲNG nằm trên đất, nhìn isometric 2:1: dáng tổng thể dẹt (rộng gấp khoảng đôi cao), KHÔNG chiều cao, KHÔNG bóng đổ, KHÔNG mép dày, KHÔNG phải hình thoi; mép ngoài tự nhiên, không viền tối bao quanh. Trong vật không có điểm đen thuần (tông tối nhất khoảng #2E2018). "Pixel" lớn khoảng 7×7 điểm ảnh, màu phẳng, không khử răng cưa.
Thứ tự các ô (trái → phải, trên → dưới):
1. a THIRD variant (again a different outline, size, colour mix and details, same subject) of: a mushroom fairy ring: a flat ring of tiny red-capped and cream mushrooms seen from above (dots, no height) on slightly darker grass, about 320 px wide
2. a THIRD variant (again a different outline, size, colour mix and details, same subject) of: a fairy ring of tiny brown and white mushroom dots, about 280 px wide
3. a THIRD variant (again a different outline, size, colour mix and details, same subject) of: a patch of cracked dry earth: pale tan clay broken into polygon plates by thin dark-brown cracks, about 300 px wide
4. a THIRD variant (again a different outline, size, colour mix and details, same subject) of: a small cracked dry mud patch, about 200 px wide
5. a THIRD variant (again a different outline, size, colour mix and details, same subject) of: a long cracked dry earth patch with a few dry grass blades, about 320 px wide
6. a THIRD variant (again a different outline, size, colour mix and details, same subject) of: a small patch of pale warm sand, about 260 px wide
7. a THIRD variant (again a different outline, size, colour mix and details, same subject) of: a sand patch with two tiny shells and ripples, about 280 px wide
8. a THIRD variant (again a different outline, size, colour mix and details, same subject) of: a small sand spot, about 170 px wide
9. a THIRD variant (again a different outline, size, colour mix and details, same subject) of: a scorched burnt patch: charred dark-brown ground (darkest tone #3A2A22, never pure black), grey ash and a few faint orange embers, about 280 px wide
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
