"""Review sheet for the isometric Wheat set (Task 11, 2026-11-06): every building (the approved Reapers barn
included), every plot state, the wall sample, and a small board mock-up at zoom 2. A preview of the AI sources,
not production sprites.

    python docs/art-review/iso-board/wheat/make_sheet.py
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from make_comparison import BG, INK, fit, font, key_black  # noqa: E402

ROOT = Path(__file__).resolve().parents[4]
D = ROOT / 'docs/art-review/iso-board'
W = D / 'wheat'

BUILDINGS = [
    ('building_wheat_reapers', 'Đội Thợ Gặt (đã duyệt)', D / 'sample-building/source.png'),
    ('building_wheat_militia', 'Dân Quân', None),
    ('building_wheat_peasant_horde', 'Khởi Nghĩa Nông Dân', None),
    ('building_wheat_granary', 'Kho Thóc', None),
    ('building_wheat_windmill', 'Cối Xay Gió', None),
    ('building_wheat_scarecrow', 'Bù Nhìn Gác', None),
    ('building_wheat_field', 'Ruộng Lúa', None),
    ('building_wheat_throne', 'Ngai Bó Lúa', None),
]
PLOTS = [
    ('open', 'Ô trống (đã duyệt)', D / 'sample-plot/source.png'),
    ('built', 'Ô đã xây (đã duyệt)', D / 'sample-plot-built/source.png'),
    ('locked', 'Ô khoá', W / 'plot_wheat_locked/source.png'),
    ('throne', 'Ô Ngai', W / 'plot_wheat_throne/source.png'),
]


def load(path: Path) -> Image.Image | None:
    return key_black(Image.open(path)) if path.exists() else None


def main() -> None:
    sheet = Image.new('RGBA', (1800, 1660), BG)
    draw = ImageDraw.Draw(sheet)
    title, label = font(30), font(18)
    draw.text((30, 20), 'Bộ Lúa Mì isometric — chờ chủ dự án duyệt (06/11/2026)', fill=INK, font=title)

    # Buildings: two rows of four, same height box.
    draw.text((30, 75), 'Công trình', fill=INK, font=label)
    houses: dict[str, Image.Image] = {}
    for i, (ident, cap, src) in enumerate(BUILDINGS):
        img = load(src or W / ident / 'source.png')
        x, y = 30 + (i % 4) * 440, 105 + (i // 4) * 380
        if img is None:
            draw.text((x, y + 150), f'{cap}: chưa có ảnh', fill=INK, font=label)
            continue
        houses[ident] = img
        t = fit(img, h=320) if img.height / 320 > img.width / 400 else fit(img, w=400)
        sheet.alpha_composite(t, (x + (400 - t.width) // 2, y + 320 - t.height))
        draw.text((x, y + 330), cap, fill=INK, font=label)

    # Plots in one row.
    draw.text((30, 880), 'Ô đất', fill=INK, font=label)
    tiles: dict[str, Image.Image] = {}
    for i, (state, cap, src) in enumerate(PLOTS):
        img = load(src)
        x = 30 + i * 440
        if img is None:
            draw.text((x, 960), f'{cap}: chưa có ảnh', fill=INK, font=label)
            continue
        tiles[state] = img
        t = fit(img, w=400)
        sheet.alpha_composite(t, (x, 910))
        draw.text((x, 1130), cap, fill=INK, font=label)

    # Wall sample.
    wall = load(W / 'terrain_wall_iso_sample/source.png')
    draw.text((30, 1170), 'Tường núi (mẫu đoạn)', fill=INK, font=label)
    if wall is not None:
        t = fit(wall, h=420)
        sheet.alpha_composite(t, (30, 1200))

    # Board mock-up at zoom 2: plot 64 world px -> 128x64 diamond, buildings drawn at 64 px wide.
    if {'open', 'built', 'locked', 'throne'} <= tiles.keys():
        draw.text((900, 1170), 'Ghép thử bàn 5×5 ở zoom 1 (thoi 128×64)', fill=INK, font=label)
        tw, th = 128, 64
        ox, top = 1300, 1210
        centre = lambda col, row: (ox + (col - row) * tw // 2, top + th // 2 + (col + row) * th // 2)
        layout = {(2, 0): ('throne', 'building_wheat_throne'), (1, 1): ('built', 'building_wheat_militia'),
                  (2, 1): ('built', 'building_wheat_windmill'), (3, 1): ('built', 'building_wheat_granary'),
                  (1, 2): ('built', 'building_wheat_reapers'), (2, 2): ('built', 'building_wheat_field'),
                  (3, 2): ('built', 'building_wheat_scarecrow'), (2, 3): ('built', 'building_wheat_peasant_horde')}
        for row in range(5):
            for col in range(5):
                inner = 1 <= col <= 3 and 1 <= row <= 3
                state = layout.get((col, row), ('open' if inner else 'locked', None))[0]
                t = fit(tiles[state], w=tw)
                cx, cy = centre(col, row)
                sheet.alpha_composite(t, (cx - t.width // 2, cy - th // 2))
        for row in range(5):
            for col in range(5):
                ident = layout.get((col, row), (None, None))[1]
                if ident is None or ident not in houses:
                    continue
                h = fit(houses[ident], w=64)
                cx, cy = centre(col, row)
                sheet.alpha_composite(h, (cx - h.width // 2, cy + 16 - h.height))

    out = W / 'sheet.png'
    sheet.convert('RGB').save(out)
    print(out)


if __name__ == '__main__':
    main()
