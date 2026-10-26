# Crowned Kingdoms — Yêu cầu sản xuất từng bộ asset

Cập nhật: **25/10/2026**. Tài liệu repository dành cho việc giao sản xuất và kiểm đủ bộ.

## 1. Phạm vi và mức cam kết

- Danh sách ID, loại và cơ chế: [spec tổng](superpowers/specs/2026-10-16-crowned-kingdoms-design.md), §4–8; [kiểm kê](ASSET_INVENTORY.md).
- Quy chuẩn: [ART_STYLE.md](ART_STYLE.md), [quy trình duyệt](ASSET_PRODUCTION_RULES.md).
- **Theo spec**: danh mục nội dung, cấp gameplay 1–5, kỹ năng, đòn đánh. **Đề xuất sản xuất**: số frame mở rộng, ba mẫu kiến trúc, thiết kế đạn và icon bên dưới. Chưa phải tính năng đã triển khai.
- Tài liệu này không thay luật game và không tự cấp quyền tích hợp ảnh. Hiện người dùng yêu cầu các bộ tiếp theo chỉ xuất ảnh; chỉ apply khi được yêu cầu.
- Một bộ công trình sinh quân phải ghi đủ **nhà + quân + animation + tranh thẻ + đạn nếu có + impact/status liên quan**. Không coi ảnh nhà là hoàn thành cả bộ.
- Các bảng là nhu cầu cho toàn game theo spec; mã hiện tại có nội dung G1–G3 (3 vua chơi được, 9 vua làm địch); sáu Ngai, Nhân Bản và Ấn Triện thuộc G4. Trạng thái của art và trạng thái gameplay theo dõi riêng.

## 2. Tổng số và cách tính

| Nhóm | Số thiết kế gốc | Sản phẩm cần dự trù |
|---|---:|---|
| Công trình thường | 65 | 195 sprite tĩnh nếu chọn 3 mẫu kiến trúc/loại |
| Ngai | 9 | 27 sprite tĩnh nếu chọn 3 mẫu kiến trúc/loại |
| Tổng nhà/Ngai | 74 | 222 sprite kiến trúc; chưa cộng animation, hư hại hay overlay |
| Tranh thẻ | 102 | 93 thẻ + 9 Ngai; mặc định 1 tranh/ID, không nhân theo cấp |
| Quân thường/triệu hồi | 42 | 6 frame cơ bản hoặc 20 frame mở rộng/loại/hướng/phe cần thiết |
| Boss | 3 | 20 frame cơ bản mở rộng/boss + các kỹ năng đặc thù §7 |
| Chân dung vua | 9 | 1 ảnh 32×32/vua |
| Huy hiệu vua | 9 | 1 icon/vua; tái dùng cho cờ/lịch/trinh sát |
| Đạn | 15 họ đề xuất (gồm boss) | 76 frame hình đạn theo §8; dùng chung giữa các nguồn |
| VFX dùng chung | 26 họ đề xuất | 104 frame cơ sở nếu mỗi họ 4 frame; không cộng lại cho mỗi quân |
| Terrain | 5 vật liệu | Bộ chuyển tiếp dual-grid, biến thể và water animation theo §9 |
| Ô bàn cờ | 3 | open/locked/throne, mỗi loại 1 sprite 32×32 |
| Decor | 20 mẫu đề xuất | Cây/bụi/đá/hàng rào và đồ nông trại |
| UI có sẵn | 14 khung + 2 trang trí | Hoàn thiện/thay hình giữ hợp đồng 9-slice |
| Icon UI | 44 icon đề xuất | 14 hiện hành (7 gốc + 7 của G2) và phần bổ sung còn lại; tách 9 huy hiệu vua ở dòng riêng |

Không cộng các dòng thành tổng PNG: nhiều frame cùng spritesheet, một FX dùng nhiều nơi, overlay và Graphics không nhất thiết có PNG.
42 × 6 = **252 tư thế cơ bản** trước phe; 42 × 20 = **840 tư thế mở rộng** trước phe. Nếu mọi quân đều có hai phe, trần xuất tương ứng 504/1.680 frame; đây là trần dự trù, không phải yêu cầu: quân chỉ làm địch và triệu hồi boss không tự có ally.
Không nhân animation quân theo cấp nhà. Cấp hiện tăng chỉ số; không tạo thêm 5 bộ quân nếu gameplay chưa yêu cầu thay hình.

## 3. Hợp đồng kỹ thuật và cấp 1–5

| Asset | Canvas | Ghi chú |
|---|---|---|
| Asset | Canvas ảnh (px ảnh) | Ghi chú |
|---|---|---|
| Tile nền | 32×32 | = 16×16 đơn vị thế giới; mép ghép/mask đúng dual-grid |
| Quân nhỏ | ~24×32 | Cao ~16 đơn vị; mẫu `ai-v1` lính giáo |
| Quân cao / lớn | theo `UnitDef.sprite` × 2 | Ví dụ 16×24 đơn vị → 32×48 px ảnh |
| Nhà / Ngai | ~64 rộng (nhà), Ngai chốt khi làm | Nhà chiếm tối đa một ô (32 đơn vị); không kèm nền ô; neo giữa chân |
| Boss | 96×96 hoặc lớn hơn khi được chốt | = 48×48 đơn vị |
| Tranh / chân dung / icon | chốt theo UI; icon hiện 16×16 | Tranh không chữ; UI dựng chữ ngoài ảnh |
| Đạn | 8×8–16×16 | Tỉ lệ gấp đôi bảng cũ nếu vẽ cùng mật độ |

**Mật độ chuẩn (G3e): 2 pixel ảnh = 1 đơn vị thế giới**; sprite hiển thị ở scale 0,5 và camera zoom 2 nên pixel ra màn hình 1:1. Kích thước theo metadata, không còn cố định 16×16. Không giới hạn RGB hay số màu (UI vẫn dùng khung/nút chuẩn). Mép alpha 0 hoặc 255 (bóng khai báo alpha 128); không anti-aliasing, không xoay sprite, nearest-neighbour, zoom nguyên. Các frame cùng animation giữ canvas, chân và vị trí tay cầm vũ khí ổn định. Ánh sáng trên trái.

**Đề xuất kiến trúc ba mẫu, áp dụng cho cả 74 nhà/Ngai:**

| Cấp gameplay | Mẫu hình | Thay đổi phải đọc được |
|---|---|---|
| 1 | L1 | Nhà cơ bản, vật liệu đơn giản, công năng rõ |
| 2 | L2 | Gia cố chân/tường/mái hoặc thêm thiết bị đặc trưng |
| 3 | L3 | Nâng silhouette, chi tiết vật liệu và biểu tượng tinh nhuệ |
| 4 | L3 + chỉ báo IV | Dùng lại mẫu L3, huy hiệu cấp do UI dựng |
| 5 | L3 + chỉ báo V | Dùng lại mẫu L3, huy hiệu tối đa do UI dựng |

