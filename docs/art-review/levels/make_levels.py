"""Building architecture for levels 2 and 3 (P2 `building_<card>_l2/_l3`, 10/11/2026): prompts, runner and cutting.

    python docs/art-review/levels/make_levels.py prompts <card|king> [...]   # writes <card>/l2|l3/prompt.md and .superpowers/lv.sh
    python docs/art-review/levels/make_levels.py cut <card|king> [...]       # -> public/assets/art/ai-v1/<base>_l2.png, _l3.png
    python docs/art-review/levels/make_levels.py cut --density 4 <card|king> # HiDPI: -> public/assets/art/ai-v1-hd/...
    python docs/art-review/levels/make_levels.py cut --density 8 <card|king> # close-up: -> public/assets/art/ai-v1-uhd/...

The prompt is the "Prompt isometric dùng lại" block of docs/ART_STYLE.md (read through the buildings tool), with the
approved style reference, the approved isometric building AND the building's own approved level-1 source attached:
the upgrade keeps the same building, footprint, materials and door side, and only grows it. Background: flat magenta
#FF00FF (no dark rim after cutting). Cutting keys the magenta, crops and box-reduces to the level-1 image's WIDTH (the
footprint stays one plot), so the taller levels grow upward. Preview: L1 / L2 / L3 side by side at 3x on grass.
"""
import importlib.util
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
D = Path(__file__).resolve().parent
ART = ROOT / 'public/assets/art/ai-v1'
# HiDPI set (4 art px per world unit, drawn at scale 0.25) and close-up set (8, scale 0.125): same file names; cut
# against that set's level-1 image's width.
ART_SETS = {2: ART, 4: ROOT / 'public/assets/art/ai-v1-hd', 8: ROOT / 'public/assets/art/ai-v1-uhd'}
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'
ISO_REF = 'docs/art-review/style-references/iso-building-approved.png'
KINGS = ['wheat', 'stone', 'arcane', 'grove', 'tide', 'forge', 'clock', 'moon', 'nomad', 'neutral']

LEVEL_BRIEF = {
    2: ('LEVEL 2 (upgraded once)',
        'the SAME building after one upgrade: about 15% taller, a sturdier stone foundation course, one extra detail '
        'that shows growth (an added side room or lean-to, a second window row, a small banner or lantern in the '
        "kingdom colour), better roof (neater tiles or thicker thatch). Same footprint diamond, same materials, palette "
        'and door on the right (south-east) wall.'),
    3: ('LEVEL 3 (fully upgraded)',
        'the SAME building fully upgraded: about 30% taller than level 1, a dressed-stone base, an extra storey or a '
        'small tower or chimney, gold trim on the roof ridge, a proud banner in the kingdom colour and one '
        'distinctive flourish of the building\'s role. Clearly the grand version of the level-1 building, never a '
        'different building. Same footprint diamond, same materials, palette and door on the right (south-east) wall.'),
}

FOOTER = """
PRODUCTION (overrides "transparent background" above): image 1024x1024, ONE flat solid magenta #FF00FF background
filling the whole canvas, no gradient, no ground patch outside the building's own footprint, no cast shadow on the
background; the building itself must not contain magenta. Draw it centred with padding, the whole building visible.
When done, print the saved path and the image size.
"""


