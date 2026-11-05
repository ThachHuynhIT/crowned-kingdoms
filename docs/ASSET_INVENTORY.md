# Crowned Kingdoms — Danh mục và yêu cầu sản xuất asset

Chi tiết giao sản xuất theo từng ID, cấp 1–5, bộ nhà–quân–đạn, animation và số lượng: [ASSET_REQUIREMENTS.md](ASSET_REQUIREMENTS.md) (25/10/2026). Các số “hiện có” bên dưới là ảnh chụp kiểm kê ngày 21/10, không thay cho tiến độ mới ở tài liệu chi tiết.

Ngày kiểm kê: **21/10/2026**. Phạm vi: hình ảnh, sprite, animation, UI, icon, font và ghi chú âm thanh. Đây là tài liệu làm việc trong repository, không phải sổ xác nhận asset đã được duyệt.

## 1. Nguồn chuẩn và cách đọc

- Gameplay và danh sách nội dung: [spec tổng](superpowers/specs/2026-10-16-crowned-kingdoms-design.md), đặc biệt §6–7, §10–11.
- Quy chuẩn hình: [ART_STYLE.md](ART_STYLE.md).
- Quyền sử dụng: [ASSET_LICENSES.md](ASSET_LICENSES.md).
- Đăng ký asset đã nhận: [ASSET_MANIFEST.md](ASSET_MANIFEST.md), [assets.manifest.yml](assets.manifest.yml), [credits](../CREDITS.md).
- Hiện trạng runtime: `src/render/atlas.ts`, các module `*Art.ts`, `src/scenes/PreloadScene.ts`, `src/data/kings/wheat.ts`, `src/data/neutral.ts`, `src/data/raiders.ts`.

Trạng thái **P — placeholder**: có frame sinh bằng code, chưa duyệt mỹ thuật cuối. **M — missing**: chưa có asset tương ứng trong runtime. **C — concept**: chỉ có thiết kế tham khảo. **R — ready**: đã qua nghiệm thu và tích hợp; chưa xác nhận asset hình nào ở mức này trong đợt kiểm kê.

Các brief mỹ thuật và ưu tiên trong tài liệu là đề xuất sản xuất, không thay thế gameplay spec. Mốc G là mốc nội dung, khác mức ưu tiên art. Một frame có tên riêng không có nghĩa là một thiết kế hình riêng.

## 2. Tổng quan số lượng

| Hạng mục | Nhu cầu theo spec | Hiện có | Chưa có |
|---|---:|---:|---:|
| Chân dung vua | 9 | 0 | 9 |
| Công trình thường | 65 | 5 P | 60 |
| Ngai | 9 | 1 P | 8 |
| Tranh thẻ gồm Ngai | 102 | 8 P | 94 |
| Quân thường và triệu hồi | 42 loại | 7 loại P | 35 loại |
| Boss | 3 | 0 | 3 |
| Khung UI dùng chung | 14 frame hiện hành | 14 P | Các khung/chức năng mở rộng chưa chốt số |
| Trang trí UI atlas | 2 | 2 P | Chưa chốt số mở rộng |
| Icon atlas | 7 hiện hành | 7 P | Icon mở rộng chưa chốt số |
| VFX atlas | 11 hiện hành | 11 P | VFX mở rộng chưa chốt số |

Cách tính: 9 vua × (9 thẻ + 1 Ngai) + 12 thẻ trung lập = 102 tranh. Trong 93 thẻ không phải Ngai có 65 thẻ đặt công trình, 28 thẻ bùa/sách. Quân gồm 40 loại trong các bảng §6 và 2 quân boss triệu hồi (`frog`, `hornet`); 3 boss tính riêng. Không cộng các nhóm trên thành tổng file: tranh và sprite là hai sản phẩm khác nhau, animation và atlas có thể đóng gói chung.

7 loại quân hiện tại × 2 phe × 3 animation × 2 frame = **84 frame quân**. Atlas `sprites` hiện sinh **119 frame** = 84 quân + 6 công trình/Ngai + 8 tranh + 3 ô + 7 icon + 11 FX. Atlas `ui` sinh **16 frame** = 14 khung + 2 trang trí. Sân theo seed và nền menu nằm ngoài phép đếm này. Đây là phép đếm từ đường dựng atlas, không phải số PNG có sẵn.

## 3. Quy chuẩn chung khi sản xuất

| Loại | Canvas gốc | Yêu cầu |
|---|---|---|
| Terrain | 16×16 | Tương thích dual-grid; kiểm tra mép nối và mask |
| Ô bàn cờ | 32×32 | Phân biệt open / locked / throne |
| Công trình | 32×40 | Chân ở mép dưới; phần cao tràn lên phía Bắc |
| Ngai | 32×48 | Nhận diện rõ khi nhiều lính che phía trước |
| Quân nhỏ | 16×16 | Đầu khoảng 40% chiều cao |
| Quân cao | 16×24 | Vũ khí dài/pháp sư; không cắt đầu vũ khí |
| Quân lớn | 24×24 hoặc 24×32 | Chốt từng loại trước khi vẽ final |
| Boss | 48×48 | Silhouette rõ ở zoom thật |
| Đạn/FX nhỏ | 4×4–8×8 | Riêng mũi tên cần 8 hướng vẽ sẵn |
| Đá Can Thiệp | 16×16 | Bóng riêng 24×8 |
| Tranh thẻ | 32×24 | Không chữ, điểm nhấn rõ ở kích thước nhỏ |
| Chân dung vua | 32×32 | Cùng bố cục, ánh sáng và tỷ lệ khuôn mặt |
| Icon | 16×16 | Đọc được trên nền kem |

