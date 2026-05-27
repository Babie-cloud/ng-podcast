import {
  Injectable,
  inject,
  signal,
  computed,
  effect,
  OnDestroy,
  PLATFORM_ID,
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

/**
 * Lecture via Web Audio (analyseur + volume sur GainNode).
 * Réglé pour éviter le silence fréquent avec médias cross-origin sans CORS (`crossOrigin`).
 * Volume : soit via `gainNode` (graphe actif), soit via `audio.volume` avant création du graphe.
 */
@Injectable({ providedIn: 'root' })
export class AudioService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly store = inject(PodcastStore);

  private audio!: HTMLAudioElement;
  private context!: AudioContext;
  private gainNode!: GainNode;
  private analyserNode!: AnalyserNode;
  private sourceCreated = false;

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
  readonly timeLabel = computed(
    () => `${this.fmt(this._state().currentTime)} / ${this.fmt(this._state().duration)}`
  );

  private _analyserData = new Uint8Array(128);
  get analyserData(): Uint8Array {
    return this._analyserData;
  }

  private intervalId?: ReturnType<typeof setInterval>;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.initElement();

    effect(() => {
      const episode = this.store.currentEpisode();
      const playing = this.store.isPlaying();

      if (!episode?.audioUrl) return;

      if (this.audio.src !== episode.audioUrl) {
        this.loadTrack(episode.audioUrl);
      }

      if (playing) {
        this.ensureAudioContext();
        this.resumeContext();
        this.audio.play().catch((e: Error) => {
          this._error.set(`Lecture impossible : ${e.message}`);
          this.store.pause();
        });
      } else {
        this.audio.pause();
      }
    });

    /** Reprend la session volume persistée depuis le store. */
    effect(() => {
      const v = this.store.volume();
      this.setVolume(v, { silent: true });
    });
  }

  private initElement(): void {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.crossOrigin = 'anonymous';
    this.bindEvents();
    this.startPolling();
  }

  private ensureAudioContext(): void {
    if (this.context) {
      this.applyOutputGain();
      return;
    }

    this.context = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.gainNode = this.context.createGain();
    this.analyserNode = this.context.createAnalyser();
    this.analyserNode.fftSize = 256;
    this._analyserData = new Uint8Array(this.analyserNode.frequencyBinCount);

    if (!this.sourceCreated) {
      const source = this.context.createMediaElementSource(this.audio);
      source.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.context.destination);
      this.sourceCreated = true;
    }
    /** Pas de double atténuation : le gain Web Audio fait foi. */
    this.audio.volume = 1;
    this.audio.muted = false;
    this.applyOutputGain();
  }

  /** Applique volume / muet sur le GainNode (ou fallback sur HTMLMediaElement avant graphe). */
  private applyOutputGain(): void {
    const v = this._state().volume;
    const muted = this._state().muted;
    const effective = muted ? 0 : v;

    if (this.gainNode && this.context && this.sourceCreated) {
      this.audio.volume = 1;
      this.audio.muted = false;
      this.gainNode.gain.setTargetAtTime(
        effective,
        this.context.currentTime,
        0.02,
      );
    } else {
      this.audio.muted = muted;
      this.audio.volume = muted ? 0 : v;
    }
  }

  private bindEvents(): void {
    this.audio.addEventListener('loadstart', () => {
      this._loading.set(true);
      this._error.set(null);
    });

    this.audio.addEventListener('canplay', () => {
      this._loading.set(false);
      this._state.update((s) => ({ ...s, duration: this.audio.duration || 0 }));
    });

    this.audio.addEventListener('ended', () => {
      this.store.stopPlayback();
      this._state.update((s) => ({ ...s, currentTime: 0 }));
    });

    this.audio.addEventListener('error', () => {
      this._loading.set(false);
      this._error.set('Impossible de charger le fichier audio.');
      this.store.pause();
    });

    this.audio.addEventListener('progress', () => this.updateBuffered());

    this.audio.addEventListener('timeupdate', () => {
      this._state.update((s) => ({
        ...s,
        currentTime: this.audio.currentTime,
        duration: isFinite(this.audio.duration) ? this.audio.duration : s.duration,
      }));
    });
  }

  private startPolling(): void {
    this.intervalId = setInterval(() => {
      if (this.analyserNode && !this.audio.paused) {
        this.analyserNode.getByteFrequencyData(this._analyserData);
      }
    }, 50);
  }

  private loadTrack(url: string): void {
    this.audio.src = url;
    this.audio.load();
    this._state.update((s) => ({ ...s, currentTime: 0, duration: 0, buffered: 0 }));
  }

  seek(seconds: number): void {
    if (!this.audio?.duration) return;
    this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration));
    this._state.update((s) => ({ ...s, currentTime: this.audio.currentTime }));
  }

  seekToPercent(percent: number): void {
    if (!this.audio?.duration) return;
    this.seek((percent / 100) * this.audio.duration);
  }

  skipForward(seconds = 15): void {
    this.seek(this.audio.currentTime + seconds);
  }
  skipBackward(seconds = 15): void {
    this.seek(this.audio.currentTime - seconds);
  }

  toggleMute(): void {
    this._state.update((s) => ({ ...s, muted: !s.muted }));
    this.applyOutputGain();
  }

  setVolume(
    value: number,
    opts: { silent?: boolean } = {},
  ): void {
    const v = Math.max(0, Math.min(1, value));
    this._state.update((s) => {
      let muted = s.muted;
      if (!opts.silent) {
        muted = v === 0 ? true : false;
      }
      return { ...s, volume: v, muted };
    });
    this.applyOutputGain();

    if (!opts.silent) {
      this.store.setVolume(v);
    }
  }

  setPlaybackRate(rate: number): void {
    const allowed = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    if (!allowed.includes(rate)) return;
    this.audio.playbackRate = rate;
    this._state.update((s) => ({ ...s, playbackRate: rate }));
  }

  private resumeContext(): void {
    if (this.context?.state === 'suspended') void this.context.resume();
  }

  private fmt(s: number): string {
    if (!s || isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`
      : `${m}:${String(sc).padStart(2, '0')}`;
  }

  private updateBuffered(): void {
    if (!this.audio?.duration) return;
    const buf = this.audio.buffered;
    if (!buf.length) return;
    const pct = Math.round((buf.end(buf.length - 1) / this.audio.duration) * 100);
    this._state.update((s) => ({ ...s, buffered: pct }));
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.audio?.pause();
    void this.context?.close();
  }
}
