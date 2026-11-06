# Cổng duyệt mẫu isometric (P3, 06/11/2026)

Spec: `docs/superpowers/specs/2026-11-06-iso-board-redesign-design.md` §4. Quy chuẩn: `docs/ART_STYLE.md`, mục "Isometric (trục đo 2.5D) cho sprite thế giới".

| Mẫu | Nguồn | Prompt | Trạng thái |
|---|---|---|---|
| Công trình: Đội Thợ Gặt, isometric — bản 3 | `sample-building/source.png` (1024×1024, nền đen) | `sample-building/prompt.md` | **Chờ chủ dự án duyệt** |
| ↳ bản 2 (góc mái sau bên phải bị nâng cao hơn mái trước) | `sample-building/v2-source.png` | `sample-building/v2-prompt.md` | Chủ dự án yêu cầu sửa |
| ↳ bản 1 (cửa bên trái, có bệ gỗ) | `sample-building/v1-source.png` | `sample-building/v1-prompt.md` | Chủ dự án yêu cầu sửa |
| Ô trống (đất trống), isometric — bản 2 | `sample-plot/source.png` (1024×1024, nền đen) | `sample-plot/prompt.md` | **Chờ chủ dự án duyệt** |
| ↳ bản 1 (ruộng có luống, cọc cao) | `sample-plot/v1-source.png` | `sample-plot/v1-prompt.md` | Chủ dự án yêu cầu sửa |
| Ô đã xây (sân lát đá), isometric — bản 2 | `sample-plot-built/source.png` (1024×1024, nền đen) | `sample-plot-built/prompt.md` | **Chờ chủ dự án duyệt** |
| ↳ bản 1 (cọc cao) | `sample-plot-built/v1-source.png` | `sample-plot-built/v1-prompt.md` | Chủ dự án yêu cầu sửa |

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

**Góp ý về bản 2 (06/11/2026):** góc mái sau bên phải cao hơn phần mái trước, không đúng góc isometric. Bản 3 đã sửa: mái ngồi đều trên tường, diềm mái song song với đỉnh tường, góc mái trái và phải cao ngang nhau. Quy tắc này đã ghi vào ART_STYLE (gạch đầu dòng "Mái đúng trục" và mục kiểm).

**Claude tự kiểm bản 3:**
- Đạt: góc diềm mái trái (y ≈ 440) và phải (y ≈ 450) gần ngang nhau; sống mái chạy theo trục chéo; cửa ở tường phải, có cửa sổ gác xép ở đầu hồi.
- Còn lệch: tường phải dốc khoảng 3:1, tường trái khoảng 2,2:1. Nghĩa là tường phải thoải hơn chuẩn 2:1; có thể nắn lại khi làm sạch sprite native hoặc vẽ lại.

**Góp ý về ô đất (06/11/2026):** cọc góc phải thấp và nhỏ; ô trống phải là một mảnh đất trống, không giống ruộng. Bản 2 đã sửa, và ART_STYLE đã ghi quy tắc này ở gạch đầu dòng "Mặt đất".
- **Claude tự kiểm:** ô trống bản 2 là đất nện với vài khóm cỏ và sỏi, không có luống; cọc chỉ cao vài pixel. Hai ô chưa khớp nhau hoàn toàn: cọc ô trống là gốc tròn, cọc ô lát đá là khối vuông nhỏ hơn, và mép đất của ô lát đá mỏng hơn. Hai điểm này sẽ được làm đồng nhất khi làm sạch sprite native.
