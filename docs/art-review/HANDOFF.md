# Bàn giao phiên làm việc — art, cảnh 45° và giao diện mới (cập nhật 29/10/2026)

Nhánh `g3e-ux-and-art`, PR #12 vào `develop` (chưa merge). Đọc theo thứ tự: `CLAUDE.md` → `docs/ART_STYLE.md` (**mục "Góc nhìn" là khung BẮT BUỘC cho mọi lần tạo ảnh**) → tài liệu này.

## Đã xong
- **Logic (T1–T4, commit `4448090`…`2f6d0cb`):** địch và boss chỉ xuất từ mép S, hàng dàn quân thay cho cờ `extraEdge`, tường núi chặn mọi đơn vị phía bắc `BATTLE.wallY` (88), save cũ có mép N/E/W đổi thành S khi giải mã. Đo cân bằng 600 ca: scripted thắng 12,3% (trước 0,3%), vượt ngưỡng plan nhưng **người dùng đã chấp nhận**; báo cáo ở `docs/art-review/oblique-wall/logic-report.md`.
- **Tường núi vào game:** `src/render/{MountainWallRenderer,mountainWallAssets,mountainWallModel,mountainWallArt}.ts`, 32 ảnh trong `public/assets/art/ai-v1/mountain-wall/`, catalog `docs/art-review/oblique-wall/catalog.json`, công cụ `tools/slice_mountain_wall.py`. Còn lại: click tay chưa nhắm được hàng địch sâu phía nam (`screenToWorld` trả null khi y > 384).
- **Trang quản trị asset:** `npm run admin` → http://localhost:5180/admin (có danh sách 733 mục chưa có từ `tools/asset-admin/planned.json`, sinh bằng `tools/build_planned_assets.py`).
- **Phong cách ảnh đã chốt:** Stardew 2.5D, camera nhìn xuống **45°**, mái và mặt tiền cao ngang nhau, không thấy tường bên, tháp/cối xay phải thấy nóc; mẫu đã duyệt `docs/art-review/style-references/harvester-house-front-approved.png`.

## Giao diện làm lại (plan `docs/superpowers/plans/2026-10-28-ui-redesign.md`, đã duyệt từng task)
Spec: `docs/superpowers/specs/2026-10-28-king-select-redesign-design.md`. Đã xong và đã push:
- **D thẻ dọc dùng chung:** `ui/cards/{cardLayout,cardImage,CardView}.ts`; tranh thẻ ngang 32×24 vẫn là art tạm (`VERTICAL_CARD_ART` rỗng). Kích thước: tay 120×176 (PC) / 108×162, kho và trợ giúp 96×144, hội đồng 100×150.
- **E màu theo vua:** `KING_THEMES` + `LOCKED_THEME` (`data/uiPalette.ts`), frame `panel/button*/card*/bar@<vua>` trong texture `ui`, `skinFrame`, `createPanel/createButton/CardView` nhận skin.
- **A chọn vua:** carousel + chi tiết (`ui/kingSelect/*`, `scenes/KingSelectScene.ts`), phím ←/→, thẻ kiểu bài tây (`render/kingCardArt.ts`), 9 chân dung native 96×144 (bản A, `public/assets/art/ai-v1/portraits/`, `tools/prepare_king_portraits.py`), Đặc quyền vô hiệu hóa, độ khó một mức, **không có thanh Cấp**.
- **C phần thưởng:** `RewardModal` mới (tiêu đề theo loại, thẻ dọc, "ĐỔI THƯỞNG — Sắp có" vô hiệu hóa — Q1), nền tối 75%, Nhận gửi đúng một `pickOffer`.
- **B HUD:** lập kế hoạch (dải lịch giữa + nhãn năm, hai hàng trạng thái) và trận (`HealthBarView`, máu Ngai trái dưới, **tổng máu quân địch đang hiện diện phải dưới — Q2**, tốc độ phải trên, phím L mở lịch trong trận).
- **F đồng bộ:** modal lịch/kho/hội đồng/nhiệm vụ, màn kết thúc ván, HUD lập kế hoạch đổi màu theo vua; ô chọn hội đồng 44 px; chữ nhiệm vụ dài tự thu nhỏ. Menu chính và Trợ giúp để trung tính.

### Bằng chứng nghiệm thu (29/10/2026)
- Cổng `npm run lint && npm run typecheck && npm test && npm run build`: xanh (149 file, 1918 test); `python -m unittest discover -s tools -p "test_*.py"` trong `tools/`: 39 test pass.
- Trình duyệt (dev server, 1280×720 và 375×812): chuỗi thật không dựng trạng thái giả — chọn vua Đá bằng phím (→, Enter, Enter) → ván mới đúng `{seed, kingId}` → đặt thẻ → Ra trận ×3 → thắng → bảng tổng kết (đã hạ 5, +3 vàng) → Tiếp tục → màn phần thưởng thật "CHIẾN THẮNG / CHỌN PHẦN THƯỞNG" → chọn thẻ bằng chuột thật, bấm Nhận hai lần → năm 2, bộ bài chỉ tăng đúng 1 thẻ. Không có lỗi console. Ảnh chụp: `.superpowers/` (git-ignored).
- Đã sửa trong lúc nghiệm thu: ba nút Bán/Đổi/Bộ bài mất skin khi đổi bố cục (được dựng lại); nay `createActionButtons` truyền skin.

