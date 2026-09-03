export class SoundFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.lastStretch = 0;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.62;
    this.master.connect(this.ctx.destination);
  }

  setMuted(value) {
    this.muted = Boolean(value);
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.62;
  }

  tone(freq, duration = 0.08, type = 'sine', gain = 0.045, slide = 0, delay = 0) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.master) return;
    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), start);
    if (slide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), start + duration);
    }
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.012, duration / 3));
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp).connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  noise({ duration = 0.16, gain = 0.08, delay = 0, highpass = 250 } = {}) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.master) return;
    const start = this.ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const envelope = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const amp = this.ctx.createGain();
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.buffer = buffer;
    source.connect(filter).connect(amp).connect(this.master);
    source.start(start);
  }

  tick() {
    this.tone(520, 0.055, 'square', 0.028);
    this.tone(650, 0.065, 'square', 0.022, 0, 0.07);
  }

  stretch(strength = 0.5) {
    const now = performance.now();
    if (now - this.lastStretch < 90) return;
    this.lastStretch = now;
    this.tone(130 + strength * 45, 0.07, 'sawtooth', 0.022, -44);
  }

  launch() {
    this.noise({ duration: 0.14, gain: 0.065, highpass: 900 });
    this.tone(280, 0.18, 'triangle', 0.055, -190);
  }

  splat() {
    // Ported from the older build: low impact thump + wet broadband burst.
    this.tone(108, 0.2, 'sine', 0.17, -62);
    this.noise({ duration: 0.19, gain: 0.12, highpass: 120 });
  }

  dodge() {
    this.noise({ duration: 0.10, gain: 0.045, highpass: 1200 });
    this.tone(460, 0.11, 'sine', 0.04, -250);
  }

  success() {
    this.tone(440, 0.12, 'triangle', 0.035, 220);
    this.tone(660, 0.16, 'triangle', 0.04, 220, 0.105);
  }

  fail() {
    this.tone(180, 0.18, 'sawtooth', 0.035, -70);
    this.tone(115, 0.25, 'sawtooth', 0.03, -45, 0.13);
  }
}
