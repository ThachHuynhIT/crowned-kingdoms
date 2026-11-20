"""Codex prompts for the menu / release pictures still missing after G5 (2026-11-20, branch art/remaining-images).

    python docs/art-review/g5/menu/make_extra_prompts.py [id ...]

ids: menu_near, menu_logo, menu_win, menu_lose (-> docs/art-review/g5/menu/<id>/) and release_app_icon
(-> docs/art-review/release/<id>/). One sample per new kind; the owner (Claude by delegation) reviews before the rest.

Nothing about the style is written here from memory:
- menu_near reuses the approved menu-layer frame of make_prompts.py (HEADER + BODY, the one that produced hills_far /
  hills_mid / sky), only with a new layer description;
- the other ids take the same HEADER (tells Codex to read docs/ART_STYLE.md) plus the "Prompt mẫu dùng lại" block read
  from docs/ART_STYLE.md through docs/art-review/g3e/buildings/make_prompts.py style_template() for every building
  they show, then the per-picture brief.
Every prompt attaches the approved harvester-house reference and the approved menu art (sky, hills) so the colours
match the menu. Writes prompt.md next to each future source.png and a runner .superpowers/menu-extra.sh.
"""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
MENU = 'docs/art-review/g5/menu'
RELEASE = 'docs/art-review/release'
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'
CARD_REF = 'docs/art-review/style-references/card-art-approved.png'
SKY = f'{MENU}/sky/source.png'
FAR = f'{MENU}/hills_far/source.png'
MID = f'{MENU}/hills_mid/source.png'
WIN = f'{MENU}/menu_win/source.png'


def _load(rel, name):
    spec = importlib.util.spec_from_file_location(name, ROOT / rel)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


menu_tool = _load(f'{MENU}/make_prompts.py', 'menu_make_prompts')
building_tool = _load('docs/art-review/g3e/buildings/make_prompts.py', 'building_make_prompts')

NEAR = ('near layer (the closest foreground strip)',
        'it is the closest foreground, in front of the approved middle countryside layer (attached: hills_mid), so it '
        'must stay LOW and must not hide that layer\'s fields, windmill and cottages.',
        'one sixth',
        'a low foreground strip of tall grass tufts, wildflowers (small yellow, white and pink clusters), two or three '
        'round bushes and a short broken wooden fence with a leaning post; a little darker and more saturated than the '
        'middle layer (deep warm green, olive, plum shade) with a warm orange rim of dusk light along the top edges; '
        'NOT a black silhouette, the colours of the plants must still read.')

MENU_COLOURS = ('Colours must match the attached approved menu art: the dusk sky (apricot #F6B26B, orange #F08A5D, '
                'rose #B85C7A, violet #6B4A8A) and the hazy violet mountains and green-olive countryside of the hills.')

STYLE_LEAD = ('STYLE BASE — the "Prompt mẫu dùng lại" block of docs/ART_STYLE.md, quoted verbatim below. It sets the '
              'camera, lighting and pixel style for EVERY building that appears in this picture (castle, keep, towers); '
              'the lines after it say what this picture is and override only its framing, background and output size:')

