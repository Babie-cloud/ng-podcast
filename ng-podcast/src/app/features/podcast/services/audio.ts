// features/podcast/services/audio.service.ts
import {
  Injectable,
  inject,
  signal,
  computed,
  effect,
  OnDestroy,
  PLATFORM_ID,
  afterNextRender
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PodcastStore } from '../store/podcast.store';


export interface AudioState {
  duration: number;
  currentTime: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  buffered: number;
}

@Injectable({ providedIn: 'root' })
export class AudioService implements OnDestroy {

  private readonly platformId = inject(PLATFORM_ID);
  private readonly store = inject(PodcastStore);

  // ─── Web Audio API (uniquement côté browser) ─────────────────────
  private context!: AudioContext;
  private sourceNode!: MediaElementAudioSourceNode;
  private gainNode!: GainNode;
  private analyserNode!: AnalyserNode;
  private audio!: HTMLAudioElement;

  // ─── State ───────────────────────────────────────────────────────
  private readonly _state = signal<AudioState>({
    duration: 0,
    currentTime: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    buffered: 0,
  });

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly state = this._state.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentTime = computed(() => this._state().currentTime);
  readonly duration = computed(() => this._state().duration);
  readonly volume = computed(() => this._state().volume);
  readonly buffered = computed(() => this._state().buffered);
  readonly playbackRate = computed(() => this._state().playbackRate);
  readonly progress = computed(() => {
    const d = this._state().duration;
    return d > 0 ? (this._state().currentTime / d) * 100 : 0;
  });

  readonly timeLabel = computed(() => 
    `${this.formatTime(this._state().currentTime)} / ${this.formatTime(this._state().duration)}`
  );

  private _analyserData = new Uint8Array(128);
  get analyserData(): Uint8Array { return this._analyserData; }

  private intervalId?: ReturnType<typeof setInterval>;

  constructor() {
    // Initialisation uniquement côté navigateur
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.initAudio();
      });
    }

    // Effect qui réagit aux changements d'épisode
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      const episode = this.store.currentEpisode();
      const playing = this.store.isPlaying();

      if (!episode?.audioUrl) return;

      if (this.audio?.src !== episode.audioUrl) {
        this.loadTrack(episode.audioUrl);
      }

      if (playing) {
        this.resumeContext();
        this.audio?.play().catch(e => this._error.set(e.message));
      } else if (this.audio) {
        this.audio.pause();
      }
    });
  }

  // ─── Initialisation (Browser only) ───────────────────────────────
  private initAudio() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.crossOrigin = 'anonymous';

    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.context.createGain();
    this.analyserNode = this.context.createAnalyser();
    this.analyserNode.fftSize = 256;
    this._analyserData = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.sourceNode = this.context.createMediaElementSource(this.audio);

    this.sourceNode
      .connect(this.analyserNode)
      .connect(this.gainNode)
      .connect(this.context.destination);

    this.bindEvents();
    this.startPolling();
  }

  // ─── Le reste du code reste presque identique ───────────────────
  private bindEvents() {
    if (!this.audio) return;

    this.audio.addEventListener('loadstart', () => {
      this._loading.set(true);
      this._error.set(null);
    });

    this.audio.addEventListener('canplay', () => {
      this._loading.set(false);
      this._state.update(s => ({ ...s, duration: this.audio.duration || 0 }));
    });

    this.audio.addEventListener('ended', () => {
      this.store.pause();
      this._state.update(s => ({ ...s, currentTime: 0 }));
    });

    this.audio.addEventListener('error', () => {
      this._loading.set(false);
      this._error.set('Impossible de charger le fichier audio.');
      this.store.pause();
    });

    this.audio.addEventListener('progress', () => this.updateBuffered());
  }

  private startPolling() {
    this.intervalId = setInterval(() => {
      if (!this.audio || this.audio.paused) return;

      this._state.update(s => ({
        ...s,
        currentTime: this.audio.currentTime,
        duration: this.audio.duration || s.duration,
      }));

      this.analyserNode?.getByteFrequencyData(this._analyserData);
    }, 250);
  }

  private loadTrack(url: string) {
    if (!this.audio) return;
    this.audio.src = url;
    this.audio.load();
    this._state.update(s => ({ ...s, currentTime: 0, duration: 0, buffered: 0 }));
  }

  // ─── Méthodes publiques (avec garde browser) ─────────────────────
 

  setVolume(value: number) {
    if (!this.audio || !this.gainNode) return;
    const v = Math.max(0, Math.min(1, value));
    this.gainNode.gain.setValueAtTime(v, this.context.currentTime);
    this.audio.volume = v;
    this._state.update(s => ({ ...s, volume: v, muted: v === 0 }));
    this.store.setVolume(v);
  }


  // ─── Actions publiques (avec protection browser) ─────────────────────

seek(seconds: number) {
  if (!isPlatformBrowser(this.platformId) || !this.audio) return;
  this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || 0));
  this._state.update(s => ({ ...s, currentTime: this.audio.currentTime }));
}

seekToPercent(percent: number) {
  if (!isPlatformBrowser(this.platformId) || !this.audio || !this.audio.duration) return;
  const seconds = (percent / 100) * this.audio.duration;
  this.seek(seconds);
}

skipForward(seconds: number = 15) {
  if (!isPlatformBrowser(this.platformId) || !this.audio) return;
  this.seek(this.audio.currentTime + seconds);
}

skipBackward(seconds: number = 15) {
  if (!isPlatformBrowser(this.platformId) || !this.audio) return;
  this.seek(this.audio.currentTime - seconds);
}

toggleMute() {
  if (!isPlatformBrowser(this.platformId) || !this.audio) return;
  const muted = !this._state().muted;
  this.audio.muted = muted;
  this._state.update(s => ({ ...s, muted }));
}

setPlaybackRate(rate: number) {
  if (!isPlatformBrowser(this.platformId) || !this.audio) return;
  const allowed = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  if (!allowed.includes(rate)) return;

  this.audio.playbackRate = rate;
  this._state.update(s => ({ ...s, playbackRate: rate }));
}
  // ... (les autres méthodes : skipForward, skipBackward, toggleMute, etc. doivent aussi avoir une garde isPlatformBrowser)

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
    if (this.context) {
      this.context.close();
    }
  }

  private resumeContext() {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  }

  private formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  }

  private updateBuffered() {
    if (!this.audio || !this.audio.duration) return;
    const buf = this.audio.buffered;
    if (buf.length === 0) return;
    const end = buf.end(buf.length - 1);
    this._state.update(s => ({
      ...s,
      buffered: Math.round((end / this.audio.duration) * 100)
    }));
  }
}