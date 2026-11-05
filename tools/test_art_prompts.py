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


pspec = importlib.util.spec_from_file_location('portrait_prompts', ROOT / 'docs/art-review/g3e/portraits/make_prompts.py')
pp = importlib.util.module_from_spec(pspec)
pspec.loader.exec_module(pp)


class PortraitPromptGateTest(unittest.TestCase):
    def test_reference_and_style_doc_exist(self):
        self.assertTrue((ROOT / pp.REFERENCE).exists())
        self.assertTrue((ROOT / pp.STYLE_DOC).exists())
        self.assertIn('## Chân dung vua', (ROOT / pp.STYLE_DOC).read_text(encoding='utf-8'))

    def test_all_nine_kings_have_a_prompt_from_the_doc(self):
        self.assertEqual(len(pp.KINGS), 9)
        for king in pp.KINGS:
            p = pp.build_prompt(f'x/{king}/source.png', king)
            self.assertIn('docs/ART_STYLE.md', p, king)
            self.assertIn('BẮT BUỘC TRƯỚC KHI VẼ', p, king)
            self.assertIn(pp.REFERENCE, p, king)
            self.assertIn('aspect ratio 2:3', p, king)
            self.assertIn('96x144', p, king)
            self.assertIn('themed fantasy scene', p, king)
            self.assertIn('No text', p, king)
            self.assertIn('NOT a gentle farmer', p, king)

    def test_wheat_king_wears_cloth_not_straw(self):
        p = pp.build_prompt('x/wheat/source.png', 'wheat')
        self.assertIn('NO straw', p)
        self.assertIn('embroidered', p)

    def test_generation_is_refused_without_the_doc_or_reference(self):
        old_root = pp.ROOT
        try:
            with tempfile.TemporaryDirectory() as d:
                pp.ROOT = Path(d)
                with self.assertRaises(SystemExit):
                    pp.build_prompt('x.png', 'wheat')
        finally:
            pp.ROOT = old_root


cspec = importlib.util.spec_from_file_location('card_prompts', ROOT / 'docs/art-review/g3e/cards/make_prompts.py')
cp = importlib.util.module_from_spec(cspec)
cspec.loader.exec_module(cp)


class CardPromptGateTest(unittest.TestCase):
    def test_catalogue_is_the_whole_registry(self):
        cards = cp.load_cards()
        self.assertEqual(len(cards), 94)
        self.assertEqual(sorted({c['kind'] for c in cards.values()}), ['economy', 'enchantment', 'support', 'throne', 'tome', 'tower', 'troop'])

    def test_every_card_prompt_points_at_the_doc_and_carries_the_reference(self):
        for cid, card in cp.load_cards().items():
            p = cp.build_prompt(f'x/{cid}/source.png', card)
            self.assertIn('docs/ART_STYLE.md', p, cid)
            self.assertIn('BẮT BUỘC TRƯỚC KHI VẼ', p, cid)
            self.assertIn(cp.REFERENCE, p, cid)
            self.assertIn(card['nameVi'], p, cid)
            self.assertIn('4:3', p, cid)
            self.assertIn('No text' if card['kind'] not in cp.BUILDING_KINDS else 'Không chữ', p, cid)

    def test_building_cards_use_the_template_block_of_the_style_doc_word_for_word(self):
        template = cp._buildings.style_template()
        for cid, card in cp.load_cards().items():
            if card['kind'] not in cp.BUILDING_KINDS:
                continue
            p = cp.build_prompt(f'x/{cid}/source.png', card)
            self.assertIn('STRICT straight-on FRONT VIEW', p, cid)
            self.assertIn('NO isometric view', p, cid)
            self.assertIn('Roof ridge runs LEFT TO RIGHT', p, cid)
            self.assertNotIn('[building and function]', p, cid)
            self.assertNotIn('[Materials', p, cid)
            # the template's own sentences survive unchanged (only the two placeholders are filled)
            self.assertIn(template.split('[building and function]')[0], p, cid)

    def test_visual_hints_belong_to_real_cards_and_reach_the_prompt(self):
        cards = cp.load_cards()
        for cid, hint in cp.VISUAL.items():
            self.assertIn(cid, cards)
            self.assertIn(hint, cp.build_prompt(f'x/{cid}/source.png', cards[cid]), cid)
        self.assertIn('SCARECROW', cp.build_prompt('x.png', cards['wheat_scarecrow']))

    def test_king_cards_attach_the_approved_portrait_and_neutral_ones_do_not(self):
        cards = cp.load_cards()
        self.assertIn('portraits/wheat/source.png', cp.build_prompt('x.png', cards['wheat_field']))
        self.assertNotIn('portraits/', cp.build_prompt('x.png', cards['neutral_barracks']))

    def test_generation_is_refused_without_the_doc_or_reference(self):
        old = cp.ROOT
        try:
            with tempfile.TemporaryDirectory() as d:
                cp.ROOT = Path(d)
                with self.assertRaises(SystemExit):
                    cp.build_prompt('x.png', {'id': 'a', 'nameVi': 'A', 'owner': 'wheat', 'kind': 'tome', 'rarity': 'common', 'summary': 's'})
        finally:
            cp.ROOT = old


