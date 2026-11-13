/**
 * Web Audio API synthesizer for alert sounds.
 * Synthesizes acoustic dual-tone and bell chimes via browser Web Audio API.
 * Handles browser autoplay policies and async AudioContext resumption.
 */

class SoundService {
  private ctx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.ensureContext();
      };
      window.addEventListener('click', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
      window.addEventListener('touchstart', unlock, { once: true, passive: true });
    }
  }

  private async ensureContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return this.ctx;
    } catch (e) {
      console.warn('[SoundService] AudioContext initialization failed:', e);
      return null;
    }
  }

  private async _playBreakoutChimeOnce(): Promise<void> {
    try {
      const ctx = await this.ensureContext();
      if (!ctx) return;

      const now = Math.max(ctx.currentTime, 0.02);
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Upward melodic chime: D5 (587Hz) -> D6 (1175Hz), with A5 (880Hz) -> A6 (1760Hz) harmony
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.linearRampToValueAtTime(1174.66, now + 0.15);

      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.linearRampToValueAtTime(1760, now + 0.15);

      // Smooth attack and decay to prevent speaker clicks
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.03);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
    } catch (e) {
      console.warn('[SoundService] Breakout chime error:', e);
    }
  }

  private async _playEodChimeOnce(): Promise<void> {
    try {
      const ctx = await this.ensureContext();
      if (!ctx) return;

      const now = Math.max(ctx.currentTime, 0.02);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.linearRampToValueAtTime(659.25, now + 0.2); // E5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch (e) {
      console.warn('[SoundService] EOD chime error:', e);
    }
  }

  /**
   * Play the breakout chime `count` times.
   * count=1  → app was in focus
   * count=3  → app/tab was hidden (backgrounded)
   */
  playBreakoutChimes(count: 1 | 3 = 1): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this._playBreakoutChimeOnce();
      }, i * 850);
    }
  }

  /**
   * Play the EOD chime `count` times.
   */
  playEodChimes(count: 1 | 3 = 1): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this._playEodChimeOnce();
      }, i * 850);
    }
  }
}

export const soundService = new SoundService();
