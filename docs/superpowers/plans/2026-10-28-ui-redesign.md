# Crowned Kingdoms UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (hoặc superpowers:subagent-driven-development khi được yêu cầu) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thống nhất giao diện tiếng Việt quanh thẻ dọc, màu theo vua, carousel chọn vua và HUD thoáng, giữ nguyên luật và toàn bộ thao tác chơi hiện có.

**Architecture:** Dữ liệu màu thuần ở `src/data/uiPalette.ts`; mô hình hiển thị và layout thuần ở `src/ui`; Phaser chỉ dựng view, đọc state và gửi intent qua EventBus. Giữ các primitive `createPanel`, `createButton`, `Tooltip`, thay skin bằng frame có tên trong texture `ui`; không đưa trạng thái giao diện vào save hay luật chơi.

**Tech Stack:** Phaser 4 · TypeScript strict · Vite · Vitest · Playwright qua `window.game` · Python/Pillow cho xử lý chân dung.

**Spec:** `docs/superpowers/specs/2026-10-28-king-select-redesign-design.md`, đã duyệt 29/10/2026, cùng phạm vi A–F trong yêu cầu chủ dự án. Đọc kèm `CLAUDE.md`, `docs/ART_STYLE.md`, `docs/art-review/HANDOFF.md`, `docs/ROADMAP.md`.

## Global Constraints

- Chỉ lấy bố cục, nhịp và cách đổi màu từ năm ảnh `.superpowers/ui_refs/*.webp`; không nhập ảnh tham chiếu, nhân vật, font, mẫu thẻ hay bảng màu game khác vào sản phẩm.
- Chữ tiếng Việt bằng `FONT_UI`; giữ tên thương hiệu Crowned Kingdoms. Khung nine-slice qua `createPanel`, nút qua `createButton`, tooltip hover/giữ 400 ms. Mục tiêu chạm ≥ 44×44 logical px, kể cả nút vô hiệu hóa có tooltip.
- Desktop 1280×720, mobile 375×812; `width >= 768` dùng desktop. Mọi vị trí tính thuần, số nguyên, tính lại khi resize. Mobile nằm trong phạm vi này dù HANDOFF cũ từng hoãn E8.
- Giữ `PALETTE` Hearth 32 và `UI_PALETTE` tương thích; ART_STYLE hiện hành cho phép màu mở. Không đổi màu thế giới để chạy theo UI. Màu phe và dấu hiệu phe không bị theme ghi đè.
- `src/game`, `src/data`, `src/core` không import Phaser/UI/render/scenes/platform; `src/data` không import game. Không sửa luật, schema save, RNG, command hay cân bằng. Mọi số lượng chơi tiếp tục từ `src/data/*`.
- Không dùng `Math.random`/`Date.now` trong phần thuần; seed mới vẫn từ `newRunSeed()` hiện tại ở scene. Loang khói dùng `pixelHash` theo kingId, không dùng RNG của ván.
- Không thêm cấp vua, Perks, mở khóa thật, độ khó thật hay hệ thống di vật. Bỏ thanh Cấp. Chỉ một mức Nông dân, chừa cấu trúc Gai 0–5 cho G4.
- Giữ đường vào ván mới `{ seed, kingId } satisfies RealmData`; giữ nguyên các nhánh resume/preview hiện có, session registry và `lastKing`. Không thu hẹp union `RealmData` thực tế.
- Scene tái sử dụng: reset trường trong `create()`, dọn listener/timer/view trong shutdown; dữ liệu đầu tiên truyền khi launch HUD, không chờ sự kiện create đã phát.
- Công trình đang dừng: không tạo/vẽ lại công trình. Tranh thẻ dọc 94 thẻ là dự án art riêng; không chặn UI dùng art tạm.
- Không đụng `.agents/` hoặc `AGENTS.md`. Phiên lập plan chỉ tạo file này, không chạy node/npm. Các lệnh bên dưới dành cho người thực thi trong môi trường chạy được.
- Cuối **mỗi nhóm D/E/A/C/B/F** chạy `npm run lint && npm run typecheck && npm test && npm run build`, tất cả exit 0 trước khi chuyển nhóm. Trong Git Bash Windows thêm `< /dev/null` vào từng lệnh npm/npx. Không tuyên bố đã chạy từ phiên lập plan.

## Review Focus

1. Resize qua 767/768 giữa lúc chọn thẻ hoặc mở modal: giữ lựa chọn, không hit area cũ hoặc click xuyên (D2, A3, C2, B2).
2. Tên/dòng mô tả tiếng Việt dài, thẻ thứ tư và badge cấp: không đè tranh/nút, tooltip vẫn đủ nội dung (D1–D2).
3. Vua khóa nhận Enter hoặc kết thúc vuốt: không vào chi tiết, không khởi tạo ván, không sửa `lastKing` thành vua khóa (A1/A3).
4. Địch chưa xuất hết, hồi sinh/triệu hồi và boss đổi pha: thanh máu không giả làm số quân hoặc máu vua địch không tồn tại (B1/B3).
5. Double click Nhận/CHƠI và mở lại scene: một intent/chuyển cảnh, không listener trùng, không nhận thưởng hai lần (A3/C2, kiểm cuối F2).

## Thứ tự, phụ thuộc và bản đồ file

Thứ tự tích hợp: **D → E → A → C → B → F**. D chốt cấu trúc thẻ; E chốt API skin; A là mẫu dùng chung; C và B dùng lại mẫu này; F chỉ đồng bộ tối thiểu. Sau D/E có thể làm phần thuần A1, C1, B1 độc lập; xử lý chân dung A4 có thể chạy song song A1–A3. Các cảnh chỉ tích hợp sau interface ổn định. Không sửa song song `theme.ts`, `uiArt.ts`, `atlas.ts`, `modalLayout.ts`, `PlanningHudScene.ts`; C2 phải xong trước B2. Đây là khả năng chia việc, không yêu cầu tự mở agent.

| Nhóm | Trách nhiệm/file chủ đạo | Phụ thuộc | Cổng trình duyệt/rủi ro chính |
| --- | --- | --- | --- |
| D | `src/ui/cards/CardView.ts`, mới `cardLayout.ts`, `cardImage.ts`; các nơi dùng thẻ | Không | Tay 3/4 thẻ, kho/trợ giúp hai cỡ; nguy cơ chữ nhỏ, drag/tooltip xung đột |
| E | `src/data/uiPalette.ts`, `src/ui/theme.ts`, `src/render/uiArt.ts`, `uiKit.ts`, `atlas.ts` | D | Đổi ba vua không rò màu; Kenney đè frame mới, tint làm giảm tương phản |
| A | `src/ui/kingSelect/*`, `src/scenes/KingSelectScene.ts`, shortcut, chân dung | D/E | Carousel/chi tiết/CHƠI hai cỡ; vuốt thành click, khóa lọt guard |
| C | `src/ui/modals/RewardModal.ts`, `modalLayout.ts`, `overlay.ts` | D/E, mẫu A | Reward/conquest/offer nối tiếp; nhận lặp hoặc đề nghị reroll không có luật |
| B | `src/ui/realm/realmLayout.ts`, `src/ui/planning/CalendarStrip.ts`, hai HUD | D/E/C | Trận thường/boss và planning hai cỡ; che bàn, mất ngắm/inspection |
| F | Menu/kết thúc/help/council/quest/deck/calendar | D/E/A/C/B | Luồng resume và toàn ván; thay skin lan sang input/save |

