class SoundManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
    }
    return this.context;
  }

  // Play a procedural sound effect
  play(name: string): void {
    const ctx = this.getContext();
    if (!this.masterGain) return;

    switch (name) {
      case "fizz_gentle":
        this.playNoise(ctx, 0.05, 2.0);
        break;
      case "fizz_vigorous":
        this.playNoise(ctx, 0.15, 1.5);
        break;
      case "sizzle":
        this.playNoise(ctx, 0.1, 1.0);
        break;
      case "pop":
        this.playTone(ctx, 800, 0.1, 0.05);
        break;
      case "bang":
        this.playTone(ctx, 200, 0.3, 0.1);
        break;
      case "hiss":
        this.playNoise(ctx, 0.08, 3.0);
        break;
      case "pour":
        this.playNoise(ctx, 0.06, 1.5);
        break;
      case "clink":
        this.playTone(ctx, 2000, 0.05, 0.02);
        break;
      default:
        // Unknown sound — play a short beep
        this.playTone(ctx, 440, 0.05, 0.1);
    }
  }

  private playTone(ctx: AudioContext, freq: number, volume: number, duration: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  private playNoise(ctx: AudioContext, volume: number, duration: number): void {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this.masterGain!);
    source.start();
  }

  setVolume(value: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  getVolume(): number {
    return this.masterGain?.gain.value ?? 0.5;
  }
}

export const soundManager = new SoundManager();
