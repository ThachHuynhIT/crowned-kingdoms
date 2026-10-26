"""Build the missing-image backlog; never modify the availability manifest.

Run with Python 3 from any directory. Markdown tables and literal TS records are
parsed as data, never executed. Counts and source shapes deliberately fail closed.
"""
from pathlib import Path
import json
import re
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
REQ = 'docs/ASSET_REQUIREMENTS.md'
INV = 'docs/ASSET_INVENTORY.md'


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def require(ok, message):
    if not ok:
        raise ValueError(message)


def section(path, title):
    lines = read(path).splitlines()
    hits = [i for i, line in enumerate(lines) if line == title]
    require(len(hits) == 1, f'{path}: expected unique heading {title}')
    start = hits[0]
    level = len(title) - len(title.lstrip('#'))
    end = next((i for i in range(start + 1, len(lines))
                if re.match(r'^#{1,' + str(level) + r'} ', lines[i])), len(lines))
    return [(i + 1, lines[i]) for i in range(start + 1, end)]


def table(path, title, columns):
    rows = []
    active = False
    for line, text in section(path, title):
        if not text.startswith('|'):
            if rows:
                break
            continue
        cells = [x.strip().strip('`') for x in text.strip('|').split('|')]
        if cells[0] == columns[0]:
            active = True
            continue
        if not active:
            continue
        if re.fullmatch(r'[-: ]+', cells[0]):
            continue
        require(len(cells) == len(columns), f'{path}:{line}: changed table shape')
        rows.append((line, cells))
    require(rows, f'{path}: empty table {title}')
    return rows


def records(path):
    """Extract balanced object literals, ignoring braces in strings/comments.

    Only records with literal id and nameVi are returned. Nested effects cannot
    supply a parent's ID/name because only text at depth one is inspected.
    """
    text = read(path)
    stack = []
    result = []
    quote = None
    comment = None
    escaped = False
    i = 0
    while i < len(text):
        char = text[i]
        pair = text[i:i+2]
        if comment:
            if comment == 'line' and char == '\n': comment = None
            elif comment == 'block' and pair == '*/': comment = None; i += 1
        elif quote:
            if escaped: escaped = False
            elif char == '\\': escaped = True
            elif char == quote: quote = None
            if stack: stack[-1][1].append(char)
        elif pair in ('//', '/*'):
            comment = 'line' if pair == '//' else 'block'
            i += 1
        elif char in "'\"`":
            quote = char
            if stack: stack[-1][1].append(char)
        elif char == '{':
            stack.append([i, []])
        elif char == '}':
            require(stack, f'{path}: unbalanced braces')
            start, flat = stack.pop()
            direct = ''.join(flat)
            ident = re.search(r"\bid:\s*'([^']+)'", direct)
            name = re.search(r"\bnameVi:\s*'([^']+)'", direct)
            if ident and name:
                raw = text[start:i+1]
                sprite = re.search(r'sprite:\s*\{\s*w:\s*(\d+),\s*h:\s*(\d+)\s*\}', raw)
                result.append({'id': ident[1], 'name': name[1], 'sprite':
                               tuple(map(int, sprite.groups())) if sprite else None,
                               'source': f'{path}:{text[:start].count(chr(10))+1}', 'raw': raw})
        elif stack:
            stack[-1][1].append(char)
        i += 1
    require(not stack and not quote and comment != 'block', f'{path}: incomplete TS literal')
    return result