BRIEFS = {
    'menu_logo': dict(dir=MENU, refs=[REFERENCE, SKY, MID], building='a small royal castle keep crowned with gold', body="""
THIS PICTURE: the GAME EMBLEM for the Crowned Kingdoms title screen (an original heraldic crest, NOT a copy or pastiche of any existing game's logo: no shield-and-sword layout of famous strategy games, no swooshes, no metallic 3D bevel, no glossy mobile-game style).
Composition, centred and roughly symmetric left-right: a broad heater shield in warm wood brown with a cream parchment field; on the field a tiny front-facing castle keep (same camera as the style base: straight-on, roof/top seen from above) under a golden crown with NINE small points; behind the shield two crossed golden wheat sheaves; across the lower part a VERY WIDE EMPTY cream ribbon banner: its straight middle band runs well PAST the shield on BOTH sides (the band is about 1.6 times as wide as the shield and tall enough for one line of large title text, i.e. room for a two-word title such as two long words side by side), with curled forked ends beyond that; NO letters on it (the game writes the title in code, so the ribbon stays blank). (Redo 2026-11-20: the first sample's ribbon was too narrow; keep everything else of that emblem.) A thin dark-brown outline and the cosy Stardew-like warm wood and cream palette of the game's UI; one small blue accent (a pennant on the keep) and one small red accent (a gem in the crown).
Output: 1536x1024 px, the emblem centred, the ribbon filling about 90% of the width and 85% of the height, padding all round; each art pixel about 6x6 source pixels (the emblem will be reduced to about 256 px wide), crisp square pixel clusters.
Background: ONE flat solid magenta #FF00FF everywhere outside the emblem, no glow, no drop shadow on the background; the emblem itself contains no magenta.
NO text, letters, numbers, runes that look like letters, watermark, people, blur, antialiasing, soft glow or smooth gradients.
"""),
    'menu_win': dict(dir=MENU, refs=[REFERENCE, CARD_REF, SKY, FAR, MID], building='the player\'s small castle with tall towers', body="""
THIS PICTURE: the VICTORY backdrop shown full screen behind the end-of-run result panel (the panel covers the CENTRE of the picture, so keep the centre calm: open golden sky and soft distant land, important things in the LEFT and RIGHT thirds).
Scene, wide landscape: the little kingdom triumphant at a golden sunrise. On the left third a cosy stone-and-timber castle on a gentle hill (front-facing per the style base), every tower flying a long blue-and-gold banner, a big golden crown emblem over its gate; on the right third a windmill and ripe golden wheat fields with festival bunting strung between poles; in the sky a few chunky pixel fireworks bursts (gold, cream, pale blue) and drifting petals; distant violet mountains along the horizon like the attached hills_far. Warm, joyful, cosy.
""" + MENU_COLOURS.replace('dusk sky', 'dusk sky (here brighter, a golden-apricot dawn)') + """
Output: 1536x1024 px (3:2), full-bleed scene, no border, no vignette; each art pixel about 4x4 source pixels (it will be reduced to 384x256 like the menu sky), crisp square pixel clusters, flat colour bands with sparse dithering.
NO text, letters, numbers, UI, frame, watermark, people, animals, blur, antialiasing, soft glow or smooth gradients.
"""),
    'menu_lose': dict(dir=MENU, refs=[REFERENCE, WIN, CARD_REF, SKY, FAR, MID], building='the same small castle, now damaged', body="""
REDO 2026-11-20: the attached `docs/art-review/g5/menu/menu_win/source.png` is the APPROVED victory backdrop. This defeat picture is its PAIR: draw the SAME three-tower castle from menu_win (same shape, same position in the left third, same size, same front-facing camera) and the SAME framing of the whole scene (same horizon, same hill line, windmill area on the right), now damaged at night. The first attempt drew a small cottage instead of the castle: that is wrong.
THIS PICTURE: the DEFEAT backdrop shown full screen behind the end-of-run result panel (the panel covers the CENTRE of the picture, so keep the centre calm: dark open sky and soft distant land, important things in the LEFT and RIGHT thirds).
Scene, wide landscape: the little kingdom has fallen, at night after the battle. On the left third the castle of menu_win, damaged: one of its side towers broken off with fallen stones, roof tiles missing, its blue-and-gold banners torn and hanging limp, the crown emblem over the gate dark, thin grey smoke columns rising; on the right third trampled wheat fields, a broken wooden fence and a fallen golden crown lying in the grass catching a little moonlight; a pale crescent moon and a few stars in a cold violet-indigo sky, low clouds; faint embers. Sad and quiet but still the game's cosy style, NOT gory: no bodies, no blood, no skulls.
Colours: the violet end of the attached menu sky (#6B4A8A) darkening to deep indigo and plum, cool moonlight, a few small warm ember accents; the distant mountains like the attached hills_far but darker.
Output: 1536x1024 px (3:2), full-bleed scene, no border, no vignette; each art pixel about 4x4 source pixels (it will be reduced to 384x256 like the menu sky), crisp square pixel clusters, flat colour bands with sparse dithering.
NO text, letters, numbers, UI, frame, watermark, people, animals, blur, antialiasing, soft glow or smooth gradients.
"""),
    'release_app_icon': dict(dir=RELEASE, refs=[REFERENCE, SKY, MID], building='a small royal castle keep crowned with gold', body="""
THIS PICTURE: the APP ICON of Crowned Kingdoms (installed PWA icon; the 192/512 icons, the maskable icon and the favicon will all be cut from this one design, so it must read at 32x32 and survive a circular mask).
Composition: a SQUARE icon. Full-bleed background filling the whole canvas: the dusk sky of the attached menu art (apricot at the top through orange and rose to violet at the bottom) in flat dithered bands, with a strip of the green-olive hills along the bottom. Centred motif inside the central 70% of the canvas (the outer 15% on every side may be cut off by a mask, so nothing important there): one chunky front-facing castle keep (style base camera: straight-on, its crenellated top seen from above) with a blue pennant, under a big golden crown with a red gem that overlaps the top of the keep. Very bold simple shapes, thick dark material-coloured outlines, strong silhouette, few small details.
Output: 1024x1024 px; each art pixel about 16x16 source pixels (the icon is designed on a 64x64 art grid), crisp square pixel clusters, no rounded-corner frame drawn into the image (the platform masks it).
NO text, letters, numbers, watermark, people, blur, antialiasing, soft glow or smooth gradients.
"""),
}

