"""The nine approved king portraits are real 96x144 files and are registered (manifest + credits)."""
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
KINGS = ['arcane', 'clock', 'forge', 'grove', 'moon', 'nomad', 'stone', 'tide', 'wheat']
DIR = ROOT / 'public/assets/art/ai-v1/portraits'


class PortraitRegistrationTest(unittest.TestCase):
    def test_nine_files_of_96x144_identical_to_the_approved_native_pictures(self):
        for king in KINGS:
            shipped = DIR / f'{king}.png'
            self.assertTrue(shipped.exists(), king)
            self.assertEqual(Image.open(shipped).size, (96, 144), king)
            approved = ROOT / f'docs/art-review/g3e/portraits/native/{king}.png'
            self.assertEqual(shipped.read_bytes(), approved.read_bytes(), king)

    def test_every_portrait_is_in_the_manifest_as_a_custom_asset(self):
        manifest = (ROOT / 'docs/assets.manifest.yml').read_text(encoding='utf-8')
        for king in KINGS:
            self.assertIn(f'path: public/assets/art/ai-v1/portraits/{king}.png', manifest, king)
            self.assertIn(f'id: portrait_king_{king}', manifest, king)
        block = manifest.split('id: portrait_king_wheat', 1)[1].split('- id:', 1)[0]
        for field in ('origin: custom', 'license: project-owned', 'nativeSize: 1024x1536', 'finalSize: 96x144', 'category: ui'):
            self.assertIn(field, block)

    def test_credits_mention_the_portraits(self):
        credits = (ROOT / 'CREDITS.md').read_text(encoding='utf-8')
        self.assertIn('public/assets/art/ai-v1/portraits/', credits)


if __name__ == '__main__':
    unittest.main()
