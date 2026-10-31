"""The native portrait step: 1024x1536 approved art -> 96x144 in an explicit per-king palette."""
import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('prepare_king_portraits', ROOT / 'tools/prepare_king_portraits.py')
pk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pk)

NINE = ['arcane', 'clock', 'forge', 'grove', 'moon', 'nomad', 'stone', 'tide', 'wheat']


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class PrepareKingPortraitsTest(unittest.TestCase):
    def test_every_king_has_an_explicit_palette(self):
        self.assertEqual(sorted(pk.PALETTES), NINE)
        for king, pal in pk.PALETTES.items():
            self.assertTrue(2 <= len(pal) <= 32, king)
            self.assertEqual(len(set(pal)), len(pal), king)

    def test_output_is_96x144_with_only_palette_colours_and_opaque(self):
        for king in NINE:
            art = pk.prepare(ROOT / f'docs/art-review/g3e/portraits/{king}/source.png', pk.PALETTES[king])
            self.assertEqual(art.size, (96, 144), king)
            self.assertEqual(art.mode, 'RGBA', king)
            allowed = {pk.hex_rgb(h) for h in pk.PALETTES[king]}
            for r, g, b, a in art.getdata():
                self.assertEqual(a, 255, king)
                self.assertIn((r, g, b), allowed, king)

    def test_source_is_not_modified_and_the_result_is_deterministic(self):
        src = ROOT / 'docs/art-review/g3e/portraits/wheat/source.png'
        before = sha(src)
        a = pk.prepare(src, pk.PALETTES['wheat'])
        b = pk.prepare(src, pk.PALETTES['wheat'])
        self.assertEqual(list(a.getdata()), list(b.getdata()))
        self.assertEqual(sha(src), before)

    def test_head_and_feet_are_not_cropped_or_shifted(self):
        def mean(img, box):
            px = list(img.convert('RGB').crop(box).getdata())
            return tuple(sum(c[i] for c in px) / len(px) for i in range(3))

        def dist(a, b):
            return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5

        for king in NINE:
            src = Image.open(ROOT / f'docs/art-review/g3e/portraits/{king}/source.png').convert('RGB')
            art = pk.prepare(ROOT / f'docs/art-review/g3e/portraits/{king}/source.png', pk.PALETTES[king])
            top = dist(mean(src, (0, 0, 1024, 160)), mean(art, (0, 0, 96, 15)))
            bottom = dist(mean(src, (0, 1376, 1024, 1536)), mean(art, (0, 129, 96, 144)))
            self.assertLess(top, 45, f'{king} top')
            self.assertLess(bottom, 45, f'{king} bottom')

    @staticmethod
    def lone_pixels(art):
        w, h = art.size
        px = art.load()
        n = 0
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                c = px[x, y]
                if all(px[nx, ny] != c for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))):
                    n += 1
        return n

    def test_smoothing_leaves_almost_no_stray_pixels(self):
        for king in NINE:
            art = pk.prepare(ROOT / f'docs/art-review/g3e/portraits/{king}/source.png', pk.PALETTES[king], smooth=3)
            self.assertLess(self.lone_pixels(art), 60, king)

    def test_sharp_version_keeps_strays_under_fifteen_percent(self):
        for king in NINE:
            art = pk.prepare(ROOT / f'docs/art-review/g3e/portraits/{king}/source.png', pk.PALETTES[king])
            self.assertLess(self.lone_pixels(art), 0.15 * 96 * 144, king)

    def test_main_writes_the_pictures_and_the_sheet_without_touching_public(self):
        shipped = ROOT / 'public/assets/art/ai-v1/portraits'
        before = {p.name: sha(p) for p in shipped.glob('*.png')} if shipped.exists() else {}
        with tempfile.TemporaryDirectory() as d:
            pk.main(['--out', d, 'wheat', 'stone'])
            self.assertEqual(sorted(p.name for p in Path(d).iterdir()), ['native-sheet.png', 'stone.png', 'wheat.png'])
            self.assertEqual(Image.open(Path(d) / 'wheat.png').size, (96, 144))
        after = {p.name: sha(p) for p in shipped.glob('*.png')} if shipped.exists() else {}
        self.assertEqual(after, before)


if __name__ == '__main__':
    unittest.main()
