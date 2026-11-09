Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g5/menu/sky/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Giao diện (UI)" (đoạn "Menu chính"), mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH (pixel art ấm áp, cỡ cụm pixel, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái); KHÔNG sao chép hình ngôi nhà.

Create one pixel-art DUSK SKY for the Crowned Kingdoms main menu, behind the approved hill strips (attached style reference for finish only).
Format: a WIDE landscape image (aspect 3:2, 1536x1024 px). It is reduced to 384x256 art pixels (4 source px per art pixel) and REPEATS SEAMLESSLY left to right: the left edge continues exactly into the right edge (same colours and the same clouds cut at the edges), no vignette, no border.
Sky colours top to bottom, as flat bands joined by sparse 2x2 dithering (no smooth gradient): #F6B26B apricot at the top, #F08A5D orange, #B85C7A rose, #6B4A8A violet at the bottom.
Add a few soft long pixel-art clouds in the upper and middle sky, lit warm orange-pink from the low sun on their undersides, and a handful of tiny pale stars only in the violet bottom band. No sun disc, no moon, no land, no mountains, no birds.
No text, letters, UI, watermark, blur or antialiasing; crisp square pixel clusters only.