- Từ 23/10/2026 (G3e) màu thế giới và UI **không còn bị khoá** vào Hearth 32 / `UI_PALETTE` (các export cũ giữ để tương thích); kích thước theo metadata, mật độ chuẩn 2 pixel ảnh/đơn vị thế giới. Xem `ART_STYLE.md`.
- Ánh sáng trên-trái; viền nâu/mận ấm; không đen thuần, anti-aliasing hoặc gradient mượt.
- Neo chân `(0.5, 1)`, y-sort, nearest-neighbour, zoom nguyên. Không xoay sprite; cho phép lật ngang.
- Cùng góc nhìn top-down của runtime. Không mặc định dùng isometric chỉ vì ví dụ manifest có `iso_2_1`; ví dụ đó không xác định projection của asset mới.
- Tạo chi tiết bằng silhouette, cụm màu và vật liệu; không thu nhỏ trực tiếp concept độ phân giải cao rồi coi là pixel art hoàn thiện.
- Độ tương phản nền thấp hơn quân. Mật độ chi tiết 1 px trên tile mục tiêu ≤10%; code terrain hiện tại dùng speck 12–18%, cần xem lại khi nâng art.
- Màu nhận diện phe phải còn đọc được; runtime hiện dùng vải theo loại quân, viền địch đỏ sẫm và pixel cờ đỏ. Concept xanh–vàng không tự động thay palette phe hiện hành.

## 4. Tài sản đã có và giới hạn

### 4.1 Quân G1

| UnitId | Tên | Canvas | Trạng thái | Hướng nâng art đề xuất |
|---|---|---|---|---|
| militia | Dân Quân | 16×16 | P | Trang phục nông dân, vũ khí đơn giản, dấu hiệu lúa |
| reaper | Thợ Gặt | 16×24 | P | Lưỡi hái lớn, tư thế quét ngang khác Dân Quân |
| footman | Lính Bộ | 16×16 | P | Mũ/giáp và khiên, silhouette lính chính quy |
| bandit | Thổ Phỉ | 16×16 | P | Áo vá, khăn che mặt, vũ khí thô |
| bandit_archer | Cung Thủ Phỉ | 16×16 | P | Cung và bao tên rõ ở 1× |
| boar_rider | Kỵ Lợn Rừng | 24×24 | P | Tách rõ lợn, ngà, người cưỡi; nhịp chân thú |
| ogre | Gã Hộ Pháp | 24×32 | P | Thân nặng, tay lớn, chùy; tránh chỉ phóng to người |

Hiện tất cả dùng `paintUnit` dựa trên kích thước/tag; animation chỉ dịch thân và vũ khí rất đơn giản. Mỗi loại cần idle0/1, walk0/1, attack0/1 cho ally và foe. Hit/death/spawn là mở rộng tương lai, chưa được `UnitAnim` hiện hành hỗ trợ.

### 4.2 Công trình và tranh G1

| CardId | Tên | Sprite bàn cờ | Tranh thẻ | Ghi chú |
|---|---|---|---|---|
| wheat_throne | Ngai Bó Lúa | P, 32×48 | P, 32×24 | Ngai vàng chung, chưa có bó lúa riêng |
| wheat_militia | Dân Quân | P, 32×40 | P | Mẫu nhà mái màu wheat |
| wheat_reapers | Đội Thợ Gặt | P, 32×40 | P | Trùng mẫu/màu với nhà Dân Quân |
| wheat_scarecrow | Bù Nhìn Gác | P, 32×40 | P | Đang dùng tháp đá, chưa ra hình bù nhìn |
| neutral_barracks | Trại Lính | P, 32×40 | P | Mẫu nhà mái xanh |
| neutral_archer_tower | Tháp Cung | P, 32×40 | P | Mẫu tháp đá mái xanh |
| neutral_clear_land | Khai Hoang | Không cần | P | Tranh sách chung |
| neutral_move | Dời Nhà | Không cần | P | Trùng tranh sách Khai Hoang |

Tranh hiện crop công trình hoặc vẽ sách chung. 8 frame tranh tương ứng chỉ khoảng 5 mẫu hình khác nhau; không tính là 8 minh họa độc lập.

### 4.3 Terrain, ô và nền

- `grass`, `flowers`, `path`, `sand`, `water`: P; sinh sân 384×384 theo seed, không phải PNG tileset đã xuất. Mask 4 góc có 16 tổ hợp khả dĩ; không nhân thành số asset final cố định vì code còn biến thiên theo seed.
- `plot_open`, `plot_locked`, `plot_throne`: P. Ô khóa hiện nền đá có dấu X; khác brief cỏ rậm + cọc rào + biển giá, cần sửa hình khi polish.
- Menu: trời 4 dải màu và 3 lớp đồi/cây parallax; đom đóm. Có nền chức năng nhưng chưa có minh họa vương quốc chi tiết.
- Cây, bụi, hàng rào, đá và đồ nông trại độc lập: M; cây silhouette trong menu không phải sprite cây đặt trên sân.

### 4.4 UI, icon và FX hiện hành

| Frame UI | Canvas | Slice | Trạng thái |
|---|---|---:|---|
| panel | 24×24 | 8 | P |
| button / buttonHover / buttonDown / buttonActive | 16×16 | 5 | P, 4 trạng thái |
| slot / slotHover / slotSelected | 18×18 | 4 | P, 3 trạng thái |
| tooltip | 12×12 | 4 | P |
| bar | 8×6 | 2 | P |
| card / cardUncommon / cardRare / cardSelected | 24×32 | 8 | P, 4 trạng thái |

Trang trí: `clockDial` 28×28 (đã sinh, không suy ra đang dùng ở mọi màn), `firefly` 3×3.

Icon 16×16: `icon_troop`, `icon_tower`, `icon_tome`, `icon_throne`, `icon_crown`, `icon_boulder`, `icon_skull`.

