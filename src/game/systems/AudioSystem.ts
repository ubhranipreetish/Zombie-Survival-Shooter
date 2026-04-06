// AudioSystem.ts — Web Audio synthesizer and file playback manager.
// Preloads assets from public/sounds, uses procedural audio as a fallback.

export class AudioSystem {
  private static instance: AudioSystem;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = false;
  private buffers: Map<string, AudioBuffer> = new Map();
  private loaded: boolean = false;
  private bgmSource: AudioBufferSourceNode | null = null;
  private needsBGM: boolean = false;

  private constructor() { }

  static getInstance(): AudioSystem {
    if (!AudioSystem.instance) AudioSystem.instance = new AudioSystem();
    return AudioSystem.instance;
  }

  // Must be called via user interaction (e.g. key press or click)
  init(): void {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.4;
        this.masterGain.connect(this.ctx.destination);
        this.enabled = true;
      } catch (e) {
        console.error("Web Audio API not supported", e);
      }
    }
    // Context starts suspended if no gesture. Call resume on user interaction to unlock audio.
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.preloadSounds();
  }

  startBGM(): void {
    this.init(); // Resumes if currently suspended
    this.needsBGM = true;
    if (this.loaded && !this.bgmSource) {
      this.playBGM();
    }
  }

  private async preloadSounds(): Promise<void> {
    if (this.loaded || !this.ctx) return;
    const files = {
      'pistol': '/sounds/pistol.mp3',
      'shotgun': '/sounds/shotgun.mp3',
      'rifle': '/sounds/riffle.mp3',
      'enemy_dying': '/sounds/enemy_dying.mp3',
      'xp_gain': '/sounds/xp_gain.mp3',
      'flamethrower': '/sounds/flamethrower.mp3',
      'shooting_enemy': '/sounds/shooting_enemy.mp3',
      'bg_music': '/sounds/bg_music.mp3',
      'grenade': '/sounds/grenade.mp3',
      'lazer': '/sounds/lazer.mp3',
      'crossbow': '/sounds/crossbow.mp3'
    };

    for (const [key, url] of Object.entries(files)) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
          this.buffers.set(key, audioBuffer);
        }
      } catch (e) {
        console.warn(`Failed to load audio: ${url}`);
      }
    }
    this.loaded = true;
    if (this.needsBGM) {
      this.playBGM();
    }
  }

  private playBuffer(name: string, volume: number = 1.0): boolean {
    if (!this.enabled || !this.ctx || !this.masterGain) return false;
    const buffer = this.buffers.get(name);
    if (!buffer) return false;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    if (volume !== 1.0) {
      const tempGain = this.ctx.createGain();
      tempGain.gain.value = volume;
      source.connect(tempGain);
      tempGain.connect(this.masterGain);
    } else {
      source.connect(this.masterGain);
    }

    source.start(0);
    return true;
  }

  stopBGM(): void {
    if (this.bgmSource) {
      this.bgmSource.stop();
      this.bgmSource.disconnect();
      this.bgmSource = null;
    }
  }

  private playBGM(): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const buffer = this.buffers.get('bg_music');
    if (!buffer || this.bgmSource) return;

    this.bgmSource = this.ctx.createBufferSource();
    this.bgmSource.buffer = buffer;
    this.bgmSource.loop = true;

    const bgmGain = this.ctx.createGain();
    bgmGain.gain.value = 0.5; // 50% volume

    this.bgmSource.connect(bgmGain);
    bgmGain.connect(this.masterGain);
    this.bgmSource.start(0);
  }

  private playTone(freq: number, type: OscillatorType, length: number, vol = 1): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + length);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + length);
  }

  playShoot(weaponName: string = 'Pistol'): void {
    if (weaponName === 'Shotgun' && this.playBuffer('shotgun')) return;
    if (weaponName === 'Rifle' && this.playBuffer('rifle')) return;
    if (weaponName === 'Crossbow' && this.playBuffer('crossbow')) return;
    if (weaponName === 'LaserRifle' && this.playBuffer('lazer')) return;
    if (weaponName === 'Flamethrower' && this.playBuffer('flamethrower', 2.0)) return;
    if ((weaponName === 'Pistol' || !['LaserRifle', 'Crossbow', 'Flamethrower'].includes(weaponName)) && this.playBuffer('pistol')) return;

    // Fallbacks
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    if (weaponName === 'Shotgun') {
      this.playNoise(0.2, 0.4, 800, 'lowpass');
    } else if (weaponName === 'Rifle') {
      this.playNoise(0.05, 0.2, 1000, 'bandpass');
    } else if (weaponName === 'LaserRifle') {
      this.playTone(1200, 'sawtooth', 0.05, 0.1);
      this.playTone(2800, 'sine', 0.05, 0.1);
    } else if (weaponName === 'Crossbow') {
      this.playNoise(0.05, 0.1, 200, 'lowpass');
      this.playTone(150, 'triangle', 0.1, 0.3);
    } else if (weaponName === 'Flamethrower') {
      this.playNoise(0.06, 0.1, 400, 'lowpass');
    } else {
      this.playTone(300, 'triangle', 0.1, 0.3);
    }
  }

  private playNoise(length: number, vol: number, freq: number, filterType: BiquadFilterType): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * length;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + length);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playEnemyDying(): void {
    if (this.playBuffer('enemy_dying')) return;
    this.playTone(800, 'square', 0.1, 0.2);
  }

  playEnemyHit(): void {
    if (this.playBuffer('enemy_dying')) return;
    this.playTone(150, 'sawtooth', 0.1, 0.4);
  }

  playEnemyShoot(): void {
    if (this.playBuffer('shooting_enemy')) return;
    this.playTone(600, 'sawtooth', 0.1, 0.2);
  }

  playExplosion(): void {
    if (this.playBuffer('grenade')) return;
    this.playNoise(0.5, 0.8, 800, 'lowpass');
    this.playTone(100, 'sawtooth', 0.4, 0.5);
  }

  playPowerup(): void {
    if (this.playBuffer('xp_gain')) return;
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.setValueAtTime(600, t + 0.1);
    osc.frequency.setValueAtTime(800, t + 0.2);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  playLevelUp(): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.setValueAtTime(554, t + 0.15); // C#
    osc.frequency.setValueAtTime(659, t + 0.3);  // E
    osc.frequency.setValueAtTime(880, t + 0.45); // A
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.linearRampToValueAtTime(0, t + 1.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.2);
  }
}
