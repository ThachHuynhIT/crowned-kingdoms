Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g5/menu/menu_lose/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Giao diện (UI)" (đoạn "Menu chính"), mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`docs/art-review/style-references/harvester-house-front-approved.png`): lấy PHONG CÁCH (pixel art ấm áp, cỡ cụm pixel, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái); KHÔNG sao chép hình ngôi nhà.

Ảnh đính kèm thêm (đã duyệt): `docs/art-review/style-references/card-art-approved.png`, `docs/art-review/g5/menu/sky/source.png`, `docs/art-review/g5/menu/hills_far/source.png`, `docs/art-review/g5/menu/hills_mid/source.png` — lấy bảng màu và độ chi tiết của menu từ đây; không chép nguyên cảnh.

STYLE BASE — the "Prompt mẫu dùng lại" block of docs/ART_STYLE.md, quoted verbatim below. It sets the camera, lighting and pixel style for EVERY building that appears in this picture (castle, keep, towers); the lines after it say what this picture is and override only its framing, background and output size:

```text
Create one isolated pixel-art building for Crowned Kingdoms: the same small castle, now damaged.
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

THIS PICTURE: the DEFEAT backdrop shown full screen behind the end-of-run result panel (the panel covers the CENTRE of the picture, so keep the centre calm: dark open sky and soft distant land, important things in the LEFT and RIGHT thirds).
Scene, wide landscape: the little kingdom has fallen, at night after the battle. On the left third the same kind of cosy stone-and-timber castle on a gentle hill (front-facing per the style base) but damaged: one tower broken, roof tiles missing, thin grey smoke columns rising, a torn blue banner hanging limp; on the right third trampled wheat fields, a broken wooden fence and a fallen golden crown lying in the grass catching a little moonlight; a pale crescent moon and a few stars in a cold violet-indigo sky, low clouds; faint embers. Sad and quiet but still the game's cosy style, NOT gory: no bodies, no blood, no skulls.
Colours: the violet end of the attached menu sky (#6B4A8A) darkening to deep indigo and plum, cool moonlight, a few small warm ember accents; the distant mountains like the attached hills_far but darker.
Output: 1536x1024 px (3:2), full-bleed scene, no border, no vignette; each art pixel about 4x4 source pixels (it will be reduced to 384x256 like the menu sky), crisp square pixel clusters, flat colour bands with sparse dithering.
NO text, letters, numbers, UI, frame, watermark, people, animals, blur, antialiasing, soft glow or smooth gradients.
