"""Wire the pictures `run-art.sh` produced into the game (no Codex, no Claude needed).

    python tools/codex-handoff/integrate.py            # environment objects + building loops
    python tools/codex-handoff/integrate.py --dry-run  # only print what would change

- Environment objects: every object in docs/art-review/env/catalog.json not yet in `DECOR_CATALOG`
  (src/render/imageArt.ts) is copied to public/assets/art/ai-v1*/iso/wilds/ and appended to the catalog.
- Building loops: every card (re)drawn by run-art.sh (marker `handoff-done`) with frames at all three densities, not
  yet in `IMAGE_BUILDING_ANIMS`, and passes the automatic check (static drift <= 6 %, at least one frame changing >= 3 %,
  frame no more than 10 px taller than the shipped picture) is copied next to its base picture and listed.
- Then the asset manifest is refreshed by docs/art-review/env/register.py and docs/art-review/building-anim/register.py.

Afterwards run the gate (npm run lint && npm run typecheck && npm test && npm run build, and
python -m unittest discover -s tools -p "test_*.py") and look at the game; the owner prunes what he dislikes.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ART_TS = ROOT / 'src/render/imageArt.ts'
ENV = ROOT / 'docs/art-review/env'
ANIM = ROOT / 'docs/art-review/building-anim'
TIERS = (('sd', 'ai-v1', ''), ('hd', 'ai-v1-hd', 'hd/'), ('uhd', 'ai-v1-uhd', 'uhd/'))
DRY = '--dry-run' in sys.argv


def catalog_block(text: str) -> tuple[int, int]:
    start = text.index('export const DECOR_CATALOG')
    return start, text.index('];', start)


def env_objects(text: str) -> str:
    start, end = catalog_block(text)
    have = set(re.findall(r"id: '([a-z_0-9]+)'", text[start:end]))
    new = [o for o in json.loads((ENV / 'catalog.json').read_text(encoding='utf-8')) if o['id'] not in have]
    ready = [o for o in new if all((ENV / f'objects/{o["id"]}/runtime/{t}/{o["id"]}.png').exists() for t, _, _ in TIERS)]
    print(f'environment objects: {len(ready)} new (of {len(new)} not in the game)')
    if DRY or not ready:
        return text
    for o in ready:
        for tier, folder, _ in TIERS:
            dst = ROOT / f'public/assets/art/{folder}/iso/wilds/{o["id"]}.png'
            shutil.copy2(ENV / f'objects/{o["id"]}/runtime/{tier}/{o["id"]}.png', dst)
    lines = ''.join(f"  {{ id: '{o['id']}', tall: {'true' if o['tall'] else 'false'}, radius: {o['radius']} }},\n" for o in ready)
    return text[:end] + '  // environment objects added by tools/codex-handoff/integrate.py\n' + lines + text[end:]


def base_of(card: str) -> str | None:
    for d in ('iso', 'iso-neutral'):
        if (ROOT / f'public/assets/art/ai-v1/{d}/{card}.png').exists():
            return f'{d}/{card}'
    return None


def building_loops(text: str) -> str:
    m = re.search(r'export const IMAGE_BUILDING_ANIMS: readonly string\[\] = \[(.*?)\];', text, re.S)
    have = set(re.findall(r"'([a-z_0-9]+)'", m.group(1)))
    picked = []
    for meta in sorted(ANIM.glob('*/anim.json')):
        card = meta.parent.name
        # only cards (re)drawn by run-art.sh: older cards were reviewed by hand (rejected ones stay out)
        if card in have or card == 'wheat_windmill' or not (meta.parent / 'handoff-done').exists():
            continue
        d = json.loads(meta.read_text(encoding='utf-8'))
        ok = d['drift'] <= 6 and max(d['frame1'], d['frame2']) >= 3 and d['size'][1] - d['shipped'][1] <= 10
        files = [ANIM / f'{card}/{sub}{card}_anim_{i}.png' for _, _, sub in TIERS for i in range(3)]
        base = base_of(card)
        print(f'  {card}: drift {d["drift"]} change {d["frame1"]}/{d["frame2"]} size {d["size"]} vs {d["shipped"]} -> '
              f'{"OK" if ok and base and all(f.exists() for f in files) else "skip"}')
        if ok and base and all(f.exists() for f in files):
            picked.append((card, base))
    print(f'building loops: {len(picked)} new')
    if DRY or not picked:
        return text
    for card, base in picked:
        for _, folder, sub in TIERS:
            for i in range(3):
                shutil.copy2(ANIM / f'{card}/{sub}{card}_anim_{i}.png', ROOT / f'public/assets/art/{folder}/{base}_anim{i}.png')
    cards = sorted(have | {c for c, _ in picked})
    (ANIM / 'in-game.txt').write_text('\n'.join(cards) + '\n', encoding='utf-8')
    body = ''.join(f"  '{c}',\n" for c in cards)
    return text[:m.start(1)] + '\n' + body + text[m.end(1):]


def main() -> None:
    text = ART_TS.read_text(encoding='utf-8')
    text = env_objects(text)
    text = building_loops(text)
    if DRY:
        return
    ART_TS.write_text(text, encoding='utf-8', newline='\n')
    for script in ('docs/art-review/env/register.py', 'docs/art-review/building-anim/register.py'):
        subprocess.run([sys.executable, str(ROOT / script)], check=True)
    print('done: now run the gate and look at the game')


if __name__ == '__main__':
    main()
