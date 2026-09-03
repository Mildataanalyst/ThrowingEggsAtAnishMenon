export class SoundFX {
  constructor() {
    this.ctx = null;
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
  }

  setMuted(value) {
    this.muted = Boolean(value);
  }

  tone(freq, duration = 0.08, type = 'sine', gain = 0.045, slide = 0) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  tick() {
    this.tone(900, 0.045, 'square', 0.018, -120);
  }

  stretch(strength = 0.5) {
    const now = performance.now();
    if (now - this.lastStretch < 90) return;
    this.lastStretch = now;
    this.tone(110 + strength * 80, 0.045, 'triangle', 0.018, 25);
  }

  launch() {
    this.tone(230, 0.12, 'sawtooth', 0.035, 420);
  }

  splat() {
    this.tone(82, 0.12, 'square', 0.055, -28);
    setTimeout(() => this.tone(48, 0.10, 'sine', 0.045, -10), 28);
  }

  dodge() {
    this.tone(420, 0.09, 'triangle', 0.035, 260);
  }

  success() {
    this.tone(440, 0.12, 'triangle', 0.035, 220);
    setTimeout(() => this.tone(660, 0.16, 'triangle', 0.04, 220), 105);
  }

  fail() {
    this.tone(180, 0.18, 'sawtooth', 0.035, -70);
    setTimeout(() => this.tone(115, 0.25, 'sawtooth', 0.03, -45), 130);
  }
}
