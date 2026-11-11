"""Contact sheet of one king's G5 set for review: `python docs/art-review/g5/make_sheet.py <king>` → <king>/sheet.png.

Every source (throne, buildings, plots) black-cropped and scaled to a 280 px cell, with its folder name underneath.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
G5 = ROOT / 'docs/art-review/g5'
CELL = 280
COLS = 5


def main(king: str) -> None:
    items = sorted(d for d in (G5 / king).iterdir() if d.is_dir() and (d / 'source.png').exists())
    rows = (len(items) + COLS - 1) // COLS
    sheet = Image.new('RGB', (COLS * (CELL + 10) + 10, rows * (CELL + 30) + 10), (40, 36, 44))
    draw = ImageDraw.Draw(sheet)
    for i, d in enumerate(items):
        im = Image.open(d / 'source.png').convert('RGB')
        box = im.point(lambda v: 255 if v > 24 else 0).getbbox() or (0, 0, *im.size)
        im = im.crop(box)
        k = min(CELL / im.width, CELL / im.height)
        im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.NEAREST)
        x0 = 10 + (i % COLS) * (CELL + 10)
        y0 = 10 + (i // COLS) * (CELL + 30)
        sheet.paste(im, (x0 + (CELL - im.width) // 2, y0 + (CELL - im.height) // 2))
        draw.text((x0, y0 + CELL + 6), d.name, fill=(230, 220, 200))
    out = G5 / king / 'sheet.png'
    sheet.save(out)
    print(out)


if __name__ == '__main__':
    main(sys.argv[1])