ispec = importlib.util.spec_from_file_location('icon_prompts', ROOT / 'docs/art-review/g3e/icons/make_prompts.py')
ip = importlib.util.module_from_spec(ispec)
ispec.loader.exec_module(ip)


class IconPromptGateTest(unittest.TestCase):
    def test_reference_and_style_doc_exist(self):
        self.assertTrue((ROOT / ip.REFERENCE).exists())
        self.assertTrue((ROOT / ip.STYLE_DOC).exists())

    def test_every_icon_prompt_points_at_the_doc_and_carries_the_reference(self):
        for icon in ip.ICONS:
            p = ip.build_prompt(f'x/{icon}/source.png', icon)
            self.assertIn('docs/ART_STYLE.md', p, icon)
            self.assertIn('BẮT BUỘC TRƯỚC KHI VẼ', p, icon)
            self.assertIn(ip.REFERENCE, p, icon)
            self.assertIn('32x32', p, icon)
            self.assertIn('#FF00FF', p, icon)
            self.assertIn('No text', p, icon)

    def test_generation_is_refused_without_the_doc_or_reference(self):
        old = ip.ROOT
        try:
            with tempfile.TemporaryDirectory() as d:
                ip.ROOT = Path(d)
                with self.assertRaises(SystemExit):
                    ip.build_prompt('x.png', 'icon_troop')
        finally:
            ip.ROOT = old


uspec = importlib.util.spec_from_file_location('unit_prompts', ROOT / 'docs/art-review/g3e/units/make_prompts.py')
up = importlib.util.module_from_spec(uspec)
uspec.loader.exec_module(up)


class UnitPromptGateTest(unittest.TestCase):
    def test_reference_and_style_doc_exist(self):
        self.assertTrue((ROOT / up.REFERENCE).exists())
        self.assertTrue((ROOT / up.STYLE_DOC).exists())

    def test_every_unit_prompt_points_at_the_doc_and_carries_the_reference(self):
        for unit in up.UNITS:
            p = up.build_prompt(f'x/{unit}/source.png', unit)
            self.assertIn('docs/ART_STYLE.md', p, unit)
            self.assertIn('BẮT BUỘC TRƯỚC KHI VẼ', p, unit)
            self.assertIn(up.REFERENCE, p, unit)
            self.assertIn('45 degrees', p, unit)
            self.assertIn('#FF00FF', p, unit)
            self.assertIn('ALLY', p, unit)
            self.assertIn('No text', p, unit)

    def test_native_size_follows_four_art_px_per_world_unit(self):
        self.assertIn('64x64', up.build_prompt('x.png', 'militia'))
        self.assertIn('64x96', up.build_prompt('x.png', 'reaper'))

    def test_generation_is_refused_without_the_doc_or_reference(self):
        old = up.ROOT
        try:
            with tempfile.TemporaryDirectory() as d:
                up.ROOT = Path(d)
                with self.assertRaises(SystemExit):
                    up.build_prompt('x.png', 'militia')
                with self.assertRaises(SystemExit):
                    up.build_pose_prompt('x.png', 'militia')
        finally:
            up.ROOT = old


