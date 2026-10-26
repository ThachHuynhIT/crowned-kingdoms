import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

from slice_mountain_wall import WallError, slice_wall, validate_wall_recipe


def make_source(directory, w, h, alpha=255):
    rng = np.random.default_rng(1)
    arr = rng.integers(0, 256, (h, w, 4), dtype=np.uint8)
    arr[..., 3] = alpha
    path = Path(directory) / 'source.png'
    Image.fromarray(arr, 'RGBA').save(path)
    return path, arr


class SliceTest(unittest.TestCase):
    def test_wide_source_is_split_and_reassembles_byte_equal(self):
        with tempfile.TemporaryDirectory() as d:
            src, arr = make_source(d, 9000, 256)
            out = Path(d) / 'out'
            parts = slice_wall(src, {'id': 'wall', 'baseLine': 250}, out, 2048)
            self.assertEqual(len(parts), 5)
            self.assertTrue(all(p['w'] <= 2048 and p['h'] <= 2048 for p in parts))
            canvas = np.zeros_like(arr)
            for p in parts:
                im = np.array(Image.open(out / p['file']).convert('RGBA'))
                canvas[p['sourceY']:p['sourceY'] + p['h'], p['sourceX']:p['sourceX'] + p['w']] = im
            self.assertTrue((canvas == arr).all())  # no gap, no overlap, nothing altered
            self.assertEqual([p['id'] for p in parts][0], 'wall_part_000')

    def test_small_cap_also_cuts_the_height(self):
        with tempfile.TemporaryDirectory() as d:
            src, _ = make_source(d, 300, 250)
            parts = slice_wall(src, {'id': 'w', 'baseLine': 0}, Path(d) / 'o', 128)
            self.assertEqual(len(parts), 3 * 2)
            self.assertEqual(sum(p['w'] * p['h'] for p in parts), 300 * 250)

    def test_downscale_box_averages_blocks_and_must_divide_the_size(self):
        with tempfile.TemporaryDirectory() as d:
            src, arr = make_source(d, 16, 8)
            parts = slice_wall(src, {'id': 'w', 'baseLine': 8, 'downscale': 4}, Path(d) / 'o', 2048)
            self.assertEqual((parts[0]['w'], parts[0]['h']), (4, 2))
            out = np.array(Image.open(Path(d) / 'o' / 'w.png').convert('RGBA'))
            self.assertEqual(out.shape, (2, 4, 4))
            self.assertTrue((out[..., 3] == 255).all())
            expect = arr[:4, :4, :3].astype(float).mean(axis=(0, 1))
            self.assertTrue(np.abs(out[0, 0, :3].astype(float) - expect).max() <= 1.0)
            with self.assertRaises(WallError):
                slice_wall(src, {'id': 'w', 'baseLine': 8, 'downscale': 3}, Path(d) / 'o2', 2048)
            with self.assertRaises(WallError):
                validate_wall_recipe({'id': 'w', 'baseLine': 8, 'downscale': 0}, (16, 8))

    def test_a_source_that_fits_is_a_single_file_named_by_id(self):
        with tempfile.TemporaryDirectory() as d:
            src, _ = make_source(d, 100, 60)
            parts = slice_wall(src, {'id': 'terrain_mountain_wall_cap_left', 'baseLine': 59}, Path(d) / 'o', 2048)
            self.assertEqual([p['file'] for p in parts], ['terrain_mountain_wall_cap_left.png'])

    def test_semi_transparent_pixels_are_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            src, _ = make_source(d, 64, 64, alpha=128)
            with self.assertRaises(WallError):
                slice_wall(src, {'id': 'w', 'baseLine': 0}, Path(d) / 'o', 2048)

    def test_crop_outside_the_image_and_bad_cap_are_rejected(self):
        with self.assertRaises(WallError):
            validate_wall_recipe({'id': 'w', 'baseLine': 0, 'crop': {'x': 10, 'y': 0, 'w': 100, 'h': 10}}, (50, 50))
        with self.assertRaises(WallError):
            validate_wall_recipe({'id': 'w', 'baseLine': 99}, (50, 50))
        with self.assertRaises(WallError):
            validate_wall_recipe({'id': 'w', 'baseLine': 0, 'crop': {'x': 0.5, 'y': 0, 'w': 1, 'h': 1}}, (50, 50))
        with tempfile.TemporaryDirectory() as d:
            src, _ = make_source(d, 10, 10)
            with self.assertRaises(WallError):
                slice_wall(src, {'id': 'w', 'baseLine': 0}, Path(d) / 'o', 5000)

    def test_output_cannot_escape_or_overwrite_the_source(self):
        with tempfile.TemporaryDirectory() as d:
            src, arr = make_source(d, 10, 10)
            with self.assertRaises(WallError):
                slice_wall(src, {'id': '../escape', 'baseLine': 0}, Path(d) / 'o', 2048)
            with self.assertRaises(WallError):
                slice_wall(src, {'id': 'source', 'baseLine': 0}, Path(d), 2048)  # would overwrite source.png
            self.assertTrue((np.array(Image.open(src).convert('RGBA')) == arr).all())


if __name__ == '__main__':
    unittest.main()
