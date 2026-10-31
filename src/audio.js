/* ==========================================================================
   NECROTERM: Paranormal Audio Synthesizer & EVP Sound Engine
   Built with 100% Native Web Audio API & Speech Synthesis
   ========================================================================== */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.droneGain = null;
    this.noiseGain = null;
    this.isMuted = false;
    this.ambientRunning = false;
    this.currentFreq = 94.7;

    // Load saved sound preference
    const saved = localStorage.getItem('necroterm_sound');
    if (saved !== null) {
      this.isMuted = saved === 'muted';
    }
  }

  // Initialize AudioContext upon first user interaction
  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.45;
      this.masterGain.connect(this.ctx.destination);

      // Start ambient background drone
      this.startAmbientDrone();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  toggleSound() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = !this.isMuted;
    localStorage.setItem('necroterm_sound', this.isMuted ? 'muted' : 'active');

    if (this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.45, now, 0.05);
    }
    return !this.isMuted;
  }

  // Vintage mechanical switch sound on keystroke
  playKeyClick() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Click transient
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Randomized frequency for organic mechanical keyboard feel
      const baseFreq = 700 + Math.random() * 500;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.025);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(2.5, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (_) {}
  }

  // Low occult humming drone
  startAmbientDrone() {
    if (this.ambientRunning || !this.ctx) return;
    this.ambientRunning = true;

    try {
      const now = this.ctx.currentTime;

      // Dual detuned sub-oscillators
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      this.droneGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, now); // A1 note

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(56.2, now); // slight beat frequency

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);

      // LFO modulation for breathing paranormal effect
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.15, now);
      lfoGain.gain.setValueAtTime(60, now);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      this.droneGain.gain.setValueAtTime(0.06, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      lfo.start(now);
    } catch (_) {}
  }

  // EVP radio static sweep
  playEVPBurst(duration = 0.25) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink/Brownian noise with crackle
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.04 * white) / 1.04;
        data[i] = lastOut * 3.5 + (Math.random() > 0.985 ? (Math.random() - 0.5) * 1.5 : 0);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 1200, now);
      filter.Q.setValueAtTime(3.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
    } catch (_) {}
  }

  // Ominous bell chime for rituals
  playChime(isHoly = false) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isHoly ? 880 : 330, now);
      osc.frequency.exponentialRampToValueAtTime(isHoly ? 1174 : 220, now + 1.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.5);
    } catch (_) {}
  }

  // Spirit voice whisper using Web Speech API with pitch-down and static
  speakWhisper(text) {
    if (this.isMuted) return;
    this.playEVPBurst(0.4);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.82; // slightly slowed down
      utter.pitch = 0.45; // deep eerie pitch
      utter.volume = 0.65;

      // Prefer eerie English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('UK') || v.name.includes('Male') || v.name.includes('Natural')));
      if (preferred) utter.voice = preferred;

      window.speechSynthesis.speak(utter);
    }
  }
}

export const soundEngine = new SoundEngine();
