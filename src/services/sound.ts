// Synthesizes chess sound effects using Web Audio API without external audio files

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private blunderAudio: HTMLAudioElement | null = null;
  private moveAudios: HTMLAudioElement[] = [];
  private captureAudio: HTMLAudioElement | null = null;
  private moveSoundIndex: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.blunderAudio = new Audio('/sounds/blunder.mp3');
        this.blunderAudio.preload = 'auto';

        this.captureAudio = new Audio('/sounds/capture.mp3');
        this.captureAudio.preload = 'auto';

        // Natural move variations from user sound pack
        const movePaths = [
          '/sounds/move_1.mp3',
          '/sounds/move_2.mp3',
          '/sounds/move_3.mp3',
          '/sounds/move_5.mp3',
        ];
        this.moveAudios = movePaths.map((p) => {
          const a = new Audio(p);
          a.preload = 'auto';
          return a;
        });
      } catch {
        // Ignore pre-load error
      }
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Authentic move sound from user pack (with subtle natural variations)
  public playMove() {
    if (!this.enabled) return;
    try {
      if (this.moveAudios.length > 0) {
        const audio = this.moveAudios[this.moveSoundIndex % this.moveAudios.length];
        this.moveSoundIndex = (this.moveSoundIndex + 1) % this.moveAudios.length;
        audio.currentTime = 0;
        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => {
            const fallback = new Audio('/sounds/move.mp3');
            fallback.play().catch(() => {});
          });
        }
        return;
      }
      const audio = new Audio('/sounds/move.mp3');
      audio.play().catch(() => {});
    } catch {
      // Fallback synthesizer
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.07);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
      this.playNoise(t, 0.04, 0.2, 500);
    }
  }

  // Authentic capture knock sound from user pack
  public playCapture() {
    if (!this.enabled) return;
    try {
      if (this.captureAudio) {
        this.captureAudio.currentTime = 0;
        const p = this.captureAudio.play();
        if (p !== undefined) {
          p.catch(() => {
            const fallback = new Audio('/sounds/capture.mp3');
            fallback.play().catch(() => {});
          });
        }
        return;
      }
      const audio = new Audio('/sounds/capture.mp3');
      audio.play().catch(() => {});
    } catch {
      // Fallback synthesizer
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
      this.playNoise(t, 0.07, 0.45, 800);
    }
  }

  // Check alert chime
  public playCheck() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [587.33, 880].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const st = t + idx * 0.09;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.3, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(st);
      osc.stop(st + 0.22);
    });
  }

  // Checkmate fanfare
  public playCheckmate() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const st = t + idx * 0.11;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.4, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(st);
      osc.stop(st + 0.5);
    });
  }

  // Pawn promotion sound
  public playPromote() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const st = t + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.25, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(st);
      osc.stop(st + 0.25);
    });
  }

  // Game start sound
  public playGameStart() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [440, 659.25].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const st = t + idx * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.25, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(st);
      osc.stop(st + 0.3);
    });
  }

  // Blunder / Error warning sound (Custom audio effect)
  public playBlunder() {
    if (!this.enabled) return;
    try {
      if (this.blunderAudio) {
        this.blunderAudio.currentTime = 0;
        const playPromise = this.blunderAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            const fallback = new Audio('/sounds/blunder.mp3');
            fallback.play().catch(() => {});
          });
        }
        return;
      }
      const audio = new Audio('/sounds/blunder.mp3');
      audio.play().catch(() => {});
    } catch {
      // Fallback synthesizer
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.linearRampToValueAtTime(110, t + 0.25);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  }

  // Noise generator for physical wood texture
  private playNoise(time: number, duration: number, volume: number, filterFreq: number) {
    if (!this.ctx) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(time);
      noise.stop(time + duration);
    } catch {
      // Ignore audio buffer error on older systems
    }
  }
}

export const sounds = new SoundManager();