def build():
    # Read all four policy sources every run; availability alone comes from manifest.
    for path in (REQ, INV, 'docs/ASSET_PRODUCTION_RULES.md', 'docs/ART_STYLE.md'):
        require(read(path).strip(), f'{path}: empty source')
    manifest = json.loads(read('tools/asset-admin/manifest.json'))
    require(isinstance(manifest, dict) and manifest.get('version') == 1
            and isinstance(manifest.get('categories'), list), 'Invalid manifest schema/version')
    available = {}
    category_ids = set()
    for category in manifest['categories']:
        require(isinstance(category, dict) and isinstance(category.get('id'), str)
                and isinstance(category.get('label'), str) and isinstance(category.get('items'), list),
                'Invalid manifest category')
        require(category['id'] not in category_ids, 'Duplicate manifest category ID')
        category_ids.add(category['id'])
        for item in category['items']:
            require(isinstance(item, dict) and isinstance(item.get('id'), str)
                    and isinstance(item.get('label'), str) and isinstance(item.get('src'), str)
                    and item.get('kind') in ('tile', 'object', 'unit')
                    and isinstance(item.get('tags'), list)
                    and all(isinstance(tag, str) for tag in item['tags'])
                    and all(type(item.get(axis)) is int and 0 < item[axis] <= 4096 for axis in ('w','h')),
                    'Invalid manifest item schema')
            require(item['id'] not in available, f'Duplicate manifest ID: {item["id"]}')
            available[item['id']] = item
    items = []
    aliases = []

    def add(ident, label, category, size=(0, 0), priority='P0', source=None,
            kind='object', group=None, frames=1, note=None, tags=()):
        if ident in available:
            return
        row = dict(id=ident, label=label, category=category, w=size[0], h=size[1],
                   kind=kind, group=group or category, tags=list(tags), source=source or REQ,
                   priority=priority)
        if frames is not None: row['frames'] = frames
        if note: row['note'] = note
        require(size != (0, 0) or bool(note), f'{ident}: unknown canvas needs note')
        items.append(row)

    cards = table(REQ, '## 5. Danh sách 93 thẻ và liên kết trọn bộ',
                  ['CardId', 'Tên', 'Bộ', 'Quân liên kết', 'Đạn / FX cần kiểm', 'Mốc', 'Cơ chế theo spec'])
    # Section 5 includes subsection 5.1: retain only rows with card IDs/B-*.
    cards = [(line, row) for line, row in cards if row[2].startswith('B-')]
    require(len(cards) == 93, f'Expected 93 cards, got {len(cards)}')
    buildings = [(line, row) for line, row in cards if row[2] != 'B-SPELL']
    require(len(buildings) == 65, 'Expected 65 buildings')
    data_paths = ['src/data/neutral.ts', 'src/data/raiders.ts'] + [str(p.relative_to(ROOT)).replace('\\', '/') for p in sorted((ROOT / 'src/data/kings').glob('*.ts')) if not p.name.endswith('.test.ts')]
    data = [record for path in data_paths for record in records(path)]
    by_id = {r['id']: r for r in data}
    # Two meta cards are spec-only until G4; all 54 conquest cards already serve G3.
    meta = {'neutral_duplicate', 'neutral_royal_seal'}
    for line, row in cards:
        ident, name, package = row[:3]
        require(ident in by_id or ident in meta, f'Card missing from data: {ident}')
        priority = 'P1' if ident in meta else 'P0'
        source = f'{REQ}:{line} (§5); ' + (by_id[ident]['source'] if ident in by_id else 'G4: chưa có dữ liệu runtime')
        add('card_art_' + ident, 'Tranh thẻ — ' + name, 'card-art', (64, 48), priority, source, tags=(ident,))
        if package != 'B-SPELL':
            add('building_' + ident, name, 'buildings', (64, 80), priority, source, tags=(ident, package))
            for level in (2, 3):
                add(f'building_{ident}_l{level}', f'{name} — kiến trúc L{level}', 'buildings', (64, 80), 'P2', source,
                    note='Tùy chọn kiến trúc; cần mở rộng loader. L4/L5 dùng lại L3 + chỉ báo UI.', tags=(ident, 'optional'))
            count = 6 if package == 'B-TROOP' else 9 if package == 'B-TOWER' else 12
            add('building_' + ident + '_animation', name + ' — hoạt động', 'buildings', (64, 80), 'P2', f'{REQ}:§4; {source}', frames=count,
                note='Tùy chọn bổ sung sau static; số frame cho cả 3 mẫu, không nhân thành công trình mới.', tags=(ident, 'optional'))

    thrones = table(INV, '### 6.1 Chín vua và Ngai', ['KingId', 'Vua', 'Ngai (CardId)', 'Trạng thái Ngai', 'Brief tạo hình đề xuất'])
    require(len(thrones) == 9, 'Expected 9 kings')
    for line, row in thrones:
        king, name, throne = row[:3]
        priority = 'P0' if king in ('wheat', 'stone', 'arcane') else 'P1'
        source = f'{INV}:{line} (§6.1); {REQ}:§5.1'
        throne_name = by_id.get(throne, {}).get('name', 'Ngai — ' + name)
        add('building_' + throne, throne_name, 'thrones', (64, 96), priority, source, tags=(king, 'throne'))
        add('card_art_' + throne, 'Tranh ' + throne_name, 'card-art', (64, 48), priority, source, tags=(king, 'throne'))
        add('portrait_' + king, 'Chân dung Vua ' + name, 'portraits', (64, 64), 'P0', source, note='Tên frame đề xuất; canvas theo ART_STYLE 32×32 world ×2.', tags=(king,))
        add('icon_king_' + king, 'Huy hiệu Vua ' + name, 'king-badges', (32, 32), 'P0', source, tags=(king,))
        for level in (2, 3):
            add(f'building_{throne}_l{level}', f'{throne_name} — L{level}', 'thrones', (64, 96), 'P2', source,
                note='Kiến trúc tùy chọn; cần loader theo cấp; không phải ô plot_throne.', tags=(king, 'optional'))
        add(f'building_{throne}_animation', throne_name + ' — bắn', 'thrones', (64, 96), 'P2', source, frames=9,
            note='Fire 3 frame/mẫu ×3 mẫu; bổ sung tùy chọn, cần mở rộng renderer.', tags=(king, 'optional'))

    units = table(REQ, '## 6. Animation và danh mục 42 quân', ['UnitId', 'Tên', 'Canvas', 'Bộ', 'Đòn / đạn', 'Kỹ năng / FX bổ sung'])
    # The first animation-state table has four columns, so parsed separately below.
    require(len(units) == 42, 'Expected 42 units')
    for line, row in units:
        ident, name = row[:2]
        require(ident in by_id and by_id[ident]['sprite'], f'No literal UnitDef sprite for {ident}')
        size = tuple(v * 2 for v in by_id[ident]['sprite'])
        source = f'{REQ}:{line} (§6); {by_id[ident]["source"]}'
        add('unit_' + ident, name, 'units', size, source=source, kind='unit', frames=6,
            note='Một bộ cơ bản idle/walk/attack ×2; xuất phe thật sự dùng, không mặc định ally cho quân chỉ làm địch.', tags=(ident, 'base'))
        existing = available.get('unit_' + ident)
        expanded_size = (existing['w'], existing['h']) if existing else size
        add('unit_' + ident + '_expanded', name + ' — animation mở rộng', 'units', expanded_size, 'P2', source, kind='unit', frames=14,
            note='14 frame bổ sung để bộ 6 thành 20; không cộng thêm một thiết kế quân. Hit/death/spawn cần mở rộng renderer.' + (' Giữ canvas theo metadata ảnh base trong manifest để khớp animation hiện có.' if existing else ''), tags=(ident, 'optional', 'supplemental'))
    boss_rows = table(REQ, '## 7. Ba bộ boss', ['Boss', 'Động tác bổ sung', 'Số frame bổ sung', 'Quân/đạn/FX liên kết'])
    boss_data = read('src/data/bosses.ts')
    for line, row in boss_rows:
        ident = row[0]
        match = re.search(r"boss\('" + ident + r"', '([^']+)'", boss_data)
        require(match, f'Unknown boss {ident}')
        add('unit_' + ident, match[1], 'units', (96, 96), source=f'{REQ}:{line} (§7); src/data/bosses.ts:{boss_data[:match.start()].count(chr(10))+1}', kind='unit', frames={'boss_bog_ogre':28,'boss_hornet_queen':34,'boss_crownless_king':32}[ident],
            note='Chỉ phe foe. P0 cần 6 frame cơ bản; tổng 28/34/32 gồm phần mở rộng kỹ năng đề xuất P2, chưa được renderer hỗ trợ. Một mục theo thiết kế boss, không hàm ý toàn bộ animation là bắt buộc P0.', tags=(ident, 'boss'))

    projectile_rows = table(REQ, '### 8.1 Thư viện 13 họ projectile — đề xuất hình, không đổi sát thương', ['ID họ', 'Dùng cho', 'Canvas', 'Hướng × frame', 'Số frame'])
    require(len(projectile_rows) == 13, 'Expected 13 ordinary projectiles')
    for line, row in projectile_rows:
        size = tuple(int(x)*2 for x in row[2].split('×'))
        add('fx_' + row[0], 'Đạn — ' + row[0], 'projectiles', size, source=f'{REQ}:{line} (§8.1)', frames=int(row[4]), note='Họ đạn dùng chung; frame hướng vẽ riêng, không xoay sprite.', tags=(row[0],))
    for ident, count in [('mud', 1), ('stinger', 8)]:
        add('fx_' + ident, 'Đạn boss — ' + ident, 'projectiles', source=f'{REQ}:§8.1', frames=count,
            note='Chưa chốt canvas; đề xuất 8×8 world →16×16 ảnh. Bộ boss dùng chung.', tags=(ident, 'boss'))
    for ident, size in [('boulder',(32,32)), ('boulder_shadow',(48,16))]:
        add('fx_' + ident, 'Can Thiệp — ' + ('Đá' if ident == 'boulder' else 'Bóng đá'), 'projectiles', size, source=f'{INV}:§4.4', tags=('intervention',))
    fx_groups = [('physical_hit slash dust magic_hit', (0,0)), ('explosion splash fire_cone wave',(0,0)), ('chain rope',(0,0)), ('heal shield slow stun burn poison disable',(0,0)), ('summon soul revive',(32,32)), ('place upgrade move destroy',(0,0)), ('rage reward',(32,32))]
    require(sum(len(names.split()) for names, _ in fx_groups) == 26, 'Expected 26 VFX families')
    for names, size in fx_groups:
        for ident in names.split():
            add('fx_' + ident, 'Hiệu ứng — ' + ident, 'vfx', size, source=f'{REQ}:§8.2', frames=4,
                note='Ngân sách 4 frame dùng chung. ' + ('Canvas chưa chốt: bảng có nhiều lựa chọn/Graphics; cần chốt orientation và radius.' if size == (0,0) else '16×16 world ×2; không nhân lại theo từng quân.'), tags=(ident,))

    # Variant filenames provide no four-corner mask metadata. Do not infer masks
    # from numeric suffixes or incorrectly count water a/b variants as animation.
    for material in ('grass','flowers','path','sand','water'):
        for mask in range(1,16):
            add(f'terrain_{material}_mask_{mask:02d}', f'Nền {material} — mask {mask:04b}', 'terrain', (32,32), priority='P2', source=f'{REQ}:§9', kind='tile',
                note='Ngân sách dual-grid tùy chọn, pipeline xuất chưa chốt: mask không rỗng. Manifest chỉ có biến thể, chưa xác nhận topology/mask; cần kiểm mép trước tích hợp.', tags=(material, 'dual-grid', f'mask-{mask:04b}'))
    for material, ids in [('grass',['terrain_grass_'+str(i) for i in range(3)]), ('flowers',['terrain_meadow_flowers_'+str(i) for i in range(3)]), ('path',['terrain_path_'+str(i) for i in range(2)]), ('sand',['terrain_sand_'+str(i) for i in range(2)])]:
        require(all(i in available for i in ids), 'Terrain variant aliases need review')
        aliases.append(dict(requirement=f'{material}: biến thể full đề xuất §9', available=ids, note='Có ảnh cùng vật liệu/biến thể; không tạo bộ trùng. Chưa chứng nhận full mask hoặc mép ghép.'))
    add('terrain_water_full_animation', 'Nước — animation ô đầy', 'terrain', (32,32), 'P2', f'{REQ}:§9', kind='tile', frames=4,
        note='4 frame thay ô full tĩnh; chưa có bằng chứng water_a/b là chu kỳ animation; không cộng 4 lên full mask đã có.', tags=('water','optional'))
    for king, *_ in [row for _, row in thrones]:
        for state in ('open','locked','throne'):
            require(f'plot_{king}_{state}' in available, f'Missing expected existing plot {king}/{state}')
    aliases.append(dict(requirement='3 ô bàn cờ ×9 vua', available=sorted(i for i in available if i.startswith('plot_')), note='27 ô có ảnh; plot_*_throne là nền bệ, không thay sprite Ngai building_*_throne.'))
    for label, ids in [('3 cây',['wild_tree_pine_dark','wild_tree_pine_light','wild_tree_oak']), ('3 bụi',['wild_bush_green','wild_bush_berry','wild_bush_dry']), ('3 đá',['wild_rock_large','wild_rock_medium','wild_rock_small'])]:
        require(all(i in available for i in ids), 'Wild aliases changed')
        aliases.append(dict(requirement=label, available=ids, note='Ánh xạ thủ công theo mục đích §9; không sản xuất bộ trùng. Cây autumn và wild khác là ảnh bổ sung hiện có.'))
    decor = [('fence_horizontal','Hàng rào ngang'),('fence_vertical','Hàng rào dọc'),('fence_ne','Góc rào đông bắc'),('fence_nw','Góc rào tây bắc'),('fence_se','Góc rào đông nam'),('fence_sw','Góc rào tây nam'),('gate','Cổng'),('wheat_cart','Xe lúa'),('barrel','Thùng'),('haystack','Đống rơm'),('sign','Biển')]
    for ident, label in decor:
        add('wild_'+ident, label, 'wilds', source=f'{REQ}:§9', priority='P2', note='Canvas chưa chốt; đồ nhỏ đề xuất 16×16 world →32×32 ảnh, neo chân/y-sort.', tags=('decor','optional'))

    icon_ids = 'troop tower tome throne crown boulder skull economy support enchantment gold life level enchant_stack soul shield poison burn slow stun revive flying cooldown disabled attack armor speed range heal lock unlock reroll move upgrade sacrifice quest decree conquest save pause sound music settings difficulty'.split()
    require(len(icon_ids) == 44, 'Expected 44 UI icons')
    for ident in icon_ids:
        priority = 'P1' if ident == 'difficulty' else 'P2' if ident in ('sound','music','settings') else 'P0'
        add('icon_' + ident, 'Biểu tượng — ' + ident, 'ui-icons', (32,32), priority, source=f'{REQ}:§10', tags=(ident,))
    frames = [('panel',24,24),('button',16,16),('buttonHover',16,16),('buttonDown',16,16),('buttonActive',16,16),('slot',18,18),('slotHover',18,18),('slotSelected',18,18),('tooltip',12,12),('bar',8,6),('card',24,32),('cardUncommon',24,32),('cardRare',24,32),('cardSelected',24,32)]
    for ident,w,h in frames:
        add('ui_'+ident, 'Khung UI — ' + ident, 'ui-frames', (w*2,h*2), 'P2', source=f'{INV}:§4.4; docs/ART_STYLE.md:40 (Giao diện)', note='Skin ảnh riêng tùy chọn, giữ hợp đồng 9-slice. UI procedural/Kenney đã tồn tại trong game; mục này dự trù thay hình, không khẳng định game thiếu khung UI. Canvas nguồn hiện hành ×2.', tags=('nine-slice',ident,'optional'))
    for ident,w,h in [('clockDial',28,28),('firefly',3,3)]:
        add('ui_'+ident, 'Trang trí UI — '+ident, 'ui-decor', (w*2,h*2), 'P2', source=f'{INV}:§4.4', note='Ảnh thay thế tùy chọn; trang trí procedural đã có trong game nhưng chưa có ảnh trong manifest admin, không hàm ý thiếu chức năng UI.', tags=(ident,'optional'))
    for path,prefix,count in [('src/data/decrees.ts','decree_',18),('src/data/quests.ts','quest_',13)]:
        content = [r for r in records(path) if r['id'].startswith(prefix)]
        require(len(content)==count, f'{path}: expected {count} IDs')
        for r in content:
            add('icon_'+r['id'], 'Biểu tượng — '+r['name'], 'content-icons', (32,32), 'P2', r['source']+'; '+REQ+':§10', note='Ảnh riêng tùy chọn; mặc định tái dùng icon chung.', tags=(r['id'],'optional'))
    add('icon_perks_optional', 'Bộ icon perk riêng (27 mục)', 'content-icons', priority='P2', source=f'{REQ}:§10; {INV}:§7', frames=27,
        note='Tùy chọn 27 icon độc lập; chưa có PerkId trong src/data, tên ID/canvas chưa chốt. Dùng icon chung trước; không giả tạo 27 runtime ID.', tags=('perk','optional','unfinalized'))
    for ident,label in [('sky','Trời menu'),('far','Nền menu xa'),('middle','Nền menu trung'),('near','Nền menu gần'),('logo','Logo'),('win','Tranh thắng'),('lose','Tranh thua')]:
        add('menu_'+ident,label,'menu',priority='P2',source=f'{REQ}:§9',note='Ảnh tùy chọn; canvas chưa chốt theo layout.',tags=('optional',))
    for ident,label in [('app_icon','App icon'),('favicon','Favicon'),('maskable','Icon maskable'),('screenshot_desktop','Screenshot desktop'),('screenshot_mobile','Screenshot mobile')]:
        add('release_'+ident,label,'release',priority='P2',source=f'{REQ}:§10',note='Xuất phát hành tùy chọn; canvas/kích thước chốt theo kênh, không giả định store.',tags=('optional',))

    # Names are presentation copy; IDs/tags remain stable English keys.
    projectile_names = dict(zip(
        'arrow seed stone crystal magic_orb ice_shard thorn cannonball hook bullet fireball gear shadow_orb mud stinger'.split(),
        ['Mũi tên','Hạt giống','Đá ném','Pha lê','Cầu phép','Mảnh băng','Gai','Đạn pháo','Móc câu','Đạn súng','Cầu lửa','Bánh răng','Cầu bóng tối','Bùn','Ngòi ong']))
    fx_names = dict(zip(
        'physical_hit slash dust magic_hit explosion splash fire_cone wave chain rope heal shield slow stun burn poison disable summon soul revive place upgrade move destroy rage reward'.split(),
        ['Trúng đòn vật lý','Vệt chém','Bụi đá','Trúng phép','Vụ nổ','Sát thương lan','Luồng lửa','Sóng xung kích','Tia phép nảy','Dây móc','Hồi máu','Khiên','Làm chậm','Choáng','Bỏng','Độc','Vô hiệu hóa','Triệu hồi','Thu hồn','Hồi sinh','Đặt công trình','Nâng cấp','Dời công trình','Phá hủy','Cuồng nộ','Phần thưởng']))
    icon_names = dict(zip(icon_ids,
        ['Lính','Tháp','Sách phép','Ngai','Vương miện','Đá Can Thiệp','Đầu lâu','Kinh tế','Hỗ trợ','Bùa','Vàng','Mạng sống','Cấp độ','Số tầng bùa','Hồn','Khiên','Độc','Bỏng','Làm chậm','Choáng','Hồi sinh','Bay','Hồi chiêu','Vô hiệu hóa','Tấn công','Giáp','Tốc độ','Tầm đánh','Hồi máu','Khóa','Mở khóa','Đổi bài','Di chuyển','Nâng cấp','Hiến tế','Nhiệm vụ','Sắc lệnh','Chinh phục','Lưu ván','Tạm dừng','Âm thanh','Nhạc','Cài đặt','Độ khó']))
    terrain_names = dict(zip('grass flowers path sand water'.split(), ['Cỏ','Cỏ hoa','Đường đất','Cát','Nước']))
    frame_names = dict(zip([entry[0] for entry in frames],
        ['Bảng','Nút thường','Nút khi trỏ','Nút khi bấm','Nút đang bật','Ô thường','Ô khi trỏ','Ô đang chọn','Chú giải','Thanh chỉ số','Thẻ thường','Thẻ vừa','Thẻ hiếm','Thẻ đang chọn']))
    for row in items:
        ident = row['id']
        if row['category'] == 'projectiles' and ident[3:] in projectile_names:
            row['label'] = 'Đạn — ' + projectile_names[ident[3:]]
        elif row['category'] == 'vfx':
            row['label'] = 'Hiệu ứng — ' + fx_names[ident[3:]]
        elif row['category'] == 'ui-icons':
            row['label'] = 'Biểu tượng — ' + icon_names[ident[5:]]
        elif row['category'] == 'terrain' and '_mask_' in ident:
            material, mask = ident[len('terrain_'):].split('_mask_')
            row['label'] = 'Nền ' + terrain_names[material] + ' — mặt nạ ' + format(int(mask), '04b')
        elif row['category'] == 'ui-frames':
            row['label'] = 'Khung UI — ' + frame_names[ident[3:]]
        elif row['category'] == 'ui-decor':
            row['label'] = 'Trang trí UI — ' + {'ui_clockDial':'Mặt đồng hồ','ui_firefly':'Đom đóm'}[ident]

    # Attach concrete line numbers to section references, so the UI can point
    # reviewers to the requirements even for programmatic families.
    def line_ref(match):
        path, number = match.groups()
        lines = read(path).splitlines()
        hit = next((n for n, text in enumerate(lines, 1)
                    if re.match(r'^#+ ' + re.escape(number) + r'(?:[. ]|$)', text)), None)
        require(hit is not None, f'{path}: unknown section {number}')
        return f'{path}:{hit} (§{number})'
    for row in items:
        row['source'] = re.sub(r'(docs/[A-Z_]+\.md):§([0-9.]+)', line_ref, row['source'])
    category_aliases = {'card-art':'cards', 'king-badges':'ui_icons',
                        'ui-icons':'ui_icons', 'ui-frames':'ui_icons',
                        'ui-decor':'ui_icons', 'content-icons':'ui_icons', 'wilds':'decor'}
    category_order = ['units','buildings','thrones','bosses','cards','portraits',
                      'projectiles','vfx','terrain','plots','decor','ui_icons','menu','release']
    for row in items:
        row['category'] = 'bosses' if 'boss' in row['tags'] and row['kind'] == 'unit' else category_aliases.get(row['category'], row['category'])
    ids = [row['id'] for row in items]
    require(len(ids)==len(set(ids)), 'Duplicate planned IDs')
    require(not set(ids)&available.keys(), 'Planned IDs overlap manifest')
    items.sort(key=lambda row:(category_order.index(row['category']),row['id']))
    return dict(version=1, metadata=dict(pixelScale=2, availability='tools/asset-admin/manifest.json',
        categoryOrder=category_order, coverage=dict(manifestItems=len(available),cards=93,cardArtIncludingThrones=102,
        buildingBases=65,throneBases=9,unitBases=42,bosses=3,portraits=9,kingBadges=9,projectileFamilies=15,vfxFamilies=26,decorDesigns=20,uiIcons=44,uiFrames=14,uiDecor=2,optionalContentIcons=58),
        aliases=aliases, notes=['Ưu tiên theo yêu cầu người dùng: P0 nội dung G1–G3 (gồm 54 thẻ chinh phục và roster sáu vua); P1 Ngai G4, hai thẻ meta và biểu tượng độ khó; P2 sản xuất mở rộng/tùy chọn, skin UI và cài đặt/âm thanh G5.',
        'Manifest là nguồn khả dụng ảnh; procedural/concept không loại khỏi danh sách. Có ảnh không đồng nghĩa accepted.',
        'Kích thước là px ảnh: world ×2. UnitDef.sprite là nguồn chuẩn cho cả 42 quân; 0×0 nghĩa chưa chốt canvas, xem note.',
        'Không tính audio/font vì không phải raster. Không tạo icon riêng cho chữ cấp I–V hoặc ảnh nền mỗi màn.',
        'Perk chưa có runtime ID: gom một bộ tùy chọn 27 frame 0×0 chờ chốt ID/canvas. Các frame mở rộng/terrain/chân dung là đề xuất, chưa là helper runtime.',
        'Không nhân quân theo cấp công trình; expanded là 14 frame bổ sung, không phải bộ thứ hai 20 frame.']),items=items)


if __name__ == '__main__':
    result = build()
    output = ROOT / 'tools/asset-admin/planned.json'
    output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Written {len(result["items"])} planned items')
    print('Categories:',dict(Counter(r['category'] for r in result['items'])))
    print('Priorities:',dict(Counter(r['priority'] for r in result['items'])))
    print('Unknown canvas:',sum(r['w']==0 for r in result['items']))






