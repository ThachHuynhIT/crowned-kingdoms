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


HUD_DIRS = ('cards', 'portraits', 'king-cards', 'menu', 'icons')


def hud_hd_files() -> set[str]:
    """HD twins of HUD pictures (src/render/hudArtHd.ts), relative to ai-v1-hd."""
    return {f.relative_to(HD).as_posix() for f in hd_files() if f.relative_to(HD).parts[0] in HUD_DIRS}


def world_hd_files(text: str, listed) -> set[str]:
    """The world pictures drawn outside the atlas, per `IMAGE_ART_HD_WORLD` group (wall, decor, forest, portal, ground)."""
    groups = set(listed('IMAGE_ART_HD_WORLD'))
    out = set()
    if 'wall' in groups:
        out.add('iso/wall_cliff.png')
    if 'decor' in groups:
        catalog = re.search(r'DECOR_CATALOG[^=]*=\s*\[(.*?)\];', text, re.S).group(1)
        out |= {f'iso/wilds/{i}.png' for i in re.findall(r"id: '([a-z_]+)'", catalog)}
    if 'forest' in groups:
        out |= {f'iso/polish/{i}.png' for i in listed('FOREST_APPROVED')}
    if 'portal' in groups:
        out.add('iso/polish/enemy_portal.png')
    if 'ground' in groups:
        grass = re.search(r'GRASS_FILES[^=]*=\s*\[(.*?)\]', text, re.S).group(1)
        out |= {f'{g}.png' for g in re.findall(r"'([a-z_0-9]+)'", grass)}
        out |= {f'iso/terrain/{t}.png' for t in listed('GROUND_TEXTURES_APPROVED')}
    return out


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
        card's base image (`iso/` or `iso-neutral/`) with every published L2/L3, four plot skins per king, and the world
        pictures of each `IMAGE_ART_HD_WORLD` group, and the `IMAGE_ART_HD_FX` battle effects (`fx/fx_<id>`)."""
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
        expected |= world_hd_files(text, listed)
        expected |= {f'fx/fx_{fx}.png' for fx in listed('IMAGE_ART_HD_FX')}
        found = {f.relative_to(HD).as_posix() for f in hd_files()} - hud_hd_files()
        self.assertEqual(found, expected)

    def test_hud_twins_cover_the_hud_runtime(self):
        """HUD twins (src/render/hudArtHd.ts, 2x of the HUD pictures, drawn at half the scale): every card illustration
        size, every king portrait copy, every king card, the menu sky and hills, each STAT_ICONS 16 px icon and both king
        badge sizes has its HD file."""
        text = (ROOT / 'src/render/imageArt.ts').read_text(encoding='utf-8')
        stat = re.findall(r"'(icons/icon_[a-z_]+-16)'", re.search(r'STAT_ICONS[^=]*=\s*\{(.*?)\}', text, re.S).group(1))
        kings = ['wheat', 'stone', 'arcane', 'grove', 'tide', 'forge', 'clock', 'moon', 'nomad']
        cards = {f.name[:-len('-128.png')] for f in (SD / 'cards').glob('*-128.png')}
        expected = {f'{s}.png' for s in stat}
        expected |= {f'cards/{c}{s}.png' for c in cards for s in ('', '-48', '-128')}
        expected |= {f'portraits/{k}{s}.png' for k in kings for s in ('', '-144')}
        expected |= {f'king-cards/{k}.png' for k in kings}
        expected |= {f'icons/icon_king_{k}{s}.png' for k in kings for s in ('', '-16')}
        expected |= {'menu/sky.png', 'menu/hills_far.png', 'menu/hills_mid.png'}
        self.assertEqual(expected - hud_hd_files(), set())

    def test_atlas_icons_have_their_twin(self):
        """Each `IMAGE_ART_HD_ICONS` id's 16 px atlas icon (`IMAGE_ICONS`) has its 32 px twin."""
        text = (ROOT / 'src/render/imageArt.ts').read_text(encoding='utf-8')
        ids = re.findall(r"'([a-z_]+)'", re.search(r'IMAGE_ART_HD_ICONS[^=]*=\s*\[(.*?)\]', text, re.S).group(1))
        body = re.search(r'IMAGE_ICONS[^=]*=\s*\{(.*?)\}', text, re.S).group(1)
        icons = dict(re.findall(r"(\w+): '(icons/icon_[a-z_]+-16)'", body))
        self.assertTrue(ids)
        for icon in ids:
            self.assertIn(icon, icons)
            self.assertTrue((HD / f'{icons[icon]}.png').exists(), icons[icon])

    def test_footman_has_no_hd_twin(self):
        """footman has no pose source (front-view barracks sheet): it stays ai-v1 at every density."""
        self.assertFalse(any(f.name.startswith('footman') for f in hd_files()))



UHD = ROOT / 'public/assets/art/ai-v1-uhd'


class UhdTwinTest(unittest.TestCase):
    """Close-up art (12/11/2026): every ai-v1-uhd file is its ai-v1 twin at exactly 4x the pixels (2x its HD twin),
    drawn at scale 0.125, so footprints and feet anchors do not move. Alpha stays 0/255."""

    def test_every_uhd_file_is_four_times_its_twin(self):
        files = sorted(UHD.rglob('*.png')) if UHD.exists() else []
        self.assertGreater(len(files), 700)
        for f in files:
            rel = f.relative_to(UHD)
            with self.subTest(rel.as_posix()):
                with Image.open(f) as u, Image.open(SD / rel) as s, Image.open(HD / rel) as h:
                    self.assertEqual(u.size, (s.width * 4, s.height * 4))
                    self.assertEqual(u.size, (h.width * 2, h.height * 2))
                    alpha = set(u.convert('RGBA').getchannel('A').getdata())
                    self.assertLessEqual(alpha, {0, 255})


if __name__ == '__main__':
    unittest.main()
