Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g5/menu/menu_logo/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

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

THIS PICTURE: the GAME EMBLEM for the Crowned Kingdoms title screen (an original heraldic crest, NOT a copy or pastiche of any existing game's logo: no shield-and-sword layout of famous strategy games, no swooshes, no metallic 3D bevel, no glossy mobile-game style).
Composition, centred and roughly symmetric left-right: a broad heater shield in warm wood brown with a cream parchment field; on the field a tiny front-facing castle keep (same camera as the style base: straight-on, roof/top seen from above) under a golden crown with NINE small points; behind the shield two crossed golden wheat sheaves; below it a wide EMPTY cream ribbon banner with curled ends and NO letters on it (the game writes the title in code, so the ribbon stays blank). A thin dark-brown outline and the cosy Stardew-like warm wood and cream palette of the game's UI; one small blue accent (a pennant on the keep) and one small red accent (a gem in the crown).
Output: 1536x1024 px, the emblem centred and filling about 70% of the width and 85% of the height, padding all round; each art pixel about 6x6 source pixels (the emblem will be reduced to about 256 px wide), crisp square pixel clusters.
Background: ONE flat solid magenta #FF00FF everywhere outside the emblem, no glow, no drop shadow on the background; the emblem itself contains no magenta.
NO text, letters, numbers, runes that look like letters, watermark, people, blur, antialiasing, soft glow or smooth gradients.
