"""Build the production checklist from the checked-in inventory and binding design."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
inventory = (ROOT / 'docs/ASSET_INVENTORY.md').read_text(encoding='utf-8')
spec = (ROOT / 'docs/superpowers/specs/2026-10-16-crowned-kingdoms-design.md').read_text(encoding='utf-8')
def rows(text):
    return [[c.strip().strip('`') for c in line.strip().strip('|').split('|')] for line in text.splitlines() if line.startswith('|')]
cards = [r for r in rows(inventory.split('### 6.2 Thẻ và công trình theo phe')[1].split('### 6.3 Toàn bộ quân')[0]) if len(r) == 6 and re.fullmatch(r'(neutral|wheat|stone|arcane|grove|tide|forge|clock|moon|nomad)_[a-z_]+', r[0])]
units = [r for r in rows(inventory.split('### 6.3 Toàn bộ quân')[1].split('### 6.4 Boss')[0]) if len(r) == 4 and r[3] in ('M', 'P')]
thrones = [r for r in rows(inventory.split('### 6.1 Chín vua và Ngai')[1].split('### 6.2 Thẻ')[0]) if len(r) == 5 and r[0] in ('wheat','stone','arcane','grove','tide','forge','clock','moon','nomad')]
source_cards = {r[0]: r for r in rows(spec) if len(r) == 6 and r[0] in {c[0] for c in cards}}
source_units = {r[0]: r for r in rows(spec) if len(r) == 12 and r[0] in {u[0] for u in units}}
buildings = [r for r in cards if r[2].split(',')[0] in ('lính','tháp','kinh tế','hỗ trợ')]
assert (len(cards),len(buildings),len(units),len(thrones)) == (93,65,42,9)

header = '''# Crowned Kingdoms — Yêu cầu sản xuất từng bộ asset

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
| Đạn | 13 họ đề xuất | 69 frame hình đạn theo §8; dùng chung giữa các nguồn |
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
'''

def fx(text, ident):
    if 'cone' in text: return 'fire_cone + burn; không projectile bay'
    if 'pulse' in text: return 'wave + impact; không projectile bay'
    if 'xúc tu' in text: return 'tentacle_strike + splash; không ép thành đạn pháo'
    if 'đạn' in text:
        if any(t in ident for t in ['catapult','stone_throne']): return 'stone + dust'
        if any(t in ident for t in ['steam_cannon','tide_cannon','tide_throne']): return 'cannonball + explosion/knockback'
        if 'scarecrow' in ident: return 'seed + slow'
        if 'thorn' in ident or 'grove_throne' in ident: return 'thorn + poison'
        if 'forge_throne' in ident: return 'fireball + burn'
        if 'moon' in ident: return 'shadow_orb + soul/summon'
        if 'crystal' in ident: return 'crystal + magic_hit'
        if 'arcane' in ident: return 'magic_orb + magic_hit; chain nếu có nảy'
        if 'clock' in ident: return 'gear + physical_hit'
        return 'arrow + physical_hit'
    if 'triệu hồi' in text: return 'summon / soul'
    if 'khiên' in text: return 'shield'
    if 'hồi' in text and ('HP' in text or 'máu' in text): return 'heal'
    return 'FX đặt/nâng cấp hoặc cast theo hiệu ứng; không đạn riêng mặc định'

parts = [header]
kind_map = {'lính':'B-TROOP','tháp':'B-TOWER','kinh tế':'B-ECON','hỗ trợ':'B-SUPPORT'}
for r in cards:
    original = source_cards[r[0]][4]
    linked = list(dict.fromkeys(re.findall(r'`([a-z_]+)`', original)))
    linked = [x for x in linked if x in {u[0] for u in units}]
    parts.append(f"| `{r[0]}` | {r[1]} | {kind_map.get(r[2].split(',')[0], 'B-SPELL')} | {', '.join(linked) or '—'} | {fx(original,r[0])} | {r[3]} | {original} |\n")

parts.append('''
### 5.1 Chín bộ Ngai/vua

Mỗi dòng: B-THRONE, 3 kiến trúc + 1 tranh + 1 chân dung + 1 huy hiệu = 6 hình tĩnh liên kết; đạn/FX dùng chung tính ở thư viện.

| KingId | CardId Ngai | Nhận diện | Đạn / bị động cần thể hiện |
|---|---|---|---|
''')
throne_fx = ['arrow; vàng mùa gặt', 'stone; tăng sát thương tháp', 'magic_orb; buff từ stack bùa', 'thorn; poison/growth', 'cannonball; splash/knockback/gold', 'fireball; burn/buff', 'gear; lên dây/tăng tốc đánh', 'shadow_orb; soul/summon wraith', 'arrow; dời nhà']
for r, effect in zip(thrones, throne_fx):
    parts.append(f'| {r[0]} | `{r[2]}` | {r[4]} | {effect} |\n')

parts.append('''
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
''')
sizes={'reaper':'16×24','boar_rider':'24×24','ogre':'24×32'}
large={'golem','bear','treant','iron_drake','colossus','moon_reaper','rider','horse_archer','khan_guard'}
tall={'miner','slinger','apprentice','frost_mage','archmage','dryad','hookman','musketeer','gear_gunner'}
projectiles={'bandit_archer':'arrow','horse_archer':'arrow','slinger':'stone','apprentice':'magic_orb','frost_mage':'ice_shard','archmage':'magic_orb + splash','dryad':'magic_orb + heal','hookman':'hook + rope','musketeer':'bullet + muzzle','bombardier':'fireball + explosion','gear_gunner':'gear','iron_drake':'fire_cone; không đạn bay'}
for u in units:
    ident=u[0]; raw=source_units.get(ident)
    size=sizes.get(ident, '24×32' if ident in large else '16×24' if ident in tall else '16×16')
    if ident not in {'footman','militia','reaper','bandit','bandit_archer','boar_rider','ogre'}: size+=' (đề xuất)'
    detail=(raw[3]+'; '+raw[11]) if raw else ('Đánh cận chiến; spawn riêng của boss' if ident in ('frog','hornet') else 'Đối chiếu spec')
    parts.append(f"| `{ident}` | {u[1]} | {size} | 6 cơ bản / 20 mở rộng | {projectiles.get(ident,'Cận chiến; không projectile riêng')} | {detail} |\n")

parts.append('''
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
''')
text=''.join(parts).replace('| Đạn | 13 họ đề xuất | 69 frame hình đạn theo §8;', '| Đạn | 15 họ đề xuất (gồm boss) | 76 frame hình đạn theo §8;')
(ROOT / 'docs/ASSET_REQUIREMENTS.md').write_text(text, encoding='utf-8')
print(f'Written ASSET_REQUIREMENTS.md: {len(cards)} cards, {len(buildings)} buildings, {len(thrones)} thrones, {len(units)} units')