### Chưa kiểm hoặc còn lại (ghi trung thực)
- Chưa chạy bằng tay: trận boss (thanh boss chỉ kiểm bằng test bố cục), Can Thiệp thả đá thật, mở Trợ giúp giữa trận rồi khôi phục tốc độ, xem thông tin quân đã chết, hội đồng và nhiệm vụ với skin mới, màn kết thúc ván với skin, reload giữa chừng (planning/battle/phần thưởng), nhấn giữ 400 ms và vuốt bằng cảm ứng thật, thiếu một PNG chân dung (đã kiểm: rơi về chân dung vuông tạm).
- Bảng trinh sát, thông báo nhiệm vụ và ô lịch trong HUD vẫn màu kem (tự dựng khung riêng).
- Thanh nối giữa ô lịch rất mảnh (khe 4 px trên PC).
- Lỗi sẵn có (không phải regression): click tay chưa nhắm được hàng địch sâu phía nam (`screenToWorld` trả null khi y > 384).
- Art tạm còn lại: tranh thẻ ngang 32×24 trong khung thẻ dọc (94 tranh thẻ dọc là dự án art riêng); khi vẽ xong chỉ thêm vào `VERTICAL_CARD_ART`.
- Nhóm F tối thiểu đã làm xong; mức đồng bộ sâu hơn (trinh sát, quest notice, Trợ giúp theo vua) chưa làm.

## Đang chờ người dùng duyệt (chưa vào game, chưa đăng ký)
- **Tranh thẻ dọc (94 thẻ):** chủ dự án chốt cỡ native **96×72** (4:3, 30/10/2026). Công cụ `docs/art-review/g3e/cards/make_prompts.py` (danh mục `cards.json` từ registry; thẻ công trình dùng nguyên khối mẫu của `ART_STYLE.md`; `VISUAL` cho gợi ý hình ảnh từng thẻ), cổng `tools/test_art_prompts.py`. Đang thử 2 mẫu Lúa Mì (`wheat_scarecrow`, `wheat_harvest_festival`); mục "Tranh thẻ" của `ART_STYLE.md` chỉ thêm khi chủ dự án duyệt phong cách. **Khi nối vào game:** tranh 96×72 vừa thẻ ≥ 100 px rộng ở scale 1, nhưng vùng tranh của thẻ nhỏ (84–96 px, lưới 3×3 và kho bài) chỉ rộng 76–88 px: phải chỉnh `cardLayout`/`fitArt` hoặc cỡ thẻ trước khi thêm vào `VERTICAL_CARD_ART`.
- Công trình Lúa Mì thử: Kho Thóc, Cối Xay Gió (`docs/art-review/g3e/buildings/wheat/`). Các bản bị loại nằm trong `_rejected_*` và `_superseded_*`.
- Chân dung 9 vua đã duyệt và đã vào game (xem trên); mẫu vuông cũ ở `_rejected_square/`, bản Lúa Mì dùng rơm ở `_rejected_wheat_straw/`. Phong cách ở `ART_STYLE.md` mục "Chân dung vua".

## Việc tiếp theo (người dùng chọn thứ tự)
1. Cụm hiện tại: **biểu tượng UI (49), tranh thẻ dọc (94)** (chân dung vua đã xong). Chân dung nếu cần vẽ lại: `python docs/art-review/g3e/portraits/make_prompts.py <vua ...>` rồi `bash .superpowers/p.sh`, sau đó `python tools/prepare_king_portraits.py`.
2. Công trình P0 (63 cái, mỗi vua một nhóm; 3 vua chơi được trước): `python docs/art-review/g3e/buildings/make_prompts.py wheat [id ...]`, rồi `python docs/art-review/g3e/buildings/make_assets.py wheat` để tách nền, thu nhỏ 64 px và dựng bảng duyệt `wheat/sheet.png`. Hai nhà cũ (Nhà Tranh, Trại Lính) phải vẽ lại theo góc mới.
3. Lính P0 (40 loại × 6 pose), đạn và hiệu ứng P0 (17 + 26), địa hình và trang trí P2.
4. G3e còn lại: giao diện mobile cơ bản đã nằm trong plan trên; còn kiểm cảm ứng thật.

## Quy tắc đã thống nhất với người dùng
- Duyệt từng nhóm nhỏ; thử một mẫu trước khi vẽ cả nhóm; mọi prompt lấy từ `docs/ART_STYLE.md` kèm ảnh tham chiếu (`tools/test_art_prompts.py` chặn khi thiếu).
- Chưa nối ảnh mới vào `src` khi người dùng chưa duyệt; ảnh bị loại cất vào thư mục `_rejected_*`.
- PR chỉ vào `develop`; không đụng `.agents/` và `AGENTS.md`; Codex không chạy được node nên phải tự kiểm lại kết quả của nó.
