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


class IsoSamplePromptGateTest(unittest.TestCase):
    """Isometric world sprites (owner decision 2026-11-06): their own block in docs/ART_STYLE.md, samples first."""

    def test_iso_template_is_its_own_block_in_the_style_doc(self):
        t = mp.iso_template()
        self.assertIn('ISOMETRIC', t)
        self.assertIn('2:1', t)
        self.assertIn('[subject]', t)
        self.assertIn('[Materials and identifying details.]', t)
        self.assertNotIn('STRICT straight-on FRONT VIEW', t)
        self.assertNotIn('NO isometric view', t)
        # the card illustrations keep the approved front-view block
        self.assertIn('STRICT straight-on FRONT VIEW', mp.style_template())

    def test_sample_prompts_read_the_doc_attach_the_reference_and_say_so(self):
        self.assertEqual([s[0] for s in mp.ISO_SAMPLES], ['sample-building', 'sample-plot', 'sample-plot-built'])
        building = dict((i, d) for i, _, d in mp.ISO_SAMPLES)['sample-building']
        self.assertIn('MAIN DOOR', building)
        self.assertIn('RIGHT wall', building)
        self.assertIn('MIDDLE of its square plot', building)
        self.assertIn('PAVED WITH STONE', dict((i, d) for i, _, d in mp.ISO_SAMPLES)['sample-plot-built'])
        for ident, name, desc in mp.ISO_SAMPLES:
            p = mp.build_iso_prompt(f'x/{ident}/source.png', name, desc)
            self.assertIn('docs/ART_STYLE.md', p, ident)
            self.assertIn('BẮT BUỘC TRƯỚC KHI VẼ', p, ident)
            self.assertIn(mp.REFERENCE, p, ident)
            self.assertIn('ISOMETRIC', p, ident)
            self.assertIn('#000000', p, ident)
            self.assertIn(name, p, ident)
            self.assertNotIn('[subject]', p, ident)

    def test_sample_mode_writes_only_the_samples_and_attaches_the_reference(self):
        mp.main('iso-sample')
        runner = (ROOT / '.superpowers/b-iso-sample.sh').read_text(encoding='utf-8')
        self.assertEqual(runner.count('codex exec'), 3)
        self.assertEqual(runner.count(f'-i {mp.REFERENCE}'), 3)
        mp.main('iso-sample', ['sample-building', 'sample-plot-built'])
        runner = (ROOT / '.superpowers/b-iso-sample.sh').read_text(encoding='utf-8')
        self.assertEqual(runner.count('codex exec'), 2)
        self.assertNotIn('sample-plot/prompt.md', runner)
        for ident, _, _ in mp.ISO_SAMPLES:
            self.assertTrue((ROOT / 'docs/art-review/iso-board' / ident / 'prompt.md').exists(), ident)

    def test_iso_generation_is_refused_without_the_doc_or_reference(self):
        old_root = mp.ROOT
        try:
            with tempfile.TemporaryDirectory() as d:
                mp.ROOT = Path(d)
                with self.assertRaises(SystemExit):
                    mp.iso_template()
        finally:
            mp.ROOT = old_root


class IsoWheatSetPromptGateTest(unittest.TestCase):
    """Task 11 (2026-11-06): the isometric Wheat set reads the doc and carries both the style and the iso references."""

    def test_the_set_covers_seven_buildings_two_plots_and_a_wall_sample(self):
        kinds = [k for _, k, _, _ in mp.ISO_WHEAT]
        self.assertEqual(kinds.count('building'), 7)
        self.assertEqual(kinds.count('plot'), 2)
        self.assertEqual(kinds.count('wall'), 1)
        ids = {i for i, _, _, _ in mp.ISO_WHEAT}
        self.assertNotIn('building_wheat_reapers', ids)  # the approved sample is the Reapers barn

    def test_every_prompt_reads_the_doc_and_names_its_isometric_references(self):
        for ident, kind, name, desc in mp.ISO_WHEAT:
            p = mp.build_iso_set_prompt(f'x/{ident}/source.png', kind, name, desc)
            self.assertIn('docs/ART_STYLE.md', p, ident)
            self.assertIn('BẮT BUỘC TRƯỚC KHI VẼ', p, ident)
            self.assertIn(mp.REFERENCE, p, ident)
            self.assertIn('ISOMETRIC', p, ident)
            self.assertIn('#000000', p, ident)
            for r in mp.ISO_REFS[kind].split():
                self.assertIn(r, p, ident)
            if kind == 'building':
                self.assertIn('MAIN DOOR is on the RIGHT wall', p, ident)
                self.assertIn('MIDDLE of its plot', p, ident)

    def test_runner_attaches_the_style_and_isometric_references(self):
        mp.main('wheat-iso')
        runner = (ROOT / '.superpowers/b-wheat-iso.sh').read_text(encoding='utf-8')
        self.assertEqual(runner.count('codex exec'), len(mp.ISO_WHEAT))
        self.assertEqual(runner.count(f'-i {mp.REFERENCE}'), len(mp.ISO_WHEAT))
        self.assertIn('-i docs/art-review/style-references/iso-building-approved.png', runner)
        self.assertIn('-i docs/art-review/style-references/iso-plot-built-approved.png', runner)


