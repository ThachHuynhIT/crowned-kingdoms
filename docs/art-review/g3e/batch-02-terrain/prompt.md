Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `docs/art-review/g3e/batch-02-terrain/source.png` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo). Không sửa file khác, không commit.

Hai ảnh tham chiếu đính kèm: `source-sheet.webp` (bộ lính giáo + nhà tranh + 3 ô cỏ) và `batch-01-barracks/source.png`. Giữ ĐÚNG phong cách: pixel art fantasy ấm áp, "pixel" lớn khoảng 7×7 điểm ảnh, ánh sáng trên-trái, không anti-aliasing, không làm mờ; các ô nền phải cùng bảng màu và độ chi tiết với 3 ô cỏ trong `source-sheet.webp`.

Nội dung (1536×1024, nền phẳng đen #000000 giữa các ô, mỗi ô là hình VUÔNG đúng 224×224 px ảnh = 32×32 pixel nghệ thuật, cách nhau đều 32 px, KHÔNG viền, KHÔNG bóng, KHÔNG chữ). Mỗi ô phải LẶP ĐƯỢC (seamless): mép trái khớp mép phải, mép trên khớp mép dưới, không có vật thể nào chạm mép ô.
Bố cục lưới 6 cột × 4 hàng (24 ô):
- Hàng 1: 6 ô ĐƯỜNG ĐẤT (lối mòn đất nâu vàng, vài sỏi nhỏ, vết bánh xe nhẹ) — 6 biến thể khác nhau.
- Hàng 2: 6 ô CÁT (cát vàng nhạt, vài vỏ sò/đá nhỏ, gợn sóng cát) — 6 biến thể.
- Hàng 3: 3 ô CỎ HOA (cỏ như trong tham chiếu, nhiều hoa trắng/vàng/hồng hơn) và 3 ô CỎ DÀY/CỎ CAO (cỏ đậm hơn, bụi cỏ cao) — 6 biến thể.
- Hàng 4: 6 ô NƯỚC (xanh lam ấm, sóng gợn, vài đốm sáng) — cột 1–3 là 3 khung hoạt ảnh liên tiếp của cùng một mặt nước A (sóng dịch chuyển nhẹ giữa các khung, vòng lặp được), cột 4–6 là 3 khung của mặt nước B (biến thể khác).
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
