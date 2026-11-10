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
- **Phép Thuật, học viện / thư viện / tháp pháp sư:** "mái sọc xanh lá" thật ra là lỗi cắt: khoá màu magenta lỏng ăn cả mái tím, cỏ lộ qua lỗ. `make_levels.py` nay chỉ bỏ magenta nối liền mép ảnh (cộng vài túi magenta thuần kẹt bên trong); cắt lại từ bản vẽ đầu (bản vẽ lại giữ ở `source-v2.png`). ĐÃ DUYỆT. Cắt lại các vua đã duyệt: chỉ lấp vài lỗ nhỏ (0–83 px mỗi ảnh).
- **Rừng Xanh (8):** hang gấu, cây non, cổng hươu, suối, tháp gai, Ngai, người cây, hang sói. Bảng `sheet-grove.png`. ĐÃ DUYỆT.
- **Thuỷ Triều (8):** pháo, cảng, nhà móc câu, xoáy kraken, tàu cướp biển, Ngai, rương báu, tháp sóng. Bảng `sheet-tide.png`. ĐÃ DUYỆT.
- **Lò Rèn (8):** kho vũ khí, lò cao, nhà pháo thủ, tháp lửa, hang rồng sắt, lò rèn, nhà kiếm sĩ, Ngai. Bảng `sheet-forge.png`. ĐÃ DUYỆT. Ảnh cấp 1 của tháp lửa, hang rồng sắt và nhà pháo thủ bị thủng ở mạch vữa tối (cỏ lộ ra như viền xanh): cắt lại bằng `g5/recut_border_key.py` (chỉ bỏ nền đen nối liền mép), cùng kích thước.
- **Đồng Hồ (8):** tháp chuông, xưởng người khổng lồ, tháp bánh răng, xưởng nhện, xưởng lò xo, pháo hơi nước, Ngai, xưởng lính lên dây. Bảng `sheet-clock.png`. ĐÃ DUYỆT.

## Tạm dừng 10/11/2026 (chủ dự án bảo dừng)

- Đã duyệt và đưa vào game: 55/74 (Lúa Mì, Đá Núi, Phép Thuật, Rừng Xanh, Thuỷ Triều, Lò Rèn, Đồng Hồ).
- Đã vẽ nhưng **chưa cắt, chưa duyệt**: Ánh Trăng `moon_altar`, `moon_crypt`, `moon_reaper_shrine` (nguồn ở `<card>/l2|l3/source.png`).
- Chưa vẽ: 5 công trình còn lại của Ánh Trăng, 7 của Du Mục, 4 trung lập. Prompt đã có sẵn.
- Vẽ tiếp: `python docs/art-review/levels/make_levels.py prompts moon nomad neutral` rồi chạy `.superpowers/lv.sh` (bỏ dòng các thẻ đã có `source.png`), sau đó `cut <vua>`, duyệt, `register <vua>`.