Không xóa file ngoài `src/ui/kingSelectLayout.ts` và `src/ui/kingSelectLayout.test.ts` ở A3. Mỗi task ghi chính xác file tạo/sửa/test; không hiểu các thư mục trong bảng trên là quyền refactor cả thư mục.

## Ảnh tham chiếu → thành phần → file

| Ảnh | Lấy vào thiết kế | File chịu trách nhiệm |
| --- | --- | --- |
| `a-choose-a-king.webp` | Tiêu đề giữa, back trái, carousel 5 vị trí, tên hai màu, khóa, mũi tên | `src/scenes/KingSelectScene.ts`, `src/ui/kingSelect/carouselLayout.ts`, `carouselModel.ts`, `kingTitle.ts`, `KingPortraitView.ts` |
| `b-king-of-spells.webp`, `c-king-of-nothing.webp` | 3×3 trái, vua phải, theme cả màn, hàng hành động; **bỏ thanh Cấp** | `src/ui/kingSelect/detailLayout.ts`, `src/ui/cards/CardView.ts`, `src/data/uiPalette.ts` |
| `d-battle-hud.webp` | Vàng trái trên, lịch giữa trên, tốc độ phải trên, thanh máu đáy; giảm khung lớn | `src/scenes/BattleHudScene.ts`, `PlanningHudScene.ts`, `src/ui/planning/CalendarStrip.ts`, `src/ui/realm/realmLayout.ts`, `src/ui/battle/battleReadout.ts` |
| `e-loot-pick.webp` | Hai tiêu đề, ba thẻ dọc, dòng đổi thưởng, nền tối | `src/ui/modals/RewardModal.ts`, `modalLayout.ts`, `offerModel.ts`, `overlay.ts` |
| b/c/e | Header loại+tên, tranh, ô mô tả; một view nhiều mật độ | `src/ui/cards/cardLayout.ts`, `cardImage.ts`, `CardView.ts`, `src/render/uiArt.ts` |

### Kiểm kê thực tế và chức năng bắt buộc giữ

- **Thẻ:** hiện không có mặt `CardView` ngang: king-select 72×100 nhưng xếp thành **hàng ngang cuộn**; hand 120×168/108×152; reward 150×210/108×152; deck/help 96×134; lựa chọn thẻ hiếm council 100×140. D thay cấu trúc mặt thẻ và nguồn tranh, A bỏ hàng ngang để thành 3×3. Không nhầm tranh ngang 32×24 với thẻ ngang. Các ô sắc lệnh council 300×120 là lựa chọn sắc lệnh, không phải CardView và F giữ dạng ngang.
- **Planning:** mạng, vàng/giá, năm và lịch đầy đủ, dấu hội đồng/nhiệm vụ, scout/đợt địch, sắc lệnh/nhiệm vụ/quest notice; tay tối đa bốn thẻ, chọn/nhấc/drag/drop, dim/badge cấp, tooltip; bán/bỏ bài, đổi bài theo `rerollPrice`, Bộ bài/lọc/cuộn; chọn ô, mua ô, xác nhận/hủy, nhiều mục tiêu, lỗi thiếu vàng/sai ô, Ra trận theo `fightRule`. Giữ bàn 5×5/camera và inspection/vòng tầm đánh.
- **Battle:** vàng, mạng, đồng hồ, HP Ngai, boss tên/HP/pha, địch còn (gồm đợt chưa ra), dấu các đợt; pause/1×/2×/3×, nhớ tốc độ; Tự bắn là auto **Đá Tảng**, Can Thiệp/ngắm/hủy/hồi chiêu, panel Địch, help, inspection/vòng tầm, rage toast, banner thắng/thua, summary và Tiếp tục.
- **Luồng:** offer reward/conquest/questReward qua `pickOffer`, queue `pendingOffers`, không bỏ qua thưởng; chọn rồi Nhận/Enter, không click thẻ là nhận ngay. Council giữ lựa chọn phụ, quest nhận/từ chối/phí, save/resume mọi pha, menu cảnh báo lưu, summary cuối ván và quay menu/ván mới.
- **Input:** giữ mọi action của `src/data/shortcuts.ts`: F1/H; chọn vua 1–3; planning 1–4/R/S/D/L/Enter/Esc; battle P/1–3/Space/B/Esc, Enter/Space ở summary; run-end Enter/Esc. Help/modal bắt buộc/bảng phụ tiếp tục có priority và chặn input tương ứng. Chỉ thêm ←/→ cho chọn vua và L ở battle để mở lịch.

| Khác biệt với ảnh d/e | Quyết định bố cục/phạm vi |
| --- | --- |
| Chưa có hệ thống di vật, cột kỹ năng nhiều ô | Dành rail trái dưới vàng cho Can Thiệp có cooldown; không dựng di vật giả, không thêm rule |
| Không có HP một vua địch trong trận thường | B1 đề xuất HP tổng quân địch đang hiện diện, ghi rõ “Máu quân địch”; giữ số địch còn/đợt riêng, chờ quyết định Q2 |
| Planning chưa có BattleWorld/HP chiến đấu | Chỉ hiện dải tên hai phe và “Chưa giao chiến”; không tạo số HP giả; battle mới hiện hai thanh số |
| Game có mạng/đồng hồ/đợt/boss mà ảnh ít thể hiện | Mạng cạnh vàng; đồng hồ dưới NĂM; địch còn/đợt trên thanh địch; boss có thanh riêng ngay trên dải đáy |
| Game có tay bài/bàn/confirm-buy/quest/decree | Planning giữ bàn giữa; tay đáy giữa; bán/đổi/kho sát tay; ✓/✕ gần mục tiêu, hint phía trên; scout/decree hai cạnh desktop, mở bằng nút ở mobile |
| Ảnh có auto trên mọi màn | Chỉ cho thao tác khi battle có runner; planning không thêm auto-start hay tăng tốc giả; giữ điều khiển battle dưới overlay nhưng không tương tác khi nhận thưởng |
| Repo chưa có reroll reward, chỉ có reroll **tay bài** | C hiển thị “ĐỔI THƯỞNG — Sắp có” vô hiệu hóa, không ghi giá 10, không gửi command `reroll`; xem Q1 |
| Biểu tượng nhỏ đáy ảnh e không có cơ chế tương ứng | Không thêm mắt/điều khiển ẩn HUD giả |

## Quy ước thực thi và nghiệm thu