Không tăng diện tích chiếm ô hoặc scale nhà theo cấp. L1–L3 là kiến trúc khác nhau, không chỉ đổi màu. Chỉ báo cấp vẫn hiển thị kể cả nhà có biến thể.
Runtime hiện chỉ có `building_<CardId>`; L2/L3 cần loader/helper chọn frame theo level trước khi dùng. Tên dự kiến `building_<CardId>_l1/l2/l3`, giữ alias cũ về L1. Không ghi các frame mới là đã hoạt động.
Nếu muốn đủ 5 kiến trúc riêng: 74 × 5 = 370 sprite tĩnh, tăng 148 so với đề xuất ba mẫu; chưa nằm trong khối lượng mặc định.

### 3.1 Brief nâng cấp theo nhóm mỹ thuật (đề xuất)

Áp dụng cho từng CardId thuộc phe tương ứng ở §5, đồng thời giữ vật thể nhận diện chức năng của chính nhà đó. Không biến mọi nhà trong một phe thành cùng một thiết kế.

| Phe | Cấp 1 | Cấp 2 | Cấp 3 |
|---|---|---|---|
| Trung lập | Gỗ/đá đơn giản, thiết bị ít | Tường gia cố, giá vũ khí hoặc thiết bị lớn hơn | Đá vững, mái hoàn thiện, huy hiệu và thiết bị tinh nhuệ |
| Lúa Mì | Nông trại nhỏ, rơm/gỗ | Nền đá, kho/giá công cụ rõ hơn | Trang trí bó lúa, mái tốt, thiết bị mùa gặt hoàn chỉnh |
| Đá Núi | Khối đá thô, rune ít | Đá đẽo, thanh chống/rune rõ | Pha lê và rune trung tâm, hình khối chắc nặng |
| Phép Thuật | Tháp/học viện nhỏ | Sách, rune, pha lê gia cố | Đỉnh pha lê lớn, vòng phép và vật liệu tinh luyện |
| Rừng Xanh | Mầm/rễ/hang nhỏ | Rễ dày, tán lá và đá tự nhiên | Cây trưởng thành, biểu tượng linh mộc; không tự đổi cơ chế tuổi |
| Thủy Triều | Gỗ tàu, dây thừng | Chống đá, kim loại, thiết bị biển | Pháo/neo/vỏ sò đặc trưng; silhouette hải quân tinh nhuệ |
| Lò Rèn | Lò/gỗ/đá thô | Thép gia cố, ống khói hoàn thiện | Giáp thép, đe/thiết bị luyện kim rõ; lửa vẫn cùng palette |
| Đồng Hồ | Máy đơn giản, bánh răng nhỏ | Hệ truyền động, dây cót lớn | Đồng/thép tinh xảo, đồng hồ và cơ cấu hoàn chỉnh |
| Ánh Trăng | Đá cổ/hầm mộ nhỏ | Rune và trụ đá | Biểu tượng nguyệt thực, đá chạm và vật thể triệu hồi rõ |
| Du Mục | Lều, gỗ, vải đơn giản | Cọc chắc, mái/vải nhiều lớp | Thảm/cờ/giáp tinh nhuệ, giữ vẻ có thể di dời |

Không làm đạn cấp 2/3 chỉ vì sát thương tăng. Dùng chung projectile; thay kích cỡ/FX chỉ khi có cue gameplay được chốt. Ruộng, giếng, tường, rương và vòng triệu hồi cũng cần L2/L3 theo đề xuất, nhưng nâng vật thể đặc trưng thay vì thêm mái nhà không phù hợp.

## 4. Mỗi loại công trình phải bàn giao gì

| Mã bộ | Áp dụng | Bắt buộc trong gói đề xuất | Chuyển động nâng cao |
|---|---|---|---|
| B-TROOP | Nhà sinh quân | L1/L2/L3, tranh thẻ, liên kết UnitId, FX sinh quân dùng chung | Cửa/cờ 2 frame/mẫu, tổng 6; chỉ thêm sau static được duyệt |
| B-TOWER | Tháp tấn công | L1/L2/L3, tranh thẻ, điểm bắn, đạn/beam/cone và impact đúng cơ chế | Windup/fire/recover 3 frame/mẫu, tổng 9 frame bổ sung |
| B-ECON | Kinh tế | L1/L2/L3, tranh thẻ, FX thu vàng dùng chung | Hoạt động 4 frame/mẫu, tổng 12; cối xay/nước/lò có nhịp riêng |
| B-SUPPORT | Hỗ trợ | L1/L2/L3, tranh thẻ, FX buff/heal/summon phù hợp | Hoạt động 4 frame/mẫu, tổng 12; aura tách riêng |
| B-THRONE | Ngai | L1/L2/L3, tranh Ngai, đạn, impact, bị động, chân dung/huy hiệu vua liên kết | Fire 3 frame/mẫu, tổng 9 bổ sung; nhận sát thương dùng FX chung |
| B-SPELL | Bùa/sách | 1 tranh thẻ, icon hiệu ứng dùng chung, FX khi thi triển | Không tạo nhà hoặc quân nếu thẻ không sinh chúng |

FX đặt/xây, lên cấp, dời, phá hủy dùng chung. Nhà hư hại tĩnh và xác nhà là tùy chọn: nếu làm riêng ba cấp thì thêm 222 sprite/loại trạng thái. Không tự nhân vào dự toán.
Tháp có hướng: giữ nền tháp tĩnh, tách nòng/đầu bắn thành 8 hướng khi thật sự cần. Không nhân toàn bộ kiến trúc thành 8 hướng theo mặc định.

## 5. Danh sách 93 thẻ và liên kết trọn bộ

Cột cơ chế được trích nguyên từ spec trong repo để giữ liên kết quân/đạn/effect; không suy ra đạn chỉ vì tên có chữ “tháp”. Mỗi dòng thừa hưởng toàn bộ yêu cầu B-* ở §4. “Đạn/FX” là brief mỹ thuật, cơ chế cột cuối là nguồn chuẩn.