def _buildings_tool():
    spec = importlib.util.spec_from_file_location('mp', ROOT / 'docs/art-review/g3e/buildings/make_prompts.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def image_buildings() -> dict[str, str]:
    """card id -> base file under ai-v1 (without .png), read from src/render/imageArt.ts (IMAGE_BUILDINGS)."""
    text = (ROOT / 'src/render/imageArt.ts').read_text(encoding='utf-8')
    out = {}
    approved = re.search(r'G5_ART_APPROVED[^=]*=\s*\{(.*?)\n\};', text, re.S)
    if approved:
        for card in re.findall(r"'([a-z]+_[a-z_]+)'", approved.group(1)):
            out[card] = f'iso/{card}'
    block = re.search(r'IMAGE_BUILDINGS[^=]*=\s*\{(.*?)\n\};', text, re.S)
    for card, file in re.findall(r"\b([a-z]+_[a-z_]+): '([^']+)'", block.group(1)):
        out[card] = file
    return out


def base_source(card: str) -> Path | None:
    king = card.split('_', 1)[0]
    for p in (ROOT / f'docs/art-review/iso-board/{king}/building_{card}/source.png',
              ROOT / f'docs/art-review/g5/{king}/{card}/source.png',
              ROOT / f'docs/art-review/neutral-iso/{card}/source.png',
              # the approved isometric sample of 2026-11-06 is the Wheat reapers' house
              *([ROOT / 'docs/art-review/iso-board/sample-building/source.png'] if card == 'wheat_reapers' else [])):
        if p.exists():
            return p
    return None


def cards_of(args: list[str]) -> list[str]:
    known = image_buildings()
    out = []
    for a in args:
        out += sorted(c for c in known if c.startswith(a + '_')) if a in KINGS else [a]
    for c in out:
        if c not in known:
            raise SystemExit(f'{c}: no base image in IMAGE_BUILDINGS')
    return out


def prompt(card: str, level: int, out: str, src: Path) -> str:
    title, brief = LEVEL_BRIEF[level]
    body = _buildings_tool().iso_template().replace(
        '[subject]', f'{card} building, {title}').replace('[Materials and identifying details.]', brief)
    head = (f"Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh "
            "nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.\n\n"
            "BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục \"Góc nhìn\" (isometric 2:1, mái đúng trục) và mục "
            f"\"Quy tắc vẽ\". Ảnh đính kèm: `{REFERENCE}` (phong cách), `{ISO_REF}` (góc nhìn isometric đã duyệt) và "
            f"`{src.relative_to(ROOT).as_posix()}` (CHÍNH công trình này ở cấp 1, đã duyệt: giữ nguyên công trình, chất liệu, "
            "bảng màu, hướng cửa; chỉ nâng cấp).\n\n")
    return head + body + FOOTER


def prompts(args):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for card in cards_of(args):
        src = base_source(card)
        if src is None:
            print(card, 'SKIP: no level-1 source found')
            continue
        for lv in (2, 3):
            d = D / card / f'l{lv}'
            d.mkdir(parents=True, exist_ok=True)
            out = (d / 'source.png').relative_to(ROOT).as_posix()
            (d / 'prompt.md').write_text(prompt(card, lv, out, src), encoding='utf-8')
            p = (d / 'prompt.md').relative_to(ROOT).as_posix()
            s = src.relative_to(ROOT).as_posix()
            runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {REFERENCE} -i {ISO_REF} -i {s} - < {p} > .superpowers/codex-lv-{card}-{lv}.out 2>&1')
            runner.append(f'if [ -s {out} ]; then echo "{card} l{lv} ok" >> .superpowers/lv.log; else echo "{card} l{lv} MISSING" >> .superpowers/lv.log; fi')
    runner.append('echo done >> .superpowers/lv.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)
    (ROOT / '.superpowers/lv.sh').write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(ROOT / '.superpowers/lv.sh')


def background_mask(a: np.ndarray) -> np.ndarray:
    """Magenta-like pixels CONNECTED TO THE IMAGE BORDER. A loose colour key alone also ate violet roofs and pink
    stone inside the building (review 10/11/2026: Arcane roofs came out striped with holes)."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    cand = (r > 150) & (b > 150) & (g < 110)
    # grow the border seed through candidate pixels (4-neighbour dilation until stable; numpy only)
    bg = np.zeros_like(cand)
    bg[0, :], bg[-1, :], bg[:, 0], bg[:, -1] = cand[0, :], cand[-1, :], cand[:, 0], cand[:, -1]
    while True:
        grown = bg.copy()
        grown[1:, :] |= bg[:-1, :]
        grown[:-1, :] |= bg[1:, :]
        grown[:, 1:] |= bg[:, :-1]
        grown[:, :-1] |= bg[:, 1:]
        grown &= cand
        if (grown == bg).all():
            # plus pure-magenta pockets trapped inside the object (between crane arms…): far from any violet paint
            return bg | ((r > 225) & (b > 225) & (g < 45))
        bg = grown


def cut_one(src: Path, width: int, height: int | None = None) -> Image.Image:
    a = np.array(Image.open(src).convert('RGB')).astype(float)
    solid = ~background_mask(a)
    ys, xs = np.where(solid)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    crop, m = a[y0:y1, x0:x1], solid[y0:y1, x0:x1].astype(np.float32)
    tw = width
    th = height or max(1, round((y1 - y0) * tw / (x1 - x0)))
    mm = np.array(Image.fromarray(m, mode='F').resize((tw, th), Image.BOX))
    out = np.zeros((th, tw, 4), dtype=np.uint8)
    for k in range(3):
        wk = np.array(Image.fromarray((crop[..., k] * m).astype(np.float32), mode='F').resize((tw, th), Image.BOX))
        out[..., k] = np.clip(np.round(wk / np.maximum(mm, 1e-6)), 0, 255).astype(np.uint8)
    out[..., 3] = np.where(mm >= 0.5, 255, 0)
    out[out[..., 3] == 0] = 0
    return Image.fromarray(out, 'RGBA')


def cut(args):
    """`--density 4|8` cuts into that density's set against its level-1 image (make it first with the level-1
    exporter at the same density) at exactly density / 2 times the shipped L2/L3 height; the review preview is written
    only for the default density."""
    density = 2
    if '--density' in args:
        i = args.index('--density')
        density, args = int(args[i + 1]), args[:i] + args[i + 2:]
    if density not in ART_SETS:
        raise SystemExit('--density must be 2, 4 or 8')
    art = ART_SETS[density]
    files = image_buildings()
    for card in cards_of(args):
        base = Image.open(art / f'{files[card]}.png').convert('RGBA')
        ims = [base]
        for lv in (2, 3):
            src = D / card / f'l{lv}' / 'source.png'
            if not src.exists():
                print(card, f'l{lv} missing')
                continue
            # HD/UHD: exactly density / 2 times the shipped L2/L3 image (same world footprint and feet), when that one exists
            shipped = ART / f'{files[card]}_l{lv}.png'
            if density != 2 and not shipped.exists():
                print(card, f'l{lv}: no published density-2 image, no HD twin')
                continue
            h = Image.open(shipped).height * density // 2 if density != 2 else None
            im = cut_one(src, base.width, h)
            im.save(art / f'{files[card]}_l{lv}.png')
            ims.append(im)
        if density != 2:
            print(card, [i.size for i in ims])
            continue
        S, pad = 3, 8
        w = sum(i.width * S + pad for i in ims) + pad
        h = max(i.height for i in ims) * S + 2 * pad
        prev = Image.new('RGBA', (w, h), (93, 155, 58, 255))
        x = pad
        for i in ims:
            prev.alpha_composite(i.resize((i.width * S, i.height * S), Image.NEAREST), (x, h - pad - i.height * S))
            x += i.width * S + pad
        (D / card).mkdir(parents=True, exist_ok=True)
        prev.save(D / card / 'preview.png')
        print(card, [i.size for i in ims])


def register(args):
    """Adds approved L2/L3 images to `IMAGE_BUILDING_LEVELS` (src/render/imageArt.ts) and docs/assets.manifest.yml."""
    files = image_buildings()
    art_ts = ROOT / 'src/render/imageArt.ts'
    text = art_ts.read_text(encoding='utf-8')
    m = re.search(r'(export const IMAGE_BUILDING_LEVELS[^=]*= \{)(.*?)(\};)', text, re.S)
    current = dict(re.findall(r"\s*([a-z_]+): \[([^\]]*)\]", m.group(2)))
    manifest = ROOT / 'docs/assets.manifest.yml'
    mtext = manifest.read_text(encoding='utf-8')
    if not mtext.endswith('\n'):
        mtext += '\n'
    for card in cards_of(args):
        levels = [lv for lv in (2, 3) if (ART / f'{files[card]}_l{lv}.png').exists()]
        if not levels:
            continue
        current[card] = ', '.join(str(lv) for lv in levels)
        for lv in levels:
            path = f'public/assets/art/ai-v1/{files[card]}_l{lv}.png'
            if f'path: {path}\n' in mtext:
                continue
            w, h = Image.open(ROOT / path).size
            mtext += f"""  - id: building_{card}_l{lv}_iso
    path: {path}
    category: building
    origin: custom
    source: docs/art-review/levels/{card}/l{lv}/source.png
    creator: Project owner (OpenAI imagegen via Codex; prompt in docs/art-review/levels/{card}/l{lv}/prompt.md)
    license: project-owned
    attribution: false
    redistribute: true
    evidence: docs/art-review/levels/review.md
    modified: true
    nativeSize: 1024x1024
    finalSize: {w}x{h}
    anchor: feet
    notes: Level {lv} architecture of {card} (P2, 2026-11-10), magenta keyed and reduced to the level-1 width by docs/art-review/levels/make_levels.py; approved by Claude under the owner's delegation
"""
    body = ''.join(f'\n  {card}: [{lv}],' for card, lv in sorted(current.items()))
    text = text[:m.start(2)] + (body + '\n' if body else '') + text[m.end(2):]
    art_ts.write_text(text, encoding='utf-8')
    manifest.write_text(mtext, encoding='utf-8')
    print('registered', len(current))


if __name__ == '__main__':
    cmd, rest = sys.argv[1], sys.argv[2:]
    {'prompts': prompts, 'cut': cut, 'register': register}[cmd](rest)
