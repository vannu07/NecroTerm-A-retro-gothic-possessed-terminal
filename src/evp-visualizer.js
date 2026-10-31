/* ==========================================================================
   NECROTERM: EVP Oscilloscope & Spectral Visualizer
   Draws glowing phosphor waveform that reacts to radio freq and spirit activity
   ========================================================================== */

export class EVPVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.time = 0;
    this.activityLevel = 0.3; // 0 (flat) to 1.0 (heavy spike)
    this.freq = 94.7;
    this.animId = null;

    this.start();
  }

  setFrequency(freq) {
    this.freq = freq;
    this.triggerActivity(0.7);
  }

  triggerActivity(amount = 0.8) {
    this.activityLevel = Math.min(1.0, this.activityLevel + amount);
  }

  start() {
    const render = () => {
      this.draw();
      this.animId = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    if (!this.ctx) return;
    const { ctx, width, height } = this;

    // Fade trail for phosphor persistence effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(0, 0, width, height);

    // Get current theme accent color from computed styles
    const accent = getComputedStyle(document.body).getPropertyValue('--accent-color').trim() || '#ff2a4b';
    const spiritColor = getComputedStyle(document.body).getPropertyValue('--spirit-color').trim() || '#00e5ff';

    // Gradually decay activity level
    this.activityLevel = Math.max(0.15, this.activityLevel * 0.96);
    this.time += 0.08 + this.activityLevel * 0.05;

    // Draw baseline grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw primary waveform
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = this.activityLevel > 0.5 ? spiritColor : accent;
    ctx.shadowBlur = 6;
    ctx.shadowColor = ctx.strokeStyle;

    const midY = height / 2;
    const points = 120;
    const step = width / points;

    for (let i = 0; i <= points; i++) {
      const x = i * step;
      const freqFactor = (this.freq % 10) * 0.5 + 1.2;
      
      // Multiple sinusoidal harmonics + paranormal noise jitter
      const wave1 = Math.sin((i * 0.15 * freqFactor) + this.time);
      const wave2 = Math.cos((i * 0.08) - this.time * 1.4) * 0.5;
      const noise = (Math.random() - 0.5) * (this.activityLevel * 14);

      const y = midY + (wave1 + wave2) * (8 * this.activityLevel) + noise;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Random spectral EVP blip when activity is high
    if (this.activityLevel > 0.6 && Math.random() > 0.65) {
      const blipX = Math.random() * width;
      ctx.fillStyle = spiritColor;
      ctx.fillRect(blipX, midY - 10 + Math.random() * 20, 2, 8);
    }
  }
}
