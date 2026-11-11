# Công trình trung lập isometric — duyệt nhóm (09/11/2026)

Mẫu Trại Lính đã duyệt trước (`sample-review.md`). Ba công trình còn lại vẽ bằng `python docs/art-review/neutral-iso/make_prompts.py set` (đính kèm thêm mẫu Trại Lính đã duyệt). Bảng thu nhỏ ×4: `sheet.png`. Cắt bằng `python docs/art-review/neutral-iso/make_assets.py <id>` (cùng cutter và tỉ lệ với bộ Wheat/G5: Reapers = 64 px rộng; mép alpha 0/255).

Claude kiểm cả bốn: isometric 2:1, thấy hai mặt và phần mái/nóc từ trên, cạnh đứng thẳng, không phối cảnh; ánh sáng trên-trái; viền màu tối của vật liệu; cùng bảng màu gỗ nâu, đá xám, ngói đỏ, cờ xanh nhỏ như mẫu; không lính đứng trước, không huy hiệu vua nào; cao ≤ 80 px ảnh.

| Công trình | File | Cỡ | Kết quả | Lý do |
|---|---|---|---|---|
| `neutral_barracks` Trại Lính | `public/assets/art/ai-v1/iso-neutral/neutral_barracks.png` | 62×56 | ĐÃ DUYỆT | Mẫu đã duyệt; cửa vòm ở tường phải, giá giáo/khiên, hình nộm; thay `barracks.png` góc 45° cũ |
| `neutral_archer_tower` Tháp Cung | `public/assets/art/ai-v1/iso-neutral/neutral_archer_tower.png` | 46×78 | ĐÃ DUYỆT | Chân đá, tầng gỗ có khe bắn, nỏ và ống tên thấy từ trên; mái bốn mái góc ngang nhau; cửa ở tường phải |
| `neutral_well` Giếng | `public/assets/art/ai-v1/iso-neutral/neutral_well.png` | 53×70 | ĐÃ DUYỆT | Giếng đá tròn, mái gỗ hai mái trên bốn cột, dây và xô vàng; đọc rõ là công trình kinh tế; không cần cửa |
| `neutral_mercenary_camp` Trại Lính Đánh Thuê | `public/assets/art/ai-v1/iso-neutral/neutral_mercenary_camp.png` | 68×61 | ĐÃ DUYỆT | Lều sọc đỏ-kem, lối vào có mái hiên ở mặt phải, biển đồng vàng, giá vũ khí và rương vàng |

**Trạng thái:** ĐÃ DUYỆT 09/11/2026 — Claude duyệt theo uỷ quyền của chủ dự án (09/11/2026). Chưa nối vào `src` (phiên chính nối).