Mỗi task có một chu kỳ RED → GREEN → kiểm view → commit riêng. Lệnh `npx vitest run <test-files>` phải FAIL vì assertion mới hoặc export chưa có, sau đó PASS; không coi lỗi môi trường là RED. Task chỉ nối Phaser dùng kịch bản Playwright thất bại trước thay đổi, không mock cả Phaser để kiểm vị trí.

**Quy trình PW chung cho mọi task có view:** chạy dev server trong môi trường hỗ trợ; Playwright đặt viewport lần lượt 1280×720 và 375×812, đợi `window.game` và scene active qua `window.game.scene.getScene(...)` (key lấy `src/scenes/keys.ts`). Tương tác bằng chuột/phím/touch; dùng `page.evaluate` đọc scene/controller và đăng ký listener bus để đếm intent, tuyệt đối không sửa trực tiếp state. Có thể dùng fixture/preview DEV sẵn để tới pha khó, không thêm debug API production. Lưu screenshot theo task/viewport và console/pageerror trong bằng chứng PR; sau resize kiểm cả bounds hiển thị lẫn hit target. Chạy lại ở 767/768 cho các task layout. Không dùng ảnh game khác làm pixel-diff đích: so cấu trúc, phân cấp, khoảng thở và phong cách Crowned Kingdoms.

### Task D1: Hợp đồng thẻ dọc và nguồn tranh thay thế được

**Files:** Create `src/ui/cards/cardLayout.ts`, `src/ui/cards/cardLayout.test.ts`, `src/ui/cards/cardImage.ts`, `src/ui/cards/cardImage.test.ts`. Modify `src/ui/cards/CardView.ts`, `src/ui/cards/cardText.test.ts`.

**Interfaces:** `cardLayout(size: Size, inset: number, density: 'compact' | 'full'): CardFaceLayout` trả `header/icon/name/art/description/badge: Rect`; `CardImageRef = { key: string; frame: string; w: number; h: number }`; `resolveCardImage(cardId: CardId, vertical: Readonly<Partial<Record<CardId, CardImageRef>>>): CardImageRef`. Fallback là `sprites` + `cardArtFrame(id)` 32×24 đang có, hiển thị 64×48 nếu vừa; không kéo méo hay tự vẽ art mới. Thêm tùy chọn density cuối constructor CardView, giữ API `setCard/setSelected/setDimmed/resize/onClick/onDrop/destroy`.

- [ ] RED: test `regions_stay_inside`, `header_art_description_order`, `badge_has_own_space` với 72×112 compact, 84×132 compact, 96×144 compact, 120×180 và 180×288 full; mọi rect nằm trong thẻ, không giao nhau. `cardImage` kiểm ID chưa có PNG → fallback, có PNG → metadata mới, không sửa kích thước layout. `cardText` kiểm tên “Đá Tảng Hoàng Gia”, dấu Việt, mô tả dài cắt có “…”, tooltip không cắt.
- [ ] Chạy `npx vitest run src/ui/cards/cardLayout.test.ts src/ui/cards/cardImage.test.ts src/ui/cards/cardText.test.ts`; xác nhận FAIL.
- [ ] GREEN: dựng header luôn có icon loại+tên; vùng tranh cố định dọc, letterbox art ngang ở giữa bằng scale nguyên; ô mô tả có khung con và badge tách riêng. Compact dùng mô tả rút gọn một dòng, full tối đa phần vừa vùng, toàn văn qua `describeCard` trong Tooltip. Không scale nhỏ ảnh nguồn để ép khít. Art dọc tương lai chỉ thêm mapping/metadata, không sửa layout hoặc CardView.
- [ ] Chạy lại PASS; PW chung: card dài/hiếm/selected/dim/null, long-press 400 ms không click, drag >8 px không chọn lần nữa; kiểm description thật không đè ảnh ở hai cỡ.
- [ ] Commit riêng: `feat(ui): define shared vertical card face and image fallback` (git add đúng các file trên).

### Task D2: Đưa các nơi dùng thẻ về cùng hợp đồng

**Files:** Modify `src/ui/planning/HandView.ts`, `src/ui/modals/RewardModal.ts`, `src/ui/modals/DeckModal.ts`, `src/ui/modals/CouncilModal.ts`, `src/ui/help/HelpCardBrowser.ts`, `src/ui/realm/realmLayout.ts`, `src/ui/realm/realmLayout.test.ts`, `src/ui/modals/modalLayout.ts`, `src/ui/modals/modalLayout.test.ts`, `src/ui/help/helpLayout.test.ts`.

**Interfaces:** giữ `HandView.bounds()` và dữ liệu deck/help; đổi kích thước consumer sang preset D1. Hand desktop 120×180; mobile 3 thẻ 108×162, 4 thẻ 84×132 (compact); kho/help 96×144; rare council 100×150; reward tạm giữ đến C1. Tất cả đều cùng CardView, không tạo view thứ hai.

- [ ] RED: thêm test `four_cards_fit_phone`, `selected_lift_clear_of_actions`, `deck_last_row_reachable`, `help_filter_keeps_valid_selection`; 0/1/3/4 thẻ, kho rỗng/nhiều hàng; bounding boxes không tràn ở hai viewport. Giữ thuật toán clamp/snap và badge ×N.
- [ ] Chạy `npx vitest run src/ui/realm/realmLayout.test.ts src/ui/modals/modalLayout.test.ts src/ui/help/helpLayout.test.ts`, xác nhận FAIL.
- [ ] GREEN: thay preset/density từng consumer, cập nhật rowStep/visible pool/drag step, giữ thẻ ẩn không nhận input và selection lift 12 px. Không đổi tab/lọc, nội dung hoặc callback gameplay.
- [ ] PASS lệnh trên; PW chung tay 4 thẻ, kéo thả một/hai mục tiêu, đổi/bán, cuộn kho/help tới thẻ cuối, rare council chọn/xác nhận; resize khi đang chọn không mất selection.
- [ ] Cổng nhóm D; commit `refactor(ui): migrate card consumers to vertical face`.

### Task E1: Chín theme thuần và tra cứu

**Files:** Modify `src/data/uiPalette.ts`. Create `src/data/uiPalette.test.ts`, `src/ui/kingSelect/kingTheme.ts`, `src/ui/kingSelect/kingTheme.test.ts`.

**Interfaces:** `KingTheme = Readonly<{ bgDark: number; bgMid: number; panel: number; light: number; accent: number }>`; `KING_THEMES: Readonly<Record<KingId, KingTheme>>`; `kingTheme(id: KingId): KingTheme`. Màu cụ thể chọn từ chân dung gốc, giữ panel sáng/chữ nâu đọc rõ; wheat vàng cam, stone xám xanh, arcane tím, grove lục, tide biển, forge đỏ than, clock đồng, moon chàm, nomad cát. Không dùng `Content`/game trong data.

