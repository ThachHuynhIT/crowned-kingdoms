/**
 * Fake WebAudio for tests (node has no AudioContext). Records what the audio code creates so tests can
 * assert on voices, gains and schedules without real time.
 */

export class FakeParam {
  value: number;
  readonly events: { kind: string; value: number; time: number }[] = [];
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
}

export class FakeOscillator extends FakeSource {
  type = 'sine';
  readonly frequency = new FakeParam(440);
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
