import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MUSIC } from '../data/music';
import { midiToHz, scheduleLoop, SOURCES_PER_NOTE, TONE } from './music';
import { asContext, FakeAudioContext, FakeBufferSource, type FakeGain, FakeOscillator } from './testing/fakeAudio';

/** Sources the track starts for the notes that begin exactly at `beat`. */
const sourcesAt = (track: keyof typeof MUSIC, beat: number): number =>
  MUSIC[track].voices.reduce(
    (sum, v) => sum + v.notes.filter((note) => note.beat === beat).length * SOURCES_PER_NOTE[v.instrument],
    0,
  );

describe('scheduleLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules only the notes inside the 200 ms horizon, then more each 100 ms tick', () => {
    const ctx = new FakeAudioContext();
    const out = ctx.createGain();
    const loop = scheduleLoop(asContext(ctx), 'planning', out as unknown as AudioNode, 0);
    const beat0 = sourcesAt('planning', 0);
    // Beat 0: a three-note pad chord (two oscillators each), a pluck and the lead.
    expect(beat0).toBe(8);
    expect(ctx.started.length).toBe(beat0);
    expect(vi.getTimerCount()).toBe(1);
    ctx.currentTime = 0.7; // beat 1 at 0.833 s enters the horizon
    vi.advanceTimersByTime(100);
    expect(ctx.started.length).toBe(beat0 + sourcesAt('planning', 1));
    expect(ctx.started[beat0]!.startedAt).toBeCloseTo(60 / 72);
    loop.stop();
  });

  it('loops: notes of the next pass are scheduled one loop length later', () => {
    const ctx = new FakeAudioContext();
    const loopSeconds = (MUSIC.battle.bars * MUSIC.battle.beatsPerBar * 60) / MUSIC.battle.bpm;
    const loop = scheduleLoop(asContext(ctx), 'battle', ctx.createGain() as unknown as AudioNode, 0);
    const firstPass = ctx.started.length;
    for (let t = 0.1; t < loopSeconds + 0.05; t += 0.1) {
      ctx.currentTime = t;
      vi.advanceTimersByTime(100);
    }
    expect(ctx.started.length).toBeGreaterThan(firstPass);
    expect(ctx.started.some((s) => Math.abs(s.startedAt! - loopSeconds) < 1e-9)).toBe(true);
    loop.stop();
  });

  it('drops late notes instead of catching up after a long gap', () => {
    const ctx = new FakeAudioContext();
    const loop = scheduleLoop(asContext(ctx), 'planning', ctx.createGain() as unknown as AudioNode, 0);
    const before = ctx.started.length;
    ctx.currentTime = 30.7;
    vi.advanceTimersByTime(100);
    const fresh = ctx.started.slice(before);
    // Only the notes of the next 200 ms (beat 5 of the third pass), none of the missed ones.
    expect(fresh.length).toBeGreaterThan(0);
    expect(fresh.length).toBeLessThanOrEqual(4);
    for (const s of fresh) expect(s.startedAt!).toBeGreaterThanOrEqual(30.7);
    loop.stop();
  });

  it('stop clears the timer, stops live voices and is idempotent', () => {
    const ctx = new FakeAudioContext();
    const loop = scheduleLoop(asContext(ctx), 'battle', ctx.createGain() as unknown as AudioNode, 0);
    expect(ctx.started.length).toBeGreaterThan(0);
    loop.stop();
    loop.stop();
    expect(vi.getTimerCount()).toBe(0);
    for (const s of ctx.started) {
      expect(s.stoppedAt).not.toBeNull();
      expect(s.disconnected).toBe(true);
    }
    const count = ctx.started.length;
    ctx.currentTime = 1;
    vi.advanceTimersByTime(500);
    expect(ctx.started.length).toBe(count);
  });

  it('pitches oscillators from MIDI', () => {
    expect(midiToHz(69)).toBeCloseTo(440);
    expect(midiToHz(60)).toBeCloseTo(261.63, 1);
    const ctx = new FakeAudioContext();
    const loop = scheduleLoop(asContext(ctx), 'planning', ctx.createGain() as unknown as AudioNode, 0);
    const flute = ctx.started.find((s) => s instanceof FakeOscillator && s.type === 'sine') as FakeOscillator;
    expect(flute.frequency.value).toBeCloseTo(midiToHz(76));
    const freqs = ctx.started.map((s) => Math.round((s as FakeOscillator).frequency.value * 100));
    for (const pitch of [48, 52, 55, 60, 76]) expect(freqs).toContain(Math.round(midiToHz(pitch) * 100));
    loop.stop();
  });

  it('no square or sawtooth: soft sine lead, filtered triangle pluck, detuned triangle pad', () => {
    const ctx = new FakeAudioContext();
    const loop = scheduleLoop(asContext(ctx), 'planning', ctx.createGain() as unknown as AudioNode, 0);
    const oscs = ctx.started.filter((s): s is FakeOscillator => s instanceof FakeOscillator);
    for (const o of oscs) expect(['sine', 'triangle']).toContain(o.type);
    // The pad's two oscillators per note are detuned in opposite directions.
    const detunes = oscs.map((o) => o.detune.value).filter((d) => d !== 0);
    expect(detunes.length).toBe(6);
    expect(new Set(detunes)).toEqual(new Set(TONE.horn.detune));
    // Every tone goes through a low-pass.
    expect(ctx.filters.length).toBe(MUSIC.planning.voices.reduce((n, v) => n + v.notes.filter((x) => x.beat === 0).length, 0));
    for (const f of ctx.filters) expect(f.type).toBe('lowpass');
    // The pluck decays exponentially on its own and its filter closes.
    const pluckFilter = ctx.filters.find((f) => f.frequency.events.some((e) => e.kind === 'target'))!;
    expect(pluckFilter.frequency.events.find((e) => e.kind === 'target')!.value).toBe(TONE.pluck.cutoffEnd);
    loop.stop();
  });

  it('soft attacks and exponential releases, no hard cut', () => {
    const ctx = new FakeAudioContext();
    const out = ctx.createGain();
    const loop = scheduleLoop(asContext(ctx), 'planning', out as unknown as AudioNode, 0);
    const noteGains = ctx.gains.filter((g) => g.connections.includes(out));
    expect(noteGains.length).toBeGreaterThan(0);
    for (const g of noteGains) {
      const [first, rise, release] = g.gain.events;
      expect(first).toMatchObject({ kind: 'set', value: 0 });
      expect(rise!.kind).toBe('ramp');
      expect(rise!.time).toBeGreaterThan(first!.time);
      expect(release).toMatchObject({ kind: 'target', value: 0 });
    }
    // Voices stop only after their release has died away.
    for (const s of ctx.started) expect(s.stoppedAt!).toBeGreaterThan(s.startedAt! + 0.5);
    loop.stop();
  });

  it('battle drums are buffers at a soft level; the shaker sits under the kick', () => {
    const ctx = new FakeAudioContext();
    const out = ctx.createGain();
    const loop = scheduleLoop(asContext(ctx), 'battle', out as unknown as AudioNode, 0);
    ctx.currentTime = 0.5;
    vi.advanceTimersByTime(100);
    const drums = ctx.started.filter((s): s is FakeBufferSource => s instanceof FakeBufferSource);
    expect(drums.length).toBe(2);
    const [kick, shaker] = drums.map((d) => (d.connections[0] as FakeGain).gain.value);
    const drumGain = MUSIC.battle.voices.find((v) => v.instrument === 'drum')!.gain;
    expect(kick).toBeCloseTo(drumGain);
    expect(shaker!).toBeLessThan(kick!);
    loop.stop();
  });
});
