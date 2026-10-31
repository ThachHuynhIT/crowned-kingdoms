Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g3e/icons/icon_troop/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH (pixel art ấm áp, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm, họa tiết chất liệu rõ); KHÔNG sao chép hình ngôi nhà.

Create one pixel-art UI ICON for Crowned Kingdoms: Lính (loại thẻ) — the card kind "troop": a barracks that spawns soldiers.
Format: a SQUARE image (aspect ratio 1:1, target 1024x1024 px, to be reduced to 32x32 art pixels, so each art pixel is 32x32 source pixels). ONE bold, simple object centered, filling about 80% of the frame, readable as a thumbnail at 16x16 px: strong silhouette, big simple shapes, 3 to 4 tones per material, no tiny details.
Object: a small steel helmet with a red plume in front of two crossed swords, the helmet is the main shape, swords peek out behind it; steel greys with a red accent.
Style: warm cozy medieval fantasy pixel art for a Stardew-like wooden-and-cream UI, crisp square pixel clusters, upper-left lighting (top-left edges lighter, bottom-right edges darker), a 1-art-pixel dark brown outline around the whole object (never pure black), saturated warm palette, slight material texture.
View: flat front view of the object as an icon, NOT the 45-degree world view and NOT isometric; no ground, no cast shadow, no scene.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no gradient, no texture, no glow and no shadow, so it can be cut out; the object itself must not contain magenta.
No text, letters, numbers, labels, UI frame, card frame, watermark, blur, antialiasing or smooth gradients. Only this one object.
