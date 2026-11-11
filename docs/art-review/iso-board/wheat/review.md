# Bộ Lúa Mì isometric (Task 11, 06/11/2026)

- **Cách tạo:** chạy `python docs/art-review/g3e/buildings/make_prompts.py wheat-iso` (sinh `.superpowers/b-wheat-iso.sh`), sau đó Codex imagegen vẽ từng ảnh.
- **Ảnh đính kèm mỗi prompt:** ảnh phong cách Thợ Gặt, và ảnh isometric đã duyệt cùng loại (công trình: `iso-building-approved.png`; ô đất: `iso-plot-open-approved.png` và `iso-plot-built-approved.png`).
- **Bảng duyệt:** `sheet.png`, dựng bằng `make_sheet.py`.

| Asset | Nguồn | Trạng thái |
|---|---|---|
| Dân Quân | `building_wheat_militia/source.png` | Chờ duyệt |
| Khởi Nghĩa Nông Dân | `building_wheat_peasant_horde/source.png` | Chờ duyệt |
| Kho Thóc | `building_wheat_granary/source.png` | Chờ duyệt |
| Cối Xay Gió | `building_wheat_windmill/source.png` | Chờ duyệt |
| Bù Nhìn Gác | `building_wheat_scarecrow/source.png` | Chờ duyệt |
| Ruộng Lúa | `building_wheat_field/source.png` | Chờ duyệt |
| Ngai Bó Lúa | `building_wheat_throne/source.png` | Chờ duyệt |
| Ô khoá | `plot_wheat_locked/source.png` | Chờ duyệt |
| Ô Ngai | `plot_wheat_throne/source.png` | Chờ duyệt |
| Tường núi, mẫu đoạn (bản 2) | `terrain_wall_iso_sample/source.png` | Chờ duyệt |
| ↳ bản 1 | `terrain_wall_iso_sample/v1-source.png` | Loại: sai hướng (đi lên-phải) và dốc khoảng 3:1, do prompt của Claude ghi nhầm hướng |

Nhà Đội Thợ Gặt, ô trống và ô đã xây là ba mẫu đã duyệt ở `../sample-*`.

**Claude tự kiểm:**

- **Công trình:** đạt cả bảy. Cửa chính ở tường phải, nhà đứng giữa ô, không có bệ. Mái nằm đều trên tường (diềm mái song song đỉnh tường, góc mái trái và phải ngang nhau). Phong cách và màu khớp mẫu Thợ Gặt.
- **Ruộng Lúa:** ảnh nguồn rộng gần bằng cả ô. Khi đưa vào game, ảnh được thu theo chân nhà nên ruộng sẽ nhỏ trên sân lát đá; nếu muốn ruộng phủ cả ô thì cần quyết định riêng.
- **Ô khoá và ô Ngai:** cùng khung với hai ô đã duyệt (viền cỏ, cọc góc nhỏ, độ dày mép).
- **Tường bản 2:** hướng đúng (trên-trái xuống dưới-phải, mặt vách hướng xuống dưới-trái), hai đầu cắt thẳng đứng. Độ dốc chân vách khoảng 2,7:1 thay vì 2:1. Khi làm sprite native có thể sửa bằng cách dịch từng cột ảnh theo chiều dọc (giữ cạnh đứng thẳng), hoặc vẽ lại.
