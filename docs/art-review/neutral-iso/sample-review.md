# Công trình trung lập isometric — duyệt mẫu (09/11/2026)

Bối cảnh: `neutral_archer_tower`, `neutral_well`, `neutral_mercenary_camp` vẫn vẽ bằng code (`paintBuilding` trong `src/render/atlas.ts`); `neutral_barracks` dùng `barracks.png` cũ góc 45° giữa bàn cờ isometric. Mẫu đầu tiên: Trại Lính (`neutral_barracks`).

Vẽ bằng `python docs/art-review/neutral-iso/make_prompts.py sample` (prompt dựng từ khối "Prompt isometric dùng lại" của `docs/ART_STYLE.md` qua `docs/art-review/g3e/buildings/make_prompts.py`; prompt bắt Codex đọc `docs/ART_STYLE.md`). Đính kèm: `harvester-house-front-approved.png`, `iso-building-approved.png`, `iso/wheat_throne.png`, `iso/wheat_militia.png`.

Claude kiểm (nguồn 1024×1024 và bản thu 62×56 cạnh Đội Dân Quân và Mỏ Đá đã duyệt, phóng ×4):
- Isometric 2:1, thấy hai mặt tường và mái từ trên; cạnh đứng thẳng, không phối cảnh.
- Cửa chính (cửa đôi vòm đá) ở tường phải hướng đông-nam; nhà đứng thẳng trên đất, không bệ.
- Mái ngói đỏ: góc diềm trái/phải ngang nhau, diềm song song đỉnh tường, không góc sau bị nâng.
- Ánh sáng trên-trái; viền màu tối của vật liệu; cùng cỡ cụm pixel và độ hoàn thiện với bộ Wheat/G5 (62×56, đúng cỡ Đội Dân Quân 62×56).
- Nhận ra trại lính: giá giáo, khiên tròn, hình nộm tập, cờ xanh; không có lính; không huy hiệu vua nào.
- Mép alpha 0/255 sau khi cắt (cutter chung `iso-board/make_assets.py`).

**Trạng thái:** ĐÃ DUYỆT 09/11/2026 — Claude duyệt theo uỷ quyền của chủ dự án (09/11/2026). Được vẽ ba công trình còn lại với mẫu này đính kèm.
