"""HiDPI art (public/assets/art/ai-v1-hd): every HD file is its ai-v1 twin at exactly twice the pixels.

Same size x 2 means the game, which draws HD frames at half the scale (IMAGE_ART_HD_SCALE 0.25), keeps every world
footprint and feet anchor (origin 0.5, 1) where it was. Alpha stays 0/255 (ART_STYLE).
"""
import re
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SD = ROOT / 'public/assets/art/ai-v1'
HD = ROOT / 'public/assets/art/ai-v1-hd'


def hd_files() -> list[Path]:
    return sorted(HD.rglob('*.png')) if HD.exists() else []


class HdDensityTest(unittest.TestCase):
    def test_every_hd_file_is_twice_its_twin(self):
        for f in hd_files():
            rel = f.relative_to(HD)
            twin = SD / rel
            self.assertTrue(twin.exists(), f'{rel}: no ai-v1 twin')
            with Image.open(f) as hd, Image.open(twin) as sd:
                self.assertEqual(hd.size, (sd.width * 2, sd.height * 2), rel.as_posix())

    def test_alpha_is_binary(self):
        for f in hd_files():
            with Image.open(f) as im:
                alphas = set(im.convert('RGBA').getchannel('A').getdata())
            self.assertTrue(alphas <= {0, 255}, f'{f.name}: alpha {sorted(alphas)[:5]}')

    def test_the_runtime_lists_exactly_the_hd_files(self):
        """The HD set is exactly the ai-v1 twins of the listed ids: twelve poses per unit (prefix = unit id), each
        card's base image (`iso/` or `iso-neutral/`) with every published L2/L3, four plot skins per king."""
        text = (ROOT / 'src/render/imageArt.ts').read_text(encoding='utf-8')

        def listed(name: str) -> list[str]:
            body = re.search(name + r'[^=]*=\s*\[(.*?)\]', text, re.S).group(1)
            return re.findall(r"'([a-z_]+)'", re.sub(r'//[^\n]*', '', body))

        expected = {f'{u}{t}_{i}.png' for u in listed('IMAGE_ART_HD_UNITS') for t in ('', '_foe') for i in range(6)}
        for card in listed('IMAGE_ART_HD_BUILDINGS'):
            bases = [d for d in ('iso', 'iso-neutral') if (SD / d / f'{card}.png').exists()]
            self.assertEqual(len(bases), 1, f'{card}: no single ai-v1 base image')
            expected |= {f'{bases[0]}/{card}{s}.png' for s in ('', '_l2', '_l3') if (SD / bases[0] / f'{card}{s}.png').exists()}
        expected |= {f'iso/plots/{k}_{s}.png' for k in listed('IMAGE_ART_HD_PLOTS') for s in ('open', 'locked', 'throne', 'built')}
        found = {f.relative_to(HD).as_posix() for f in hd_files()}
        self.assertEqual(found, expected)

    def test_footman_has_no_hd_twin(self):
        """footman has no pose source (front-view barracks sheet): it stays ai-v1 at every density."""
        self.assertFalse(any(f.name.startswith('footman') for f in hd_files()))


if __name__ == '__main__':
    unittest.main()
