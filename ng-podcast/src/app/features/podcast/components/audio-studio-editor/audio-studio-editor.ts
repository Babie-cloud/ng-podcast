import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  output,
  signal,
  PLATFORM_ID,
  effect,
} from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { AudioStudioService } from '../../services/audio-studio.service';
import { FfmpegExportService } from '../../services/ffmpeg-export.service';
import { SoundLibrary } from '../sound-library/sound-library';
import { formatTime } from '../../utils/audio-buffer.util';
import type { AudioStudioTrack } from '../../models/audio-studio.types';

@Component({
  selector: 'app-audio-studio-editor',
  standalone: true,
  imports: [FormsModule, DecimalPipe, SoundLibrary],
  providers: [AudioStudioService],
  templateUrl: './audio-studio-editor.html',
  styleUrl: './audio-studio-editor.scss',
})
export class AudioStudioEditor implements AfterViewInit, OnDestroy {
  @ViewChild('waveformContainer', { static: true })
  waveformContainer!: ElementRef<HTMLElement>;

  private readonly platformId = inject(PLATFORM_ID);
  readonly studio = inject(AudioStudioService);
  readonly ffmpegExport = inject(FfmpegExportService);

  /** Emits the exported or last-ready audio file for parent forms. */
  readonly audioReady = output<File | null>();

  readonly exportLabel = signal<string | null>(null);
  readonly waveReady = signal(false);

  private wavesurfer: WaveSurfer | null = null;
  private regionsPlugin: RegionsPlugin | null = null;
  private trimRegion: Region | null = null;
  private syncingFromService = false;

  constructor() {
    effect(() => {
      const track = this.studio.activeTrack();
      const region = this.studio.trimRegion();
      if (isPlatformBrowser(this.platformId) && this.wavesurfer) {
        void this.loadActiveTrack(track);
      }
      if (region && this.regionsPlugin && this.trimRegion) {
        this.trimRegion.setOptions({ start: region.start, end: region.end });
      }
    });

    effect(() => {
      const playback = this.studio.playback();
      if (!this.wavesurfer || this.syncingFromService) return;
      // WaveSurfer is visual-only; mixed audio plays via Web Audio in the service.
      const wsTime = this.wavesurfer.getCurrentTime();
      if (Math.abs(wsTime - playback.currentTime) > 0.08) {
        this.wavesurfer.setTime(playback.currentTime);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initWaveSurfer();
  }

  ngOnDestroy(): void {
    this.destroyWaveSurfer();
  }

  private initWaveSurfer(): void {
    const container = this.waveformContainer.nativeElement;
    this.regionsPlugin = RegionsPlugin.create();

    this.wavesurfer = WaveSurfer.create({
      container,
      waveColor: 'rgba(193, 122, 78, 0.35)',
      progressColor: 'rgba(193, 122, 78, 0.9)',
      cursorColor: 'rgba(139, 69, 19, 0.85)',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 96,
      normalize: true,
      interact: true,
      plugins: [this.regionsPlugin],
    });
    this.wavesurfer.setVolume(0);

    this.wavesurfer.on('ready', () => {
      this.waveReady.set(true);
      this.createTrimRegion();
    });

    this.wavesurfer.on('timeupdate', (time: number) => {
      if (this.syncingFromService) return;
      this.syncingFromService = true;
      this.studio.seek(time);
      this.syncingFromService = false;
    });

    this.wavesurfer.on('click', () => {
      this.syncingFromService = true;
      this.studio.seek(this.wavesurfer?.getCurrentTime() ?? 0);
      this.syncingFromService = false;
    });

    this.regionsPlugin.on('region-updated', (region: Region) => {
      this.trimRegion = region;
      this.studio.setTrimRegion({ start: region.start, end: region.end });
    });

    const track = this.studio.activeTrack();
    if (track) void this.loadActiveTrack(track);
  }

  private destroyWaveSurfer(): void {
    this.trimRegion = null;
    this.wavesurfer?.destroy();
    this.wavesurfer = null;
    this.regionsPlugin = null;
    this.waveReady.set(false);
  }

  private async loadActiveTrack(track: AudioStudioTrack | null): Promise<void> {
    if (!this.wavesurfer || !track) return;

    this.waveReady.set(false);
    const url = this.studio.resolveTrackUrl(track);
    await this.wavesurfer.load(url);
    this.createTrimRegion();
  }

  private createTrimRegion(): void {
    if (!this.regionsPlugin || !this.wavesurfer) return;

    this.regionsPlugin.clearRegions();
    const duration = this.wavesurfer.getDuration();
    if (!duration) return;

    const existing = this.studio.trimRegion();
    const start = existing?.start ?? 0;
    const end = existing?.end ?? duration;

    this.trimRegion = this.regionsPlugin.addRegion({
      start,
      end,
      color: 'rgba(193, 122, 78, 0.25)',
      drag: true,
      resize: true,
    });

    this.studio.setTrimRegion({ start, end });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    void this.studio.loadFile(file).then(() => {
      input.value = '';
    });
  }

  onMusicFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    void this.studio.addTrack(file, file.name, 'music').then(() => {
      input.value = '';
    });
  }

  selectTrack(id: string): void {
    this.studio.setActiveTrack(id);
  }

  onVolumeChange(id: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.studio.setVolume(id, value / 100);
  }

  onSeekInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.studio.seekToPercent(value);
  }

  seekPercent(): number {
    const p = this.studio.playback();
    return p.duration > 0 ? (p.currentTime / p.duration) * 100 : 0;
  }

  formatTrackTime(seconds: number): string {
    return formatTime(seconds);
  }

  trackTypeLabel(type: AudioStudioTrack['type']): string {
    const labels: Record<AudioStudioTrack['type'], string> = {
      voice: 'Voice',
      music: 'Music',
      recording: 'Recording',
      imported: 'Imported',
    };
    return labels[type];
  }

  async onExport(): Promise<void> {
    try {
      const blob = await this.studio.exportMp3();
      const file = new File([blob], `episode-mix-${Date.now()}.mp3`, {
        type: 'audio/mpeg',
      });
      this.exportLabel.set(`${file.name} (${(file.size / 1024).toFixed(0)} Ko)`);
      this.audioReady.emit(file);

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      /* error surfaced via studio.error */
    }
  }
}