FX: `fx_arrow_e/ne/n/nw/w/sw/s/se` 8×8; `fx_boulder` 16×16; `fx_boulder_shadow` 24×8; `fx_spark` 4×4. Vòng lan khi đá va chạm được vẽ bằng Graphics, đã có hiệu ứng nhưng không có frame ảnh riêng. Mọi projectile hiện dùng hình mũi tên, chưa phân loại hình theo damage type.

## 5. Concept đã tạo trong hội thoại

Một bảng concept tổng hợp, trạng thái C: Vua Lúa Mì, kiếm sĩ, cung thủ; nhà nông/ruộng, doanh trại, cối xay, đình Ngai; cảnh cây/đường/hàng rào/đá/xe lúa; icon vương miện, bó lúa, vàng, tim, kiếm, pha lê.

Bản gốc nằm ở `C:/Users/thach/.codex/generated_images/01a15d80-ecf4-7233-b0e7-8cf33990b8ac/exec-aac97e9e-e227-46bd-9fcb-7da02a8294f5.png`, chưa sao chép vào repo. Đây là đường dẫn máy hiện tại, không phải dependency của game. Chưa tách nền, chưa remap Hearth 32, chưa đúng canvas runtime, chưa có animation. Kiếm sĩ/cung thủ concept chưa được xác nhận là một UnitId cụ thể. Không ghi các thành phần trong bảng concept là asset Ready.

## 6. Danh mục đầy đủ theo spec

Các bảng dưới trích ID, tên và phân loại từ §6 của spec tại ngày kiểm kê. Mỗi thẻ cần `card_art_<CardId>` 32×24. Thẻ lính/tháp/kinh tế/hỗ trợ còn cần `building_<CardId>` 32×40; bùa/sách không cần sprite công trình riêng. Các Ngai liệt kê riêng. Trạng thái chỉ phản ánh hình, không xác nhận gameplay đã triển khai.

### 6.1 Chín vua và Ngai

Mỗi vua cần chân dung 32×32 (đều M), tranh Ngai 32×24 và sprite Ngai 32×48. Huy hiệu/cờ vua là đề xuất bổ sung để dùng lịch và thám báo; không nhất thiết cần một ảnh vua toàn thân trong trận.

| KingId | Vua | Ngai (CardId) | Trạng thái Ngai | Brief tạo hình đề xuất |
|---|---|---|---|---|
| wheat | Lúa Mì | wheat_throne | P | Bó lúa, gỗ nông trại, đá ấm, vàng mùa gặt |
| stone | Đá Núi | stone_throne | M | Đá khối, rune khắc, pha lê; thân vuông nặng |
| arcane | Phép Thuật | arcane_throne | M | Sách, rune, pha lê tím; đường cong thanh |
| grove | Rừng Xanh | grove_throne | M | Rễ cây, lá, hoa; hình hữu cơ |
| tide | Thuỷ Triều | tide_throne | M | Gỗ tàu, dây thừng, vỏ sò, sắc nước |
| forge | Lò Rèn | forge_throne | M | Đe, thép, than hồng; khối kim loại chắc |
| clock | Đồng Hồ | clock_throne | M | Bánh răng, đồng, dây cót; hình tròn cơ khí |
| moon | Ánh Trăng | moon_throne | M | Nguyệt thực, đá cổ, bóng mận; huyền bí nhưng cùng thế giới ấm |
| nomad | Du Mục | nomad_throne | M | Lều, thảm dệt, vàng cát, cờ thảo nguyên |

### 6.2 Thẻ và công trình theo phe

#### 6.1 Thẻ trung lập (`neutral`)

| CardId | Tên | Loại | Mốc | Tranh | Công trình |
|---|---|---|---|---|---|
| neutral_barracks | Trại Lính | lính | G1 | P | P |
| neutral_archer_tower | Tháp Cung | tháp | G1 | P | P |
| neutral_well | Giếng Làng | kinh tế | G2 | M | M |
| neutral_mercenary_camp | Trại Đánh Thuê | lính | G2 | M | M |
| neutral_sharpen | Bùa Sắc Bén | bùa (lính, tháp, Ngai) | G2 | M | — |
| neutral_fortify | Bùa Vững Chãi | bùa (lính, tháp, hỗ trợ, Ngai) | G2 | M | — |
| neutral_promote | Thăng Cấp | sách (`building`) | G2 | M | — |
| neutral_clear_land | Khai Hoang | sách (`lockedPlot`) | G1 | P | — |
| neutral_move | Dời Nhà | sách (`buildingThenPlot`) | G1 | P | — |
| neutral_demolish | Dỡ Bỏ | sách (`building`), tag `sacrifice` | G2 | M | — |
| neutral_duplicate | Nhân Bản | sách (`buildingThenPlot`) | G4 | M | — |
| neutral_royal_seal | Ấn Triện | sách (`none`) | G4 | M | — |

#### 6.2 Thổ Phỉ (quân trung lập, chỉ làm địch)

Không có thẻ/công trình riêng trong danh mục này; xem quân ở §6.3.

#### 6.3 Vua Lúa Mì (`wheat`) — kinh tế, ruộng buff lân cận, dân quân đông

| CardId | Tên | Loại | Mốc | Tranh | Công trình |
|---|---|---|---|---|---|
| wheat_militia | Dân Quân | lính | G1 | P | P |
| wheat_field | Ruộng Lúa | kinh tế, `farm` | G2 | M | M |
| wheat_scarecrow | Bù Nhìn Gác | tháp | G1 | P | P |
| wheat_fertilizer | Bùa Phân Bón | bùa (lính, kinh tế) | G2 | M | — |
| wheat_reapers | Đội Thợ Gặt | lính | G1 | P | P |
| wheat_windmill | Cối Xay Gió | kinh tế | G2 | M | M |
| wheat_harvest_festival | Lễ Hội Mùa Màng | sách (`none`) | G2 | M | — |
| wheat_granary | Kho Thóc | hỗ trợ | G2 | M | M |
| wheat_peasant_horde | Khởi Nghĩa Nông Dân | lính | G2 | M | M |

