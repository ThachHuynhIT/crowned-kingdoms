import { INTERVENTION_POWERS } from '../data/battle';
import { describe, expect, it } from 'vitest';
import { CODE_FX } from './codeFx';
import type { PixelCanvas } from './pixel';
import planned from '../../tools/asset-admin/planned.json';

function solidCount(canvas: PixelCanvas): number {
  let count = 0;
  for (let n = 3; n < canvas.data.length; n += 4) {
    expect([0, 255]).toContain(canvas.data[n]);
    if (canvas.data[n] === 255) count++;
  }
  return count;
}

describe('CODE_FX', () => {
  it('provides one drop and impact per intervention power', () => {
    const powers = CODE_FX.filter((fx) => fx.group === 'Can Thiệp');
    expect(powers).toHaveLength(Object.keys(INTERVENTION_POWERS).length * 2);
    for (const king of Object.keys(INTERVENTION_POWERS)) for (const phase of ['drop', 'impact']) {
      const matches = powers.filter((fx) => fx.id === `power_${king}_${phase}`);
      expect(matches).toHaveLength(1);
      const def = matches[0];
      if (!def) throw new Error(`Missing ${king} ${phase}`);
      expect(def.anchor).toBe('centre');
      expect(def.kind).toBe(phase === 'drop' ? 'projectile' : 'effect');
      expect(def.loop).toBe(phase === 'drop');
      if (phase === 'drop') {
        expect(def.size).toEqual({ w: 24, h: 24 });
        expect([1, 2]).toContain(def.frames);
      } else {
        expect([7, 8]).toContain(def.frames);
        const duration = def.frameMs.reduce((sum, ms) => sum + ms, 0);
        expect(duration).toBeGreaterThanOrEqual(460);
        expect(duration).toBeLessThanOrEqual(560);
        if (def.paintGlow) for (let i = 3; i < def.frames; i++) expect(solidCount(def.paintGlow(i))).toBe(0);
      }
    }
  });
  it('has unique ids', () => {
    expect(new Set(CODE_FX.map((fx) => fx.id)).size).toBe(CODE_FX.length);
  });
  it('has valid kinds and unique coverage', () => {
    const covers = CODE_FX.flatMap((fx) => fx.covers ?? []);
    expect(new Set(covers).size).toBe(covers.length);
    for (const fx of CODE_FX) expect(['effect', 'projectile']).toContain(fx.kind);
  });
  it('covers every planned VFX and projectile exactly once with the matching kind', () => {
    for (const item of planned.items.filter((entry) => ['vfx', 'projectiles'].includes(entry.category))) {
      const owners = CODE_FX.filter((fx) => fx.covers?.includes(item.id));
      expect(owners, item.id).toHaveLength(1);
      expect(owners[0]?.kind, item.id).toBe(item.category === 'vfx' ? 'effect' : 'projectile');
    }
  });
  it('loops sustained statuses', () => {
    for (const id of ['fx_burn', 'fx_poison', 'fx_slow', 'fx_disable', 'fx_heal', 'fx_shield', 'fx_stun', 'fx_rage']) {
      const def = CODE_FX.find((fx) => fx.covers?.includes(id));
      expect(def?.loop, id).toBe(true);
    }
  });
  it('keeps orb glow solid inside radius four and dithers only its one-pixel edge', () => {
    for (const id of ['fx_magic_orb', 'fx_shadow_orb']) {
      const def = CODE_FX.find((fx) => fx.id === id);
      expect(def?.paintGlow, id).toBeDefined();
      if (!def?.paintGlow) throw new Error(`Missing glow for ${id}`);
      for (let i = 0; i < def.frames; i++) {
        const glow = def.paintGlow(i);
        let edgePixels = 0, edgeGaps = 0;
        for (let y = 0; y < glow.height; y++) for (let x = 0; x < glow.width; x++) {
          const d2 = (x + 0.5 - 8) ** 2 + (y + 0.5 - 8) ** 2;
          const alpha = glow.alphaAt(x, y);
          if (d2 <= 16) expect(alpha).toBe(255);
          else if (d2 > 25) expect(alpha).toBe(0);
          else if (alpha === 255) edgePixels++;
          else edgeGaps++;
        }
        expect(edgePixels).toBeGreaterThan(0);
        expect(edgeGaps).toBeGreaterThan(0);
      }
    }
  });
  it('uses the four-frame budgets and authored sizes for the twenty new effects', () => {
    const sizes: Readonly<Record<string, readonly [number, number]>> = {
      fx_burn: [24, 24], fx_poison: [24, 24], fx_slow: [24, 24], fx_disable: [32, 32], fx_heal: [24, 24],
      fx_slash: [32, 32], fx_magic_hit: [24, 24], fx_splash: [32, 32], fx_wave: [48, 24],
      fx_fire_cone: [48, 24], fx_chain: [48, 16], fx_rope: [48, 8], fx_dust: [24, 16],
      fx_soul: [32, 32], fx_revive: [32, 32], fx_summon: [32, 32], fx_reward: [32, 32],
      fx_place: [64, 32], fx_move: [64, 32], fx_upgrade: [32, 48],
    };
    for (const [id, size] of Object.entries(sizes)) {
      const def = CODE_FX.find((fx) => fx.id === id);
      expect(def?.frames, id).toBe(4);
      expect([def?.size.w, def?.size.h], id).toEqual(size);
      expect(def?.loop, id).toBe(['fx_burn', 'fx_poison', 'fx_slow', 'fx_disable', 'fx_heal'].includes(id));
    }
  });
  for (const fx of CODE_FX.filter((entry) => entry.directional)) {
    it(`${fx.id} has eight distinct directions and mirrored east/west`, () => {
      expect(fx.frames).toBe(8);
      const images = Array.from({ length: 8 }, (_, i) => fx.paint(i));
      expect(new Set(images.map((c) => Array.from(c.data).join(','))).size).toBe(8);
      const east = fx.paint(0), west = fx.paint(4);
      for (let y = 0; y < east.height; y++) for (let x = 0; x < east.width; x++) {
        const e = (y * east.width + x) * 4;
        const w = (y * west.width + west.width - 1 - x) * 4;
        expect(east.data.slice(e, e + 4)).toEqual(west.data.slice(w, w + 4));
      }
    });
  }
  for (const fx of CODE_FX) describe(fx.id, () => {
    it('has valid timing and deterministic hard-edged frames at the declared size', () => {
      expect(fx.frameMs).toHaveLength(fx.frames);
      const counts: number[] = [];
      for (let i = 0; i < fx.frames; i++) {
        expect(fx.frameMs[i]).toBeGreaterThan(0);
        const c = fx.paint(i);
        expect([c.width, c.height]).toEqual([fx.size.w, fx.size.h]);
        expect(c.data).toEqual(fx.paint(i).data);
        counts.push(solidCount(c));
        if (fx.paintGlow) {
          const glow = fx.paintGlow(i);
          expect([glow.width, glow.height]).toEqual([fx.size.w, fx.size.h]);
          expect(glow.data).toEqual(fx.paintGlow(i).data);
          solidCount(glow);
        }
      }
      expect(counts[0]).toBeGreaterThan(0);
      const last = counts[fx.frames - 1] ?? 0;
      if (fx.loop) {
        expect(last).toBeGreaterThan(0);
        expect(fx.paint(fx.frames - 1).data).not.toEqual(fx.paint(0).data);
      } else if (fx.kind === 'effect') expect(last).toBeLessThan(Math.max(...counts));
    });
  });
});
