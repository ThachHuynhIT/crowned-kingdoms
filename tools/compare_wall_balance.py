"""Compare two WALL_BALANCE_JSON logs (src/game/sim/obliqueBalance.test.ts, WALL_BALANCE_SEEDS=100).

    python tools/compare_wall_balance.py BEFORE.log AFTER.log [--expected 600]

Exit code 0 when both logs are complete and every delta is inside the gate, 1 otherwise.
Crashed cases (bot illegal command) count as losses and are excluded from the year median; after may not
crash more than 12 additional cases per bot. Gate (plan 2026-10-26): |delta win rate| <= 10 points per bot, <= 15 points per king and bot,
|delta median final year| <= 3 per bot. A baseline of 0 wins still compares by absolute delta.
"""
import argparse
import json
import math
import statistics
import sys
from collections import defaultdict

MARKER = 'WALL_BALANCE_JSON '
TOTAL_GATE = 10.0
GROUP_GATE = 15.0
YEAR_GATE = 3.0
FIELDS = ('seed', 'kingId', 'bot', 'won', 'year', 'commands', 'bossesDefeated', 'crashed')
CRASH_SLACK = 12  # after may crash at most this many more cases than before (2% of 600)


class LogError(Exception):
    pass


def parse(text, expected):
    """Rows keyed by (seed, kingId, bot); raises LogError on duplicates, bad rows or a wrong count."""
    rows = {}
    for line in text.splitlines():
        i = line.find(MARKER)
        if i < 0:
            continue
        try:
            row = json.loads(line[i + len(MARKER):])
        except json.JSONDecodeError as e:
            raise LogError(f'unparseable row: {line!r} ({e})')
        for f in FIELDS:
            if f not in row:
                raise LogError(f'row missing {f}: {row}')
        for f in ('year', 'commands', 'bossesDefeated', 'seed'):
            v = row[f]
            if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
                raise LogError(f'non-finite {f} in {row}')
        key = (row['seed'], row['kingId'], row['bot'])
        if key in rows:
            raise LogError(f'duplicate row {key}')
        rows[key] = row
    if len(rows) != expected:
        raise LogError(f'expected {expected} rows, found {len(rows)}')
    return rows


def win_rate(rows):
    return 100.0 * sum(1 for r in rows if r['won']) / len(rows)


def compare(before, after):
    """Return (report lines, failures) for two complete, parsed logs with identical keys."""
    if set(before) != set(after):
        raise LogError('the two logs do not cover the same (seed, king, bot) cases')
    lines, fails = [], []
    bots = sorted({k[2] for k in before})
    for bot in bots:
        b = [r for k, r in before.items() if k[2] == bot]
        a = [r for k, r in after.items() if k[2] == bot]
        dw = win_rate(a) - win_rate(b)
        yb = statistics.median(r['year'] for r in b if not r['crashed'])
        ya = statistics.median(r['year'] for r in a if not r['crashed'])
        dy = ya - yb
        cb, ca = sum(1 for r in b if r['crashed']), sum(1 for r in a if r['crashed'])
        lines.append(f'{bot}: win {win_rate(b):.1f}% -> {win_rate(a):.1f}% ({dw:+.1f} pts), '
                     f'median year {yb} -> {ya} ({dy:+.1f}), bot crashes {cb} -> {ca}')
        if ca > cb + CRASH_SLACK:
            fails.append(f'{bot}: bot crashes rose from {cb} to {ca}')
        if abs(dw) > TOTAL_GATE:
            fails.append(f'{bot}: win-rate delta {dw:+.1f} pts exceeds {TOTAL_GATE}')
        if abs(dy) > YEAR_GATE:
            fails.append(f'{bot}: median year delta {dy:+.1f} exceeds {YEAR_GATE}')
        for king in sorted({k[1] for k in before}):
            bk = [r for k, r in before.items() if k[2] == bot and k[1] == king]
            ak = [r for k, r in after.items() if k[2] == bot and k[1] == king]
            d = win_rate(ak) - win_rate(bk)
            lines.append(f'  {bot}/{king}: win {win_rate(bk):.1f}% -> {win_rate(ak):.1f}% ({d:+.1f} pts)')
            if abs(d) > GROUP_GATE:
                fails.append(f'{bot}/{king}: win-rate delta {d:+.1f} pts exceeds {GROUP_GATE}')
    return lines, fails


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('before')
    ap.add_argument('after')
    ap.add_argument('--expected', type=int, default=600)
    args = ap.parse_args(argv)
    try:
        before = parse(open(args.before, encoding='utf-8').read(), args.expected)
        after = parse(open(args.after, encoding='utf-8').read(), args.expected)
        lines, fails = compare(before, after)
    except (LogError, OSError) as e:
        print(f'FAIL: {e}')
        return 1
    print('\n'.join(lines))
    for f in fails:
        print('FAIL:', f)
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
