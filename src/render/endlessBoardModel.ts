import type { RunMode } from '../data/rules';
import { geometryFor, plotAtCell, plotCoords } from '../game/run/boardGeometry';

/** World-space hit test, preserving inner ids in both modes. */
export function plotAtWorld(x: number, y: number, mode: RunMode = 'normal'): number | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const g = geometryFor(mode);
  return plotAtCell(
    Math.floor((y - g.innerOrigin) / g.plotSize),
    Math.floor((x - g.innerOrigin) / g.plotSize),
    mode,
  );
}

export function boardPlotCenter(plot: number, mode: RunMode = 'normal') {
  const g = geometryFor(mode);
  const { row, col } = plotCoords(plot, mode);
  return {
    x: g.innerOrigin + (col + 0.5) * g.plotSize,
    y: g.innerOrigin + (row + 0.5) * g.plotSize,
  };
}

/** Drawing-only extents shared by terrain tests. */
export function boardTerrain(mode: RunMode = 'normal') {
  const g = geometryFor(mode);
  return {
    wallY: g.wallY,
    road: { x: g.field / 2, y0: g.roadStartY, y1: g.field },
    portal: g.portal,
  };
}

/** Different run modes must never share a painted field texture. */
export const fieldTextureKey = (seed: number, mode: RunMode = 'normal'): string =>
  mode === 'normal' ? `field-${seed}` : `field-${seed}-${mode}`; // normal keeps its old key
