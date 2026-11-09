Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g5/king-cards/grove/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Quy tắc vẽ", mục "Góc nhìn" (khung BẮT BUỘC) và mục "Giao diện (UI)". Ảnh tham chiếu đã duyệt đính kèm: `docs/art-review/style-references/harvester-house-front-approved.png` (phong cách: pixel art ấm, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái), `docs/art-review/style-references/card-art-approved.png` (tranh thẻ đã duyệt: độ hoàn thiện) và `public/assets/art/ai-v1/portraits/grove.png` (chân dung đã duyệt của vua này: lấy bảng màu và chủ đề). KHÔNG chép hình của chúng.

Create one pixel-art PLAYING-CARD FACE BACKGROUND for the king-select screen of Crowned Kingdoms: the Grove King (forest).
Format: PORTRAIT image, aspect ratio 2:3 (1024x1536 px). It will be reduced to 66x96 art pixels (about 16 source px per art pixel), so use big crisp square pixel clusters and simple shapes; no detail smaller than one cluster.
Layout (in art pixels of the final 66x96 card):
- An ornamental BORDER band about 7 art px wide on the left, right and top and about 14 art px at the bottom, running all round the card: oak leaves, acorns and a curling green vine; leaf green and bark brown
- The MIDDLE (art px x 9..57, y 8..80) is plain flat paper in pale spring-green parchment, no pattern: the portrait is drawn there.
- The TOP-LEFT corner (x 1..9, y 1..18) and the BOTTOM-RIGHT corner (x 57..65, y 78..95) are plain flat paper too: the game draws a letter "K" and a card suit there. Make these two plain patches TALL: about one fifth of the card height and one seventh of its width each.
- A 1-art-pixel dark outline round the whole card in dark forest green; slightly rounded corners.
Style: warm cozy medieval fantasy pixel art, upper-left lighting, colours from the attached portrait of this king. Flat colour clusters, sparse dithering, no smooth gradients.
Background outside the card: ONE flat solid magenta #FF00FF; the card itself must not contain magenta.
No text, letters, numbers, card suits, faces, people, watermark, blur or antialiasing. Only the empty card face.
