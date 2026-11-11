/**
 * Which code-drawn projectile each shooter fires (render only, 10/11/2026): battle label (card id for a structure,
 * unit id for a unit) → `CODE_FX` id. Shooters not listed keep the eight pre-drawn arrows. Never touches the sim.
 */
export const PROJECTILE_FX: Readonly<Record<string, string>> = {
  // thrones
  arcane_throne: 'fx_magic_orb',
  clock_throne: 'fx_gear',
  forge_throne: 'fx_fireball',
  grove_throne: 'fx_thorn',
  moon_throne: 'fx_shadow_orb',
  stone_throne: 'fx_stone',
  tide_throne: 'fx_cannonball',
  // towers
  arcane_mage_tower: 'fx_magic_orb',
  clock_gear_tower: 'fx_gear',
  clock_steam_cannon: 'fx_cannonball',
  grove_thorn_tower: 'fx_thorn',
  moon_shadow_spire: 'fx_shadow_orb',
  stone_catapult: 'fx_stone',
  tide_cannon: 'fx_cannonball',
  wheat_scarecrow: 'fx_seed',
  // units
  apprentice: 'fx_magic_orb',
  archmage: 'fx_magic_orb',
  frost_mage: 'fx_ice_shard',
  gear_gunner: 'fx_gear',
  bombardier: 'fx_cannonball',
  dryad: 'fx_seed',
  slinger: 'fx_stone',
  hookman: 'fx_hook',
  musketeer: 'fx_bullet',
  boss_hornet_queen: 'fx_stinger',
};

export const projectileFxFor = (label: string): string | null => PROJECTILE_FX[label] ?? null;

/** Index of a direction in the authored order of directional code projectiles (`e, ne, n, nw, w, sw, s, se`). */
export const CODE_FX_DIRS = ['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se'] as const;

/**
 * Frame of a code effect after `elapsed` ms: steps through `frameMs`; a looping effect wraps, a one-shot returns
 * null once finished.
 */
export const codeFxFrameAt = (frameMs: readonly number[], elapsed: number, loop: boolean): number | null => {
  const total = frameMs.reduce((a, b) => a + b, 0);
  if (total <= 0 || frameMs.length === 0) return null;
  let t = Math.max(0, elapsed);
  if (loop) t %= total;
  else if (t >= total) return null;
  for (let i = 0; i < frameMs.length; i++) {
    if (t < frameMs[i]!) return i;
    t -= frameMs[i]!;
  }
  return frameMs.length - 1;
};

/** Atlas frame name of frame `i` of code effect `id` (and of its additive glow layer). */
export const codeFxFrame = (id: string, i: number, glow = false): string => `fx_code_${id}_${glow ? 'glow_' : ''}${i}`;
