import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type {
  AudioStudioTrack,
  AudioStudioTrackType,
  PlaybackState,
  TrimRegion,
} from '../models/audio-studio.types';
import {
  audioBufferToWav,
  decodeAudioSource,
  formatTime,
  sourceToBlob,
  trimAudioBuffer,
} from '../utils/audio-buffer.util';
import { FfmpegExportService } from './ffmpeg-export.service';

interface ActiveSource {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

@Injectable()
export class AudioStudioService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ffmpegExport = inject(FfmpegExportService);

  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly objectUrls = new Map<string, string>();
  private activeSources: ActiveSource[] = [];
  private playbackStartContextTime = 0;
  private playbackOffset = 0;
  private tickId: ReturnType<typeof setInterval> | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private recordChunks: BlobPart[] = [];
  private recordStream: MediaStream | null = null;

  private readonly _tracks = signal<AudioStudioTrack[]>([]);
  private readonly _activeTrackId = signal<string | null>(null);
  private readonly _trimRegion = signal<TrimRegion | null>(null);
  private readonly _playback = signal<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });
  private readonly _recording = signal(false);
  private readonly _exporting = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly tracks = this._tracks.asReadonly();
  readonly activeTrackId = this._activeTrackId.asReadonly();
  readonly trimRegion = this._trimRegion.asReadonly();
  readonly playback = this._playback.asReadonly();
  readonly recording = this._recording.asReadonly();
  readonly exporting = this._exporting.asReadonly();
  readonly error = this._error.asReadonly();

  readonly activeTrack = computed(() => {
    const id = this._activeTrackId();
    return this._tracks().find((t) => t.id === id) ?? null;
  });

  readonly timeLabel = computed(() => {
    const p = this._playback();
    return `${formatTime(p.currentTime)} / ${formatTime(p.duration)}`;
  });

  readonly hasTracks = computed(() => this._tracks().length > 0);

  ngOnDestroy(): void {
    this.stopPlaybackInternal();
    this.stopRecordingInternal(false);
    this.revokeAllUrls();
    void this.audioContext?.close();
    if (this.tickId) clearInterval(this.tickId);
  }

  private ensureBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private ensureContext(): AudioContext {
    if (!this.ensureBrowser()) {
      throw new Error('Audio studio requires a browser environment.');
    }
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.startTick();
    }
    return this.audioContext;
  }

  private startTick(): void {
    if (this.tickId) return;
    this.tickId = setInterval(() => {
      if (!this._playback().isPlaying || !this.audioContext) return;
      const elapsed =
        this.playbackOffset +
        (this.audioContext.currentTime - this.playbackStartContextTime);
      const duration = this._playback().duration;
      const currentTime = Math.min(elapsed, duration);
      this._playback.update((p) => ({ ...p, currentTime }));
      if (currentTime >= duration && duration > 0) {
        this.pause();
        this._playback.update((p) => ({ ...p, currentTime: 0 }));
        this.playbackOffset = 0;
      }
    }, 50);
  }

  private updateDuration(): void {
    const maxDuration = this._tracks().reduce(
      (max, t) => Math.max(max, t.duration),
      0,
    );
    this._playback.update((p) => ({ ...p, duration: maxDuration }));
  }

  private revokeUrl(trackId: string): void {
    const url = this.objectUrls.get(trackId);
    if (url) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(trackId);
    }
  }

  private revokeAllUrls(): void {
    for (const id of this.objectUrls.keys()) {
      this.revokeUrl(id);
    }
  }

  private trackObjectUrl(track: AudioStudioTrack): string {
    if (typeof track.source === 'string') return track.source;
    let url = this.objectUrls.get(track.id);
    if (!url) {
      url = URL.createObjectURL(track.source);
      this.objectUrls.set(track.id, url);
    }
    return url;
  }

  getTrackUrl(trackId: string): string | null {
    const track = this._tracks().find((t) => t.id === trackId);
    if (!track) return null;
    return this.trackObjectUrl(track);
  }

  /** Resolve a playable URL for WaveSurfer. */
  resolveTrackUrl(track: AudioStudioTrack): string {
    return this.trackObjectUrl(track);
  }

  async addTrack(
    source: Blob | string,
    name: string,
    type: AudioStudioTrackType,
  ): Promise<string> {
    this._error.set(null);
    const context = this.ensureContext();
    const id = crypto.randomUUID();

    const blob = await sourceToBlob(source);
    const buffer = await decodeAudioSource(blob, context);
    this.buffers.set(id, buffer);

    const track: AudioStudioTrack = {
      id,
      name,
      type,
      source: blob,
      volume: type === 'music' ? 0.4 : 1,
      muted: false,
      duration: buffer.duration,
    };

    this._tracks.update((list) => [...list, track]);
    if (!this._activeTrackId()) {
      this._activeTrackId.set(id);
    }
    this.updateDuration();
    return id;
  }

  async loadFile(file: File): Promise<string> {
    const type: AudioStudioTrackType =
      file.type.startsWith('audio/') ? 'imported' : 'imported';
    return this.addTrack(file, file.name, type);
  }

  removeTrack(id: string): void {
    this.stopPlaybackInternal();
    this.revokeUrl(id);
    this.buffers.delete(id);
    this._tracks.update((list) => list.filter((t) => t.id !== id));
    if (this._activeTrackId() === id) {
      const remaining = this._tracks();
      this._activeTrackId.set(remaining[0]?.id ?? null);
    }
    this.updateDuration();
  }

  setActiveTrack(id: string): void {
    if (this._tracks().some((t) => t.id === id)) {
      this._activeTrackId.set(id);
    }
  }

  setVolume(id: string, volume: number): void {
    const v = Math.max(0, Math.min(1, volume));
    this._tracks.update((list) =>
      list.map((t) => (t.id === id ? { ...t, volume: v, muted: v === 0 } : t)),
    );
    this.applyLiveGains();
  }

  toggleMute(id: string): void {
    this._tracks.update((list) =>
      list.map((t) => (t.id === id ? { ...t, muted: !t.muted } : t)),
    );
    this.applyLiveGains();
  }

  setTrimRegion(region: TrimRegion | null): void {
    this._trimRegion.set(region);
  }

  setTrimStart(): void {
    const t = this._playback().currentTime;
    const region = this._trimRegion();
    const end = region?.end ?? this.activeTrack()?.duration ?? t;
    this._trimRegion.set({ start: t, end: Math.max(t, end) });
  }

  setTrimEnd(): void {
    const t = this._playback().currentTime;
    const region = this._trimRegion();
    const start = region?.start ?? 0;
    this._trimRegion.set({ start: Math.min(start, t), end: t });
  }

  async cutSelection(): Promise<void> {
    const track = this.activeTrack();
    const region = this._trimRegion();
    if (!track || !region) {
      this._error.set('Select a trim region first.');
      return;
    }
    if (region.end - region.start < 0.05) {
      this._error.set('Trim region is too short.');
      return;
    }

    const buffer = this.buffers.get(track.id);
    if (!buffer) {
      this._error.set('Track buffer not found.');
      return;
    }

    try {
      this.pause();
      const trimmed = await trimAudioBuffer(buffer, region.start, region.end);
      const wavBlob = audioBufferToWav(trimmed);
      this.buffers.set(track.id, trimmed);
      this.revokeUrl(track.id);

      this._tracks.update((list) =>
        list.map((t) =>
          t.id === track.id
            ? { ...t, source: wavBlob, duration: trimmed.duration, name: `${t.name} (trimmed)` }
            : t,
        ),
      );
      this._trimRegion.set(null);
      this.playbackOffset = 0;
      this._playback.update((p) => ({ ...p, currentTime: 0 }));
      this.updateDuration();
    } catch (err: unknown) {
      this._error.set(err instanceof Error ? err.message : 'Trim failed.');
    }
  }

  async startRecording(): Promise<void> {
    if (!this.ensureBrowser()) return;
    this._error.set(null);

    try {
      this.recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      this.mediaRecorder = mime
        ? new MediaRecorder(this.recordStream, { mimeType: mime })
        : new MediaRecorder(this.recordStream);
      this.recordChunks = [];

      this.mediaRecorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data.size > 0) this.recordChunks.push(ev.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordChunks, {
          type: this.mediaRecorder?.mimeType ?? 'audio/webm',
        });
        void this.addTrack(blob, `Recording ${new Date().toLocaleTimeString()}`, 'recording');
        this.stopRecordingInternal(false);
      };

      this.mediaRecorder.start();
      this._recording.set(true);
    } catch (err: unknown) {
      this._error.set(err instanceof Error ? err.message : 'Microphone access denied.');
      this.stopRecordingInternal(false);
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this._recording.set(false);
  }

  private stopRecordingInternal(revokeStream: boolean): void {
    if (revokeStream) {
      this.recordStream?.getTracks().forEach((t) => t.stop());
    }
    this.recordStream = null;
    this.mediaRecorder = null;
    this._recording.set(false);
  }

  async play(): Promise<void> {
    if (!this._tracks().length) return;
    const context = this.ensureContext();
    await context.resume();

    this.stopPlaybackInternal(false);

    const startAt = this.playbackOffset;
    this.playbackStartContextTime = context.currentTime;
    this.activeSources = [];

    for (const track of this._tracks()) {
      const buffer = this.buffers.get(track.id);
      if (!buffer) continue;

      const source = context.createBufferSource();
      source.buffer = buffer;

      const gain = context.createGain();
      gain.gain.value = track.muted ? 0 : track.volume;

      source.connect(gain);
      gain.connect(this.masterGain!);

      const offset = Math.min(startAt, buffer.duration);
      source.start(context.currentTime, offset);
      this.activeSources.push({ source, gain });
    }

    this._playback.update((p) => ({ ...p, isPlaying: true, currentTime: startAt }));
  }

  pause(): void {
    if (!this._playback().isPlaying) return;
    if (this.audioContext) {
      const elapsed =
        this.playbackOffset +
        (this.audioContext.currentTime - this.playbackStartContextTime);
      this.playbackOffset = elapsed;
    }
    this.stopPlaybackInternal(false);
    this._playback.update((p) => ({
      ...p,
      isPlaying: false,
      currentTime: this.playbackOffset,
    }));
  }

  togglePlay(): void {
    if (this._playback().isPlaying) {
      this.pause();
    } else {
      void this.play();
    }
  }

  seek(seconds: number): void {
    const duration = this._playback().duration;
    const t = Math.max(0, Math.min(seconds, duration));
    this.playbackOffset = t;
    this._playback.update((p) => ({ ...p, currentTime: t }));

    if (this._playback().isPlaying) {
      void this.play();
    }
  }

  seekToPercent(percent: number): void {
    const duration = this._playback().duration;
    if (duration <= 0) return;
    this.seek((percent / 100) * duration);
  }

  async exportMp3(): Promise<Blob> {
    this._exporting.set(true);
    this._error.set(null);
    this.pause();

    try {
      return await this.ffmpegExport.exportMp3(this._tracks());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Export failed.';
      this._error.set(message);
      throw err;
    } finally {
      this._exporting.set(false);
    }
  }

  clearError(): void {
    this._error.set(null);
  }

  private applyLiveGains(): void {
    if (!this.activeSources.length) return;
    const trackList = this._tracks();
    this.activeSources.forEach((active, i) => {
      const track = trackList[i];
      if (track) {
        active.gain.gain.value = track.muted ? 0 : track.volume;
      }
    });
  }

  private stopPlaybackInternal(resetOffset = true): void {
    for (const { source } of this.activeSources) {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
      source.disconnect();
    }
    this.activeSources = [];
    if (resetOffset) {
      this.playbackOffset = 0;
    }
  }
}
