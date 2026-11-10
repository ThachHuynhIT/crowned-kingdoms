# Kiến trúc cấp 2/3 của công trình — duyệt 10/11/2026

Danh sách P2 `building_<card>_l2/_l3` trong `tools/asset-admin/planned.json`. Duyệt: Claude theo uỷ quyền của chủ dự án (09/11/2026).

- **Quy ước:** cấp 1 dùng ảnh gốc, cấp 2 dùng L2, cấp 3–5 dùng L3 (cấp 4/5 phân biệt bằng sao). Thiếu ảnh cấp nào thì dùng cấp thấp hơn rồi tới ảnh gốc (`pickBuildingFrame`, `src/render/atlas.ts`). Áp cho bàn cờ, vùng bấm và công trình trong trận.
- **Cách vẽ:** `make_levels.py prompts` dựng prompt từ khối "Prompt isometric dùng lại" của `docs/ART_STYLE.md`, đính kèm ảnh phong cách, nhà isometric đã duyệt và CHÍNH ảnh nguồn cấp 1 của công trình; nền magenta. `make_levels.py cut` thu về đúng bề rộng ảnh cấp 1 (chân vẫn một ô), nhà cao lên phía trên. `register` thêm vào `IMAGE_BUILDING_LEVELS` và `docs/assets.manifest.yml`.
- **Mẫu:** Dân Quân (`wheat_militia/preview.png`): L2 có móng đá, thêm cửa sổ và đèn; L3 thêm khung gỗ chạm, mái dày hơn, cờ thêu. Vẫn rõ là cùng một nhà, cùng chân, cửa bên phải. ĐÃ DUYỆT trước khi vẽ cả bộ.

## Theo vua

- **Lúa Mì (7 + mẫu):** ruộng (L3 thêm chòi canh), kho thóc, trại nông dân, nhà thợ gặt, bù nhìn, Ngai, cối xay gió. Bảng `sheet-wheat.png`. ĐÃ DUYỆT cả nhóm.
- **Đá Núi (7/8):** máy bắn đá, tháp pha lê, lò golem, mỏ, tim núi, Ngai, tường. Bảng `sheet-stone.png`. ĐÃ DUYỆT. **Mỏ đá (`stone_quarry`)**: L2/L3 gần như y hệt L1, vẽ lại với yêu cầu rõ hơn.
- **Đá Núi, mỏ đá (vòng 2):** L2 thêm tầng và cần cẩu, L3 tháp cẩu lớn. ĐÃ DUYỆT.
- **Phép Thuật (4/7):** pháp sư băng, đại pháp sư, Ngai, bùa chắn. Bảng `sheet-arcane.png`. ĐÃ DUYỆT. Học viện, thư viện, tháp pháp sư: mái L2/L3 thành sọc tím xanh lá, khác mái tím trơn của L1, vẽ lại.