#### 6.4 Vua Đá Núi (`stone`) — tháp, người đá trâu bò

| CardId | Tên | Loại | Mốc | Tranh | Công trình |
|---|---|---|---|---|---|
| stone_catapult | Tháp Ném Đá | tháp | G2 | M | M |
| stone_golem_forge | Xưởng Người Đá | lính, `golem` | G2 | M | M |
| stone_quarry | Mỏ Đá | kinh tế | G2 | M | M |
| stone_stoneskin | Bùa Da Đá | bùa (lính, tháp, hỗ trợ, Ngai) | G2 | M | — |
| stone_wall | Tường Thành | hỗ trợ | G2 | M | M |
| stone_crystal | Tháp Pha Lê | tháp | G2 | M | M |
| stone_miners | Đội Thợ Mỏ | lính | G2 | M | M |
| stone_rune_carving | Khắc Ấn Núi | sách (`none`) | G2 | M | — |
| stone_mountain_heart | Tim Núi | tháp | G2 | M | M |

#### 6.5 Vua Phép Thuật (`arcane`) — bùa, pháp sư

| CardId | Tên | Loại | Mốc | Tranh | Công trình |
|---|---|---|---|---|---|
| arcane_mage_tower | Tháp Pháp Sư | tháp, `mage` | G2 | M | M |
| arcane_apprentices | Học Viện | lính, `mage` | G2 | M | M |
| arcane_spark_rune | Bùa Tia Lửa | bùa (lính, tháp, Ngai) | G2 | M | — |
| arcane_haste_rune | Bùa Tốc Biến | bùa (lính, tháp, Ngai) | G2 | M | — |
| arcane_library | Thư Viện | hỗ trợ | G2 | M | M |
| arcane_frost_mages | Tháp Băng Sư | lính, `mage` | G2 | M | M |
| arcane_mirror | Gương Chép Bùa | sách (`buildingThenBuilding`) | G2 | M | — |
| arcane_ward | Vòng Kết Giới | hỗ trợ | G2 | M | M |
| arcane_archmage | Tháp Đại Pháp Sư | lính, `mage` | G2 | M | M |

#### 6.6 Vua Rừng Xanh (`grove`) — mạnh dần theo năm, thú rừng, hồi máu

| CardId | Tên | Loại | Mốc | Tranh | Công trình |
|---|---|---|---|---|---|
| grove_wolf_den | Hang Sói | lính, `grove` | G4 | M | M |
| grove_sapling | Cây Mầm | hỗ trợ, `grove` | G4 | M | M |
| grove_spring | Suối Hồi Sinh | hỗ trợ, `grove` | G4 | M | M |
| grove_deep_roots | Bùa Rễ Sâu | bùa (lính, tháp, hỗ trợ, Ngai) | G4 | M | — |
| grove_thorn_tower | Tháp Gai | tháp, `grove` | G4 | M | M |
| grove_bear_cave | Hang Gấu | lính, `grove` | G4 | M | M |
| grove_spring_rain | Mưa Xuân | sách (`none`) | G4 | M | — |
| grove_spirit_stags | Đàn Hươu Thần | lính, `grove` | G4 | M | M |
| grove_treant | Cổ Thụ Thức Tỉnh | lính, `grove` | G4 | M | M |

#### 6.7 Vua Thuỷ Triều (`tide`) — cướp biển, cướp vàng, đẩy lùi

| CardId | Tên | Loại | Mốc | Tranh | Công trình |
|---|---|---|---|---|---|
| tide_pirates | Thuyền Cướp Biển | lính, `pirate` | G4 | M | M |
| tide_cannon | Pháo Đài Biển | tháp | G4 | M | M |
| tide_harbor | Bến Cảng | kinh tế | G4 | M | M |
| tide_undertow_rune | Bùa Sóng Ngầm | bùa (lính, tháp, Ngai) | G4 | M | — |
| tide_wave_tower | Tháp Sóng | tháp | G4 | M | M |
| tide_treasure | Rương Châu Báu | kinh tế | G4 | M | M |
| tide_hookmen | Đội Móc Câu | lính, `pirate` | G4 | M | M |
| tide_privateers | Hợp Đồng Lính Đánh Thuê | sách (`none`) | G4 | M | — |
| tide_kraken | Vực Kraken | tháp | G4 | M | M |

#### 6.8 Vua Lò Rèn (`forge`) — rèn đúc, sát thương lửa

| CardId | Tên | Loại | Mốc | Tranh | Công trình |
|---|---|---|---|---|---|
| forge_swordsmen | Doanh Trại Kiếm Sĩ | lính | G4 | M | M |
| forge_flame_tower | Tháp Phun Lửa | tháp, `fire` | G4 | M | M |
| forge_smithy | Lò Rèn | hỗ trợ | G4 | M | M |
| forge_ember_rune | Bùa Than Hồng | bùa (lính, tháp, Ngai), `fire` | G4 | M | — |
| forge_master_hammer | Búa Thợ Cả | sách (`building`) | G4 | M | — |
| forge_bombardiers | Đội Ném Lửa | lính, `fire` | G4 | M | M |
| forge_blast_furnace | Lò Cao | kinh tế | G4 | M | M |
| forge_armory | Kho Giáp | hỗ trợ | G4 | M | M |
| forge_iron_drake | Tổ Rồng Sắt | lính, `fire` | G4 | M | M |

#### 6.9 Vua Đồng Hồ (`clock`) — máy móc, mạnh dần trong trận

