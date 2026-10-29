# Bàn giao phiên làm việc — art và cảnh 45° (cập nhật 29/10/2026)

Nhánh `g3e-ux-and-art`, PR #12 vào `develop` (chưa merge). Đọc theo thứ tự: `CLAUDE.md` → `docs/ART_STYLE.md` (**mục "Góc nhìn" là khung BẮT BUỘC cho mọi lần tạo ảnh**) → tài liệu này.

## Đã xong
- **Logic (T1–T4, commit `4448090`…`2f6d0cb`):** địch và boss chỉ xuất từ mép S, hàng dàn quân thay cho cờ `extraEdge`, tường núi chặn mọi đơn vị phía bắc `BATTLE.wallY` (88), save cũ có mép N/E/W đổi thành S khi giải mã. Đo cân bằng 600 ca: scripted thắng 12,3% (trước 0,3%), vượt ngưỡng plan nhưng **người dùng đã chấp nhận**; báo cáo ở `docs/art-review/oblique-wall/logic-report.md`.
- **Tường núi vào game:** `src/render/{MountainWallRenderer,mountainWallAssets,mountainWallModel,mountainWallArt}.ts`, 32 ảnh trong `public/assets/art/ai-v1/mountain-wall/`, catalog `docs/art-review/oblique-wall/catalog.json`, công cụ `tools/slice_mountain_wall.py`. Còn lại: click tay chưa nhắm được hàng địch sâu phía nam (`screenToWorld` trả null khi y > 384).
- **Trang quản trị asset:** `npm run admin` → http://localhost:5180/admin (có danh sách 733 mục chưa có từ `tools/asset-admin/planned.json`, sinh bằng `tools/build_planned_assets.py`).
- **Phong cách ảnh đã chốt:** Stardew 2.5D, camera nhìn xuống **45°**, mái và mặt tiền cao ngang nhau, không thấy tường bên, tháp/cối xay phải thấy nóc; mẫu đã duyệt `docs/art-review/style-references/harvester-house-front-approved.png`.

## Đang chờ người dùng duyệt (chưa vào game, chưa đăng ký)
- Công trình Lúa Mì thử: Kho Thóc, Cối Xay Gió (`docs/art-review/g3e/buildings/wheat/`). Các bản bị loại nằm trong `_rejected_*` và `_superseded_*`.
- (Đã duyệt 29/10/2026) Chân dung 9 vua dạng bán thân dọc 2:3 trong `docs/art-review/g3e/portraits/<vua>/source.png` (1024×1536); phong cách đã vào `ART_STYLE.md` mục "Chân dung vua", prompt ở `make_prompts.py`, cổng ở `tools/test_art_prompts.py`. Đã thu về 96×144 (bản A), đăng ký và nối vào màn chọn vua mới (29/10/2026). Mẫu vuông cũ ở `_rejected_square/`, bản Lúa Mì dùng rơm ở `_rejected_wheat_straw/`.
- Spec màn chọn vua `docs/superpowers/specs/2026-10-28-king-select-redesign-design.md` (chờ duyệt) và prompt cho Codex lập plan toàn bộ giao diện `docs/art-review/ui-redesign-codex-prompt.md` (kết quả: `docs/superpowers/plans/2026-10-28-ui-redesign.md`). Ảnh tham chiếu 9 Kings ở `.superpowers/ui_refs/` (git-ignored). Chọn: thẻ dọc mới (cần vẽ lại 94 tranh thẻ, dự án riêng), Đặc quyền vô hiệu hóa, bỏ thanh Cấp.

## Việc tiếp theo (người dùng chọn thứ tự)
1. Cụm hiện tại: **chân dung vua (đã duyệt, còn thu nhỏ/ép màu), biểu tượng UI (49), tranh thẻ dọc (94)**. Chân dung: `python docs/art-review/g3e/portraits/make_prompts.py <vua ...>` rồi `bash .superpowers/p.sh`.
2. Công trình P0 (63 cái, mỗi vua một nhóm; 3 vua chơi được trước): `python docs/art-review/g3e/buildings/make_prompts.py wheat [id ...]`, rồi `python docs/art-review/g3e/buildings/make_assets.py wheat` để tách nền, thu nhỏ 64 px và dựng bảng duyệt `wheat/sheet.png`. Hai nhà cũ (Nhà Tranh, Trại Lính) phải vẽ lại theo góc mới.
3. Lính P0 (40 loại × 6 pose), đạn và hiệu ứng P0 (17 + 26), địa hình và trang trí P2.
4. G3e còn lại: E7b bố cục HUD PC, E8 mobile (người dùng bảo bỏ qua mobile, làm sau).

## Quy tắc đã thống nhất với người dùng
- Duyệt từng nhóm nhỏ; thử một mẫu trước khi vẽ cả nhóm; mọi prompt lấy từ `docs/ART_STYLE.md` kèm ảnh tham chiếu (`tools/test_art_prompts.py` chặn khi thiếu).
- Chưa nối ảnh mới vào `src` khi người dùng chưa duyệt; ảnh bị loại cất vào thư mục `_rejected_*`.
- PR chỉ vào `develop`; không đụng `.agents/` và `AGENTS.md`; Codex không chạy được node nên phải tự kiểm lại kết quả của nó.
