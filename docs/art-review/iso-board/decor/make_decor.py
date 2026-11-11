"""Small field decoration (P2 `decor` in tools/asset-admin/planned.json, 10/11/2026): prompts, runner and cutting.

    python docs/art-review/iso-board/decor/make_decor.py prompts [id ...]   # writes <id>/prompt.md and .superpowers/d.sh
    python docs/art-review/iso-board/decor/make_decor.py cut [id ...]       # source.png -> public/assets/art/ai-v1/iso/wilds/<id>.png
    python docs/art-review/iso-board/decor/make_decor.py cut --density 4 [id ...]   # HiDPI twin -> public/assets/art/ai-v1-hd/iso/wilds/
    python docs/art-review/iso-board/decor/make_decor.py cut --density 8 [id ...]   # close-up twin -> public/assets/art/ai-v1-uhd/iso/wilds/

The prompt is the "Prompt isometric dùng lại" block of docs/ART_STYLE.md (read through the buildings tool, never
copied here), with the approved style reference and the approved isometric building attached. Background: flat
magenta #FF00FF instead of black, so cutting leaves no dark rim (the old wilds had a maroon ring from black keying).
Cutting keys the magenta, crops, box-reduces (mask-weighted, alpha 0/255) to the object's target height in art px
(2 art px per world unit, like the other wilds) and writes a 4x preview next to the source. `--density 4` (11/11/2026)
cuts the same source to EXACTLY twice the density-2 size (4 art px per world unit) into ai-v1-hd/, without a preview;
`--density 8` (12/11/2026, close-up tier) to EXACTLY four times it (8 art px per world unit) into ai-v1-uhd/.
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
D = Path(__file__).resolve().parent
OUT = ROOT / 'public/assets/art/ai-v1/iso/wilds'
OUT_HD = ROOT / 'public/assets/art/ai-v1-hd/iso/wilds'
DENSITIES = (2, 4, 8)
OUT_DIRS = {4: OUT_HD, 8: ROOT / 'public/assets/art/ai-v1-uhd/iso/wilds'}
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'
ISO_REF = 'docs/art-review/style-references/iso-building-approved.png'

# id -> (subject, details, target height in art px)
DECOR = {
    'wild_barrel': ('a single wooden barrel standing upright', 'oak staves with two dark iron hoops, a round lid seen from above, warm brown wood', 30),
    'wild_haystack': ('a round haystack', 'a dome of golden straw tied with a rope band, a few loose straws at the base', 36),
    'wild_sign': ('a small wooden signpost', 'one post with a single plank sign pointing right, no letters on it, warm wood', 34),
    'wild_wheat_cart': ('a small two-wheeled wooden hand cart loaded with wheat sheaves', 'spoked wooden wheels, golden wheat bundles, handles to the left', 40),
    'wild_fence_ne': ('a short straight wooden fence segment running along the north-east diagonal axis', 'two posts and two rails, warm weathered wood, the rails follow the 2:1 diagonal exactly', 26),
    'wild_fence_nw': ('a short straight wooden fence segment running along the north-west diagonal axis', 'two posts and two rails, warm weathered wood, the rails follow the 2:1 diagonal exactly', 26),
    'wild_fence_se': ('a short straight wooden fence segment running along the south-east diagonal axis', 'two posts and two rails, warm weathered wood, the rails follow the 2:1 diagonal exactly', 26),
    'wild_fence_sw': ('a short straight wooden fence segment running along the south-west diagonal axis', 'two posts and two rails, warm weathered wood, the rails follow the 2:1 diagonal exactly', 26),
    'wild_fence_horizontal': ('a short straight wooden fence segment running left to right across the screen', 'three posts and two rails, warm weathered wood', 24),
    'wild_fence_vertical': ('a short straight wooden fence segment running straight up the screen (toward the viewer and away)', 'three posts and two rails seen end-on in a column, warm weathered wood', 34),
    'wild_gate': ('a small wooden farm gate between two posts, closed', 'plank gate with a diagonal brace, along the south-east diagonal axis, warm wood', 30),
}

FOOTER = """
PRODUCTION (overrides "transparent background" above): image 1024x1024, ONE flat solid magenta #FF00FF background
filling the whole canvas, no gradient, no ground patch, no grass under the object, no cast shadow on the background;
the object itself must not contain magenta. The object is small: draw it centred, filling about 70% of the canvas.
When done, print the saved path and the image size.
"""


def _buildings_tool():
    spec = importlib.util.spec_from_file_location('mp', ROOT / 'docs/art-review/g3e/buildings/make_prompts.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def prompt(decor_id: str, out: str) -> str:
    subject, details, _ = DECOR[decor_id]
    tpl = _buildings_tool().iso_template()
    body = tpl.replace('[subject]', f'{subject} (small field decoration)').replace('[Materials and identifying details.]', details + '.')
    head = (f"Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh "
            "nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.\n\n"
            "BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục \"Góc nhìn\" (isometric 2:1) và mục \"Quy tắc vẽ\". "
            f"Ảnh đính kèm: `{REFERENCE}` (phong cách) và `{ISO_REF}` (góc nhìn isometric đã duyệt).\n\n")
    return head + body + FOOTER


def prompts(ids):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for i in ids:
        d = D / i
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        (d / 'prompt.md').write_text(prompt(i, out), encoding='utf-8')
        p = (d / 'prompt.md').relative_to(ROOT).as_posix()
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {REFERENCE} -i {ISO_REF} - < {p} > .superpowers/codex-d-{i}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{i} ok" >> .superpowers/d.log; else echo "{i} MISSING" >> .superpowers/d.log; fi')
    runner.append('echo done >> .superpowers/d.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)
    (ROOT / '.superpowers/d.sh').write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(ROOT / '.superpowers/d.sh')


def cut_one(decor_id: str, times: int = 1) -> Image.Image:
    """The density-2 cut (times = 1), or its twin at `times` x its size (density / 2: 2 HiDPI, 4 close-up)."""
    a = np.array(Image.open(D / decor_id / 'source.png').convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    solid = ~((r > 150) & (b > 150) & (g < 110))
    ys, xs = np.where(solid)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    crop, m = a[y0:y1, x0:x1], solid[y0:y1, x0:x1].astype(np.float32)
    th = DECOR[decor_id][2]
    tw = max(1, round((x1 - x0) * th / (y1 - y0)))
    th, tw = th * times, tw * times
    mm = np.array(Image.fromarray(m, mode='F').resize((tw, th), Image.BOX))
    out = np.zeros((th, tw, 4), dtype=np.uint8)
    for k in range(3):
        wk = np.array(Image.fromarray((crop[..., k] * m).astype(np.float32), mode='F').resize((tw, th), Image.BOX))
        out[..., k] = np.clip(np.round(wk / np.maximum(mm, 1e-6)), 0, 255).astype(np.uint8)
    out[..., 3] = np.where(mm >= 0.5, 255, 0)
    out[out[..., 3] == 0] = 0
    return Image.fromarray(out, 'RGBA')


def cut(ids):
    if '--density' in ids:
        at = ids.index('--density')
        if ids[at + 1:at + 2] not in (['4'], ['8']):
            raise SystemExit('usage: make_decor.py cut [--density 4|8] [id ...]')
        density = int(ids[at + 1])
        ids = ids[:at] + ids[at + 2:] or list(DECOR)
        out_dir = OUT_DIRS[density]
        out_dir.mkdir(parents=True, exist_ok=True)
        for i in ids:
            im = cut_one(i, density // 2)
            im.save(out_dir / f'{i.removeprefix("wild_")}.png')
            print(i, im.size)
        return
    OUT.mkdir(parents=True, exist_ok=True)
    for i in ids:
        im = cut_one(i)
        name = i.removeprefix('wild_')
        im.save(OUT / f'{name}.png')
        prev = Image.new('RGBA', (im.width * 4 + 16, im.height * 4 + 16), (93, 155, 58, 255))
        prev.alpha_composite(im.resize((im.width * 4, im.height * 4), Image.NEAREST), (8, 8))
        prev.save(D / i / 'preview.png')
        print(i, im.size)


if __name__ == '__main__':
    cmd, ids = sys.argv[1], (sys.argv[2:] or list(DECOR))
    {'prompts': prompts, 'cut': cut}[cmd](ids)