| CardId | Tên | Loại | Mốc | Tranh | Công trình |
|---|---|---|---|---|---|
| clock_windup_soldiers | Xưởng Lính Thiếc | lính, `clockwork` | G4 | M | M |
| clock_gear_tower | Tháp Bánh Răng | tháp, `clockwork` | G4 | M | M |
| clock_spring_workshop | Xưởng Lò Xo | kinh tế | G4 | M | M |
| clock_tick_rune | Bùa Tích Tắc | bùa (lính, tháp, Ngai) | G4 | M | — |
| clock_bell_tower | Tháp Chuông | hỗ trợ, `clockwork` | G4 | M | M |
| clock_spiders | Ổ Nhện Cơ Khí | lính, `clockwork` | G4 | M | M |
| clock_rewind | Tua Ngược | sách (`building`) | G4 | M | — |
| clock_steam_cannon | Pháo Hơi Nước | tháp, `clockwork` | G4 | M | M |
| clock_colossus | Lò Khổng Lồ Đồng | lính, `clockwork` | G4 | M | M |

#### 6.10 Vua Ánh Trăng (`moon`) — hiến tế, triệu hồi, rủi ro cao

| CardId | Tên | Loại | Mốc | Tranh | Công trình |
|---|---|---|---|---|---|
| moon_crypt | Hầm Mộ | lính, `undead` | G4 | M | M |
| moon_shadow_spire | Tháp Bóng Đêm | tháp, `undead` | G4 | M | M |
| moon_blood_pact | Khế Ước Máu | sách (`building`), `sacrifice` | G4 | M | — |
| moon_blood_moon_rune | Bùa Trăng Máu | bùa (lính, tháp, Ngai) | G4 | M | — |
| moon_altar | Đàn Tế | hỗ trợ, `undead` | G4 | M | M |
| moon_vampires | Lâu Đài Ma Cà Rồng | lính, `undead` | G4 | M | M |
| moon_summoning_circle | Vòng Triệu Hồi | hỗ trợ, `undead` | G4 | M | M |
| moon_eclipse_pact | Giao Ước Nguyệt Thực | sách (`building`) | G4 | M | — |
| moon_reaper_shrine | Điện Thần Chết | lính, `undead` | G4 | M | M |

#### 6.11 Vua Du Mục (`nomad`) — dời công trình, kỵ binh

| CardId | Tên | Loại | Mốc | Tranh | Công trình |
|---|---|---|---|---|---|
| nomad_riders | Trại Kỵ Binh | lính, `cavalry` | G4 | M | M |
| nomad_horse_archers | Trại Cung Kỵ | lính, `cavalry` | G4 | M | M |
| nomad_stables | Chuồng Ngựa | hỗ trợ | G4 | M | M |
| nomad_relocate | Nhổ Trại | sách (`buildingThenPlot`) | G4 | M | — |
| nomad_bazaar | Chợ Phiên | kinh tế | G4 | M | M |
| nomad_wind_rune | Bùa Gió Thảo Nguyên | bùa (lính, tháp) | G4 | M | — |
| nomad_watchtower | Chòi Canh Thảo Nguyên | tháp | G4 | M | M |
| nomad_caravan | Đoàn Lữ Hành | kinh tế | G4 | M | M |
| nomad_khan_guard | Ngự Lâm Thiết Kỵ | lính, `cavalry` | G4 | M | M |

### 6.3 Toàn bộ quân

Canvas của 7 quân G1 đã chốt ở §4.1. Các quân M dùng nhóm kích thước tại §3; kích thước cụ thể từng loại còn cần chốt trong dữ liệu trước khi sản xuất final, không suy ra từ bán kính va chạm.

| UnitId | Tên | Tag trong spec | Trạng thái |
|---|---|---|---|
| footman | Lính Bộ | melee, human | P |
| mercenary | Lính Đánh Thuê | melee, human | M |
| bandit | Thổ Phỉ | melee, human | P |
| bandit_archer | Cung Thủ Phỉ | ranged, human | P |
| boar_rider | Kỵ Lợn Rừng | melee, cavalry | P |
| ogre | Gã Hộ Pháp | melee, siege | P |
| militia | Dân Quân | melee, human | P |
| reaper | Thợ Gặt | melee, human | P |
| peasant | Nông Binh | melee, human | M |
| golem | Người Đá | melee, golem | M |
| miner | Thợ Mỏ | melee, human | M |
| rubble | Đá Vụn | melee, golem, summon | M |
| slinger | Lính Ném Đá | ranged, human | M |
| apprentice | Học Đồ | ranged, mage | M |
| frost_mage | Pháp Sư Băng | ranged, mage | M |
| archmage | Đại Pháp Sư | ranged, mage | M |
| construct | Hộ Vệ Phù Chú | melee, construct | M |
| wolf | Sói | melee, beast | M |
| bear | Gấu Rừng | melee, beast | M |
| stag | Hươu Thần | melee, beast | M |
| treant | Cổ Thụ | melee | M |
| dryad | Tiên Rừng | ranged | M |
| pirate | Cướp Biển | melee, pirate | M |
| hookman | Lính Móc Câu | ranged, pirate | M |
| musketeer | Lính Hoả Mai | ranged, pirate | M |
| swordsman | Kiếm Sĩ Thép | melee, human | M |
| bombardier | Lính Ném Lửa | ranged, human | M |
| iron_drake | Rồng Sắt | ranged, flying | M |
| shieldbearer | Lính Khiên | melee, human | M |
| tin_soldier | Lính Thiếc | melee, clockwork | M |
| spider | Nhện Cơ Khí | melee, clockwork | M |
| colossus | Khổng Lồ Đồng | melee, clockwork | M |
| gear_gunner | Xạ Thủ Bánh Răng | ranged, clockwork | M |
| skeleton | Bộ Xương | melee, undead | M |
| wraith | Bóng Ma | melee, undead | M |
| vampire | Ma Cà Rồng | melee, undead | M |
| moon_reaper | Thần Chết Trăng | melee, undead | M |
| rider | Kỵ Binh | melee, cavalry | M |
| horse_archer | Cung Kỵ | ranged, cavalry | M |
| khan_guard | Thiết Kỵ | melee, cavalry | M |
| frog | Ếch Đầm | melee, summon | M |
| hornet | Ong Bắp Cày | melee, flying, summon | M |

