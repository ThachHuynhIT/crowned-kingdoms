import tempfile
import unittest
from pathlib import Path

from PIL import Image

from strip_decor_outline import is_outline_colour, process_files, strip_outline

OUTLINE = (90, 6, 24, 255)
FILL = (120, 160, 60, 255)
DARK_INNER = (88, 8, 22, 255)


def bush(size=12, ring=2):
    """A square of FILL wrapped in `ring` rings of OUTLINE, on a transparent margin of 1, a dark inner pixel."""
    w = size + 2
    im = Image.new('RGBA', (w, w), (0, 0, 0, 0))
    for y in range(1, w - 1):
        for x in range(1, w - 1):
            edge = min(x - 1, y - 1, w - 2 - x, w - 2 - y)
            im.putpixel((x, y), OUTLINE if edge < ring else FILL)
    im.putpixel((w // 2, w // 2), DARK_INNER)  # an inner dark detail that is not on the edge
    return im


class OutlineColourTest(unittest.TestCase):
    def test_dark_maroon_is_outline_and_art_colours_are_not(self):
        self.assertTrue(is_outline_colour(90, 6, 24))
        self.assertTrue(is_outline_colour(120, 10, 30))
        for rgb in [(120, 160, 60), (40, 60, 50), (200, 90, 40), (150, 150, 150), (230, 40, 40), (20, 30, 40)]:
            self.assertFalse(is_outline_colour(*rgb), rgb)


class StripTest(unittest.TestCase):
    def test_peels_the_two_outline_rings_and_keeps_the_art(self):
        im = bush()
        out, removed = strip_outline(im, passes=2)
        self.assertEqual(out.size, im.size)
        self.assertEqual(removed, sum(1 for p in im.getdata() if p == OUTLINE))
        self.assertTrue(all(p[3] == 0 or p[:3] != OUTLINE[:3] for p in out.getdata()))
        c = im.width // 2
        self.assertEqual(out.getpixel((c, c)), DARK_INNER)  # inner detail survives
        self.assertEqual(out.getpixel((4, 4)), FILL)
        self.assertEqual(im.getpixel((1, 1)), OUTLINE)  # the input is untouched

    def test_one_pass_removes_only_the_outermost_ring(self):
        out, removed = strip_outline(bush(), passes=1)
        self.assertEqual(out.getpixel((1, 1))[3], 0)
        self.assertEqual(out.getpixel((2, 2)), OUTLINE)
        self.assertEqual(removed, 4 * 12 - 4)

    def test_stray_rim_specks_go_too(self):
        im = Image.new('RGBA', (7, 7), (0, 0, 0, 0))
        for y in range(2, 5):
            for x in range(2, 5):
                im.putpixel((x, y), FILL)
        im.putpixel((5, 3), OUTLINE)  # a rim pixel sticking out of the art
        im.putpixel((6, 6), OUTLINE)  # a lone rim speck
        out, removed = strip_outline(im, passes=0)
        self.assertEqual(out.getpixel((6, 6))[3], 0)
        self.assertEqual(out.getpixel((5, 3))[3], 0)  # one opaque neighbour: a speck too
        self.assertEqual(removed, 2)
        self.assertEqual(out.getpixel((3, 3)), FILL)

    def test_art_on_the_edge_is_never_removed(self):
        im = Image.new('RGBA', (5, 5), (0, 0, 0, 0))
        for y in range(1, 4):
            for x in range(1, 4):
                im.putpixel((x, y), FILL)
        out, removed = strip_outline(im)
        self.assertEqual(removed, 0)
        self.assertEqual(list(out.getdata()), list(im.getdata()))


class FilesTest(unittest.TestCase):
    def test_backs_up_once_and_reprocesses_from_the_original(self):
        with tempfile.TemporaryDirectory() as d:
            src = Path(d) / 'bush.png'
            backup = Path(d) / 'originals'
            bush().save(src)
            first = process_files([src], backup, passes=2)
            self.assertTrue((backup / 'bush.png').exists())
            self.assertEqual(Image.open(backup / 'bush.png').getpixel((1, 1)), OUTLINE)
            self.assertEqual(Image.open(src).getpixel((1, 1))[3], 0)
            # A second run starts again from the kept original: same result, the backup unchanged.
            second = process_files([src], backup, passes=2)
            self.assertEqual(first, second)
            self.assertEqual(Image.open(backup / 'bush.png').getpixel((1, 1)), OUTLINE)


if __name__ == '__main__':
    unittest.main()
