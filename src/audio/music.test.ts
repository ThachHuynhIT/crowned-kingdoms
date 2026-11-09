import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MUSIC } from '../data/music';
import { midiToHz, scheduleLoop } from './music';
import { asContext, FakeAudioContext, FakeOscillator } from './testing/fakeAudio';

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
    // Beat 0 holds one flute and one pluck note.
    expect(ctx.started.length).toBe(2);
    expect(vi.getTimerCount()).toBe(1);
    ctx.currentTime = 0.6; // beat 1 at 0.667 s enters the horizon
    vi.advanceTimersByTime(100);
    expect(ctx.started.length).toBe(4);
    expect(ctx.started[2]!.startedAt).toBeCloseTo(60 / 90);
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
    ctx.currentTime = 30;
    vi.advanceTimersByTime(100);
    const fresh = ctx.started.slice(before);
    expect(fresh.length).toBeLessThanOrEqual(4);
    for (const s of fresh) expect(s.startedAt!).toBeGreaterThanOrEqual(30);
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
    const flute = ctx.started.find((s) => s instanceof FakeOscillator && s.type === 'triangle') as FakeOscillator;
    expect(flute.frequency.value).toBeCloseTo(midiToHz(72));
    loop.stop();
  });
});