### 6.4 Boss

| BossId | Tên | Canvas | Trạng thái | Hình và FX cần thiết |
|---|---|---|---|---|
| boss_bog_ogre | Ông Kẹ Đầm Lầy | 48×48 | M | Thân nặng phủ bùn/rêu; đánh quét, ném bùn, gọi Ếch Đầm |
| boss_hornet_queen | Nữ Hoàng Ong Bắp Cày | 48×48 | M | Bụng ong, cánh rõ; bay, bắn, hạ cánh, gọi đàn ong |
| boss_crownless_king | Vua Không Ngai | 48×48 | M | Vương miện vỡ; đánh quét, bóng gương, khiên Ngai Vỡ, Cuồng Vương |

Tối thiểu có idle/walk/attack; animation kỹ năng đặc thù là đề xuất cần gắn trigger render riêng. Boss nữ hoàng cần hình phân biệt bay/hạ cánh; bóng gương ưu tiên tái dùng quân có xử lý màu/FX. Không tự nhân thêm 2 phe cho boss chỉ để tăng frame count.

## 7. Brief hình ảnh theo loại

- Công trình lính: thể hiện nơi sinh quân và vũ khí đặc trưng; phân biệt trại Dân Quân, Thợ Gặt, Trại Lính ngay khi bỏ màu. Không bắt buộc vẽ lính tí hon trước cửa nếu làm rối.
- Tháp: điểm bắn và vật liệu phải đọc được; Bù Nhìn Gác phải ra silhouette bù nhìn, không dùng lại tháp đá. Tháp lửa/băng/phép/đá/cơ khí cần đầu tháp riêng.
- Kinh tế: thể hiện nguồn thu (ruộng, giếng, mỏ, bến cảng, lò, chợ); chỉ thêm animation sản xuất sau khi static đã được duyệt.
- Hỗ trợ: nhận diện qua vật thể trung tâm (sách, đe, chuồng, đàn tế, chuông, nguồn nước), không yêu cầu aura luôn bật nếu che lính.
- Tranh thẻ: một chủ thể chính, nền ít chi tiết; bùa và sách cần biểu tượng hành động khác nhau. Khai Hoang dùng đất/công cụ, Dời Nhà dùng nhà và mũi tên; không để cả hai chỉ là sách giống nhau.
- Công trình cấp 1–5: chưa có hợp đồng frame theo cấp. Trước mắt một sprite nền + chỉ báo cấp; biến thể kiến trúc nâng cấp là tùy chọn, không tính thành yêu cầu 5×74 ảnh.
- Quân: phân biệt role bằng dáng, vũ khí và nhịp đánh. Giữ vị trí chân và silhouette ổn định giữa frame để tránh rung.

## 8. Icon và nội dung hỗ trợ còn thiếu

| Nhóm | Phạm vi | Mức bắt buộc |
|---|---|---|
| Loại thẻ | Kinh tế, hỗ trợ, bùa | Cần khi loại thẻ được triển khai |
| Tài nguyên | Vàng, mạng, cấp, stack bùa, Hồn | Cần biểu diễn; có thể dùng chữ/Graphics trước |
| Trạng thái | Khiên, độc, bỏng, chậm, choáng, bất tử/hồi sinh, bay, hồi chiêu | Ưu tiên trạng thái ảnh hưởng quyết định chiến đấu |
| 9 cờ hiệu vua | Hình nhận diện phe/đặc tính thám báo | Có thể tái dùng huy hiệu vua và icon status |
| 27 perk | 3 perk × 9 vua | Có thể dùng icon chung theo hiệu ứng, không mặc định 27 tranh |
| 18 sắc lệnh | Theo danh sách dưới | Cần UI nội dung; tranh riêng là tùy chọn |
| 13 nhiệm vụ | Theo danh sách dưới | Cần nhận diện trạng thái/tiến độ; tranh riêng là tùy chọn |

- `decree_harvest_tax` — Thuế Mùa Màng
- `decree_expand_borders` — Mở Rộng Bờ Cõi
- `decree_mobilize` — Tổng Động Viên
- `decree_recast_crown` — Đúc Lại Vương Miện
- `decree_royal_armory` — Kho Vũ Khí Hoàng Gia
- `decree_new_armor` — Áo Giáp Mới
- `decree_royal_archers` — Cung Thủ Hoàng Gia
- `decree_merchant_guild` — Phường Hội Thương Nhân
- `decree_fourth_hand` — Bàn Tay Thứ Tư
- `decree_bigger_boulder` — Đá Tảng Lớn
- `decree_quick_reflex` — Phản Xạ Nhanh
- `decree_amnesty` — Lệnh Ân Xá
- `decree_treasury` — Ngân Khố
- `decree_academy` — Học Viện Hoàng Gia
- `decree_purge` — Thanh Lọc
- `decree_trade` — Giao Thương
- `decree_rune_festival` — Lễ Hội Phù Chú
- `decree_moat` — Hào Nước
- `quest_untouched` — Ngai Vô Sự
- `quest_three_barracks` — Ba Doanh Trại
- `quest_no_reroll` — Tiết Kiệm
- `quest_slaughter` — Đại Thắng
- `quest_double_rune` — Bùa Chồng Bùa
- `quest_land_grab` — Khai Phá
- `quest_master_builder` — Thợ Cả
- `quest_blitz` — Chớp Nhoáng
- `quest_hoard` — Kho Đầy
- `quest_no_help` — Tự Lực
- `quest_offering` — Lễ Vật
- `quest_diversity` — Trăm Nghề
- `quest_wager` — Đặt Cược