class NewUnitScaleGateTest(unittest.TestCase):
    def test_sized_units_exist_and_carry_the_approved_militia(self):
        self.assertTrue((ROOT / up.UNIT_REFERENCE).exists())
        for unit, h in up.HEIGHT.items():
            self.assertIn(unit, up.UNITS)
            p = up.build_prompt(f'x/{unit}/source.png', unit)
            self.assertIn('APPROVED Wheat militia', p, unit)
            self.assertIn(f'({h} art pixels against 51)', p, unit)

    def test_wheat_prompts_are_unchanged_by_the_scale_line(self):
        for unit in ('militia', 'reaper', 'peasant'):
            self.assertNotIn('APPROVED Wheat militia', up.build_prompt('x.png', unit))

    def test_sample_runner_attaches_the_militia_for_sized_units_only(self):
        up.main(['golem', 'militia'])
        runner = (ROOT / '.superpowers/u.sh').read_text(encoding='utf-8')
        golem = next(l for l in runner.splitlines() if 'golem/prompt.md' in l)
        militia = next(l for l in runner.splitlines() if 'militia/prompt.md' in l)
        self.assertIn(f'-i {up.REFERENCE} -i {up.UNIT_REFERENCE}', golem)
        self.assertNotIn(up.UNIT_REFERENCE, militia)

    def test_stone_is_warm_so_the_foe_recolour_only_hits_the_team_colour(self):
        for unit in ('golem', 'rubble'):
            self.assertIn('WARM grey-brown', up.build_prompt('x.png', unit))


class UnitPosePromptGateTest(unittest.TestCase):
    def test_six_poses_match_the_game_animations(self):
        self.assertEqual([(p[0], p[1]) for p in up.POSES],
                         [('idle', 0), ('idle', 1), ('walk', 0), ('walk', 1), ('attack', 0), ('attack', 1)])

    def test_every_unit_has_attack_poses(self):
        for unit in up.UNITS:
            self.assertIn(unit, up.ATTACK, unit)
            self.assertIn(unit, up.STRIKE, unit)

    def test_every_pose_prompt_points_at_the_doc_and_attaches_the_unit_sample(self):
        for unit in up.UNITS:
            if not up.sample_path(unit).exists():
                continue  # no approved standing sample yet: build_pose_prompt refuses (tested below)
            p = up.build_pose_prompt(f'x/{unit}/poses-source.png', unit)
            self.assertIn('docs/ART_STYLE.md', p, unit)
            self.assertIn('BẮT BUỘC TRƯỚC KHI VẼ', p, unit)
            self.assertIn(up.REFERENCE, p, unit)
            self.assertIn(f'docs/art-review/g3e/units/{unit}/source.png', p, unit)
            self.assertIn('3 columns', p, unit)
            self.assertIn('SAME character', p, unit)
            self.assertIn('#FF00FF', p, unit)
            self.assertIn('No text', p, unit)
            self.assertIn(up.ATTACK[unit], p, unit)

    def test_pose_runner_attaches_the_reference_and_the_unit_sample(self):
        up.main(['militia'], poses=True)
        runner = (ROOT / '.superpowers/up.sh').read_text(encoding='utf-8')
        self.assertIn(f'-i {up.REFERENCE} -i docs/art-review/g3e/units/militia/source.png', runner)
        self.assertIn('docs/art-review/g3e/units/militia/poses-source.png', runner)

    def test_pose_prompt_is_refused_without_the_approved_idle_sample(self):
        old = up.P
        try:
            with tempfile.TemporaryDirectory() as d:
                up.P = Path(d)
                with self.assertRaises(SystemExit):
                    up.build_pose_prompt('x.png', 'militia')
        finally:
            up.P = old


if __name__ == '__main__':
    unittest.main()
