/**
 * Fake WebAudio for tests (node has no AudioContext). Records what the audio code creates so tests can
 * assert on voices, gains and schedules without real time.
 */

export class FakeParam {
  value: number;
  readonly events: { kind: string; value: number; time: number; timeConstant?: number }[] = [];
  constructor(value = 1) {
    this.value = value;
  }
  setValueAtTime(value: number, time: number): this {
    this.events.push({ kind: 'set', value, time });
    this.value = value;
    return this;
  }
  linearRampToValueAtTime(value: number, time: number): this {
    this.events.push({ kind: 'ramp', value, time });
    this.value = value;
    return this;
  }
  setTargetAtTime(value: number, time: number, timeConstant: number): this {
    this.events.push({ kind: 'target', value, time, timeConstant });
    return this;
  }
  cancelScheduledValues(time: number): this {
    this.events.push({ kind: 'cancel', value: this.value, time });
    return this;
  }
}

export class FakeNode {
  readonly connections: unknown[] = [];
  disconnected = false;
  constructor(readonly ctx: FakeAudioContext) {}
  connect(target: unknown): unknown {
    this.connections.push(target);
    return target;
  }
  disconnect(): void {
    this.disconnected = true;
  }
}

export class FakeGain extends FakeNode {
  readonly gain = new FakeParam(1);
}

export class FakeSource extends FakeNode {
  onended: (() => void) | null = null;
  startedAt: number | null = null;
  stoppedAt: number | null = null;
  ended = false;
  start(when = 0): void {
    this.startedAt = when;
    this.ctx.started.push(this);
  }
  stop(when = 0): void {
    this.stoppedAt = when;
  }
  /** Simulates playback finishing. */
  finish(): void {
    if (this.ended) return;
    this.ended = true;
    this.onended?.();
  }
}

export class FakeBufferSource extends FakeSource {
  buffer: FakeBuffer | null = null;
  readonly playbackRate = new FakeParam(1);
}

export class FakeOscillator extends FakeSource {
  type = 'sine';
  readonly frequency = new FakeParam(440);
  readonly detune = new FakeParam(0);
}

export class FakeBiquad extends FakeNode {
  type = 'lowpass';
  readonly frequency = new FakeParam(350);
  readonly Q = new FakeParam(1);
}

export class FakeCompressor extends FakeNode {
  readonly threshold = new FakeParam(-24);
  readonly knee = new FakeParam(30);
  readonly ratio = new FakeParam(12);
  readonly attack = new FakeParam(0.003);
  readonly release = new FakeParam(0.25);
}

export class FakeConvolver extends FakeNode {
  buffer: FakeBuffer | null = null;
  normalize = true;
}

export class FakeBuffer {
  private readonly data: Float32Array[];
  constructor(
    readonly numberOfChannels: number,
    readonly length: number,
    readonly sampleRate: number,
  ) {
    this.data = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }
  get duration(): number {
    return this.length / this.sampleRate;
  }
  getChannelData(channel: number): Float32Array {
    return this.data[channel]!;
  }
  copyToChannel(source: Float32Array, channel: number): void {
    this.data[channel]!.set(source);
  }
}

export class FakeAudioContext {
  currentTime = 0;
  sampleRate = 8000;
  state: 'suspended' | 'running' | 'closed' = 'running';
  readonly destination = new FakeNode(this);
  readonly gains: FakeGain[] = [];
  readonly buffers: FakeBuffer[] = [];
  readonly started: FakeSource[] = [];
  readonly filters: FakeBiquad[] = [];
  readonly compressors: FakeCompressor[] = [];
  readonly convolvers: FakeConvolver[] = [];
  resumeCalls = 0;
  suspendCalls = 0;
  closeCalls = 0;
  /** When set, the next resume() rejects with this error once. */
  failNextResume: Error | null = null;

  createGain(): FakeGain {
    const g = new FakeGain(this);
    this.gains.push(g);
    return g;
  }
  createBuffer(channels: number, length: number, sampleRate: number): FakeBuffer {
    const b = new FakeBuffer(channels, length, sampleRate);
    this.buffers.push(b);
    return b;
  }
  createBufferSource(): FakeBufferSource {
    return new FakeBufferSource(this);
  }
  createOscillator(): FakeOscillator {
    return new FakeOscillator(this);
  }
  createBiquadFilter(): FakeBiquad {
    const f = new FakeBiquad(this);
    this.filters.push(f);
    return f;
  }
  createDynamicsCompressor(): FakeCompressor {
    const c = new FakeCompressor(this);
    this.compressors.push(c);
    return c;
  }
  createConvolver(): FakeConvolver {
    const c = new FakeConvolver(this);
    this.convolvers.push(c);
    return c;
  }
  resume(): Promise<void> {
    this.resumeCalls += 1;
    if (this.failNextResume) {
      const err = this.failNextResume;
      this.failNextResume = null;
      return Promise.reject(err);
    }
    this.state = 'running';
    return Promise.resolve();
  }
  suspend(): Promise<void> {
    this.suspendCalls += 1;
    this.state = 'suspended';
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.closeCalls += 1;
    this.state = 'closed';
    return Promise.resolve();
  }
}

export const asContext = (ctx: FakeAudioContext): AudioContext => ctx as unknown as AudioContext;