class GroundTexturePromptGateTest(unittest.TestCase):
    """Ground textures (2026-11-06): their own block in docs/ART_STYLE.md, top-down and seamless, refs attached."""

    def test_texture_block_is_in_the_style_doc(self):
        t = mp.texture_template()
        self.assertIn('TILES SEAMLESSLY', t)
        self.assertIn('STRAIGHT FROM ABOVE', t)
        self.assertIn('[subject]', t)

    def test_water_and_sand_prompts_read_the_doc_and_carry_the_references(self):
        self.assertEqual([i for i, _, _ in mp.GROUND_TEXTURES], ['terrain_water', 'terrain_sand'])
        for ident, name, desc in mp.GROUND_TEXTURES:
            p = mp.build_texture_prompt(f'x/{ident}/source.png', name, desc)
            self.assertIn('docs/ART_STYLE.md', p, ident)
            self.assertIn('BẮT BUỘC TRƯỚC KHI VẼ', p, ident)
            self.assertIn(mp.REFERENCE, p, ident)
            for r in mp.TEXTURE_REFS:
                self.assertIn(r, p, ident)
            self.assertIn('LẶP LIỀN MẠCH', p, ident)
            self.assertNotIn('[subject]', p, ident)

    def test_runner_attaches_every_reference(self):
        mp.main('terrain-textures')
        runner = (ROOT / '.superpowers/b-textures.sh').read_text(encoding='utf-8')
        self.assertEqual(runner.count('codex exec'), 2)
        for r in [mp.REFERENCE, *mp.TEXTURE_REFS]:
            self.assertEqual(runner.count(f'-i {r}'), 2)


class PolishSamplePromptGateTest(unittest.TestCase):
    """Iso board polish (2026-11-08): the portal and forest samples come from the iso block, one kind at a time."""

    def test_polish_sample_is_exactly_one_kind(self):
        with self.assertRaises(SystemExit):
            mp.main('polish-samples')
        with self.assertRaises(SystemExit):
            mp.main('polish-samples', ['enemy_portal', 'forest_pine_a'])
        with self.assertRaises(SystemExit):
            mp.main('polish-samples', ['forest_rock'])
        self.assertEqual([i for i, _, _ in mp.POLISH_SAMPLES], ['enemy_portal', 'forest_pine_a'])

    def test_polish_prompt_uses_exact_iso_block_and_read_doc_instruction(self):
        t = mp.iso_template()
        for ident, name, desc in mp.POLISH_SAMPLES:
            p = mp.build_polish_prompt(f'x/{ident}/source.png', name, desc)
            self.assertIn('docs/ART_STYLE.md', p, ident)
            self.assertIn('BẮT BUỘC TRƯỚC KHI VẼ', p, ident)
            self.assertIn('ISOMETRIC view, classic 2:1 pixel-art isometric', p, ident)
            self.assertIn(t.split('\n')[1], p, ident)
            self.assertNotIn('[subject]', p, ident)
            self.assertIn('#000000', p, ident)

    def test_polish_runner_attaches_style_and_iso_refs(self):
        for ident, _, _ in mp.POLISH_SAMPLES:
            mp.main('polish-samples', [ident])
            runner = (ROOT / f'.superpowers/b-polish-{ident}.sh').read_text(encoding='utf-8')
            self.assertEqual(runner.count('codex exec'), 1)
            for r in [mp.REFERENCE, *mp.POLISH_REFS]:
                self.assertEqual(runner.count(f'-i {r}'), 1, (ident, r))

    def test_polish_forest_set_attaches_the_approved_pine(self):
        self.assertEqual([i for i, _, _ in mp.POLISH_FOREST_SET], ['forest_pine_b', 'forest_rock'])
        with self.assertRaises(SystemExit):
            mp.main('polish-forest-set', ['enemy_portal'])
        mp.main('polish-forest-set')
        runner = (ROOT / '.superpowers/b-polish-forest-set.sh').read_text(encoding='utf-8')
        self.assertEqual(runner.count('codex exec'), 2)
        for r in [mp.REFERENCE, *mp.POLISH_REFS, mp.POLISH_FOREST_APPROVED_REF]:
            self.assertEqual(runner.count(f'-i {r}'), 2, r)
        for ident, _, _ in mp.POLISH_FOREST_SET:
            p = (ROOT / mp.POLISH_DIR / ident / 'prompt.md').read_text(encoding='utf-8')
            self.assertIn('docs/ART_STYLE.md', p, ident)
            self.assertIn('ISOMETRIC view, classic 2:1 pixel-art isometric', p, ident)
            self.assertIn(mp.POLISH_FOREST_APPROVED_REF, p, ident)
            self.assertIn('#000000', p, ident)


