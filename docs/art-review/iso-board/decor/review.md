# Đồ trang trí sân nhỏ — duyệt 10/11/2026

Danh sách P2 `decor` trong `tools/asset-admin/planned.json`. Duyệt: Claude theo uỷ quyền của chủ dự án (09/11/2026).

- **Cách vẽ:** `make_decor.py prompts` dựng prompt từ khối "Prompt isometric dùng lại" của `docs/ART_STYLE.md` (qua `g3e/buildings/make_prompts.py`), đính kèm ảnh phong cách Thợ Gặt và nhà isometric đã duyệt. Nền **magenta** thay cho nền đen, để cắt không còn viền đỏ sẫm như bộ hoang dã cũ. `make_decor.py cut` cắt về chiều cao đích (2 px ảnh mỗi đơn vị thế giới).
- **Mẫu:** thùng gỗ (`wild_barrel`): đúng góc isometric, gỗ ấm, đai sắt, không viền tối. ĐÃ DUYỆT trước khi vẽ nhóm.
- **Nhóm:** đống rơm, biển gỗ, xe kéo chở lúa, bốn đoạn rào chéo (ne, nw, se, sw), rào ngang, cổng gỗ. Bảng: `sheet.png`. ĐÃ DUYỆT.
- **Loại:** `wild_fence_vertical` ra một cọc đứng rộng 4 px, không đọc được là rào. Rào thẳng đứng trên màn hình không nằm trên trục nào của lưới isometric, nên bỏ mục này.
- **Dùng trong game:** thùng, rơm, biển và xe kéo thêm vào `DECOR_CATALOG` (đồ thấp, rải trong sân). Rào và cổng chỉ có trong kho asset và trang dựng bản đồ, vì rải ngẫu nhiên sẽ không thành hàng rào.
