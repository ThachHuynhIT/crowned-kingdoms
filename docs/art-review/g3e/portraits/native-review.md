# Chân dung vua: bản native 96×144 để duyệt (29/10/2026)

Công cụ: `python tools/prepare_king_portraits.py [--smooth 3] [--out DIR] [vua ...]` (test: `python -m unittest discover -s tools -p test_prepare_king_portraits.py`).

## Quy trình
1. Đọc `<vua>/source.png` (1024×1536, đã duyệt, không sửa).
2. Thu cả ảnh (không crop) về **96×144** bằng trung bình vùng (BOX).
3. Ép mỗi điểm ảnh về **bảng màu riêng của vua** (24 màu, ghi tường minh trong `PALETTES` của script; lấy bằng median-cut từ chính ảnh; không dither; không ép vào Hearth 32).
4. Khử điểm ảnh lẻ (điểm khác cả bốn điểm kề) một lượt.
5. Ghi `native/<vua>.png` (RGBA, alpha 255) và `native/native-sheet.png` (1×, 2× và 24×36).

## Hai biến thể (so sánh ở `native-compare.png`, bốn vua)
- **A — sắc nét (mặc định, đề xuất):** giữ mặt, vương miện, vật đặc trưng rõ; nền và áo nhiều chấm nhiễu (khoảng 9–12% điểm lẻ).
- **B — mịn (`--smooth 3`):** lọc trung vị 3×3 trước khi ép màu, khử lẻ ba lượt: gần như không điểm lẻ nhưng mặt và chi tiết nhỏ nhòe.

## Trạng thái
- **Chưa duyệt.** Chưa copy vào `public/`, chưa đăng ký `assets.manifest.yml`/`CREDITS.md`, chưa nối vào game; thẻ vua vẫn dùng `paintPortrait` tạm.
- Sau khi duyệt: copy `native/*.png` vào `public/assets/art/ai-v1/portraits/`, đăng ký, thêm `src/render/portraitAssets.ts` và nối vào `KingPortraitView` (task A4 phần 2).
