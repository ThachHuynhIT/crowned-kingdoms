"""Comparison sheet for the isometric sample gate (2026-11-06): current front-view art next to the two
isometric samples, and the samples tiled into a 3x3 board at zoom 2 (a preview, not production sprites).

    python docs/art-review/iso-board/make_comparison.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
D = ROOT / 'docs/art-review/iso-board'
ART = ROOT / 'public/assets/art/ai-v1'
REF = ROOT / 'docs/art-review/style-references/harvester-house-front-approved.png'
BG = (46, 34, 26)
INK = (245, 232, 205)


def key_black(img: Image.Image, threshold: int = 24) -> Image.Image:
    """Black background -> alpha 0, everything else alpha 255; cropped to the content."""
    img = img.convert('RGBA')
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, _ = px[x, y]
            px[x, y] = (r, g, b, 0 if max(r, g, b) < threshold else 255)
    return img.crop(img.getbbox())


def fit(img: Image.Image, w: int | None = None, h: int | None = None, nearest: bool = False) -> Image.Image:
    k = (w / img.width) if w else (h / img.height)
    size = (max(1, round(img.width * k)), max(1, round(img.height * k)))
    return img.resize(size, Image.NEAREST if nearest else Image.BOX)


def font(size: int) -> ImageFont.ImageFont:
    for f in ('C:/Windows/Fonts/arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if Path(f).exists():
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def main() -> None:
    building = key_black(Image.open(D / 'sample-building/source.png'))
    plot = key_black(Image.open(D / 'sample-plot/source.png'))
    built = key_black(Image.open(D / 'sample-plot-built/source.png'))
    sheet = Image.new('RGBA', (1500, 1300), BG)
    draw = ImageDraw.Draw(sheet)
    title, label = font(30), font(20)

    draw.text((30, 20), 'Mẫu isometric 2:1, bản 2 — chờ chủ dự án duyệt (06/11/2026)', fill=INK, font=title)

    # Row 1: what the game uses now (front view, 45 degrees)
    draw.text((30, 80), 'Hiện tại (chính diện 45°)', fill=INK, font=label)
    x = 30
    for img, cap in (
        (fit(Image.open(REF).convert('RGBA'), h=280), 'Mẫu đã duyệt (Thợ Gặt)'),
        (fit(Image.open(ART / 'wheat_reapers.png').convert('RGBA'), h=280, nearest=True), 'Sprite trong game'),
        (fit(Image.open(ART / 'plots/wheat_open.png').convert('RGBA'), h=280, nearest=True), 'Ô đất trong game'),
    ):
        sheet.alpha_composite(img, (x, 115))
        draw.text((x, 405), cap, fill=INK, font=label)
        x += img.width + 40

    # Row 2: the isometric samples
    draw.text((30, 460), 'Mẫu isometric mới (ảnh nguồn thu nhỏ)', fill=INK, font=label)
    b2 = fit(building, h=300)
    sheet.alpha_composite(b2, (30, 495))
    draw.text((30, 805), 'Thợ Gặt (cửa bên phải)', fill=INK, font=label)
    x = 30 + b2.width + 40
    for img, cap in ((plot, 'Ô đất mở'), (built, 'Ô đã xây (sân lát đá)')):
        p2 = fit(img, w=400)
        sheet.alpha_composite(p2, (x, 495 + (300 - p2.height) // 2))
        draw.text((x, 805), cap, fill=INK, font=label)
        x += 400 + 30

    # Row 3: a 3x3 board at zoom 3 — plot 64 world px -> diamond 192x96, building 32 world px wide -> 96 px
    draw.text((30, 860), 'Thử ghép bàn 3×3 ở zoom 3 (nhà giữa ô lát đá, cửa bên phải, lính đứng trước cửa)', fill=INK, font=label)
    tw, th = 192, 96
    tile = fit(plot, w=tw)
    paved = fit(built, w=tw)
    ox, top = 750, 930
    centre = lambda col, row: (ox + (col - row) * tw // 2, top + th // 2 + (col + row) * th // 2)
    houses = ((1, 1), (0, 2), (2, 0))
    for row in range(3):
        for col in range(3):
            cx, cy = centre(col, row)
            t = paved if (col, row) in houses else tile
            sheet.alpha_composite(t, (cx - t.width // 2, cy - th // 2))
    house = fit(building, w=96)
    for col, row in houses:
        cx, cy = centre(col, row)
        # house in the middle of the plot: its 32x32 world footprint's bottom corner is 8 iso px below the centre (x3)
        fx, fy = cx, cy + 24
        sheet.alpha_composite(house, (fx - house.width // 2, fy - house.height))

    out = D / 'sample-comparison.png'
    sheet.convert('RGB').save(out)
    print(out)


if __name__ == '__main__':
    main()
