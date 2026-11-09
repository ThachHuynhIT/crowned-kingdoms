Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g5/fx/boulder/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH (pixel art ấm áp, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm); KHÔNG sao chép hình ngôi nhà. Ảnh thứ hai (`docs/art-review/g3e/icons/icon_boulder/source.png`) là icon đá tảng đã duyệt: lấy cỡ cụm pixel và độ đậm của khối.

Create one pixel-art BATTLE EFFECT sprite for Crowned Kingdoms: Đá tảng rơi — the royal boulder falling onto the battlefield.
Format: a SQUARE image (1:1, target 1024x1024 px), to be reduced to 16x16 art pixels, so each art pixel is 64x64 source pixels. ONE bold simple shape centered, filling about 85% of the frame, readable at 16x16: strong silhouette, big flat clusters, 3 to 4 tones, no tiny details.
Subject: one big round grey boulder, slightly lumpy, two or three short cracks, a bright highlight on the top-left and a darker shaded bottom-right; warm grey stone, no crown mark, no speed lines.
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting (top-left lighter, bottom-right darker), a 1-art-pixel outline in a darker tone of the subject's own colour (never pure black), saturated warm palette.
View: seen as a small sprite floating over the battlefield, no ground, no cast shadow, no scene.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no gradient, no glow, no shadow, so it can be cut out; the subject itself must not contain magenta.
No text, letters, numbers, UI frame, watermark, blur, antialiasing, soft glow or smooth gradients. Only this one subject.