- [ ] RED: `nine_distinct_themes`: đúng 9 key của `ALL_KINGS`, mọi kênh số nguyên 0..0xffffff, tuple không trùng; `lookup_preserves_palette` kiểm arcane và wheat khác nhau, UI_PALETTE cũ không đổi. Kiểm tương phản chữ chính/panel ≥4.5:1 bằng helper trong test UI (không dùng Math.pow trong data/core/game).
- [ ] Chạy `npx vitest run src/data/uiPalette.test.ts src/ui/kingSelect/kingTheme.test.ts`, xác nhận FAIL.
- [ ] GREEN: khai báo màu semantic ở một nơi; theme lấy theo **vua người chơi** cho thẻ trung lập/chinh phục, không tự nhảy theo owner thẻ. Chọn vua khóa dùng theme xám semantic, không lộ chân dung.
- [ ] PASS; chưa cần scene riêng, PW chung sau E2 kiểm ba theme và chữ trên nền thế giới sáng/tối.
- [ ] Commit `feat(ui): add nine king themes`.

### Task E2: Skin có theme trên texture ui, không tint giấy/chữ hàng loạt

**Files:** Modify `src/render/uiArt.ts`, `src/render/uiArt.test.ts`, `src/render/uiKit.ts`, `src/render/uiKit.test.ts`, `src/render/atlas.ts`, `src/render/atlas.test.ts`, `src/ui/theme.ts`, `src/ui/cards/CardView.ts`. Create `src/ui/skin.ts`, `src/ui/skin.test.ts`.

**Interfaces:** `UiSkin = 'neutral' | KingId`; `skinFrame(base: BaseUiFrame, skin: UiSkin): UiFrame` ánh xạ frame state; `createPanel` nhận skin tùy chọn cuối, `ButtonOptions.skin?: UiSkin`, `CardView.setTheme(id: KingId): void`. UiFrame vẫn là union tên frame biết trước; cùng họ normal/hover/down/active/selected có source size/slice giống nhau. `UiBox.setFrame` giữ skin lúc đổi base state.

- [ ] RED: `skin_frame_states_have_equal_metadata`, `all_nine_skins_packed`, `neutral_compatibility`, `kit_does_not_override_themed_frames`; kiểm panel/button/card/bar mới đủ state, slice không ăn tranh, atlas mỗi cạnh ≤4096. Dùng frame mới `cardVertical*`, `kingCard*`, `hudButton*`; không scale méo sprite thế giới.
- [ ] Chạy `npx vitest run src/render/uiArt.test.ts src/render/uiKit.test.ts src/render/atlas.test.ts src/ui/skin.test.ts`, xác nhận FAIL.
- [ ] GREEN: sinh biến thể màu vào **texture `ui`**, không texture riêng cho panel; `uiFrameDef` là nguồn metadata cả fallback/kit. Giữ Kenney neutral hiện hữu; frame có theme dùng art sinh, không bị kit chép đè. Loang pixel ở viền, giấy sáng ở lõi, độ hiếm bằng họa tiết/viền ngoài theme; disabled vẫn có Tooltip. Không tint cả container vì sẽ nhuộm chữ/tranh.
- [ ] PASS; PW chung chọn/hover/down/disabled/selected ở hai cỡ, đổi theme không tạo texture tăng mãi; semantic bad/warn/good và phe vẫn phân biệt được bằng chữ/hình.
- [ ] Cổng nhóm E; commit `feat(ui): theme nine-slice frames and shared controls`.

### Task A1: Mô hình carousel và tên vua thuần

**Files:** Create `src/ui/kingSelect/carouselModel.ts`, `carouselModel.test.ts`, `carouselLayout.ts`, `carouselLayout.test.ts`, `kingTitle.ts`, `kingTitle.test.ts`, `difficulty.ts`, `difficulty.test.ts`.

**Interfaces:** `kingChoices(content: Content): readonly KingChoice[]` (id/nameVi/playable/cards); `nextIndex(index: number, delta: number, count: number): number`; `swipeTarget(index: number, dx: number, count: number): number`; `carouselSlots(rect: Rect, selectedIndex: number, count: number): readonly CarouselSlot[]` (index/rect/scale/brightness/depth/visible); `kingTitleParts(nameVi: string): { prefix: string; title: string }`; `DIFFICULTY_OPTIONS` chỉ `{ id: 'peasant', labelVi: 'Nông dân', thorn: 0 }`.

- [ ] RED: thứ tự wheat/stone/arcane rồi sáu vua còn lại theo ALL_KINGS; playable chỉ từ CONTENT.kings(), locked tên từ enemyKings; cards từ king.cards. `nextIndex(0,-1,9)=0`, `(8,1,9)=8`; vuốt ±40 chưa đổi, ±41 đổi đúng một hướng, không wrap, count 0/1 an toàn. Tên “Vua Lúa Mì” → `{prefix:'Vua của ',title:'Lúa Mì'}`, không lặp “của”, chuỗi không tiền tố giữ nguyên danh hiệu. Khóa hiển thị “Vua của ?”/“Sắp ra mắt”.
- [ ] Chạy `npx vitest run src/ui/kingSelect/carouselModel.test.ts src/ui/kingSelect/carouselLayout.test.ts src/ui/kingSelect/kingTitle.test.ts src/ui/kingSelect/difficulty.test.ts`, xác nhận FAIL.
- [ ] GREEN: slot trung tâm scale 1/brightness 1/depth cao nhất; ±1 0.8, hạ 24 px; ±2 0.62, hạ 48 px ở desktop (mobile hạ 16/32); đối xứng quanh giữa, chỉ ±2 visible, không bù vua giả ở đầu/cuối; kết quả snap nguyên. Mobile giữ vùng tương tác mũi tên 44×44 và phần thẻ cạnh nhìn thấy có thể bấm ≥44 px; swipe vùng carousel, không nuốt back/seed.
- [ ] PASS; test hai viewport và 767/768: thẻ giữa nằm trong vùng, các phần bị che không có hit area đè thẻ giữa. PW sẽ kiểm sau A3.
- [ ] Commit `feat(ui): model king carousel and title parts`.

### Task A2: Bố cục chi tiết và thẻ vua độc lập

**Files:** Create `src/ui/kingSelect/detailLayout.ts`, `detailLayout.test.ts`, `src/ui/kingSelect/KingPortraitView.ts`, `src/render/kingCardArt.ts`, `src/render/kingCardArt.test.ts`.

**Interfaces:** `detailLayout(screen: Size, inset: number): KingDetailLayout` trả title/back/cards[9]/portrait/perks/difficulty/previous/next/play/seed/reroll; `KingPortraitView` có `setKing(choice: KingChoice)`, `layout(rect: Rect)`, `destroy()`, nhận Tooltip và callback click. Mẫu hình 2:3 trong vùng tranh, khung thẻ có góc K/chất và viền khói.

