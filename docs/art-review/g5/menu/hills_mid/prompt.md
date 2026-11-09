Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g5/menu/hills_mid/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Giao diện (UI)" (đoạn "Menu chính"), mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH (pixel art ấm áp, cỡ cụm pixel, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái); KHÔNG sao chép hình ngôi nhà.

Create one pixel-art PARALLAX BACKGROUND LAYER for the Crowned Kingdoms main menu: middle layer.
The menu sky behind it is a warm dusk gradient (top to bottom: #F6B26B apricot, #F08A5D orange, #B85C7A rose, #6B4A8A violet), painted separately. This layer sits in front of that sky; it is the middle distance: rolling green-brown hills in warm dusk light, darker than the far layer.
Format: a WIDE landscape image (aspect ratio 3:2, 1536x1024 px). The layer is ONE horizontal band of land along the BOTTOM of the image, its ridge line about half of the image height from the bottom; everything above the ridge is background. The band will be reduced to 256 art pixels wide, so each art pixel is 6x6 source pixels: crisp square pixel clusters, big simple shapes.
It must REPEAT SEAMLESSLY left to right: the ridge height and the colours at the left edge continue exactly into the right edge (the same height and the same row of shapes at x = 0 and x = width), no vignette, no border.
Content: rolling hills with patches of meadow and a few rows of rounded and pointed pine trees standing on the ridge, a small windmill and a cottage roof in one place; muted green, olive and warm brown with a purple shade.
Light: dusk light from the upper-left; tops and left slopes catch a warm rim of light, lower parts fall into shade; flat colour bands with sparse dithering, no smooth gradients.
Background above the ridge: ONE flat solid magenta #FF00FF, no gradient, no glow, no shadow, so it can be cut out; the land itself must not contain magenta.
No text, letters, UI, frame, watermark, people, animals, blur, antialiasing or soft glow.