| CardId | Tên | Bộ | Quân liên kết | Đạn / FX cần kiểm | Mốc | Cơ chế theo spec |
|---|---|---|---|---|---|---|
| `neutral_barracks` | Trại Lính | B-TROOP | footman | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G1 | Sinh `footman` 3/4/5/6/7. |
| `neutral_archer_tower` | Tháp Cung | B-TOWER | — | arrow + physical_hit | G1 | Bắn 7 vật lý, tầm 88, nhịp 12, đạn 8 px/tick. |
| `neutral_well` | Giếng Làng | B-ECON | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Đầu năm +1/2/3/4/5 vàng. |
| `neutral_mercenary_camp` | Trại Đánh Thuê | B-TROOP | mercenary | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Sinh `mercenary` 2/3/3/4/5. Đầu năm trả 1 vàng phí; không đủ vàng thì năm đó trại không sinh lính. |
| `neutral_sharpen` | Bùa Sắc Bén | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | +15% DMG. |
| `neutral_fortify` | Bùa Vững Chãi | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | +20% HP lính và máu công trình. |
| `neutral_promote` | Thăng Cấp | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | +1 cấp cho một công trình (không phải Ngai). |
| `neutral_clear_land` | Khai Hoang | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G1 | Mở một ô khoá bất kỳ (mở bằng vàng, §3.11, vẫn phải kề ô đã mở). |
| `neutral_move` | Dời Nhà | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G1 | Dời một công trình sang ô đã mở khác (đổi chỗ nếu có). |
| `neutral_demolish` | Dỡ Bỏ | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Hiến tế một công trình, nhận 2 vàng × cấp. |
| `neutral_duplicate` | Nhân Bản | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Đặt bản sao một công trình (cùng cấp, không Bùa) lên ô trống đã mở. Meta. |
| `neutral_royal_seal` | Ấn Triện | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Ngai +1 cấp. Meta. |
| `wheat_militia` | Dân Quân | B-TROOP | militia | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G1 | Sinh `militia` 4/6/8/10/12. |
| `wheat_field` | Ruộng Lúa | B-ECON | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Đầu năm +1/1/2/2/3 vàng. Lân cận: công trình lính +1/1/2/2/3 lính. |
| `wheat_scarecrow` | Bù Nhìn Gác | B-TOWER | — | seed + slow | G1 | Bắn 6 vật lý, tầm 72, nhịp 12, đạn 6; trúng: chậm 20% trong 20 tick. |
| `wheat_fertilizer` | Bùa Phân Bón | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Lính: +1 lính. Kinh tế: +1 vàng đầu năm. |
| `wheat_reapers` | Đội Thợ Gặt | B-TROOP | reaper | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G1 | Sinh `reaper` 3/4/5/6/7. |
| `wheat_windmill` | Cối Xay Gió | B-ECON | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Đầu năm +2/3/4/5/6 vàng, thêm +1 vàng cho mỗi Ruộng Lúa lân cận. |
| `wheat_harvest_festival` | Lễ Hội Mùa Màng | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Nhận vàng = tổng cấp mọi công trình `farm` (tối thiểu 2). |
| `wheat_granary` | Kho Thóc | B-SUPPORT | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Lân cận: lính +15/20/25/30/35% HP. Đầu năm +1 vàng cho mỗi Ruộng Lúa lân cận. |
| `wheat_peasant_horde` | Khởi Nghĩa Nông Dân | B-TROOP | peasant | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Sinh `peasant` = 4 + k × (số công trình `farm`), k = 2/2/3/3/4 (vẫn kẹp `MAX_UNITS_PER_BUILDING`). |
| `stone_catapult` | Tháp Ném Đá | B-TOWER | — | stone + dust | G2 | Ném 14 vật lý, `splash 16`, tầm 96, tầm tối thiểu 24, nhịp 25, đạn 5. |
| `stone_golem_forge` | Xưởng Người Đá | B-TROOP | golem | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Sinh `golem` 1/1/2/2/3. |
| `stone_quarry` | Mỏ Đá | B-ECON | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Đầu năm +1/2/2/3/3 vàng. Lân cận: tháp +10/15/20/25/30% DMG. |
| `stone_stoneskin` | Bùa Da Đá | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | +20% HP và máu công trình, +0.05 giáp. |
| `stone_wall` | Tường Thành | B-SUPPORT | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Máu 400/550/700/850/1000, giáp 0.3. Khiêu khích: địch trong `BATTLE.tauntRadiusDefault` phải đánh tường trước. Lân cận: công trình +20% máu. |
| `stone_crystal` | Tháp Pha Lê | B-TOWER | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Tia 4 phép, tầm 64, nhịp 3, tức thời; mỗi đòn liên tiếp vào cùng mục tiêu +20% (tối đa +200%). |
| `stone_miners` | Đội Thợ Mỏ | B-TROOP | miner | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Sinh `miner` 3/4/5/6/7. |
| `stone_rune_carving` | Khắc Ấn Núi | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Mọi tháp đang có trên bàn cờ nhận vĩnh viễn +8% DMG (`permanent.dmg`). |
| `stone_mountain_heart` | Tim Núi | B-TOWER | golem | wave + impact; không projectile bay | G2 | Máu 600/750/900/1050/1200. Mỗi 40 tick (`pulse`, bán kính 48): 30 vật lý + choáng 10 tick mọi địch trong vòng. Lân cận: `golem` +30% HP. |
| `arcane_mage_tower` | Tháp Pháp Sư | B-TOWER | — | magic_orb + magic_hit; chain nếu có nảy | G2 | Bắn 9 phép, tầm 80, nhịp 14, đạn 8; nảy sang 1 địch khác trong 32 px với 60% sát thương. |
| `arcane_apprentices` | Học Viện | B-TROOP | apprentice | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Sinh `apprentice` 3/4/5/6/7. |
| `arcane_spark_rune` | Bùa Tia Lửa | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Mỗi đòn +2 sát thương phép (flat, cộng sau mọi %). |
| `arcane_haste_rune` | Bùa Tốc Biến | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | +12% tốc đánh. |
| `arcane_library` | Thư Viện | B-SUPPORT | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Đầu năm +1 vàng. Lân cận: công trình có ≥ 1 Bùa được +1/1/1/2/2 stack ảo của Bùa gắn đầu tiên. |
| `arcane_frost_mages` | Tháp Băng Sư | B-TROOP | frost_mage | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Sinh `frost_mage` 2/3/3/4/5. |
| `arcane_mirror` | Gương Chép Bùa | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Công trình thứ hai nhận bản sao mọi stack Bùa của công trình thứ nhất (tới giới hạn stack, theo thứ tự gắn). |
| `arcane_ward` | Vòng Kết Giới | B-SUPPORT | — | shield | G2 | Mỗi 50 tick: lính mình trong 64 px nhận khiên 20/25/30/35/40 (khiên tối đa = 2 × giá trị). |
| `arcane_archmage` | Tháp Đại Pháp Sư | B-TROOP | archmage | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G2 | Sinh `archmage` 1/1/1/2/2. `archmage` +4% DMG cho mỗi stack Bùa trên toàn bàn cờ (tối đa +100%). |
| `grove_wolf_den` | Hang Sói | B-TROOP | wolf | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `wolf` 3/4/5/6/7. |
| `grove_sapling` | Cây Mầm | B-SUPPORT | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Đầu năm, cứ đủ mỗi 3 năm tuổi thì +1 cấp (tối đa 5). Lân cận: lính +8/16/24/32/40% HP. |
| `grove_spring` | Suối Hồi Sinh | B-SUPPORT | — | heal | G4 | Lính mình trong 64 px hồi 2/3/4/5/6 HP/s. |
| `grove_deep_roots` | Bùa Rễ Sâu | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Mỗi đầu năm công trình nhận vĩnh viễn +3% HP và DMG (từ bùa này tối đa +90% mỗi công trình). |
| `grove_thorn_tower` | Tháp Gai | B-TOWER | — | thorn + poison | G4 | Bắn 5 vật lý, tầm 64, nhịp 8, đạn 8; trúng: độc 2/s trong 30 tick, cộng tối đa 3 lớp. |
| `grove_bear_cave` | Hang Gấu | B-TROOP | bear | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `bear` 1/1/2/2/3. |
| `grove_spring_rain` | Mưa Xuân | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Mọi công trình `grove` +2 năm tuổi (`ageBonus`); mọi Cây Mầm +1 cấp. |
| `grove_spirit_stags` | Đàn Hươu Thần | B-TROOP | stag | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `stag` 2/3/3/4/5. |
| `grove_treant` | Cổ Thụ Thức Tỉnh | B-TROOP | treant | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `treant` 1/1/1/2/2. |
| `tide_pirates` | Thuyền Cướp Biển | B-TROOP | pirate | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `pirate` 4/5/6/7/8. Mỗi 8 địch do `pirate` của trại này hạ: +1 vàng (tối đa 3 mỗi trận). |
| `tide_cannon` | Pháo Đài Biển | B-TOWER | — | cannonball + explosion/knockback | G4 | Pháo 16 vật lý, `splash 12`, tầm 88, nhịp 22, đạn 6; trúng: đẩy lùi 16. |
| `tide_harbor` | Bến Cảng | B-ECON | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Đầu năm +2/3/4/5/6 vàng. |
| `tide_undertow_rune` | Bùa Sóng Ngầm | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Mỗi đòn đẩy lùi thêm 6 px; lính +8% tốc. |
| `tide_wave_tower` | Tháp Sóng | B-TOWER | — | wave + impact; không projectile bay | G4 | pulse` mỗi 50 tick, bán kính 72: 10 phép + đẩy lùi 24 ra xa tháp. |
| `tide_treasure` | Rương Châu Báu | B-ECON | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Đầu năm +1 vàng cho mỗi 5 vàng đang có, tối đa 3/4/5/6/7. |
| `tide_hookmen` | Đội Móc Câu | B-TROOP | hookman | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `hookman` 2/3/4/5/6. |
| `tide_privateers` | Hợp Đồng Lính Đánh Thuê | B-SPELL | mercenary | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Trả toàn bộ vàng (tối đa 16); trận năm nay sinh thêm 1 `mercenary` tại Ngai cho mỗi 2 vàng đã trả (làm tròn xuống). |
| `tide_kraken` | Vực Kraken | B-TOWER | — | tentacle_strike + splash; không ép thành đạn pháo | G4 | Máu 500/625/750/875/1000. 4 xúc tu, mỗi xúc tu: 14 vật lý, tầm 56, nhịp 12, tức thời, đẩy lùi 8; các xúc tu chọn 4 mục tiêu khác nhau (`nearest`). |
| `forge_swordsmen` | Doanh Trại Kiếm Sĩ | B-TROOP | swordsman | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `swordsman` 3/4/5/6/7. |
| `forge_flame_tower` | Tháp Phun Lửa | B-TOWER | — | fire_cone + burn; không projectile bay | G4 | Phun 4 lửa, `cone` 40 px nửa góc 45°, nhịp 4, tức thời; bỏng 1/s trong 20 tick. |
| `forge_smithy` | Lò Rèn | B-SUPPORT | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Lân cận: lính +12/16/20/24/28% DMG và +0.05 giáp. |
| `forge_ember_rune` | Bùa Than Hồng | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Mỗi đòn gây thêm bỏng 2/s trong 30 tick (cộng vào bỏng cùng nguồn). |
| `forge_master_hammer` | Búa Thợ Cả | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | +1 cấp cho công trình được chọn (không phải Ngai) và +1 cấp cho công trình lân cận có cấp thấp nhất chưa tối đa (hoà: Bắc, Đông, Nam, Tây; Ngai bị bỏ qua). |
| `forge_bombardiers` | Đội Ném Lửa | B-TROOP | bombardier | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `bombardier` 2/3/3/4/5. |
| `forge_blast_furnace` | Lò Cao | B-ECON | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Đầu năm +1/2/2/3/3 vàng. Lân cận: công trình `fire` +25/30/35/40/50% sát thương bỏng. |
| `forge_armory` | Kho Giáp | B-SUPPORT | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Mọi lính trên bàn cờ +0.04/0.05/0.06/0.07/0.08 giáp (nhiều Kho Giáp: chỉ lấy cái cao nhất). Lân cận: +10% HP. |
| `forge_iron_drake` | Tổ Rồng Sắt | B-TROOP | iron_drake | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `iron_drake` 1/1/1/2/2. |
| `clock_windup_soldiers` | Xưởng Lính Thiếc | B-TROOP | tin_soldier | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `tin_soldier` 4/5/6/7/8. |
| `clock_gear_tower` | Tháp Bánh Răng | B-TOWER | — | gear + physical_hit | G4 | Bắn 5 vật lý, tầm 72, nhịp 10, đạn 8; +2% tốc đánh mỗi giây (tối đa +100%). |
| `clock_spring_workshop` | Xưởng Lò Xo | B-ECON | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Đầu năm +1/1/2/2/3 vàng. Lân cận: mọi tăng tiến lên dây trước 10/12/14/16/20 s. |
| `clock_tick_rune` | Bùa Tích Tắc | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | +1% tốc đánh mỗi giây (tối đa +30% mỗi stack). |
| `clock_bell_tower` | Tháp Chuông | B-SUPPORT | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Mỗi 100 tick: lính mình trong 80 px +25/30/35/40/45% tốc đánh trong 30 tick; từ cấp 3 địch trong 80 px bị choáng 5 tick. |
| `clock_spiders` | Ổ Nhện Cơ Khí | B-TROOP | spider | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `spider` 3/4/5/6/7. Mỗi 150 tick, nếu số nhện còn sống của ổ < số ban đầu: sinh lại 1 nhện tại ô. |
| `clock_rewind` | Tua Ngược | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Công trình được chọn vĩnh viễn lên dây trước thêm 5 s (`counters.prewind`, tối đa 30 s). |
| `clock_steam_cannon` | Pháo Hơi Nước | B-TOWER | — | cannonball + explosion/knockback | G4 | Pháo 30 vật lý, `splash 18`, tầm 104, nhịp 40, đạn 5; +1.5% tốc đánh mỗi giây (tối đa +90%). |
| `clock_colossus` | Lò Khổng Lồ Đồng | B-TROOP | colossus | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `colossus` 1/1/1/2/2. |
| `moon_crypt` | Hầm Mộ | B-TROOP | skeleton | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `skeleton` 3/4/5/6/7. |
| `moon_shadow_spire` | Tháp Bóng Đêm | B-TOWER | wraith | shadow_orb + soul/summon | G4 | Bắn 7 phép, tầm 72, nhịp 10, đạn 8; mỗi lần hạ địch triệu hồi 1 `wraith` tại tháp (tối đa 3/4/5/6/8 mỗi trận). |
| `moon_blood_pact` | Khế Ước Máu | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Hiến tế một công trình (không phải Ngai): nhận 3 vàng × cấp; mọi stack Bùa của nó chuyển sang Ngai (tới giới hạn). |
| `moon_blood_moon_rune` | Bùa Trăng Máu | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | +30% DMG, −10% HP (§5.3 kẹp HP ≥ 30%). |
| `moon_altar` | Đàn Tế | B-SUPPORT | wraith | summon / soul | G4 | Mỗi khi một thẻ `sacrifice` được chơi: `counters.offerings += 1` (vĩnh viễn). Đầu trận triệu hồi `wraith` = offerings × 1/1/2/2/3, tối đa 12/14/16/18/20. |
| `moon_vampires` | Lâu Đài Ma Cà Rồng | B-TROOP | vampire | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `vampire` 2/3/3/4/5. |
| `moon_summoning_circle` | Vòng Triệu Hồi | B-SUPPORT | wraith | summon / soul | G4 | Mỗi 80/70/60/50/40 tick triệu hồi 1 `wraith` tại ô (tối đa 8 mỗi trận). |
| `moon_eclipse_pact` | Giao Ước Nguyệt Thực | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Mất 1 mạng (không hợp lệ khi còn 1 mạng — `lastLife`): công trình được chọn +2 cấp (không vượt 5), nhận 5 vàng. |
| `moon_reaper_shrine` | Điện Thần Chết | B-TROOP | moon_reaper | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `moon_reaper` 1/1/1/2/2. |
| `nomad_riders` | Trại Kỵ Binh | B-TROOP | rider | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `rider` 2/3/4/5/6. |
| `nomad_horse_archers` | Trại Cung Kỵ | B-TROOP | horse_archer | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `horse_archer` 2/3/4/5/6. |
| `nomad_stables` | Chuồng Ngựa | B-SUPPORT | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Lân cận: lính `cavalry` +15/20/25/30/35% tốc và DMG. |
| `nomad_relocate` | Nhổ Trại | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Dời công trình tới bất kỳ ô đã mở nào (đổi chỗ nếu có); nếu khoảng cách Manhattan ≥ 2: +1 cấp. |
| `nomad_bazaar` | Chợ Phiên | B-ECON | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Đầu năm +1/1/2/2/3 vàng, thêm +1 vàng cho mỗi loại công trình khác nhau (lính/tháp/kinh tế/hỗ trợ) trong lân cận. |
| `nomad_wind_rune` | Bùa Gió Thảo Nguyên | B-SPELL | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | +10% tốc và +10% DMG; nhân đôi trong trận nếu `movedYear = year`. |
| `nomad_watchtower` | Chòi Canh Thảo Nguyên | B-TOWER | — | arrow + physical_hit | G4 | Bắn 7 vật lý, tầm 96, nhịp 12, đạn 9; +20% DMG cho mỗi ô lân cận đã mở mà trống. |
| `nomad_caravan` | Đoàn Lữ Hành | B-ECON | — | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Đầu năm +2/3/3/4/5 vàng. Mỗi lần một công trình được dời (kể cả dời miễn phí): +1 vàng ngay, tối đa 3 mỗi năm. |
| `nomad_khan_guard` | Ngự Lâm Thiết Kỵ | B-TROOP | khan_guard | FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định | G4 | Sinh `khan_guard` 2/2/3/3/4. |

### 5.1 Chín bộ Ngai/vua

Mỗi dòng: B-THRONE, 3 kiến trúc + 1 tranh + 1 chân dung + 1 huy hiệu = 6 hình tĩnh liên kết; đạn/FX dùng chung tính ở thư viện.

| KingId | CardId Ngai | Nhận diện | Đạn / bị động cần thể hiện |
|---|---|---|---|
| wheat | `wheat_throne` | Bó lúa, gỗ nông trại, đá ấm, vàng mùa gặt | arrow; vàng mùa gặt |
| stone | `stone_throne` | Đá khối, rune khắc, pha lê; thân vuông nặng | stone; tăng sát thương tháp |
| arcane | `arcane_throne` | Sách, rune, pha lê tím; đường cong thanh | magic_orb; buff từ stack bùa |
| grove | `grove_throne` | Rễ cây, lá, hoa; hình hữu cơ | thorn; poison/growth |
| tide | `tide_throne` | Gỗ tàu, dây thừng, vỏ sò, sắc nước | cannonball; splash/knockback/gold |
| forge | `forge_throne` | Đe, thép, than hồng; khối kim loại chắc | fireball; burn/buff |
| clock | `clock_throne` | Bánh răng, đồng, dây cót; hình tròn cơ khí | gear; lên dây/tăng tốc đánh |
| moon | `moon_throne` | Nguyệt thực, đá cổ, bóng mận; huyền bí nhưng cùng thế giới ấm | shadow_orb; soul/summon wraith |
| nomad | `nomad_throne` | Lều, thảm dệt, vàng cát, cờ thảo nguyên | arrow; dời nhà |

## 6. Animation và danh mục 42 quân

### 6.1 Hai mức bàn giao

| Trạng thái | Cơ bản tương thích hiện tại | Bộ mở rộng đề xuất | Loop / trigger |
|---|---:|---:|---|
| idle | 2 | 2 | Loop khi đứng yên |
| walk/fly | 2 | 4 | Loop khi di chuyển; chân/cánh có chu kỳ thật |
| attack | 2 | 4 | Windup → contact/release → follow-through → recover |
| hit | 0 | 2 | Khi nhận sát thương; không tự khóa hành động gameplay |
| death | 0 | 4 | Một lần, sau đó bỏ sprite/xác theo thiết kế |
| spawn | 0 | 4 | Một lần; hiệu ứng vòng triệu hồi là asset riêng dùng chung |
| **Tổng / loại / phe / hướng** | **6** | **20** | Không cộng 6+20; mở rộng thay bộ cơ bản |

Idle/walk mục tiêu 6–8 fps; attack 10–12 fps, nhưng thời điểm chạm/phóng phải khớp event mô phỏng. Hit/death/spawn và frame thứ 3–4 cần mở rộng renderer, chưa được code hiện tại hỗ trợ.
Một hướng vẽ + flip ngang trước; 4 hướng riêng chỉ khi được chốt, khối lượng tư thế nhân 4. Không flip nếu phá vị trí khiên/vũ khí hoặc ánh sáng; duyệt riêng.
Phe địch đổi màu/viền có kiểm soát, giữ silhouette. Chỉ làm phe thực sự được dùng; Bóng Gương của boss có thể tái dùng bản foe.
Cột size ghi “đề xuất” chưa phải thay UnitDef. Cấp 2/3 của nhà dùng lại animation quân; overlay tinh nhuệ trên quân là tùy chọn riêng.

| UnitId | Tên | Canvas | Bộ | Đòn / đạn | Kỹ năng / FX bổ sung |
|---|---|---|---|---|---|
| `footman` | Lính Bộ | 16×16 | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | Đối chiếu spec |
| `mercenary` | Lính Đánh Thuê | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | Đối chiếu spec |
| `bandit` | Thổ Phỉ | 16×16 | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 5 vật lý; 50 |
| `bandit_archer` | Cung Thủ Phỉ | 16×16 | 6 cơ bản / 20 mở rộng | arrow | 5 vật lý, đạn 7; 25 |
| `boar_rider` | Kỵ Lợn Rừng | 24×24 | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 8 vật lý; 15 |
| `ogre` | Gã Hộ Pháp | 24×32 | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 16 vật lý; 10 |
| `militia` | Dân Quân | 16×16 | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 5 vật lý; — |
| `reaper` | Thợ Gặt | 16×24 | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 9 vật lý, `cleave 2; — |
| `peasant` | Nông Binh | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 6 vật lý; — |
| `golem` | Người Đá | 24×32 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 14 vật lý; — |
| `miner` | Thợ Mỏ | 16×24 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 8 vật lý; deathSpawn rubble ×1 |
| `rubble` | Đá Vụn | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 4 vật lý; — |
| `slinger` | Lính Ném Đá | 16×24 (đề xuất) | 6 cơ bản / 20 mở rộng | stone | 7 vật lý, đạn 6; chỉ làm địch |
| `apprentice` | Học Đồ | 16×24 (đề xuất) | 6 cơ bản / 20 mở rộng | magic_orb | 7 phép, đạn 7; — |
| `frost_mage` | Pháp Sư Băng | 16×24 (đề xuất) | 6 cơ bản / 20 mở rộng | ice_shard | 6 phép, đạn 7; chậm 30%/20 tick; — |
| `archmage` | Đại Pháp Sư | 16×24 (đề xuất) | 6 cơ bản / 20 mở rộng | magic_orb + splash | 22 phép, `splash 20`, đạn 6; xem thẻ |
| `construct` | Hộ Vệ Phù Chú | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 8 phép; chỉ làm địch |
| `wolf` | Sói | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 7 vật lý; — |
| `bear` | Gấu Rừng | 24×32 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 16 vật lý; enrage` dưới 50% HP: +50% DMG |
| `stag` | Hươu Thần | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 9 vật lý; trúng: hồi 4 HP cho đồng minh máu thấp nhất trong 40 px; — |
| `treant` | Cổ Thụ | 24×32 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 20 vật lý; healAura` 48 px, 3 HP/s |
| `dryad` | Tiên Rừng | 16×24 (đề xuất) | 6 cơ bản / 20 mở rộng | magic_orb + heal | 6 phép, đạn 7; trúng: hồi 3 HP cho đồng minh máu thấp nhất trong 56 px; chỉ làm địch |
| `pirate` | Cướp Biển | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 6 vật lý; — |
| `hookman` | Lính Móc Câu | 16×24 (đề xuất) | 6 cơ bản / 20 mở rộng | hook + rope | 8 vật lý, đạn 6; mỗi đòn thứ 4 kéo mục tiêu 16 px về phía mình; — |
| `musketeer` | Lính Hoả Mai | 16×24 (đề xuất) | 6 cơ bản / 20 mở rộng | bullet + muzzle | 12 vật lý, đạn 10; chỉ làm địch |
| `swordsman` | Kiếm Sĩ Thép | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 9 vật lý; — |
| `bombardier` | Lính Ném Lửa | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | fireball + explosion | 10 lửa, `splash 14`, đạn 5; bỏng 2/s, 30 tick; — |
| `iron_drake` | Rồng Sắt | 24×32 (đề xuất) | 6 cơ bản / 20 mở rộng | fire_cone; không đạn bay | 12 lửa, `cone` 32 px nửa góc 45°; bỏng 4/s, 30 tick; — |
| `shieldbearer` | Lính Khiên | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 5 vật lý; chỉ làm địch |
| `tin_soldier` | Lính Thiếc | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 5 vật lý; rampDmg` +2%/s, tối đa +80% |
| `spider` | Nhện Cơ Khí | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 6 vật lý; — |
| `colossus` | Khổng Lồ Đồng | 24×32 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 10 vật lý; stepBuff` mỗi 100 tick +20% DMG, +10% tốc, tối đa 6 lần |
| `gear_gunner` | Xạ Thủ Bánh Răng | 16×24 (đề xuất) | 6 cơ bản / 20 mở rộng | gear | 6 vật lý, đạn 8; rampAttackSpeed` +1%/s, tối đa +60%; chỉ làm địch |
| `skeleton` | Bộ Xương | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 6 vật lý; reviveOnce` 50% HP |
| `wraith` | Bóng Ma | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 8 phép; — (là `summon` khi do hiệu ứng tạo) |
| `vampire` | Ma Cà Rồng | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 10 vật lý; hút máu 40%; — |
| `moon_reaper` | Thần Chết Trăng | 24×32 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 25 vật lý, `cleave 3; killHeal` 10; `soulScaling` +2% HP và DMG mỗi Hồn |
| `rider` | Kỵ Binh | 24×32 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 9 vật lý; charge` ×2 DMG, đẩy lùi 8 |
| `horse_archer` | Cung Kỵ | 24×32 (đề xuất) | 6 cơ bản / 20 mở rộng | arrow | 6 vật lý, đạn 8; kite` 24 px |
| `khan_guard` | Thiết Kỵ | 24×32 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | 14 vật lý; charge` ×2 DMG, choáng 10 tick |
| `frog` | Ếch Đầm | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | Đánh cận chiến; spawn riêng của boss |
| `hornet` | Ong Bắp Cày | 16×16 (đề xuất) | 6 cơ bản / 20 mở rộng | Cận chiến; không projectile riêng | Đánh cận chiến; spawn riêng của boss |

### 6.2 Ví dụ: bộ Trại Lính hoàn chỉnh

- `neutral_barracks`: nhà L1/L2/L3 (3), tranh thẻ (1), UnitId `footman`.
- `footman`: idle/walk/attack 6 tư thế cơ bản; 12 frame xuất nếu hai phe. Bộ mở rộng 20 tư thế, tối đa 40 frame xuất hai phe.
- Lính Bộ đánh cận chiến: **không đạn**, dùng physical_hit và slash chung; kiếm/khiên nằm trong sprite.
- FX sinh quân, đặt nhà, nâng cấp và phá hủy liên kết thư viện chung; không vẽ lại 4 họ FX này cho mỗi nhà.
- Cấp nhà 2/3 không mặc định đổi lính thành UnitId khác. Hình Lính Bộ mới không thay Kiếm Sĩ Thép `swordsman`.
- Concept nhà và sheet Lính Bộ đã tạo; chưa có L2/L3, chưa có tranh thẻ riêng, chưa final ở canvas native, chưa apply. Không đánh dấu bộ hoàn thành.

## 7. Ba bộ boss

Chỉ phe foe; không tự tạo cấp 2/3. Mỗi boss: bộ 20 frame mở rộng §6 + ảnh preview kỹ năng. Frame đặc thù dưới đây là ngân sách đề xuất, chưa gồm họ VFX dùng chung.

| Boss | Động tác bổ sung | Số frame bổ sung | Quân/đạn/FX liên kết |
|---|---|---:|---|
| `boss_bog_ogre` | Ném bùn 4; gọi ếch 4 | 8 → tổng 28 | mud, disable; `frog` là bộ quân riêng; bùn không chỉ là đá đổi màu |
| `boss_hornet_queen` | Gọi đàn 4; đáp 4; idle đất 2; cất cánh 4 | 14 → tổng 34 | stinger, summon; `hornet` riêng; bộ idle/move cơ bản là bay; khi hạ cánh không đánh |
| `boss_crownless_king` | Gọi bóng 4; dựng khiên 4; chuyển cuồng 4 | 12 → tổng 32 | mirror/summon, shield, rage; bóng dùng lại quân foe, không tạo một UnitId ảnh mới cho mỗi bóng |

Tổng tư thế boss theo đề xuất: **94** (28+34+32). VFX khiên vỡ/cuồng/bùn đã tính trong thư viện chung hoặc đạn; không cộng lần hai.
Boss 3 cần đọc được ba pha >66%, 33–66%, <33% HP; đề xuất overlay pha, chưa yêu cầu ba bộ sprite 48×48 hoàn chỉnh.

## 8. Đạn, vùng đánh và VFX

### 8.1 Thư viện 13 họ projectile — đề xuất hình, không đổi sát thương

| ID họ | Dùng cho | Canvas | Hướng × frame | Số frame |
|---|---|---|---|---:|
| arrow | Cung Thổ Phỉ, Cung Kỵ, Tháp Cung, chòi và Ngai dùng tên | 8×8 | 8×1 | 8 |
| seed | Bù Nhìn Gác | 4×4 | Không hướng ×1 | 1 |
| stone | Lính Ném Đá, tháp đá, Ngai Đá | 8×8 | Không hướng ×1 | 1 |
| crystal | Tháp Pha Lê | 8×8 | 8×1 | 8 |
| magic_orb | Học Đồ, Đại Pháp Sư, tháp phép, Tiên Rừng | 8×8 | Không hướng ×4 | 4 |
| ice_shard | Pháp Sư Băng | 8×8 | 8×1 | 8 |
| thorn | Ngai Cổ Thụ, Tháp Gai | 8×8 | 8×1 | 8 |
| cannonball | Pháo biển, pháo hơi nước, Ngai San Hô | 8×8 | Không hướng ×1 | 1 |
| hook | Lính Móc Câu | 8×8 | 8×1 | 8 |
| bullet | Lính Hỏa Mai | 4×4 | 8×1 | 8 |
| fireball | Ném Lửa, Ngai Đe Sắt | 8×8 | Không hướng ×4 | 4 |
| gear | Xạ Thủ/Tháp Bánh Răng, Ngai Đồng Hồ | 8×8 | Không hướng ×4 | 4 |
| shadow_orb | Ngai Trăng, Tháp Bóng Đêm | 8×8 | Không hướng ×4 | 4 |

Tổng **67 frame** cho 13 họ phía trên. Boss bổ sung `mud` 1 + `stinger` 8 = **9 frame**, nâng thư viện gồm boss thành **76 frame / 15 họ**. Đá Can Thiệp và bóng tính riêng: 2 frame tĩnh hiện hành.
Đạn đối xứng không có hướng không có nghĩa được phép rotate. Móc có dây vẽ Graphics từ tay đến đầu móc; lửa hình nón, sóng pulse, chain và xúc tu là VFX vùng/beam, không phải projectile tự bay.

### 8.2 Thư viện VFX dùng chung: 26 họ

Mỗi họ dự trù 4 frame = **104 frame mẫu** trước hướng; đây là ngân sách cơ sở, không bảo đảm đủ mọi orientation. Vệt có hướng cần atlas 8 hướng hoặc Graphics dựng hình, chốt trước sản xuất. FX vùng không ép vào 8×8: đề xuất 16×16 hoặc 32×32, vòng rộng dựng bằng Graphics theo radius gameplay.

| Họ | Vai trò | Canvas đề xuất |
|---|---|---|
| physical_hit, slash, dust, magic_hit | Trúng vật lý, vệt chém, va đá, trúng phép | 8×8 / 16×16 |
| explosion, splash, fire_cone, wave | Nổ, lan, phun lửa, pulse đẩy | 16×16 / 32×32 hoặc Graphics |
| chain, rope | Nảy phép, dây móc | Segment/Graphics, 4 nhịp biến thiên |
| heal, shield, slow, stun, burn, poison, disable | 7 trạng thái chiến đấu | 8×8 / 16×16; không che mặt quân |
| summon, soul, revive | Xuất hiện, thu Hồn, hồi sinh | 16×16 |
| place, upgrade, move, destroy | 4 thao tác công trình | 32×32 / Graphics |
| rage, reward | Cuồng nộ và vàng/thưởng/chinh phục | 16×16; icon tái dùng |

Không vẽ mỗi stack bùa thành một aura phủ toàn thân. Hiệu ứng lên dây, hút máu, charge, choáng, hồi máu tái dùng các họ trên. Bóng gương dùng shader/tint có kiểm soát hoặc bản foe, không cộng loại quân.
Impact mũi tên có thể dùng physical_hit, impact băng dùng magic_hit + slow. Chỉ tạo impact riêng nếu bản dùng chung khó đọc.

## 9. Map, ô, decor và nền

- 5 vật liệu: grass, flowers, path, sand, water; lưới pixel 16×16. Mask bốn góc có 16 tổ hợp; mask rỗng không cần ảnh. Một bộ đơn giản có tối đa 15 mask không rỗng/vật liệu, 75 frame trước biến thể. Đây là ngân sách họ mask, chưa xác nhận pipeline xuất atlas terrain.
- Đề xuất thêm 3 biến thể full grass, 3 flowers, 2 path, 2 sand; water full 4 frame (thay frame full tĩnh, thêm 3). Tổng dự trù nếu dùng toàn bộ mask: 75+10+3 = **88 frame**. Nếu animation cả bờ nước, phải tính thêm và kiểm từng mask.
- Không mặc định dùng bộ 47 tile: hiện là dual-grid và sân procedural theo seed. Test mọi mask, góc lõm/lồi, đường hẹp, ao và nhiều seed.
- 3 ô 32×32: open, locked, throne. Highlight hợp lệ/không hợp lệ, vùng đánh và chọn ô do UI/Graphics vẽ; không nhân các tile nền.
- Decor 20 mẫu đề xuất: 3 cây, 3 bụi, 3 đá, 6 hàng rào (ngang/dọc/4 góc), 1 cổng, 1 xe lúa, 1 thùng, 1 đống rơm, 1 biển. Cây 16×24/32×40; đồ nhỏ 16×16; neo chân và y-sort. Chuyển động lá không bắt buộc ở gói đầu.
- Nền menu: 1 trời + 3 lớp xa/trung/gần nếu xuất ảnh; không đếm mỗi màn UI là một background mới. Logo 1; tranh thắng/thua 2 là tùy chọn. Kích thước nền chốt theo layout.

### 9.1 Tường núi sau lưng lâu đài (góc nhìn xéo)

Thiết kế: [spec 26/10/2026](superpowers/specs/2026-10-26-oblique-view-mountain-wall-design.md). Phía bắc (sau lưng lâu đài) là vách núi liền, địch không vào từ đây; địch chỉ tiến từ phía trước.

- **Vai trò:** vật cản cứng chạy hết chiều ngang bản đồ ở mép trên, đồng thời là nền sau. Không có cổng, không có đường mòn xuyên qua.
- **Kích thước: không giới hạn.** Không bị ràng buộc 32×32/64×64 hay trần 4096: được vẽ **dài và cao tùy ý** (ví dụ bề ngang cả bản đồ 768 px ảnh trở lên, cao 128–256 px ảnh, kể cả phần cao trội lên khỏi mép logic). Ràng buộc duy nhất là hợp đồng kỹ thuật §3 (không giới hạn màu, alpha 0/255, không anti-aliasing, 2 px ảnh = 1 đơn vị thế giới) và giới hạn thực tế của GPU: ảnh quá lớn thì cắt thành các đoạn ngang, đặt cạnh nhau.
- **Nhìn xéo:** thấy mặt vách đá hướng về người chơi; chân vách phía dưới là đường tiếp xúc với đồng cỏ (đá vụn, rêu, bụi), đỉnh vách phía trên có thể có tuyết, thông, mỏm đá. Ánh sáng từ trên-trái.
- **Bộ bàn giao (đã chốt 26/10/2026):**

| Thành phần | Số lượng | Ghi chú |
|---|---:|---|
| Đoạn giữa, nền biển riêng mỗi vua | 9 | Một ảnh 1536×768 mỗi vua (có thác, cây trên đá, biển/trời theo chủ đề vua), thu nhỏ ×4 còn 384×192 px ảnh; cạnh trái/phải khớp để ghép liên tục |
| Dải chân núi | 3 | 1536×256 → 384×64, nền trong suốt, ghép ngang |
| Đầu nối trái / phải | 2 | 768×768 → 192×192, nền trong suốt, hạ dần ra phía ngoài |
| Lớp xa, thác, hang, cây, đá lăn | 0 | Đã bỏ (thác, cây và biển nằm sẵn trong ảnh đoạn giữa) |

- **Neo và độ sâu:** chân vách trùng với `BATTLE.wallY` (neo mép dưới); mọi sprite lính/nhà luôn vẽ **trước** tường (độ sâu thấp hơn là tường). Không xoay; lật ngang được cho đoạn giữa.
- **Quy trình duyệt:** như các batch trước. Codex tạo từng ảnh (một lần một ảnh), người dùng duyệt, rồi cắt/ghép và đăng ký vào `tools/asset-admin/manifest.json`; mục chưa có nằm trong `planned.json` (danh mục `terrain`, nhóm `mountain_wall`).
- **Nghiệm thu:** ghép liên tục 3 đoạn bất kỳ không lộ đường nối; chạy ở zoom 1 và 2 không méo pixel; không có điểm trong suốt giữa chân tường và cỏ.

## 10. UI, icon và phát hành

- Giữ 14 frame khung hiện hành và 2 trang trí theo ART_STYLE; panel/card/button là 9-slice. Không gen nguyên ảnh chứa chữ cho từng màn.
- 7 icon hiện hành: troop, tower, tome, throne, crown, boulder, skull.
- 37 icon bổ sung đề xuất: economy, support, enchantment; gold, life, level, enchant_stack, soul; shield, poison, burn, slow, stun, revive, flying, cooldown, disabled; attack, armor, speed, range, heal; lock, unlock, reroll, move, upgrade, sacrifice, quest, decree, conquest, save, pause, sound, music, settings, difficulty.
- Tổng 44 icon UI + 9 huy hiệu vua. Glyph chỉ báo cấp I–V do chữ/UI dựng, không nhân thành icon cho từng nhà.
- 27 perk, 18 sắc lệnh, 13 nhiệm vụ: 58 mục nội dung. Dùng icon chung trước; nếu chọn 1 icon riêng/mục thì thêm 58 thiết kế, chưa nằm trong 44 icon.
- Màn chọn vua dùng 9 chân dung; trạng thái khóa/chọn là overlay dùng chung. Bộ bài, thám báo, hội đồng, phần thưởng tái dùng tranh và panel.
- Font cần tiếng Việt; 1 family đủ bộ glyph là deliverable riêng, không chỉ ảnh chữ mẫu.
- Phát hành: 1 thiết kế app icon, xuất kích thước theo kênh; favicon, maskable và screenshot desktop/mobile kiểm riêng. Chưa chốt store nên không ghi số ảnh quảng bá cố định.
- Âm thanh ngoài số lượng hình: lập bảng riêng sau; không gán âm thanh là đã có khi chỉ mới có animation.

## 11. Hiện trạng các bộ đã tạo trong chat

| Bộ | Đã có | Còn thiếu / trạng thái |
|---|---|---|
| Nhà Dân Quân + militia | Đã áp dụng bộ `ai-v1`: lính giáo 6 pose × 2 phe (khoảng 24×32 px ảnh), nhà tranh 64 px rộng, 3 ô cỏ 32×32; chạy trong game ở mật độ 2 px/đơn vị | Chờ người dùng duyệt trong game; chưa có L2/L3, tranh thẻ riêng, animation mở rộng, hit/death/spawn |
| Trại Lính | Concept nhà đơn nền trong suốt | Chưa native/final; chưa L2/L3, tranh thẻ; chưa apply |
| Lính Bộ footman | Sheet nguồn 6 pose đứng/đi/đánh | Chưa cắt/căn frame/native/đổi phe/QA; chưa apply |

Nguồn Trại Lính: `C:/Users/thach/.codex/generated_images/01a16eab-0fd1-7d42-ac89-eb6759526587/exec-2fb9b2c5-becf-4cd4-bb8e-08a88695fe75.png`.
Nguồn Lính Bộ: `C:/Users/thach/.codex/generated_images/01a16eab-0fd1-7d42-ac89-eb6759526587/exec-45b85482-fcba-42fd-bfe5-4d3efae6b898.png`.
Hai đường dẫn trên là provenance trên máy hiện tại, không phải dependency runtime. Không đánh dấu cả bộ Ready dựa trên concept độ phân giải cao.

## 12. Phiếu bàn giao và nghiệm thu từng asset

Mỗi batch ghi đủ:

1. Batch ID/version, CardId/UnitId, bộ B-* và mốc nội dung; trạng thái riêng cho từng phần.
2. L1/L2/L3 cần tạo; cấp 4/5 tái dùng mẫu nào; có/không animation hoạt động/hư hại.
3. Animation theo trạng thái, số frame, fps, hướng, phe; event release/contact, origin và canvas cố định.
4. Quân được nhà sinh ra; đạn và VFX tham chiếu bằng ID dùng chung; ghi rõ “không đạn” với cận chiến.
5. PNG nguồn bất biến, PNG native, spritesheet/JSON atlas, metadata điểm bắn/neo/frame, prompt và provenance; file layer nếu có.
6. Preview 1× và zoom nguyên, loop animation, cảnh nền sáng/tối, desktop/mobile khi được yêu cầu tích hợp.
7. QA palette/alpha/kích thước/tên frame; không cắt vũ khí, chân không trượt; đạn xuất phát đúng điểm và impact đúng mục tiêu.
8. Liệt kê phần chưa được renderer hỗ trợ, phần thiếu và người duyệt; không tự chuyển accepted.

Tên frame hiện hành: `building_<CardId>`, `card_art_<CardId>`, `unit_<UnitId>_<team>_<anim><n>`, `fx_<id>`. Đề xuất level/direction/hit/death/spawn cần hợp đồng mở rộng trước khi nhập.

## 13. Thứ tự sản xuất

1. Hoàn thiện bộ Trại Lính: nhà + footman + L2/L3 + tranh, xuất preview; chưa apply theo yêu cầu hiện tại.
2. Hoàn thiện bộ Dân Quân và Ngai Lúa Mì; dùng làm mẫu chuẩn về scale/palette.
3. Thợ Gặt, Bù Nhìn, Tháp Cung và Thổ Phỉ G1; đạn/FX dùng chung làm cùng nguồn đầu tiên cần chúng.
4. Trung lập/Lúa Mì G2, Đá Núi, Phép Thuật; bổ sung heal/shield/status/chain.
5. Boss và quân triệu hồi, rồi các phe G4 theo danh mục; không tạo ảnh toàn bộ cùng lúc trước khi duyệt mẫu.

Tài liệu được tạo từ inventory và spec bằng `python tools/build_asset_requirements.py`. Nếu thay nội dung game, cập nhật nguồn trước và chạy lại; các con số đề xuất trong script phải sửa có chủ đích. Đếm số asset thiết kế, số frame xuất và số file là ba chỉ số riêng.