- [ ] RED: `detail_desktop_grid_left_portrait_right`, `detail_mobile_grid_stays_3_by_3`, `footer_and_seed_do_not_overlap`, mọi button ≥44×44, title có vùng riêng, không có level rect. Desktop chín thẻ 84×132, gap 8, thẻ vua 248×384; mobile grid 3×72×112, gap 6 dưới chân dung nhỏ phía trên, footer hai hàng, seed một hàng riêng; tổng nội dung trong 375×812, không co nút để vừa. Test art cùng seed/kingId có cùng bitmap, khác vua có khác màu; alpha mép 0/255.
- [ ] Chạy `npx vitest run src/ui/kingSelect/detailLayout.test.ts src/render/kingCardArt.test.ts`, xác nhận FAIL.
- [ ] GREEN: dùng CardView compact cho lưới, tooltip đầy đủ; desktop đúng trái/phải, mobile xếp dọc theo thứ tự chân dung → grid → seed → hành động. Portrait tạm `paintPortrait` trong letterbox, không kéo vuông thành dọc. Chất bài pixel gán lặp theo thứ tự vua ♦/♠/♥/♣; góc K đảo bằng bitmap riêng, không xoay sprite; khóa dùng silhouette xám/?/ổ khóa, không hiện art thật. Title tách hai màu theo A1/E1.
- [ ] PASS; PW chung sau A3 kiểm thẻ thứ chín và chân dung, tooltip blurb/Ngai/cờ hiệu không bị mép màn cắt.
- [ ] Commit `feat(ui): lay out king detail and portrait card`.

### Task A3: Nối hai trạng thái vào KingSelectScene

**Files:** Modify `src/scenes/KingSelectScene.ts`, `src/data/shortcuts.ts`, `src/ui/input/shortcuts.ts`, `src/ui/input/shortcuts.test.ts`, `src/ui/input/readmeShortcuts.test.ts`, `README.md`. Delete `src/ui/kingSelectLayout.ts`, `src/ui/kingSelectLayout.test.ts` cùng commit sau khi hết import.

**Interfaces:** giữ `SCENES.kingSelect`, `create()`, begin → `scene.start(SCENES.realm, { seed, kingId } satisfies RealmData)`; local mode `'carousel' | 'detail'`. Shortcut mới `'king.previous' | 'king.next'` trong data và resolve; không hardcode riêng key ở scene. README cập nhật bằng `tools/sync-shortcuts.mjs` ở môi trường thực thi.

- [ ] RED: bổ sung shortcut test ←/→ chỉ kingSelect, editable/repeat/modified/help không đi qua; PW trước sửa: carousel → click cạnh → giữa → Enter detail → Esc carousel → Esc menu; locked click/Enter không có detail/realm, back và help vẫn dùng được.
- [ ] Chạy `npx vitest run src/ui/input/shortcuts.test.ts src/ui/input/readmeShortcuts.test.ts`; xác nhận assertion mới FAIL. PW mới cũng phải FAIL trên UI cũ.
- [ ] GREEN: seed mới mỗi lần **mở scene**, không đổi khi qua detail/back; lastKing chỉ lưu vua chơi được. Vuốt >40 px đổi một vua khi pointerup, suppress click sau swipe; Enter ở carousel mở detail, Enter ở detail mới CHƠI; 1–3 chọn nhanh vua đầu và giữ mode hiện tại. ĐẶC QUYỀN disabled tooltip “Sắp có”; ĐỘ KHÓ có một mục, hai mũi tên disabled; CHƠI guard playable + một lần. Tooltip vua lớn chứa blurb/Ngai/cờ hiệu. Seed gọn chỉ hiển thị + Đổi seed như hiện có, không thêm form nhập mới.
- [ ] PASS unit/PW chung: đủ 9 vị trí nhưng 3 vua vào ván được, cả chín cards theo king.cards, không thanh Cấp, đổi seed và mở lại scene, resize 767/768 trong detail; qua `window.game` đối chiếu state.seed/kingId với lựa chọn. Kiểm không tăng listener sau ba lượt back/open.
- [ ] Commit `feat(ui): replace king selection with carousel and detail`.

### Task A4: Chuẩn hóa và nối chín chân dung đã duyệt

**Files:** Create `tools/prepare_king_portraits.py`, `tools/test_prepare_king_portraits.py`, `src/render/portraitAssets.ts`, `src/render/portraitAssets.test.ts`, `public/assets/art/ai-v1/portraits/wheat.png`, `stone.png`, `arcane.png`, `grove.png`, `tide.png`, `forge.png`, `clock.png`, `moon.png`, `nomad.png` (chín basename sau cùng đều trong cùng thư mục portraits). Modify `src/scenes/PreloadScene.ts`, `src/ui/kingSelect/KingPortraitView.ts`, `docs/assets.manifest.yml`, `CREDITS.md`. Create `docs/art-review/g3e/portraits/native-review.md` và `docs/art-review/g3e/portraits/native-sheet.png` làm bằng chứng.

**Interfaces:** `PORTRAIT_ASSETS: Readonly<Record<KingId, { file: string; width: 96; height: 144 }>>`, `portraitTextureKey(id: KingId): string`. Loader độc lập với atlas thế giới. Thiếu texture/ảnh chưa duyệt native → `paintPortrait` cũ, cùng rect thẻ; không import ảnh 1024×1536 trực tiếp vào runtime.

- [ ] RED: Python test ảnh 1024×1536 xử lý ra đúng 96×144, RGB thuộc palette tường minh, alpha 0/255; không sửa nguồn, đầu/chân không bị crop; TS test đủ 9 id/đường dẫn/key không trùng. `python -m unittest discover -s tools -p test_prepare_king_portraits.py` và `npx vitest run src/render/portraitAssets.test.ts` phải FAIL trước implementation.
- [ ] GREEN: đọc `docs/art-review/g3e/portraits/<kingId>/source.png` đã duyệt; thu nearest về 96×144, quantize không dither mờ vào palette riêng từng vua lưu tường minh trong script (màu mở, không ép tất cả vào Hearth 32), cleanup cụm pixel/alpha. Dựng sheet 1×/2×/24×36 và ghi palette/quy trình vào native-review. Không tạo ảnh/công trình mới.
- [ ] PASS Python/TS; **trình chủ dự án duyệt bản native trước đăng ký và nối PNG**, theo ART_STYLE “kiểm → duyệt → đăng ký”. Nếu chưa duyệt, giữ fallback A2, đánh dấu A4 chưa hoàn tất, không coi toàn bộ art đã xong. Sau duyệt mới thêm PNG vào public, manifest/CREDITS và loader. Đổi nguồn sau này chỉ sửa PORTRAIT_ASSETS + file PNG + đăng ký, layout giữ nguyên.
- [ ] PW chung cả ba vua chơi được, fallback khi một ảnh thiếu, khóa không lộ chân dung, reload texture không nhân đôi; cổng nhóm A (giao diện có thể qua với fallback, A4 art còn gate riêng phải ghi rõ).
- [ ] Commit sau duyệt `feat(art): register and load approved native king portraits`; phần công cụ/fallback nếu giao trước dùng commit riêng `tooling(art): prepare native portrait review`.

### Task C1: Layout và copy phần thưởng đúng ngữ cảnh

**Files:** Modify `src/ui/modals/modalLayout.ts`, `modalLayout.test.ts`, `src/ui/modals/offerModel.ts`, `offerModel.test.ts`.

