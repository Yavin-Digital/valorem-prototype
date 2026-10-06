// Synthesized WebAudio sound effects. Off by default; the player's choice is remembered,
// but the AudioContext is only created inside a user gesture (browser autoplay rules).
export class Sfx {
  constructor() { this.enabled = false; this.ctx = null; this.lastShot = 0; this.lastHit = 0; }

  setEnabled(on) {
    this.enabled = !!on;
    if (on) this._ensure();
    else if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.enabled) this._ensure(); }

  _ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.45;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _ok() { return this.enabled && this.ctx && this.ctx.state === 'running'; }

  _tone(type, f0, f1, dur, vol, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  _noise(dur, vol, filterType, freq, q = 1, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  shot() {
    if (!this._ok()) return;
    const now = this.ctx.currentTime;
    if (now - this.lastShot < 0.055) return;
    this.lastShot = now;
    this._noise(0.05, 0.08, 'bandpass', 1800 + Math.random() * 600, 1.4);
  }
  hit() {
    if (!this._ok()) return;
    const now = this.ctx.currentTime;
    if (now - this.lastHit < 0.07) return;
    this.lastHit = now;
    this._tone('triangle', 220, 90, 0.08, 0.08);
  }
  gateGood() { if (!this._ok()) return; [523, 659, 784, 1046].forEach((f, i) => this._tone('sine', f, f, 0.14, 0.16, i * 0.05)); }
  gateBad() { if (!this._ok()) return; this._tone('square', 330, 110, 0.32, 0.09); this._tone('sawtooth', 220, 80, 0.32, 0.05); }
  lose() { if (!this._ok()) return; this._tone('square', 300, 160, 0.09, 0.05); }
  explode() { if (!this._ok()) return; this._noise(0.6, 0.5, 'lowpass', 700, 0.7); this._tone('sine', 120, 40, 0.5, 0.35); }
  launch() { if (!this._ok()) return; this._noise(0.35, 0.12, 'highpass', 1200, 0.6); }
  roar() { if (!this._ok()) return; this._tone('sawtooth', 95, 55, 0.9, 0.18); this._noise(0.8, 0.12, 'lowpass', 400, 2); }
  smash() { if (!this._ok()) return; this._tone('sine', 90, 35, 0.35, 0.4); this._noise(0.3, 0.25, 'lowpass', 500, 1); }
  victory() { if (!this._ok()) return; [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this._tone('triangle', f, f, 0.22, 0.18, i * 0.11)); }
  gameOver() { if (!this._ok()) return; [392, 330, 262, 196].forEach((f, i) => this._tone('triangle', f, f * 0.98, 0.3, 0.16, i * 0.16)); }
  click() { if (!this._ok()) return; this._tone('sine', 880, 660, 0.05, 0.08); }
  buy() { if (!this._ok()) return; this._tone('sine', 660, 990, 0.12, 0.14); this._tone('sine', 990, 1320, 0.12, 0.1, 0.08); }
}
