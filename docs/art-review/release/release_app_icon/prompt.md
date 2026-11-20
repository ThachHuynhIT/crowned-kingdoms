Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/release/release_app_icon/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Giao diện (UI)" (đoạn "Menu chính"), mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH (pixel art ấm áp, cỡ cụm pixel, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái); KHÔNG sao chép hình ngôi nhà.

Ảnh đính kèm thêm (đã duyệt): `docs/art-review/g5/menu/sky/source.png`, `docs/art-review/g5/menu/hills_mid/source.png` — lấy bảng màu và độ chi tiết của menu từ đây; không chép nguyên cảnh.

STYLE BASE — the "Prompt mẫu dùng lại" block of docs/ART_STYLE.md, quoted verbatim below. It sets the camera, lighting and pixel style for EVERY building that appears in this picture (castle, keep, towers); the lines after it say what this picture is and override only its framing, background and output size:

```text
Create one isolated pixel-art building for Crowned Kingdoms: a small royal castle keep crowned with gold.
Use the attached approved harvester house as the camera and style reference.
STRICT straight-on FRONT VIEW with the camera pitched 45 degrees DOWN (a 45-degree downward oblique view),
orthographic game-art styling: the roof plane (or the top of a tower or windmill) and the front facade
appear about EQUALLY tall because of the 45-degree pitch.
Front facade faces the viewer exactly; horizontal beams, sills, foundation and eaves stay horizontal;
vertical posts stay vertical; both front corners have the same height. No visible side walls.
NO diagonal building rotation, NO isometric view, NO diamond ground base.
Roof ridge runs LEFT TO RIGHT, parallel to the facade. Show a broad front roof plane and a
smaller rear roof strip above the ridge, matching the reference's stylized roof geometry.
Keep the house front-facing while revealing the roof; do not turn it sideways.
Compact readable silhouette, cozy warm medieval pixel art, crisp square pixel clusters,
upper-left lighting, dark material-colored outlines. Warm stone, wood and gold.
Whole building visible, transparent background, padding around roof and feet.
No people, text, labels, UI, watermark, blur or antialiasing.
Concept preview only; native sprite size and pixel cleanup are a separate production step.
```

THIS PICTURE: the APP ICON of Crowned Kingdoms (installed PWA icon; the 192/512 icons, the maskable icon and the favicon will all be cut from this one design, so it must read at 32x32 and survive a circular mask).
Composition: a SQUARE icon. Full-bleed background filling the whole canvas: the dusk sky of the attached menu art (apricot at the top through orange and rose to violet at the bottom) in flat dithered bands, with a strip of the green-olive hills along the bottom. Centred motif inside the central 70% of the canvas (the outer 15% on every side may be cut off by a mask, so nothing important there): one chunky front-facing castle keep (style base camera: straight-on, its crenellated top seen from above) with a blue pennant, under a big golden crown with a red gem that overlaps the top of the keep. Very bold simple shapes, thick dark material-coloured outlines, strong silhouette, few small details.
Output: 1024x1024 px; each art pixel about 16x16 source pixels (the icon is designed on a 64x64 art grid), crisp square pixel clusters, no rounded-corner frame drawn into the image (the platform masks it).
NO text, letters, numbers, watermark, people, blur, antialiasing, soft glow or smooth gradients.