**Interfaces:** mở rộng `RewardLayout` thêm `subtitle/reroll/viewport`; `rewardLayout(screen: Size, inset: number, count?: number)` giữ signature. Thêm `offerHeading(kind: CardOfferState['kind']): { title: string; subtitle: string }`, `rewardRerollView(): { label: string; enabled: false; tooltip: string }` trong offerModel; không tạo giá gameplay UI tự quyết.

- [ ] RED: reward title “CHIẾN THẮNG” + “CHỌN PHẦN THƯỞNG”; conquest giữ tên vua qua offerTitle, questReward dùng “THƯỞNG NHIỆM VỤ”, không tất cả đều báo battle won. Ba thẻ desktop 180×288 xếp hàng giữa màn; phone 108×180 compact xếp hàng ba, gap 6. `count=4` phone thành hai cột có viewport cuộn nếu cần, không mất card cuối; không giả count 0 thành một thẻ rỗng. Nhận và reroll ≥44 cao, selected lift chừa 12 px, không overlap tiêu đề.
- [ ] Chạy `npx vitest run src/ui/modals/modalLayout.test.ts src/ui/modals/offerModel.test.ts`, xác nhận FAIL.
- [ ] GREEN: trả rect cho hai tiêu đề trên, tranh/thẻ giữa, dòng ĐỔI THƯỞNG disabled phía dưới và Nhận riêng; title dài wrap trong vùng. Không ghi “10 vàng”, không bật reroll tay trong reward. Giữ reward/conquest/questReward cùng layout theo offer thật, số thẻ lấy state.
- [ ] PASS; PW chung cùng C2 với 3/4 offers và conquest tên dài.
- [ ] Commit `feat(ui): define vertical reward layout and contextual headings`.

### Task C2: Nối RewardModal và overlay, chống nhận lặp

**Files:** Modify `src/ui/modals/RewardModal.ts`, `src/ui/modals/overlay.ts`, `src/scenes/PlanningHudScene.ts`. Create `src/ui/modals/rewardSelection.ts`, `src/ui/modals/rewardSelection.test.ts`.

**Interfaces:** `RewardModal` nhận options cuối `{ skin: KingId; heading: {title:string;subtitle:string} }`; callback onPick giữ nguyên. Model `selectReward(selected: number | null, index: number, count: number): number | null`, `canConfirmReward(selected: number | null, count: number, submitted: boolean): boolean`. Overlay thêm options tùy chọn `{alpha?:number;color?:number}`, giữ default 0.6 và fitOverlay API.

- [ ] RED: index không hợp lệ không chọn; bấm lại bỏ chọn; chưa chọn/đã submitted không confirm. PW trước sửa kiểm nền bị chặn, double click/Enter chỉ một `pickOffer`, Esc không bỏ qua reward; resize vẫn chọn đúng id.
- [ ] Chạy `npx vitest run src/ui/modals/rewardSelection.test.ts`, xác nhận FAIL.
- [ ] GREEN: giảm khung panel bao nặng, dùng hai heading nổi và ba CardView cùng theme vua đang chơi; overlay outline alpha 0.75 tùy chọn cho reward, các modal khác giữ 0.6. “Mờ” là làm tối nền, **không Gaussian blur** trái ART_STYLE. Rectangle chỉ làm lớp chặn/tối toàn màn đã có, không thay nine-slice bằng rectangle làm khung. Dòng đổi thưởng disabled có tooltip. Nhận disable ngay lần gửi đầu; offerKey thay thì hủy modal cũ/tạo selection mới; callback vẫn `ui:command/pickOffer`, không chạm RunState/RNG.
- [ ] PASS; PW chung reward → conquest → questReward từ queue, help phủ trên rồi đóng, overlay không cho đổi speed/đặt bài/đổi tay, selection/scroll giữ khi resize, nền không bị phủ vĩnh viễn sau destroy.
- [ ] Cổng nhóm C; commit `feat(ui): present themed loot cards over dimmed world`.

### Task B1: Readout hai phe và mô hình lịch dùng chung

**Files:** Modify `src/ui/battle/battleReadout.ts`, `battleReadout.test.ts`. Create `src/ui/hud/armyHealth.ts`, `armyHealth.test.ts`, `src/ui/planning/calendarStripLayout.ts`, `calendarStripLayout.test.ts`.

**Interfaces:** `HealthReadout = { label: string; hp: number; maxHp: number; fraction: number }`; `throneHealth(world: BattleWorld): HealthReadout`; `armyHealth(world: BattleWorld, team: number): HealthReadout | null`; `calendarStripLayout(rect: Rect, count: number): { cells: readonly Rect[]; links: readonly Rect[] }`. Đây là model UI thuần, không chuyển vào game/data. `armyHealth` là phương án đề xuất Q2, chỉ nối hiển thị sau quyết định đó.

- [ ] RED: Ngai 44/60 → text “44 | 60”, fraction 44/60; max=0 →0, hp âm clamp0. Army chỉ tính KIND_UNIT đúng phe, **mẫu số tổng maxHp của quân đang sống/hiện diện**, không cộng đợt chưa ra; không quân → null/“Chưa xuất quân”, không 0/0. Test fixture hai đợt, chết/hồi sinh/triệu hồi và boss, hàm không mutate world; `foesRemaining` vẫn gồm quân chờ đợt. Lịch 1/5 cells, mỗi hit rect ≥44×44, links không che hit area; đầu/cuối năm không sinh năm 31.
- [ ] Chạy `npx vitest run src/ui/battle/battleReadout.test.ts src/ui/hud/armyHealth.test.ts src/ui/planning/calendarStripLayout.test.ts`, xác nhận FAIL.
- [ ] GREEN: readout Ngai giữ ý nghĩa cũ, thêm số tuyệt đối; enemy army tooltip nói rõ “Tổng máu quân địch đang hiện diện; thay đổi khi có quân mới”, không gọi là HP vua/HP toàn đợt, thanh có thể tăng khi quân xuất hiện. Boss luôn có readout riêng, không mất tên/phase. Planning không lấy số từ world cũ. Lịch giữ `calendarCells(state,5)`/`fullCalendar`, không đổi luật lịch.
- [ ] PASS; PW cùng B3 kiểm boss trước/sau xuất hiện và năm 30; xác minh không thêm gameplay field để phục vụ thanh.
- [ ] Commit `feat(ui): add explicit health and connected calendar readouts`.

### Task B2: Bố cục planning và lịch theo nhịp HUD mới

**Files:** Modify `src/ui/realm/realmLayout.ts`, `realmLayout.test.ts`, `src/ui/planning/CalendarStrip.ts`, `src/ui/planning/calendarText.test.ts`, `src/scenes/PlanningHudScene.ts`, `src/ui/planning/DecreeQuestPanel.ts`, `src/ui/planning/QuestNoticeView.ts`, `src/ui/info/inspectionReserved.ts`, `src/ui/info/inspectionLayout.test.ts`.