## 9. VFX cần bổ sung

Các mục sau là nhóm hình cần thể hiện theo hiệu ứng gameplay, chưa phải tên frame được code hỗ trợ. Không đặt tên mới trong atlas rồi mặc định renderer sẽ tự dùng.

| Nhóm | Hình cần sản xuất | Tái dùng/triển khai |
|---|---|---|
| Đòn vật lý | Vệt chém, đá ném, đạn pháo, đạn súng, móc câu | Mũi tên hiện có dùng cho cung; móc cần hướng và dây |
| Phép và nguyên tố | Tia phép, tia liên kết/nảy, băng, lửa, độc/gai | Tách projectile và impact; ưu tiên 4×4–8×8 cho hạt nhỏ |
| Vùng tác động | Sóng đẩy, vòng pulse, lửa hình nón, vụ nổ | Graphics hoặc chuỗi frame tùy readability; canvas theo vùng tác động, không ép 8×8 |
| Buff/debuff | Hồi máu, khiên, chậm, choáng, bỏng, độc, vô hiệu tháp | Hạn chế hiệu ứng lặp phủ kín đơn vị |
| Triệu hồi | Xuất hiện, hồi sinh, thu Hồn, vòng triệu hồi | Tách hiệu ứng khỏi sprite quân; không xoay texture |
| Công trình | Đặt, lên cấp, gắn bùa, dời, hiến tế, phá hủy | Có thể bắt đầu bằng tween và hạt dùng lại |
| Boss | Bùn, đàn ong, bóng gương, khiên vỡ, cuồng nộ | Gắn với trạng thái/kỹ năng boss |
| Phần thưởng | Vàng, mở khóa, chiến thắng, chinh phục | Tái dùng icon; tránh bắt buộc tranh nền riêng |
| Can Thiệp | Bụi, mảnh đá, vòng cảnh báo và impact rõ hơn | Đá/bóng/spark/vòng impact hiện đã có nền chức năng |

## 10. UI, nền và sản phẩm phát hành

| Màn/nhóm | Hiện trạng | Việc art còn lại |
|---|---|---|
| Menu chính | Nền procedural, chữ tiêu đề, khung dùng chung | Logo đồ họa, minh họa vương quốc nếu chọn thay nền |
| Chọn vua | Chưa có scene G2 | 9 chân dung, dấu khóa/chọn, nhận diện perk |
| Lập kế hoạch | Có G1 | Icon kinh tế/bùa/cấp; chỉ báo ô hợp lệ, nâng cấp, mở khóa |
| Trận | Có G1 | Art nút Can Thiệp riêng; status và FX rõ hơn |
| Thưởng | Có nền UI G1 | Tranh riêng từng thẻ, polish highlight/rarity |
| Bộ bài, thám báo, lịch đầy đủ | Chưa đủ phạm vi thiết kế cuối | Tái dùng panel/card/icon; bổ sung huy hiệu và trạng thái |
| Hội đồng, nhiệm vụ, chinh phục | Chưa có đủ hệ thống G3 | Icon, trạng thái, điểm nhấn; không cần vẽ panel mới cho mọi màn |
| Kết thúc ván | Có G1 | Minh họa thắng/thua tùy chọn, biểu tượng điểm thưởng |
| Meta/Vương Miện và cài đặt | Chưa có phạm vi đầy đủ | Khóa/mở, độ khó, âm lượng, tốc độ, bật/tắt |
| Font | Stack font hệ thống có tiếng Việt | Nếu đóng gói font riêng: kiểm tra dấu tiếng Việt, license và kích thước nhỏ |
| PWA/store | Chưa ghi nhận bộ hình trong public | App icon, favicon, icon maskable, ảnh bìa và screenshot; kích thước chốt theo kênh phát hành |

Không tính khoảng tối hai bên sân là thiếu một sprite cụ thể: đó còn là quyết định bố cục/camera. Không dùng ảnh nền để che vấn đề trước khi chốt thiết kế.

Âm thanh nằm ngoài phép đếm hình: `src/audio` chưa có; cần danh mục riêng cho nhạc menu/trận, UI, đặt thẻ, quân/đòn đánh, Can Thiệp, boss, thắng/thua ở G5. Không ghi là đã có chỉ vì roadmap dự kiến sinh bằng code.

## 11. Đặt tên, file nguồn và tích hợp

### 11.1 Hợp đồng hiện hành

| Loại | Tên frame/key |
|---|---|
| Quân | `unit_<UnitId>_<ally|foe>_<idle|walk|attack><0|1>` |
| Công trình/Ngai | `building_<CardId>` |
| Tranh | `card_art_<CardId>` |
| Ô | `plot_open`, `plot_locked`, `plot_throne` |
| Icon | `icon_<id>` |
| FX | `fx_<id>` |
| Atlas world | `sprites` |
| Atlas UI | `ui`; frame đúng `UI_FRAME_IDS` / `UI_DECOR_IDS` |
| Sân | `field-<seed>` hiện sinh trực tiếp, không phải atlas terrain đã nạp |

Ví dụ: `unit_reaper_ally_attack0`, `building_wheat_scarecrow`, `card_art_neutral_move`. Chân dung và animation mới chưa có helper/hợp đồng runtime; tên như `portrait_wheat` chỉ là đề xuất cho lần tích hợp sau, không phải frame đang tồn tại.

### 11.2 Bàn giao đề xuất

