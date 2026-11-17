import { describe, expect, it } from 'vitest';
import { ISO_ANIMS, isoFacing, isoFlip, isoPoseCell, isoScreenMove, type IsoFacing } from './isoUnitModel';

const SE_RIGHT: IsoFacing = { dir: 'se', left: false };

describe('iso unit facing', () => {
  it('picks the sheet by the vertical screen move and the side by the horizontal one', () => {
    expect(isoFacing(SE_RIGHT, -3, -2)).toEqual({ dir: 'nw', left: true });
    expect(isoFacing(SE_RIGHT, 3, -2)).toEqual({ dir: 'nw', left: false });
    expect(isoFacing(SE_RIGHT, -3, 2)).toEqual({ dir: 'se', left: true });
  });

  it('keeps the sheet on a near-horizontal move and the side on a near-vertical one', () => {
    const nw: IsoFacing = { dir: 'nw', left: true };
    expect(isoFacing(nw, 10, 1)).toEqual({ dir: 'nw', left: false });
    expect(isoFacing(nw, 1, 10)).toEqual({ dir: 'se', left: true });
  });

  it('keeps the same object when nothing changes or nothing moves', () => {
    expect(isoFacing(SE_RIGHT, 0, 0)).toBe(SE_RIGHT);
    expect(isoFacing(SE_RIGHT, 5, 5)).toBe(SE_RIGHT);
  });

  it('projects world moves like core/iso project', () => {
    expect(isoScreenMove(1, 0)).toEqual({ sx: -1, sy: 0.5 });
    expect(isoScreenMove(0, 1)).toEqual({ sx: 1, sy: 0.5 });
  });

  it('flips SE when facing left and NW when facing right', () => {
    expect(isoFlip({ dir: 'se', left: true })).toBe(true);
    expect(isoFlip({ dir: 'se', left: false })).toBe(false);
    expect(isoFlip({ dir: 'nw', left: true })).toBe(false);
    expect(isoFlip({ dir: 'nw', left: false })).toBe(true);
  });
});

describe('iso unit pose', () => {
  const base = { moving: false, interval: 10, cooldown: 5, stunned: false, hasTarget: true, alpha: 0, nowMs: 0 };
  const attack = ISO_ANIMS.attack[0];

  it('shows the strike from the strike tick, then the recovery, then idle', () => {
    expect(isoPoseCell({ ...base, cooldown: 10, alpha: 0.5 })).toBe(attack + 2);
    expect(isoPoseCell({ ...base, cooldown: 9, alpha: 0.5 })).toBe(attack + 3);
    expect(isoPoseCell({ ...base, cooldown: 8, alpha: 0.1 })).toBe(0);
  });

  it('winds up during the last tick before a strike, only standing at a target and not stunned', () => {
    expect(isoPoseCell({ ...base, cooldown: 1, alpha: 0.2 })).toBe(attack);
    expect(isoPoseCell({ ...base, cooldown: 1, alpha: 0.7 })).toBe(attack + 1);
    expect(isoPoseCell({ ...base, cooldown: 1, alpha: 0.7, hasTarget: false })).toBe(0);
    expect(isoPoseCell({ ...base, cooldown: 1, alpha: 0.7, stunned: true })).toBe(0);
  });

  it('walks through four cells and idles through three on the clock', () => {
    const walk = [0, 70, 130, 190, 250].map((nowMs) => isoPoseCell({ ...base, moving: true, nowMs }));
    expect(walk).toEqual([3, 4, 5, 6, 3]);
    const idle = [0, 120, 230, 340].map((nowMs) => isoPoseCell({ ...base, nowMs }));
    expect(idle).toEqual([0, 1, 2, 0]);
  });

  it('a unit that never struck (cooldown 0) is not attacking', () => {
    expect(isoPoseCell({ ...base, cooldown: 0, alpha: 0.9 })).toBe(0);
  });
});
