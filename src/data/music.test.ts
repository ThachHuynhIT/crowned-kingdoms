import { describe, expect, it } from 'vitest';
import { MUSIC, MUSIC_BUS_GAIN, MUSIC_CROSSFADE_MS, PENTATONIC_C } from './music';

describe('MUSIC data', () => {
  it('has exactly the planning and battle loops', () => {
    expect(Object.keys(MUSIC).sort()).toEqual(['battle', 'planning']);
    expect(MUSIC_CROSSFADE_MS).toBe(600);
  });

  it('planning is a slow 72 BPM pad + pluck + lead, C major pentatonic only', () => {
    const t = MUSIC.planning;
    expect(t.bpm).toBe(72);
    expect(t.beatsPerBar).toBe(4);
    expect(t.voices.map((v) => v.instrument).sort()).toEqual(['flute', 'horn', 'pluck']);
    const pcs = new Set(PENTATONIC_C.map((p) => p % 12));
    for (const v of t.voices) for (const note of v.notes) expect(pcs.has(note.pitch % 12)).toBe(true);
  });

  it('battle is 96 BPM, drum + pad + pluck', () => {
    const t = MUSIC.battle;
    expect(t.bpm).toBe(96);
    expect(t.beatsPerBar).toBe(4);
    expect(t.voices.map((v) => v.instrument).sort()).toEqual(['drum', 'horn', 'pluck']);
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

  it.each(['planning', 'battle'] as const)('%s is soft and not busy (owner 10/11/2026)', (id) => {
    const t = MUSIC[id];
    const loopBeats = t.bars * t.beatsPerBar;
    for (const v of t.voices) {
      // Every voice is quiet; the loudest beat of all voices together stays under 0.5.
      expect(v.gain).toBeLessThanOrEqual(0.2);
      // At most one onset per beat on average per voice (chords count once).
      const onsets = new Set(v.notes.map((note) => note.beat));
      expect(onsets.size).toBeLessThanOrEqual(loopBeats + 1);
    }
    for (let beat = 0; beat < loopBeats; beat++) {
      const level = t.voices.reduce((sum, v) => sum + (v.notes.some((note) => note.beat === beat) ? v.gain : 0), 0);
      expect(level).toBeLessThan(0.5);
    }
    expect(MUSIC_BUS_GAIN).toBeLessThanOrEqual(0.7);
  });
});
