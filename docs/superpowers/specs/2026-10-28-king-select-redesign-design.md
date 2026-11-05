# Làm lại giao diện chọn vua (carousel + chi tiết vua) — thiết kế

Ngày 28/10/2026 · nhánh `g3e-ux-and-art` · thay `KingSelectScene` hiện tại (G2c/§10.3). Chỉ lấy **bố cục và nhịp** của ba ảnh tham chiếu 9 Kings (`.superpowers/ui_refs/`, git-ignored): không sao chép hình, nhân vật, thẻ, font hay màu; mọi art là bản gốc Crowned Kingdoms.

## Mục tiêu
- Màn 1 **CHỌN VUA**: carousel ngang các thẻ vua dọc, thẻ giữa to và sáng, hai bên nhỏ dần và hạ thấp (ảnh a).
- Màn 2 **chi tiết vua** sau khi chọn (ảnh b/c): lưới 3×3 chín thẻ bên trái, thẻ vua lớn bên phải, hàng cuối ĐẶC QUYỀN · ĐỘ KHÓ · CHƠI.
- Toàn bộ màn đổi bảng màu theo vua đang chọn.
- Giữ nguyên luồng: `scene.start(SCENES.realm, { seed, kingId } satisfies RealmData)`, session registry, `lastKing`.

## Phạm vi mở rộng: giao diện trong game (28/10/2026)
Chủ dự án thêm hai ảnh tham chiếu trong game (`d-battle-hud`, `e-loot-pick`): HUD trận/lập kế hoạch (vàng, cột biểu tượng tròn, dải lịch năm, điều khiển tốc độ, thanh máu hai phe có chữ) và màn chọn phần thưởng với ba thẻ dọc. Spec này giữ phần chọn vua; bố cục HUD, thẻ dọc dùng chung, phần thưởng và đồng bộ các màn khác được lập plan chung trong `docs/superpowers/plans/2026-10-28-ui-redesign.md` (Codex soạn từ `docs/art-review/ui-redesign-codex-prompt.md`). Thẻ dọc dùng chung là nền cho lưới 3×3, phần thưởng, tay bài.

## Không làm (non-goals)
- Đặc quyền (Perks), cấp/kinh nghiệm vua, độ khó thật (G3 luôn mức 0) — chỉ chừa chỗ trên giao diện.
- Vẽ lại 94 tranh thẻ dọc: **dự án riêng sau** (xem "Phụ thuộc art"). Công trình đang tạm dừng.
- Tinh chỉnh mobile ngoài việc layout đúng và nút ≥ 44×44.

## Quyết định của chủ dự án (28/10/2026)
- Chân dung vua 96×144 (2:3), bán thân dọc; thẻ dọc mới cho chín thẻ trong lưới; Đặc quyền vô hiệu hóa; **bỏ thanh Cấp**.

## Hành vi

### Dữ liệu và trạng thái mở khóa
- Thứ tự carousel: `PLAYABLE_KINGS_G2` (`wheat`, `stone`, `arcane`) trước, rồi sáu vua còn lại theo `ALL_KINGS`. Vua chơi được lấy từ `CONTENT.kings()` (`KINGS_G2`); vua khóa lấy tên từ `CONTENT.enemyKings()`. Không hardcode chín thẻ: lấy `king.cards` (đúng 9 ở ba vua chơi được).
- Vua khóa: thẻ xám, dấu "?" và ổ khóa, tên "Vua của ?". Repo **chưa có điều kiện mở khóa**, nên hiện dòng "Sắp ra mắt" (quyết định của tôi); khi có dữ liệu thì thay bằng điều kiện. Vua khóa không vào được màn chi tiết (bấm chỉ lắc nhẹ + tooltip).
- Tên hiển thị: tách `nameVi` ("Vua Lúa Mì") thành "Vua của " + danh hiệu "Lúa Mì"; danh hiệu tô màu nhấn của vua (hàm thuần `kingTitleParts`).

### Màn 1 — carousel
- Tiêu đề "CHỌN VUA" giữa trên; nút quay lại góc trái trên (≥ 44×44); mũi tên trái/phải hai bên (ẩn ở hai đầu).
- Năm vị trí: giữa (cỡ 1,0), ±1 (≈ 0,8, hạ xuống), ±2 (≈ 0,62, hạ nhiều hơn), che bớt dưới thẻ giữa; vua ngoài ±2 ẩn. Hệ số cuối cùng là việc của người dựng, theo ảnh a.
- Điều khiển: bấm thẻ cạnh → thẻ đó vào giữa; bấm thẻ giữa hoặc Enter → vào màn chi tiết; ← → đổi vua; vuốt ngang trên cảm ứng (kéo quá ~40 px thì chuyển 1 vua); Esc → về menu.
- Thẻ vua kiểu bài tây: góc trên-trái "K" và ký hiệu chất, góc dưới-phải "K" xoay ngược; viền loang khói nhẹ; màu theo vua. Mỗi vua một chất (♦ ♠ ♥ ♣ vẽ bằng pixel, không dùng glyph font) — việc của người dựng chọn gán.
- Tên vua (cỡ lớn) ngay trên thẻ giữa.

