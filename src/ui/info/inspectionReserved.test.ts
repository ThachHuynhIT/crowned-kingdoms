import { describe, expect, it } from 'vitest';
import { planningLayout } from '../realm/realmLayout';
import { planningControls } from './inspectionReserved';

describe('planningControls', () => {
  it('inspection_reserves_new_status: the info box keeps clear of the status rows, the year label and every calendar cell', () => {
    for (const screen of [{ w: 1280, h: 720 }, { w: 375, h: 812 }]) {
      const l = planningLayout(screen);
      const reserved = planningControls(l);
      for (const r of [l.allyStatus, l.foeStatus, l.year, ...l.calendar]) expect(reserved).toContainEqual(r);
    }
  });
});
