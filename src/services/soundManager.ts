class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopMusic();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.08,
    delay: number = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playCorrect() {
    this.playTone(523.25, 0.12, 'triangle', 0.08, 0); // C5
    this.playTone(659.25, 0.14, 'triangle', 0.08, 0.07); // E5
    this.playTone(783.99, 0.2, 'sine', 0.09, 0.14); // G5
  }

  public playWrong() {
    this.playTone(210, 0.14, 'sawtooth', 0.045, 0);
    this.playTone(175, 0.18, 'sawtooth', 0.04, 0.09);
  }

  public playMissed() {
    this.playTone(280, 0.16, 'triangle', 0.07, 0);
    this.playTone(185, 0.26, 'triangle', 0.07, 0.12);
  }

  public playLevelUp() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, 'triangle', 0.09, idx * 0.085);
    });
  }

  public playCountdown(isGo: boolean = false) {
    if (isGo) {
      this.playTone(880, 0.3, 'triangle', 0.1, 0);
      this.playTone(1174.66, 0.35, 'sine', 0.09, 0.08);
    } else {
      this.playTone(440, 0.14, 'sine', 0.075, 0);
    }
  }

  public playGameStart() {
    this.playTone(440, 0.12, 'triangle', 0.08, 0);
    this.playTone(554.37, 0.12, 'triangle', 0.08, 0.09);
    this.playTone(659.25, 0.16, 'triangle', 0.09, 0.18);
    this.playTone(880, 0.3, 'sine', 0.1, 0.27);
  }

  public playWinner() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 0.11, 0.22, 0.34, 0.52, 0.66];
    melody.forEach((freq, i) => {
      this.playTone(freq, i === melody.length - 1 ? 0.5 : 0.18, 'triangle', 0.09, times[i]);
    });
  }

  public startMusic() {
    if (this.muted || this.musicInterval !== null || typeof window === 'undefined') {
      return;
    }
    // Gentle low-volume classroom ambient arpeggio (pentatonic C major)
    const scale = [261.63, 329.63, 392.0, 440.0, 523.25, 392.0, 329.63, 293.66];
    this.musicInterval = window.setInterval(() => {
      if (this.muted) return;
      const freq = scale[this.musicStep % scale.length];
      this.playTone(freq, 0.35, 'sine', 0.022, 0);
      this.musicStep += 1;
    }, 520);
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundManager = new SoundManager();
