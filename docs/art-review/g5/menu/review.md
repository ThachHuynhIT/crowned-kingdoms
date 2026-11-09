# Nền menu chính — duyệt G5 (09/11/2026)

Plan `docs/superpowers/plans/2026-11-09-missing-art-assets.md` Task 7 bước 4. Duyệt: Claude theo uỷ quyền của chủ dự án (09/11/2026).

- **Cách vẽ:** `make_prompts.py`, đính kèm ảnh phong cách Thợ Gặt; nền magenta phẳng; cắt bằng `make_assets.py` (lấy dải đáy, thu 6 px nguồn thành 1 px, alpha 0/255).
- **Mẫu đầu: `hills_mid` (256×90).**
  - Ảnh ra một miền quê trọn vẹn: đồi, ruộng, cối xay gió, nhà mái đỏ, hàng rào, đá, hoa.
  - Phần đất kín tới đáy, nên lớp này thay luôn hai lớp đồi gần vẽ bằng code (lớp gần sẽ che mất ruộng và hàng rào).
  - Đường đồi ở mép trái và mép phải cao bằng nhau (lệch 0 px); hai bản đặt cạnh nhau nối liền.
- **`hills_far` (256×120):** dãy núi tím hồng nhạt, một lâu đài nhỏ trên đỉnh, gần màu trời nên đọc như ở xa. Mép lệch 1 px, không thấy khi lặp.
- **Claude kiểm:** ánh sáng trên-trái, cụm pixel vuông rõ, không chữ, không người; hai lớp đặt lên trời hoàng hôn code (`paintSky`) hợp màu. Bản ghép: `preview.png` trong từng thư mục.
- **Trạng thái:** ĐÃ DUYỆT cả hai. Không vẽ `hills_near`.
- **Nối vào game:** `MENU_IMAGE_LAYERS` trong `src/render/imageArt.ts` (trôi 4 và 10 px/giây); thiếu một file thì menu giữ ba lớp đồi vẽ bằng code.
