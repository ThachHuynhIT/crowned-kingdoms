# Cổng duyệt mẫu isometric (P3, 06/11/2026)

Spec: `docs/superpowers/specs/2026-11-06-iso-board-redesign-design.md` §4. Quy chuẩn: `docs/ART_STYLE.md`, mục "Isometric (trục đo 2.5D) cho sprite thế giới".

| Mẫu | Nguồn | Prompt | Trạng thái |
|---|---|---|---|
| Công trình: Đội Thợ Gặt, isometric — bản 2 | `sample-building/source.png` (1024×1024, nền đen) | `sample-building/prompt.md` | **Chờ chủ dự án duyệt** |
| ↳ bản 1 (cửa bên trái, có bệ gỗ) | `sample-building/v1-source.png` | `sample-building/v1-prompt.md` | Chủ dự án yêu cầu sửa |
| Ô đất mở của Lúa Mì, isometric | `sample-plot/source.png` (1024×1024, nền đen) | `sample-plot/prompt.md` | **Chờ chủ dự án duyệt** (chưa có góp ý) |
| Ô đã xây (sân lát đá), isometric | `sample-plot-built/source.png` (1024×1024, nền đen) | `sample-plot-built/prompt.md` | **Chờ chủ dự án duyệt** |

**Góp ý của chủ dự án về bản 1 (06/11/2026)**, đã áp dụng trong bản 2 và trong code:

- Cửa chính quay sang mặt tường bên phải.
- Nhà đặt ở giữa ô đất. Trong code, `BUILDING_FOOT_OFFSET` giờ là (0, 0).
- Lính đứng trước cửa. Trong code, `DEPLOY_BOX` là x ∈ [+18, +30].
- Ô đã xây nhà được lát đá cả ô.

- **Cách tạo:** `python docs/art-review/g3e/buildings/make_prompts.py iso-sample`, sau đó chạy `.superpowers/b-iso-sample.sh`. Bước này gọi Codex imagegen, đính kèm ảnh mẫu Thợ Gặt đã duyệt (chỉ dùng làm tham chiếu phong cách) và yêu cầu Codex đọc ART_STYLE.
- **Ảnh so sánh:** `sample-comparison.png`, dựng bằng `make_comparison.py`. Ảnh gồm bản hiện tại (chính diện 45°), hai mẫu isometric và một bàn 3×3 ghép thử ở zoom 3. Đây chỉ là bản xem trước thu nhỏ từ ảnh nguồn, chưa phải sprite native đã làm sạch pixel.
- **Claude tự kiểm theo "Kiểm trước khi duyệt (isometric)":**
  - Đạt: thoi gần đúng 2:1 (ô đất khoảng 1,9:1); thấy hai mặt tường và mái nhìn từ trên; cạnh đứng thẳng; không phối cảnh; cùng chất liệu và màu với mẫu Thợ Gặt; vẫn nhận ra khi thu nhỏ ở bàn 3×3.
  - Bản 1 có bệ gỗ dưới chân và tường trái chưa sáng hơn hẳn tường phải. Bản 2 đã bỏ bệ gỗ.
  - Bản 2 nên lưu ý: mái đổi sang mái bốn phía và không còn cửa sổ gác xép như bản 1.
- **Chưa duyệt thì không làm:** phép chiếu và renderer (Task 9–10), vẽ lại cả bộ Lúa Mì (Task 11), và chưa đăng ký `assets.manifest.yml` / `CREDITS.md`.
