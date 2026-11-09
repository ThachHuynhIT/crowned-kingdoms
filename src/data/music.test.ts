import { describe, expect, it } from 'vitest';
import { MUSIC, MUSIC_CROSSFADE_MS, PENTATONIC_C } from './music';

describe('MUSIC data', () => {
  it('has exactly the planning and battle loops', () => {
    expect(Object.keys(MUSIC).sort()).toEqual(['battle', 'planning']);
    expect(MUSIC_CROSSFADE_MS).toBe(600);
  });

  it('planning is 90 BPM, flute + pluck, C major pentatonic only', () => {
    const t = MUSIC.planning;
    expect(t.bpm).toBe(90);
    expect(t.beatsPerBar).toBe(4);
    expect(t.voices.map((v) => v.instrument).sort()).toEqual(['flute', 'pluck']);
    const pcs = new Set(PENTATONIC_C.map((p) => p % 12));
    for (const v of t.voices) for (const note of v.notes) expect(pcs.has(note.pitch % 12)).toBe(true);
  });

  it('battle is 120 BPM, drum + horn', () => {
    const t = MUSIC.battle;
    expect(t.bpm).toBe(120);
    expect(t.beatsPerBar).toBe(4);
    expect(t.voices.map((v) => v.instrument).sort()).toEqual(['drum', 'horn']);
  });

  it.each(['planning', 'battle'] as const)('%s notes fit inside the loop and are finite', (id) => {
    const t = MUSIC[id];
    const loopBeats = t.bars * t.beatsPerBar;
    for (const v of t.voices) {
      expect(v.gain).toBeGreaterThan(0);
      expect(v.gain).toBeLessThanOrEqual(1);
      expect(v.notes.length).toBeGreaterThan(0);
      for (const note of v.notes) {
        expect(Number.isFinite(note.pitch)).toBe(true);
        expect(note.beat).toBeGreaterThanOrEqual(0);
        expect(note.beats).toBeGreaterThan(0);
        expect(note.beat + note.beats).toBeLessThanOrEqual(loopBeats);
      }
    }
  });
});
