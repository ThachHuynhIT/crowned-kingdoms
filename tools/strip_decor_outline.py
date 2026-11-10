"""Remove the dark maroon outline ring baked into the field decoration PNGs (owner 10/11/2026).

The wild objects (`public/assets/art/ai-v1/iso/wilds/*.png`) were black keyed from the wilds sheet and carry a
1-3 px dark red rim on their alpha edge. This peels that rim: in each pass, every opaque pixel that touches a
transparent pixel (4-neighbourhood, or the image border) and has the outline colour becomes fully transparent.
Inner dark details are never touched: only pixels on the current alpha edge are tested. No new art is drawn.

Usage:
    python tools/strip_decor_outline.py --backup docs/art-review/decor-outline/originals \\
        public/assets/art/ai-v1/iso/wilds/*.png

The first run copies each original into the backup folder; every run starts from that kept original, so running it
twice gives the same files. Roll back by copying the originals back.
"""

import argparse
import shutil
import sys
from pathlib import Path

from PIL import Image

DEFAULT_PASSES = 3


def is_outline_colour(r, g, b):
    """The rim colour: a dark, saturated maroon (red well above green and blue, all of it dark)."""
    return 40 <= r <= 150 and g <= 50 and b <= 70 and r >= 2 * g + 20 and r > b


def strip_outline(image, passes=DEFAULT_PASSES):
    """A copy of `image` with up to `passes` outline rings made transparent, and the number of pixels removed."""
    im = image.convert('RGBA').copy()
    w, h = im.size
    px = im.load()
    removed = 0
    for _ in range(passes):
        kill = []
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a == 0 or not is_outline_colour(r, g, b):
                    continue
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h or px[nx, ny][3] == 0:
                        kill.append((x, y))
                        break
        if not kill:
            break
        for x, y in kill:
            px[x, y] = (0, 0, 0, 0)
        removed += len(kill)
    # Stray rim-coloured specks the rings leave behind: at most one opaque 4-neighbour.
    while True:
        stray = []
        for y in range(h):
            for x in range(w):
                if px[x, y][3] == 0:
                    continue
                near = sum(
                    1
                    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] != 0
                )
                if near <= 1 and is_outline_colour(*px[x, y][:3]):
                    stray.append((x, y))
        if not stray:
            break
        for x, y in stray:
            px[x, y] = (0, 0, 0, 0)
        removed += len(stray)
    return im, removed


def process_files(files, backup_dir, passes=DEFAULT_PASSES):
    """Strip every file in place, keeping (and reading from) its original in `backup_dir`. Returns {name: removed}."""
    backup_dir = Path(backup_dir)
    backup_dir.mkdir(parents=True, exist_ok=True)
    report = {}
    for f in sorted(Path(p) for p in files):
        original = backup_dir / f.name
        if not original.exists():
            shutil.copy2(f, original)
        with Image.open(original) as src:
            out, removed = strip_outline(src, passes)
        out.save(f)
        report[f.name] = removed
    return report


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--backup', required=True, help='folder that keeps the untouched originals')
    ap.add_argument('--passes', type=int, default=DEFAULT_PASSES)
    ap.add_argument('files', nargs='+')
    args = ap.parse_args(argv)
    for name, removed in process_files(args.files, args.backup, args.passes).items():
        print(f'{name}: {removed} outline px removed')
    return 0


if __name__ == '__main__':
    sys.exit(main())