class G5SamplePromptGateTest(unittest.TestCase):
    """G5 (plan 2026-11-09): one isometric sample per new king and kind, each its own owner gate."""

    def test_six_kings_two_kinds_one_sample_each(self):
        kings = ['grove', 'tide', 'forge', 'clock', 'moon', 'nomad', 'stone', 'arcane']
        self.assertEqual(sorted({k for k, _, _, _, _ in mp.G5_SAMPLES}), sorted(kings))
        for king in kings:
            kinds = sorted(kind for k, _, kind, _, _ in mp.G5_SAMPLES if k == king)
            self.assertEqual(kinds, ['building', 'plot'], king)

    def test_exactly_one_id_per_call(self):
        with self.assertRaises(SystemExit):
            mp.main('g5-iso-sample')
        with self.assertRaises(SystemExit):
            mp.main('g5-iso-sample', ['grove_throne', 'plot_grove_open'])
        with self.assertRaises(SystemExit):
            mp.main('g5-iso-sample', ['wheat_throne'])

    def test_prompt_reads_the_doc_and_names_every_reference(self):
        t = mp.iso_template()
        for king, ident, kind, name, desc in mp.G5_SAMPLES:
            p = mp.build_g5_prompt(f'x/{ident}/source.png', kind, name, desc, t)
            self.assertIn('docs/ART_STYLE.md', p, ident)
            self.assertIn('BẮT BUỘC TRƯỚC KHI VẼ', p, ident)
            self.assertIn('ISOMETRIC view, classic 2:1 pixel-art isometric', p, ident)
            self.assertIn(mp.REFERENCE, p, ident)
            for r in mp.ISO_REFS[kind].split():
                self.assertIn(r, p, ident)
            self.assertIn(mp.G5_WHEAT_REF[kind], p, ident)
            self.assertIn('#000000', p, ident)
            self.assertNotIn('[subject]', p, ident)
            self.assertNotIn('farm kingdom', p, ident)
            if kind == 'building':
                self.assertIn('RIGHT', p, ident)
            else:
                self.assertIn('NO furrows', p, ident)

    def test_runner_attaches_style_iso_and_wheat_refs_once(self):
        for ident in ['grove_throne', 'plot_grove_open']:
            mp.main('g5-iso-sample', [ident])
            runner = (ROOT / f'.superpowers/b-g5-{ident}.sh').read_text(encoding='utf-8')
            self.assertEqual(runner.count('codex exec'), 1)
            kind = 'building' if ident.endswith('throne') else 'plot'
            for r in [mp.REFERENCE, *mp.ISO_REFS[kind].split(), mp.G5_WHEAT_REF[kind]]:
                self.assertEqual(runner.count(f'-i {r}'), 1, (ident, r))


class G5SetPromptGateTest(unittest.TestCase):
    """G5: a king's remaining set is drawn only after its samples are approved, with them attached."""

    def test_set_covers_building_cards_and_three_plot_skins(self):
        items = mp.g5_set('grove')
        kinds = [k for _, k, _, _, _ in items]
        self.assertEqual(kinds.count('plot'), 3)
        self.assertGreaterEqual(kinds.count('building'), 6)
        self.assertEqual(sorted(i for i, k, _, _, _ in items if k == 'plot'), ['plot_grove_built', 'plot_grove_locked', 'plot_grove_throne'])
        for ident, kind, name, desc, wheat in items:
            self.assertNotIn('farm kingdom', desc, ident)
            self.assertNotRegex(desc, r'45-degree|front facing', ident)
            self.assertTrue((ROOT / wheat).exists(), wheat)

    def test_refused_until_the_samples_are_approved(self):
        old_dir = mp.G5_DIR
        try:
            with tempfile.TemporaryDirectory(dir=ROOT / '.superpowers') as d:
                mp.G5_DIR = Path(d).relative_to(ROOT).as_posix()
                with self.assertRaises(SystemExit):
                    mp.main('g5-iso-set', ['grove'])
        finally:
            mp.G5_DIR = old_dir
        with self.assertRaises(SystemExit):
            mp.main('g5-iso-set', ['wheat'])

    def test_runner_attaches_style_iso_wheat_and_both_samples(self):
        mp.main('g5-iso-set', ['grove'])
        runner = (ROOT / '.superpowers/b-g5-set-grove.sh').read_text(encoding='utf-8')
        n = len(mp.g5_set('grove'))
        self.assertEqual(runner.count('codex exec'), n)
        self.assertEqual(runner.count(f'-i {mp.REFERENCE}'), n)
        self.assertEqual(runner.count('-i docs/art-review/g5/grove/grove_throne/source.png'), n)
        self.assertEqual(runner.count('-i docs/art-review/g5/grove/plot_grove_open/source.png'), n)
        p = (ROOT / 'docs/art-review/g5/grove/grove_bear_cave/prompt.md').read_text(encoding='utf-8')
        self.assertIn('docs/ART_STYLE.md', p)
        self.assertIn('ISOMETRIC view, classic 2:1 pixel-art isometric', p)
        self.assertIn('#000000', p)


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
        self.assertEqual(len(cards), 102)  # 9 thrones + 81 king cards + 12 neutral (G4 meta cards included), tools/dumpCards.ts
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
