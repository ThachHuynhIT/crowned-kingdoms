Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g5/menu/hills_far/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Giao diện (UI)" (đoạn "Menu chính"), mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH (pixel art ấm áp, cỡ cụm pixel, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái); KHÔNG sao chép hình ngôi nhà.

Create one pixel-art PARALLAX BACKGROUND LAYER for the Crowned Kingdoms main menu: far layer.
The menu sky behind it is a warm dusk gradient (top to bottom: #F6B26B apricot, #F08A5D orange, #B85C7A rose, #6B4A8A violet), painted separately. This layer sits in front of that sky; it is the farthest land, so it is pale and hazy, closest to the sky colours.
Format: a WIDE landscape image (aspect ratio 3:2, 1536x1024 px). The layer is ONE horizontal band of land along the BOTTOM of the image, its ridge line about two thirds of the image height from the bottom; everything above the ridge is background. The band will be reduced to 256 art pixels wide, so each art pixel is 6x6 source pixels: crisp square pixel clusters, big simple shapes.
It must REPEAT SEAMLESSLY left to right: the ridge height and the colours at the left edge continue exactly into the right edge (the same height and the same row of shapes at x = 0 and x = width), no vignette, no border.
Content: a long chain of soft rolling mountains in hazy violet and dusty rose, a few gentle peaks, one tiny far-away castle with two little towers and a pennant standing on one peak near the middle; very little detail, colours only a step darker than the violet sky.
Light: dusk light from the upper-left; tops and left slopes catch a warm rim of light, lower parts fall into shade; flat colour bands with sparse dithering, no smooth gradients.
Background above the ridge: ONE flat solid magenta #FF00FF, no gradient, no glow, no shadow, so it can be cut out; the land itself must not contain magenta.
No text, letters, UI, frame, watermark, people, animals, blur, antialiasing or soft glow.