IDS = ['menu_near', *BRIEFS]


def out_dir(ident):
    return f'{RELEASE}/{ident}' if ident.startswith('release_') else f'{MENU}/{ident}'


def build_prompt(ident):
    out = f'{out_dir(ident)}/source.png'
    header = menu_tool.HEADER.format(out=out, doc=menu_tool.STYLE_DOC, ref=REFERENCE)
    if ident == 'menu_near':
        name, depth, ridge, visual = NEAR
        refs_note = (f'Ảnh đính kèm thêm (đã duyệt, đang chạy trong menu): `{SKY}` (trời), `{MID}` (lớp giữa). Lớp mới '
                     'phải hợp màu với hai ảnh này và đặt TRƯỚC lớp giữa.\n\n')
        return header + refs_note + menu_tool.BODY.format(name=name, depth=depth, ridge=ridge, visual=visual)
    brief = BRIEFS[ident]
    extra = [r for r in brief['refs'] if r != REFERENCE]
    refs_note = ('Ảnh đính kèm thêm (đã duyệt): ' + ', '.join(f'`{r}`' for r in extra) +
                 ' — lấy bảng màu và độ chi tiết của menu từ đây; không chép nguyên cảnh.\n\n')
    template = building_tool.style_template().replace('[building and function]', brief['building'])
    template = template.replace('[Materials and identifying tools.]', 'Warm stone, wood and gold.')
    return header + refs_note + STYLE_LEAD + '\n\n```text\n' + template + '```\n' + brief['body']


def refs_for(ident):
    return [REFERENCE, SKY, MID] if ident == 'menu_near' else BRIEFS[ident]['refs']


def main(only=None):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for ident in IDS:
        if only and ident not in only:
            continue
        d = ROOT / out_dir(ident)
        d.mkdir(parents=True, exist_ok=True)
        (d / 'prompt.md').write_text(build_prompt(ident), encoding='utf-8')
        prompt = f'{out_dir(ident)}/prompt.md'
        imgs = ' '.join(f'-i {r}' for r in refs_for(ident))
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" --json {imgs} - < {prompt} > .superpowers/m-codex-{ident}.out 2>&1')
        runner.append(f'if [ -s {out_dir(ident)}/source.png ]; then echo "{ident} ok" >> .superpowers/m-menu-extra.log; '
                      f'else echo "{ident} MISSING" >> .superpowers/m-menu-extra.log; fi')
    runner.append('echo done >> .superpowers/m-menu-extra.log')
    path = ROOT / '.superpowers/m-menu-extra.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1:] or None)
