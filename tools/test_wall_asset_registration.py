import hashlib
import json
import tempfile
import unittest
from pathlib import Path

import build_planned_assets as bpa
from slice_mountain_wall import OUT_DIR, adopted_wall_items

ROOT = Path(__file__).resolve().parents[1]
REAL_CATALOG = json.loads((ROOT / 'docs/art-review/oblique-wall/catalog.json').read_text(encoding='utf-8'))
# Synthetic catalog: the registration rules must not depend on which real pieces happen to be adopted today.
CATALOG = {'version': 1, 'density': 2, 'items': [
    {'id': 'terrain_mountain_wall_cap_left', 'role': 'left', 'label': 'Cap trái', 'priority': 'P0', 'proposed': {'w': 192, 'h': 192},
     'approval': 'none', 'adopted': False, 'parts': []},
    {'id': 'terrain_mountain_wall_cap_right', 'role': 'right', 'label': 'Cap phải', 'priority': 'P0', 'proposed': {'w': 192, 'h': 192},
     'approval': 'none', 'adopted': False, 'parts': []},
]}
MANIFEST = json.loads((ROOT / 'tools/asset-admin/manifest.json').read_text(encoding='utf-8'))
# Start from a manifest without any wall piece, whatever is adopted in the real one.
for _c in MANIFEST['categories']:
    _c['items'] = [i for i in _c['items'] if not i['id'].startswith('terrain_mountain_wall_')]


def planned(manifest=None, catalog=None):
    with tempfile.TemporaryDirectory() as d:
        mp, cp = Path(d) / 'manifest.json', Path(d) / 'catalog.json'
        mp.write_text(json.dumps(manifest or MANIFEST), encoding='utf-8')
        cp.write_text(json.dumps(catalog or CATALOG), encoding='utf-8')
        return bpa.build(str(mp), str(cp))


def wall_ids(result):
    return sorted(i['id'] for i in result['items'] if i['id'].startswith('terrain_mountain_wall_'))


class RegistrationTest(unittest.TestCase):
    def test_every_unadopted_wall_is_a_planned_work_item_in_terrain(self):
        result = planned()
        self.assertEqual(len(wall_ids(result)), 2)
        row = next(i for i in result['items'] if i['id'] == 'terrain_mountain_wall_cap_left')
        self.assertEqual((row['category'], row['group'], row['priority']), ('terrain', 'mountain_wall', 'P0'))
        # the five optional pieces were dropped on 26/10/2026 and are no longer planned work
        for dropped in ('far_0', 'attach_waterfall', 'attach_cave', 'attach_tree', 'attach_boulder'):
            self.assertNotIn('terrain_mountain_wall_' + dropped, wall_ids(result))

    def test_the_real_catalog_has_no_unapproved_or_dropped_pieces(self):
        ids = {e['id'] for e in REAL_CATALOG['items']}
        for dropped in ('far_0', 'attach_waterfall', 'attach_cave', 'attach_tree', 'attach_boulder'):
            self.assertNotIn('terrain_mountain_wall_' + dropped, ids)
        for e in REAL_CATALOG['items']:
            self.assertEqual(e['approval'], 'approved', e['id'])

    def test_existing_assets_are_untouched_and_ids_unique(self):
        result = planned()
        ids = [i['id'] for i in result['items']]
        self.assertEqual(len(ids), len(set(ids)))
        existing = {i['id'] for c in MANIFEST['categories'] for i in c['items']}
        self.assertFalse(existing & set(ids))

    def test_approved_but_not_adopted_stays_planned(self):
        cat = json.loads(json.dumps(CATALOG))
        next(i for i in cat['items'] if i['id'] == 'terrain_mountain_wall_cap_left').update(approval='approved')
        self.assertIn('terrain_mountain_wall_cap_left', wall_ids(planned(catalog=cat)))

    def test_adopted_with_all_parts_in_the_manifest_is_no_longer_planned(self):
        cat = json.loads(json.dumps(CATALOG))
        e = next(i for i in cat['items'] if i['id'] == 'terrain_mountain_wall_cap_left')
        e.update(approval='approved', adopted=True, parts=[{'id': e['id'] + '_part_000', 'file': 'a.png', 'w': 1, 'h': 1, 'sha256': 'x'},
                                                          {'id': e['id'] + '_part_001', 'file': 'b.png', 'w': 1, 'h': 1, 'sha256': 'x'}])
        man = json.loads(json.dumps(MANIFEST))
        man['categories'][0]['items'] = [i for i in man['categories'][0]['items'] if not i['id'].startswith(e['id'])]
        man['categories'][0]['items'].append({'id': e['id'] + '_part_000', 'label': 'p0', 'src': '/a.png', 'w': 1, 'h': 1, 'kind': 'object', 'tags': []})
        self.assertIn(e['id'], wall_ids(planned(man, cat)))  # one part missing: still planned
        man['categories'][0]['items'].append({'id': e['id'] + '_part_001', 'label': 'p1', 'src': '/b.png', 'w': 1, 'h': 1, 'kind': 'object', 'tags': []})
        self.assertNotIn(e['id'], wall_ids(planned(man, cat)))

    def test_adopted_items_need_the_file_and_the_hash(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            out = root / OUT_DIR
            out.mkdir(parents=True)
            data = b'png'
            (out / 'terrain_mountain_wall_cap_left.png').write_bytes(data)
            entry = {'id': 'terrain_mountain_wall_cap_left', 'role': 'left', 'label': 'Cap', 'approval': 'approved', 'adopted': True,
                     'parts': [{'id': 'terrain_mountain_wall_cap_left', 'file': 'terrain_mountain_wall_cap_left.png', 'w': 48, 'h': 96,
                                'sha256': hashlib.sha256(data).hexdigest()}]}
            self.assertEqual([i['id'] for i in adopted_wall_items({'items': [entry]}, root)], ['terrain_mountain_wall_cap_left'])
            entry['parts'][0]['sha256'] = 'bad'
            self.assertEqual(adopted_wall_items({'items': [entry]}, root), [])
            entry['parts'][0]['sha256'] = hashlib.sha256(data).hexdigest()
            entry['approval'] = 'pending'
            self.assertEqual(adopted_wall_items({'items': [entry]}, root), [])

    def test_output_is_deterministic(self):
        self.assertEqual(json.dumps(planned(), sort_keys=True), json.dumps(planned(), sort_keys=True))


if __name__ == '__main__':
    unittest.main()
