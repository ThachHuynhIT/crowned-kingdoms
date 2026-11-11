/**
 * Damage dealt in the last battle, per building (owner 11/11/2026): a small number under each building and a line in
 * its info box. Pure: the numbers come from `BattleResult.damageBySource` (per building uid: its tower attacks and the
 * units it spawned), kept in memory by `RunController`.
 */
import type { RunState } from '../../game/run/state';

/** Whole points below 1000; "1,2k" (Vietnamese decimal comma) below 10k; whole k from there. */
export const formatDamage = (n: number): string => {
  const v = Math.max(0, Math.round(n));
  if (v < 1000) return String(v);
  if (v < 10_000) {
    const tenths = Math.floor(v / 100) / 10;
    return `${Number.isInteger(tenths) ? tenths : String(tenths).replace('.', ',')}k`;
  }
  return `${Math.floor(v / 1000)}k`;
};

export interface PlotDamageLabel {
  readonly plot: number;
  readonly text: string;
  readonly damage: number;
}

/** One label per built plot whose building dealt damage in the last battle; none before the first battle. */
export const plotDamageLabels = (
  state: RunState,
  damage: Readonly<Record<number, number>> | null,
): readonly PlotDamageLabel[] => {
  if (damage === null) return [];
  const out: PlotDamageLabel[] = [];
  state.plots.forEach((p, plot) => {
    const uid = p.building?.uid;
    if (uid === undefined) return;
    const d = damage[uid] ?? 0;
    if (d > 0) out.push({ plot, text: formatDamage(d), damage: d });
  });
  return out;
};
