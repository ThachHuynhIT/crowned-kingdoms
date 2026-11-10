import type { PixelCanvas } from './pixel';
import { IMPACT_FRAMES, IMPACT_FRAME_MS, IMPACT_SIZE, paintImpactFrame, paintImpactGlow } from './impactFx';
import { arrowHit } from './fx/arrowHit';
import { unitDeath } from './fx/unitDeath';
import { boulderBlast } from './fx/boulderBlast';
import { buildingCollapse } from './fx/buildingCollapse';
import { rageAura } from './fx/rageAura';

/** Pure pixel painters, independent of Phaser and the DOM. */
export interface CodeFxDef {
  readonly id: string;
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
    id: 'impact', label: 'Trúng đòn', size: { w: IMPACT_SIZE, h: IMPACT_SIZE },
    frames: IMPACT_FRAMES, frameMs: IMPACT_FRAME_MS, loop: false,
    paint: paintImpactFrame, paintGlow: paintImpactGlow, anchor: 'centre',
    note: 'Chớp sáng tại điểm vũ khí cận chiến chạm mục tiêu.',
  },
  arrowHit, unitDeath, boulderBlast, buildingCollapse, rageAura,
];