**Interfaces:** mở rộng `PlanningLayout` giữ tên các vùng hiện tại, thêm `allyStatus/foeStatus: Rect`; lịch dùng B1, thêm mode `CalendarCellView` tùy chọn `'strip' | 'grid'`, default grid cho CalendarModal; callback mở full calendar giữ nguyên. Không chuyển hình kim cương bằng xoay sprite; vẽ pixel trong frame `ui`.

- [ ] RED: `planning_header_zones_do_not_overlap`, `phone_board_is_320_square`, `four_card_hand_and_actions_clear_board`, `inspection_reserves_new_status`; gold/lives trái, năm+calendar giữa, help/scout cạnh; 1280×720,375×812,767/768 và 4 card. Calendar text vẫn mô tả attacker/lần đánh/council/quest/coalition/boss; chỉ current có selected marker, cell ẩn không nhận input.
- [ ] Chạy `npx vitest run src/ui/realm/realmLayout.test.ts src/ui/planning/calendarStripLayout.test.ts src/ui/planning/calendarText.test.ts src/ui/info/inspectionLayout.test.ts`, xác nhận FAIL.
- [ ] GREEN: desktop header cao tối đa 112, vàng+mạng trái; 5 marker nối nhau giữa, “NĂM n” dưới; help/Địch phải. Giữ board/camera hiện tại; tay bài đáy giữa, action hai bên; status hai phe là chữ gọn không HP giả. Mobile: vàng+mạng/help hàng 1, lịch hàng 2, năm/hint/confirm theo vùng riêng; giữ board 320×320 (zoom2), action dưới board, tay đáy; status xếp hai cột giữa action và tay. Nếu không đủ chỗ, scout/decree dạng nút mở panel như hiện có, không che board bằng panel luôn mở. Giảm khung quanh số/chữ, vẫn có nền nine-slice nhỏ khi cần đọc rõ. Sắc lệnh/quest notice giữ đủ lối mở.
- [ ] PASS; PW chung mua ô/thiếu vàng, play/bán/đổi tay, hai mục tiêu/huỷ, Ra trận đúng guard, L lịch 30 năm, scout, decree/quest, help, resize đang kéo/chọn. Tooltip/inspection né toàn bộ controls mới; modal chặn cả world scene bên dưới.
- [ ] Commit `feat(ui): reflow planning HUD and connected year strip`.

### Task B3: HUD trận thoáng, tốc độ trên phải, máu dưới hai góc

**Files:** Modify `src/scenes/BattleHudScene.ts`, `src/ui/realm/realmLayout.ts`, `realmLayout.test.ts`, `src/ui/info/inspectionReserved.ts`, `src/ui/info/inspectionLayout.test.ts`, `src/data/shortcuts.ts`, `src/ui/input/shortcuts.test.ts`, `README.md`. Create `src/ui/hud/HealthBarView.ts`.

**Interfaces:** `BattleLayout` thêm `calendar/year/allyStatus/foeStatus/bossStatus`, giữ clock/lives/gold/help/foes/speed/intervene/auto/waves để consumer chuyển rõ ràng; `HealthBarView.set(readout: HealthReadout | null, skin: UiSkin): void`, `layout(rect: Rect): void`, `destroy(): void`. Battle nhận initial calendar từ controller.state trong create, subscribe run:state, tự hủy full CalendarModal.

- [ ] RED: test `battle_top_controls_fit`, `bottom_health_bars_do_not_overlap`, `boss_and_summary_clear_controls`, `phone_speed_wraps_into_two_rows`; mọi nút ≥44, calendar/header không đè speed, tooltip/inspection reserved gồm rail/HP/lịch. Shortcut L ở battle mở lịch, không trùng speed/Space, mandatory/help guards giữ nguyên. PW trước sửa kiểm pause P/1–3/auto/ngắm đều tác động đúng intent.
- [ ] Chạy `npx vitest run src/ui/realm/realmLayout.test.ts src/ui/info/inspectionLayout.test.ts src/ui/input/shortcuts.test.ts`, xác nhận FAIL.
- [ ] GREEN: desktop vàng+mạng trái trên, Can Thiệp/cooldown rail trái dưới; calendar+NĂM+đồng hồ giữa trên; Tự bắn/pause/1×/2×/3× phải trên. Ngai tên vua+HP trái dưới theo accent; enemy tên attacker+HP phải dưới xám/đỏ theo Q2, địch còn+dots phía trên; boss riêng trên dải HP. Mobile calendar hàng riêng, speed chia 2 hàng phải, hai HP rộng khoảng 170 px đáy, rail tránh vùng thao tác. Nút Địch/help giữ trên phải dưới speed; toast giữ dưới header, không đè boss. Nền khung mảnh bằng nine-slice, chữ nổi có shadow đọc trên terrain.
- [ ] Không đổi `ui:set-speed`, `ui:toggle-pause`, `ui:intervene`, autoFire command hay tốc độ đã nhớ. Pause chỉ nút active + chữ “TẠM DỪNG” tại đồng hồ, không modal mới. Giữ ngắm/hủy/vòng bán kính và summary/banner; không thêm 4× theo hình mũi tên. Tọa độ can thiệp/camera dùng hàm hiện hữu; lỗi nhắm sâu phía nam trong HANDOFF ghi là lỗi sẵn có, không âm thầm sửa gameplay trong task skin.
- [ ] PASS; PW chung thường/boss ở pause/1/2/3, auto tắt/bật, can thiệp trước/sau cooldown, help mở/đóng khôi phục speed, L mở/đóng lịch không click xuyên, inspect quân chết, rage, kết thúc/tiếp tục; so tick/state cùng seed và chuỗi intent trước/sau, không thay luật. Kiểm shutdown/recreate không nhân listener.
- [ ] Cổng nhóm B; commit `feat(ui): reflow battle HUD around year strip and health bars`.

### Task F1: Đồng bộ tối thiểu các màn còn lại

**Files:** Modify `src/scenes/MainMenuScene.ts`, `src/scenes/RunEndScene.ts`, `src/ui/help/HelpModal.ts`, `src/ui/help/HelpCardBrowser.ts`, `src/ui/modals/CouncilModal.ts`, `src/ui/modals/QuestModal.ts`, `src/ui/modals/DeckModal.ts`, `src/ui/modals/CalendarModal.ts`, `src/ui/planning/DecreeQuestPanel.ts`, `src/ui/modals/modalLayout.ts`, `modalLayout.test.ts`, `src/ui/menuLayout.test.ts`, `src/ui/help/helpLayout.test.ts`.

**Interfaces:** options `skin?: UiSkin` cho modal và HelpCardBrowser/HelpModal nếu chưa nhận; mặc định neutral ở menu, đang trong ván truyền state.kingId từ scene gọi (cập nhật `src/scenes/HelpScene.ts`, `src/scenes/helpLauncher.ts`, `src/scenes/PlanningHudScene.ts`, `src/scenes/BattleHudScene.ts`). Giữ args/callback cũ tương thích; không dùng singleton theme làm rò màu giữa scene.

