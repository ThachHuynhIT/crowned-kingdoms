import { describe, expect, it } from 'vitest';
import { blocksPortrait } from './orientation';

describe('landscape-only phones (owner 12/11/2026)', () => {
  it('blocks a touch-only device held in portrait', () => {
    expect(blocksPortrait({ coarsePointer: true, finePointer: false, width: 390, height: 844 })).toBe(true);
    expect(blocksPortrait({ coarsePointer: true, finePointer: false, width: 768, height: 1024 })).toBe(true);
  });
  it('lets the same device play in landscape', () => {
    for (const [w, h] of [[667, 375], [844, 390], [915, 412], [932, 430], [1024, 768]] as const)
      expect(blocksPortrait({ coarsePointer: true, finePointer: false, width: w, height: h })).toBe(false);
  });
  it('never blocks a desktop, even in a tall window', () => {
    expect(blocksPortrait({ coarsePointer: false, finePointer: true, width: 500, height: 900 })).toBe(false);
    expect(blocksPortrait({ coarsePointer: true, finePointer: true, width: 500, height: 900 })).toBe(false);
  });
});
