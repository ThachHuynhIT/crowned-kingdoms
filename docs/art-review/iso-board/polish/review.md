# Duyệt mẫu: cổng dịch chuyển và rừng sau vách núi (08/11/2026)

Theo spec `docs/superpowers/specs/2026-11-08-iso-board-polish-design.md` §6 và cổng duyệt của `docs/ART_STYLE.md`: mỗi loại một mẫu, chủ dự án duyệt riêng từng loại trước khi vẽ thêm hay nối vào game.

| Mẫu | Nguồn | Native | Trạng thái |
|---|---|---|---|
| `enemy_portal` | `enemy_portal/source.png` (prompt bên cạnh) | 112×99, chân (58; 71,5) | Đã duyệt 08/11/2026, đang dùng trong game |
| `forest_pine_a` v2 | `forest_pine_a/source.png` | 33×64 | Đã duyệt 08/11/2026, đang dùng trong game |
| `forest_pine_b` | `forest_pine_b/source.png` (`make_prompts.py polish-forest-set`, đính kèm thông đã duyệt) | 30×60 | Đã duyệt 09/11/2026, đang dùng trong game |
| `forest_rock` | `forest_rock/source.png` (như trên) | 40×23 | Đã duyệt 09/11/2026, đang dùng trong game |
| `forest_pine_a` v1 | `forest_pine_a/v1/` | – | Bị loại khi review: đứng trên miếng đất hình thoi (thành mảng ô khi rải dày), màu xanh nõn chuối |

`review.png`: hai native ×3 cạnh nhà Thợ Gặt đã duyệt. Đã xem thử trong game (bật tạm trên máy, không commit): cổng đứng đúng cuối con đường, đường đất của cổng nối liền đường trong game; rừng thông dày sau vách núi khi kéo camera lên phía bắc.

Sau khi duyệt: vẽ `forest_pine_b` và `forest_rock` (cùng prompt khối isometric, đính kèm mẫu thông đã duyệt), cắt bằng `make_polish_assets.py ... --publish`, đăng ký `docs/assets.manifest.yml` + `CREDITS.md`, rồi bật `FOREST_APPROVED` / `PORTAL_APPROVED` trong `src/render/imageArt.ts`.

`review-forest-set.png` (09/11): ba vật của rừng ×3 cạnh nhà Thợ Gặt. Đã xem thử trong game (bật tạm, không commit): thông hai kiểu xen đá rêu, đồng đều màu và cỡ pixel với thông đã duyệt.