- File gốc có layer: Aseprite hoặc công cụ pixel art tương đương; tách layer silhouette, vật liệu, bóng và màu phe nếu có ích.
- PNG RGBA ở native size; giữ alpha, không có nền giấy/checkerboard được vẽ vào ảnh. Tranh thẻ có thể có nền chủ ý.
- Spritesheet PNG + JSON atlas tương thích Phaser, frame name khớp hợp đồng. Xuất không trim/không rotate trước để giữ canvas và origin; nếu trim phải kiểm tra metadata/origin trong runtime.
- Preview 1× và phóng nguyên lần để duyệt. Không dùng preview lớn thay cho PNG native.
- Chỉ đưa atlas đã duyệt vào `public/assets/atlases/`; đây là vị trí dự kiến, hiện Preload chưa nạp atlas ngoài.
- Lưu file nguồn/concept tại vị trí được chốt khi sản xuất, không tự đặt dependency tới thư mục `.codex` ngoài repo.
- Một phiếu mỗi asset/bộ: ID, người làm, trạng thái, canvas, palette, animation, source path, exported path, preview, license, reviewer và ghi chú còn thiếu.

### 11.3 AI và nguồn ngoài

Pipeline theo policy: **concept → draft đúng kích thước → làm sạch palette → sửa pixel thủ công → animation → review → atlas**. Ảnh AI chi tiết dùng chốt hình dáng/vật liệu, không nhập nguyên bảng concept vào game. Không dùng asset có hạn chế AI làm image-to-image/reference khi chưa kiểm tra điều khoản.

Với asset ngoài: xác nhận nguồn, license, quyền phân phối repo và game; lưu bằng chứng tại `docs/licenses/<asset-name>/`; đăng ký manifest và credits trước commit. Nếu cần attribution, phải có cả credits trong game. Không ghi toàn bộ danh mục M trong tài liệu này vào manifest như thể đã được nhập.

## 12. Thứ tự sản xuất

| Ưu tiên | Phạm vi | Đầu ra nghiệm thu |
|---|---|---|
| P0 | Chốt hướng và thử nghiệm đại diện | Dân Quân, Thợ Gặt, Kỵ Lợn Rừng, Bù Nhìn, Ngai và một tranh 32×24 đọc tốt tại zoom thật |
| P1 | Nâng toàn bộ G1 | 7 bộ quân, 6 công trình/Ngai, 8 tranh, chân dung Lúa Mì; chuẩn hóa UI và FX hiện có |
| P2 | Nội dung G2 | Phần Lúa Mì còn lại, trung lập G2, Đá Núi và Phép Thuật; chân dung, bùa/status và projectile tương ứng |
| P3 | Nội dung G3 | 3 boss, Ếch/Ong, roster địch của 6 vua còn lại, nhận diện nhiệm vụ/sắc lệnh/chinh phục |
| P4 | Nội dung G4 | Hoàn thiện công trình/tranh của 6 vua còn lại, 2 thẻ trung lập meta, perk và meta UI |
| P5 | Polish và phát hành | Decor, animation tùy chọn, logo/ảnh quảng bá/PWA, font và QA đa màn hình |

Mỗi batch chốt sprite mẫu ở native size trước khi làm hàng loạt. Không cần gen đủ 102 tranh concept độ phân giải cao ngay. Ngân sách animation tính theo UnitId × phe thực sự cần × animation × frame, không mặc định boss/quân chỉ làm địch cũng cần bản ally.

## 13. Checklist nghiệm thu

- [ ] Đúng ID, tên frame, loại nội dung và trạng thái; không nhầm concept với asset tích hợp.
- [ ] Đúng native size; không tự thay đổi kích thước/chiếu hình so với game.
- [ ] Mép alpha 0/255 (bóng khai báo alpha 128), không anti-aliasing; đúng mật độ 2 px/đơn vị.
- [ ] Không anti-aliasing hoặc scale lẻ; ánh sáng trên-trái, viền ấm.
- [ ] Silhouette và chức năng đọc được ở 1×; các loại không chỉ khác màu.
- [ ] Chân không trượt/rung giữa frame; không cắt vũ khí hoặc bóng.
- [ ] Idle/walk 6–8 fps, attack 10–12 fps là mục tiêu art; kiểm tra cadence thực tế của renderer khi nhập.
- [ ] 8 hướng projectile không xoay; ally/foe phân biệt được trên cả cỏ và đất.
- [ ] Công trình y-sort đúng; tranh thẻ không cắt mất chủ thể; UI 9-slice không vỡ góc.
- [ ] Xem thử ở desktop 1280×720 và mobile 375×812, trận đông quân, cả ba tốc độ; FX không che mục tiêu.
- [ ] File nguồn, PNG/JSON, preview và dữ liệu license đầy đủ; manifest/credits cập nhật nếu nhập asset.
- [ ] Không thay logic gameplay chỉ để khớp hình; tên frame cũ vẫn hoạt động.

## 14. Điểm cần giữ rõ khi cập nhật tài liệu

- `ART_STYLE.md` có đoạn cũ nói `cardArt.ts` dùng UI palette, nhưng bảng palette, spec và code `cardArt.ts` dùng Hearth 32 cho tranh; kiểm kê này theo code và quy chuẩn world. Cần đồng bộ mô tả khi chỉnh tài liệu art.
- Tài liệu art nhắc `field-tiles`, trong khi atlas hiện tại sinh sân `field-<seed>` trực tiếp; không coi `field-tiles` là texture đã tồn tại.
- Quy chuẩn nói dùng `paintBitmap` cho quân, nhưng placeholder hiện là `paintUnit` vẽ hình học. Cần phân biệt pipeline mong muốn và triển khai hiện tại.
- Không kết luận không có hiệu ứng chỉ vì không tìm thấy PNG: vòng va chạm, overlay và chỉ báo có thể vẽ bằng Graphics/tween.
- Kích thước quân tương lai, số frame kỹ năng, số hình decor và số icon độc lập chưa chốt; không đưa ra tổng file cuối cùng giả chính xác.
- Sau khi thêm nội dung, kiểm tra lại registry, atlas và manifest rồi cập nhật ngày kiểm kê và các tổng số ở §2.