### Màn 2 — chi tiết
- Tên vua làm tiêu đề ("Vua của Lúa Mì"), nút quay lại về carousel (Esc).
- Trái: lưới 3×3 chín thẻ (tên trên đầu, tranh); hover/giữ lâu hiện `Tooltip` mô tả (`describeCard`). Phải: thẻ vua lớn với chân dung.
- Hàng cuối: **ĐẶC QUYỀN** (vô hiệu hóa, tooltip "Sắp có") · **ĐỘ KHÓ** với mũi tên ‹ › (một mức "Nông dân", cả hai mũi tên mờ; dữ liệu là mảng để thêm Gai 0–5 sau) · **CHƠI** nổi bật (Enter).
- Ô seed + nút đổi seed gọn, đặt dưới lưới hoặc cạnh hàng cuối, không tranh chỗ với CHƠI. Seed mới mỗi lần mở màn (như hiện tại).
- Không có thanh Cấp. Không có ô tên/blurb dài: blurb, Ngai và cờ hiệu địch của vua chuyển vào tooltip của thẻ vua lớn (quyết định của tôi — màn mới không còn khung chữ).

### Bảng màu theo vua
- Thêm `KING_THEMES` vào `src/data/uiPalette.ts` (UI colours chỉ ở đó): mỗi vua `{ bgDark, bgMid, panel, light, accent }` gần đơn sắc theo màu chủ đạo của chân dung. Nền màn, khung thẻ, thanh tiêu đề và nút đổi theo. Test: đủ chín vua, mọi giá trị là màu hợp lệ, không trùng bảng giữa các vua.

## Bố cục và cấu trúc kỹ thuật
- Desktop 1280×720 và mobile 375×812 (`width ≥ 768` dùng desktop); tính toán trong file thuần có test, như `kingSelectLayout.ts` hiện tại:
  - `src/ui/kingSelect/carouselLayout.ts`: `carouselSlots(rect, selectedIndex, count)` → vị trí, cỡ, độ sáng, thứ tự độ sâu; `nextIndex`, `swipeTarget`.
  - `src/ui/kingSelect/detailLayout.ts`: lưới 3×3, thẻ vua, hàng cuối, seed — cho desktop và mobile.
  - `src/ui/kingSelect/kingTitle.ts` (`kingTitleParts`), `kingTheme` (tra bảng màu).
  - Thay `src/ui/kingSelectLayout.ts` và test cũ (xóa cùng commit; `KING_CARD`/`kingCardRow` hết dùng).
- `KingSelectScene` giữ tên và key `SCENES.kingSelect`, có hai trạng thái (`carousel | detail`) trong cùng cảnh để không đổi luồng scene. Phím mới cho `kingSelect` thêm vào `src/ui/input/shortcuts.ts` (`←`, `→`, `confirm`, `back`); `select.1..3` giữ để chọn nhanh ba vua đầu.
- Khung: nine-slice từ texture `ui` qua `createPanel`/`createButton`/`Tooltip`; chữ `FONT_UI`, tiếng Việt; không `Rectangle` thô. Thẻ vua và lưới dùng khung mới tạo trong `src/render/uiArt.ts` (nine-slice thẻ dọc) + loang khói pixel sinh bằng noise có hạt giống theo `kingId` (UI, không phải `src/game`).
- Mọi mục tiêu cảm ứng ≥ 44×44; tính lại vị trí trong `layout()` khi resize; đặt lại mọi trường trong `create()` (cảnh được tái dùng).

## Phụ thuộc art
- **Chân dung 96×144** (`docs/art-review/g3e/portraits/`): đang thử mẫu; chưa nối vào `src` khi chưa duyệt. Trước đó thẻ vua lớn dùng `paintPortrait` hiện có, phóng vừa khung (tạm).
- **Tranh thẻ dọc**: lưới 3×3 tạm dùng tranh ngang 64×48 hiện có, đặt trong khung thẻ dọc mới, tên ở trên (quyết định của tôi để màn dùng được ngay). Vẽ lại tranh thẻ dọc cho 94 thẻ là dự án riêng; khi xong chỉ đổi nguồn ảnh, không đổi bố cục.

## Kiểm thử
- TDD cho phần thuần: `carouselSlots` (giữa to nhất, đối xứng, ẩn ngoài ±2, ở hai đầu không thiếu/thừa), `nextIndex`/`swipeTarget` (kẹp biên, ngưỡng vuốt), `kingTitleParts`, bảng màu, `detailLayout` ở 1280×720 và 375×812 (không tràn, nút ≥ 44).
- Kiểm cảnh bằng trình duyệt (Playwright qua `window.game`): carousel → chi tiết → CHƠI vào `RealmScene` với đúng `{ seed, kingId }`; chụp màn ở hai cỡ.
- Cổng: `npm run lint && npm run typecheck && npm test && npm run build`.

## Việc để người dựng quyết
Hệ số cỡ/độ lệch thẻ hai bên, gán chất bài, độ rộng vùng vuốt, màu cụ thể của từng `KING_THEMES` (lấy theo chân dung đã duyệt).