| Màn | Mức thay đổi tối thiểu |
| --- | --- |
| Menu chính | Skin neutral cùng họ nút/tiêu đề, giữ nền parallax, logo, Tiếp tục/Ván mới/Trợ giúp/cảnh báo lưu |
| Tạm dừng | Không có PauseModal trong repo: B3 đổi active skin/label ngay trên HUD, không thêm menu/hành vi mới |
| Kết thúc ván | Skin vua từ state, title/nút cùng hệ, summary và hai lối ra giữ nguyên; state null dùng neutral |
| Trợ giúp | Khung/tiêu đề/tab đồng bộ; CardView từ D; giữ 8 tab/4 lọc, chi tiết/cuộn/tìm đúng ngữ cảnh và phục hồi tốc độ |
| Hội đồng | Giữ ba ô sắc lệnh ngang và vùng phụ; chỉ skin header/nút, rare card dọc từ D; không biến decree thành gameplay CardView |
| Nhiệm vụ | Skin panel/title/nút; giữ điều kiện/phí/thời hạn/thưởng/Xem cách làm; văn bản dài cuộn trong body, nút cố định |
| Kho bài | CardView dọc, khung nhẹ, tab/lọc/count×N/cuộn vẫn đủ; không đổi deckModel |
| Lịch đầy đủ/scout/decree | Skin frame/title/button qua primitive, giữ grid 6×5 và markers; strip mode không làm đổi CalendarModal grid |

- [ ] RED: layout test `long_quest_body_keeps_buttons_visible`, `council_extra_selection_targets_at_least_44`, `run_result_long_lines_fit`, `help_and_deck_headers_clear_close`; thêm fixture dài và hai viewport. Council hiện có MIN_CELL=36: nâng hit target lên44 hoặc phân trang vùng lựa chọn phụ, không chỉ phóng hình rồi còn hit area36. Test không đổi lựa chọn phụ khi resize.
- [ ] Chạy `npx vitest run src/ui/modals/modalLayout.test.ts src/ui/menuLayout.test.ts src/ui/help/helpLayout.test.ts`, xác nhận FAIL.
- [ ] GREEN: truyền skin tường minh, giữ createPanel/createButton/FONT_UI; body dài nằm trong viewport cuộn, close/confirm cố định, nội dung do model hiện tại cung cấp. Không thêm scene Cài đặt/Vương Miện/Perks.
- [ ] PASS; PW chung từng dòng bảng, menu resume có/không save, RunEnd thắng/thua/state null, help từ menu/planning/battle, council chọn ô/thẻ/xóa deck, quest thiếu vàng/nhận/từ chối; không mất queue hoặc lưu lại khác.
- [ ] Commit `style(ui): align remaining screens with shared king skins`.

### Task F2: Nghiệm thu liên màn và dọn import cuối

**Files:** Chỉ sửa khi kiểm phát hiện lỗi trong các file đã liệt kê D–F; Modify `docs/art-review/HANDOFF.md` để ghi bằng chứng và art fallback còn lại. Không thêm dependency Playwright chỉ để chụp màn nếu đã có công cụ browser. Không sửa file game/core; lỗi luật ngoài phạm vi ghi riêng.

**Interfaces:** không thêm API sản phẩm. Đầu ra là bằng chứng trong HANDOFF và commit lỗi UI nếu có.

- [ ] Chạy `rg -n 'kingSelectLayout|KING_CARD|kingCardRow' src` mong không còn import cũ; tìm mọi `new CardView` kiểm đã dùng D1. Đối chiếu checklist chức năng ở đầu plan và toàn bộ spec A, không dùng “trông ổn” làm đủ điều kiện.
- [ ] PW cả 1280×720 và 375×812: menu → carousel → detail ba vua → CHƠI; seed đúng, planning 4 thẻ/mua ô/đổi/bán, trận thường/boss, thắng/thua, reward/conquest/questReward/council/quest, deck/help/calendar, RunEnd; reload planning/battle/mandatory offer giữ state. Fixture DEV chỉ để tiếp cận pha; ít nhất một chuỗi thật từ chọn vua tới nhận thưởng.
- [ ] PW kiểm resize hai chiều giữa modal, long-press 400 ms, vuốt nhanh/nhỏ, doubleclick CHƠI/Nhận, mở lại scene ba lần, tên tiếng Việt dài, thiếu một PNG, console/pageerror rỗng. Kiểm ngắm phía nam ghi rõ giới hạn sẵn có nếu còn; không báo thành regression mới hay đã sửa.
- [ ] Cổng nhóm F: `npm run lint && npm run typecheck && npm test && npm run build`, exit 0; kiểm deterministic/benchmark trong suite không thay kết quả do UI; nếu FAIL thì task chưa xong. Ghi lệnh/kết quả thật, viewport, screenshot, trạng thái A4 và quyết định Q1/Q2 vào HANDOFF.
- [ ] Commit `docs(ui): record redesign acceptance evidence` (và commit fix riêng cho mỗi lỗi tái hiện được, không gom gameplay vào commit skin). PR sau này chỉ vào develop theo workflow repo; phiên lập plan không tạo commit/PR.

## Quyết định đã chốt (29/10/2026) — trước đây là câu hỏi mở

Chủ dự án chốt cả hai theo đề xuất: **Q1** giữ "ĐỔI THƯỞNG — Sắp có" vô hiệu hóa; **Q2** thanh phe địch là HP tổng quân đang hiện diện, nhãn "Máu quân địch", có tooltip; số địch còn/đợt hiện riêng.

### Nội dung câu hỏi gốc

1. **Đổi phần thưởng bằng vàng:** có muốn mở rộng luật để thực sự đổi thưởng không? **Đề xuất:** trong đợt UI này giữ dòng “ĐỔI THƯỞNG — Sắp có” disabled; nếu muốn hoạt động, lập spec riêng chốt giá, số lần, loại offer được đổi, RNG/save trước khi bật. Không lấy giá 10 từ game tham chiếu và không dùng reroll tay bài thay thế.
2. **Ý nghĩa thanh máu phe địch ở trận thường:** chọn HP tổng quân đang hiện diện hay chỉ thanh tiến độ số quân còn lại? **Đề xuất:** dùng HP tổng quân đang hiện diện với nhãn “Máu quân địch” và tooltip rõ mẫu số thay đổi khi xuất quân; giữ số địch còn/đợt riêng, boss có thanh riêng. Phương án số quân phải ghi “Quân còn”, không gắn nhãn máu. B1 có thể làm/test readout trước; B3 chỉ nối phương án được chốt, không tự phát minh HP vua địch.

Không hỏi lại carousel, bỏ Cấp, Perks disabled, một độ khó, mobile cơ bản, ba vua chơi được hoặc chân dung nguồn: đã chốt. Duyệt sheet chân dung native A4 là cổng art theo ART_STYLE, không phải câu hỏi thiết kế mở; khi chờ duyệt vẫn dùng `paintPortrait`.
