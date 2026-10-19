import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { AudioStudioTrack } from '../models/audio-studio.types';
import { audioBufferToWav, decodeAudioSource, sourceToBlob } from '../utils/audio-buffer.util';

const FFMPEG_CORE_VERSION = '0.12.6';
const FFMPEG_CDN = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

@Injectable({ providedIn: 'root' })
export class FfmpegExportService {
  private readonly platformId = inject(PLATFORM_ID);

  private ffmpeg: FFmpeg | null = null;
  private loadPromise: Promise<void> | null = null;

  readonly loading = signal(false);
  readonly progress = signal(0);
  readonly error = signal<string | null>(null);

  /** Lazy-load ffmpeg.wasm core (browser only). */
  async ensureLoaded(): Promise<FFmpeg> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('FFmpeg export is only available in the browser.');
    }

    if (this.ffmpeg?.loaded) return this.ffmpeg;

    if (!this.loadPromise) {
      this.loadPromise = this.loadFfmpeg();
    }
    await this.loadPromise;

    if (!this.ffmpeg) {
      throw new Error('FFmpeg failed to initialize.');
    }
    return this.ffmpeg;
  }

  private async loadFfmpeg(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => {
        this.progress.set(Math.round(progress * 100));
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.ffmpeg = ffmpeg;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'FFmpeg load failed.';
      this.error.set(message);
      this.loadPromise = null;
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Merge all tracks with per-track volume into a single MP3 Blob.
   * Tracks are mixed using ffmpeg amix; longest track sets duration.
   */
  async exportMp3(tracks: AudioStudioTrack[]): Promise<Blob> {
    if (!tracks.length) {
      throw new Error('No tracks to export.');
    }

    const ffmpeg = await this.ensureLoaded();
    const context = new AudioContext();

    try {
      const inputNames: string[] = [];
      const filterParts: string[] = [];
      const mixInputs: string[] = [];

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track.muted || track.volume <= 0) continue;

        const blob = await sourceToBlob(track.source);
        let wavBlob: Blob;

        try {
          const buffer = await decodeAudioSource(blob, context);
          wavBlob = audioBufferToWav(buffer);
        } catch {
          wavBlob = blob.type.includes('wav') ? blob : blob;
        }

        const inputName = `input${i}.wav`;
        inputNames.push(inputName);
        await ffmpeg.writeFile(inputName, await fetchFile(wavBlob));

        const label = `a${i}`;
        const vol = track.muted ? 0 : track.volume;
        filterParts.push(`[${inputNames.length - 1}:a]volume=${vol.toFixed(3)}[${label}]`);
        mixInputs.push(`[${label}]`);
      }

      if (!inputNames.length) {
        throw new Error('All tracks are muted.');
      }

      const outputName = 'output.mp3';
      let exitCode: number;

      if (mixInputs.length === 1) {
        exitCode = await ffmpeg.exec([
          '-i', inputNames[0],
          '-af', `volume=${tracks.find((t) => !t.muted && t.volume > 0)?.volume.toFixed(3) ?? '1'}`,
          '-codec:a', 'libmp3lame',
          '-q:a', '2',
          outputName,
        ]);
      } else {
        const filterComplex =
          `${filterParts.join(';')};${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=longest:dropout_transition=0[out]`;
        exitCode = await ffmpeg.exec([
          ...inputNames.flatMap((name) => ['-i', name]),
          '-filter_complex', filterComplex,
          '-map', '[out]',
          '-codec:a', 'libmp3lame',
          '-q:a', '2',
          outputName,
        ]);
      }

      if (exitCode !== 0) {
        throw new Error(`FFmpeg export failed (code ${exitCode}).`);
      }

      const data = await ffmpeg.readFile(outputName);
      const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));

      await this.cleanupFiles(ffmpeg, [...inputNames, outputName]);

      return new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/mpeg' });
    } finally {
      await context.close();
    }
  }

  private async cleanupFiles(ffmpeg: FFmpeg, names: string[]): Promise<void> {
    for (const name of names) {
      try {
        await ffmpeg.deleteFile(name);
      } catch {
        /* ignore cleanup errors */
      }
    }
  }
}
