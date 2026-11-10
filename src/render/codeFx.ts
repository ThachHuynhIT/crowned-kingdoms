import { PROJECTILES } from './fx/projectiles';
import type { PixelCanvas } from './pixel';
import { IMPACT_FRAMES, IMPACT_FRAME_MS, IMPACT_SIZE, paintImpactFrame, paintImpactGlow } from './impactFx';
import { arrowHit } from './fx/arrowHit';
import { unitDeath } from './fx/unitDeath';
import { boulderBlast } from './fx/boulderBlast';
import { buildingCollapse } from './fx/buildingCollapse';
import { rageAura } from './fx/rageAura';
import { VFX } from './fx/vfx';
import { LEGACY_FX } from './fx/plannedLegacy';

/** Pure pixel painters, independent of Phaser and the DOM. */
export interface CodeFxDef {
  readonly id: string;
  readonly kind: 'effect' | 'projectile';
  readonly group?: string;
  /** Eight authored directions: e, ne, n, nw, w, sw, s, se. */
  readonly directional?: boolean;
  /** Planned asset ids supplied by this painter. */
  readonly covers?: readonly string[];
  readonly label: string;
  readonly size: { readonly w: number; readonly h: number };
  readonly frames: number;
  readonly frameMs: readonly number[];
  readonly loop: boolean;
  readonly paint: (i: number) => PixelCanvas;
  readonly paintGlow?: (i: number) => PixelCanvas;
  readonly anchor: 'centre' | 'feet';
  readonly note: string;
}

export const CODE_FX: readonly CodeFxDef[] = [
  {
    id: 'impact', kind: 'effect', covers: ['fx_physical_hit'], label: 'Trúng đòn', size: { w: IMPACT_SIZE, h: IMPACT_SIZE },
    frames: IMPACT_FRAMES, frameMs: IMPACT_FRAME_MS, loop: false,
    paint: paintImpactFrame, paintGlow: paintImpactGlow, anchor: 'centre',
    note: 'Chớp sáng tại điểm vũ khí cận chiến chạm mục tiêu.',
  },
  arrowHit, unitDeath, boulderBlast, buildingCollapse, rageAura,
  ...PROJECTILES,
  ...VFX,
  ...LEGACY_FX,
];
