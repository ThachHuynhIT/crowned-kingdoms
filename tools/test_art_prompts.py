"""The image-generation gate: every building prompt must come from docs/ART_STYLE.md and carry the approved reference."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('make_prompts', ROOT / 'docs/art-review/g3e/buildings/make_prompts.py')
mp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mp)


class ArtPromptGateTest(unittest.TestCase):
    def test_reference_and_style_doc_exist(self):
        self.assertTrue((ROOT / mp.REFERENCE).exists())
        self.assertTrue((ROOT / mp.STYLE_DOC).exists())

    def test_template_is_the_one_in_the_style_doc(self):
        t = mp.style_template()
        self.assertIn('STRICT straight-on FRONT VIEW', t)
        self.assertIn('[building and function]', t)
        self.assertIn('[Materials and identifying tools.]', t)

    def test_every_group_prompt_points_at_the_doc_and_uses_the_template(self):
        template = mp.style_template()
        for group, cfg in mp.GROUPS.items():
            for ident, name, desc in cfg['items']:
                p = mp.build_prompt(f'x/{ident}/source.png', name, desc, cfg['theme'], template)
                self.assertIn('docs/ART_STYLE.md', p, ident)
                self.assertIn('BẮT BUỘC TRƯỚC KHI VẼ', p, ident)
                self.assertIn(mp.REFERENCE, p, ident)
                self.assertIn('NO isometric view', p, ident)
                self.assertIn(name, p, ident)
                self.assertNotIn('[building and function]', p, ident)
                self.assertNotIn('[Materials', p, ident)
                self.assertIn('#000000', p, ident)  # production override of the transparent background

    def test_runner_attaches_the_reference(self):
        mp.main('wheat', ['building_wheat_reapers'])
        runner = (ROOT / '.superpowers/b-wheat.sh').read_text(encoding='utf-8')
        self.assertIn(f'-i {mp.REFERENCE}', runner)

    def test_generation_is_refused_without_the_doc_or_reference(self):
        old_root = mp.ROOT
        try:
            with tempfile.TemporaryDirectory() as d:
                mp.ROOT = Path(d)
                with self.assertRaises(SystemExit):
                    mp.style_template()  # no doc
                (Path(d) / 'docs').mkdir()
                (Path(d) / mp.STYLE_DOC).write_text('## Góc nhìn\n**Prompt mẫu dùng lại**\n```text\nx\n```\n', encoding='utf-8')
                with self.assertRaises(SystemExit):
                    mp.style_template()  # doc but no reference
        finally:
            mp.ROOT = old_root


if __name__ == '__main__':
    unittest.main()
