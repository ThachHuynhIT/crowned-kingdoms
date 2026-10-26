import unittest

from compare_wall_balance import LogError, compare, parse

KINGS = ('wheat', 'stone', 'arcane')


def log(win_fn, year=10, seeds=2, extra=''):
    out = []
    for bot in ('random', 'scripted'):
        for king in KINGS:
            for seed in range(1, seeds + 1):
                row = {'seed': seed, 'kingId': king, 'bot': bot, 'won': win_fn(bot, king, seed), 'year': year,
                       'commands': 10, 'bossesDefeated': 0, 'crashed': False}
                out.append('WALL_BALANCE_JSON ' + __import__('json').dumps(row))
    return '\n'.join(out) + extra


class CompareTest(unittest.TestCase):
    def test_equal_logs_pass(self):
        a = parse(log(lambda *_: True), 12)
        lines, fails = compare(a, parse(log(lambda *_: True), 12))
        self.assertEqual(fails, [])
        self.assertTrue(lines)

    def test_win_rate_over_gate_fails(self):
        b = parse(log(lambda *_: True, seeds=10), 60)
        a = parse(log(lambda bot, k, s: s > 3, seeds=10), 60)  # 30% wins lost
        self.assertTrue(compare(b, a)[1])

    def test_small_delta_passes_and_zero_baseline_is_absolute(self):
        b = parse(log(lambda *_: False, seeds=10), 60)
        a = parse(log(lambda bot, k, s: s == 1 and k == 'wheat', seeds=10), 60)
        self.assertEqual(compare(b, a)[1], [])  # +3.3 pts total, +10 pts for one king/bot: inside the gate

    def test_year_median_shift_fails(self):
        b = parse(log(lambda *_: True, year=10), 12)
        a = parse(log(lambda *_: True, year=20), 12)
        self.assertTrue(any('median year' in f for f in compare(b, a)[1]))

    def test_duplicate_missing_nan_and_mismatch_are_errors(self):
        text = log(lambda *_: True)
        with self.assertRaises(LogError):
            parse(text + '\n' + text.splitlines()[0], 13)  # duplicate
        with self.assertRaises(LogError):
            parse(text, 13)  # missing
        with self.assertRaises(LogError):
            parse(text.replace('"year": 10', '"year": NaN', 1), 12)
        b = parse(log(lambda *_: True), 12)
        a = parse(log(lambda *_: True, seeds=3), 18)
        with self.assertRaises(LogError):
            compare(b, a)


if __name__ == '__main__':
    unittest.main()
