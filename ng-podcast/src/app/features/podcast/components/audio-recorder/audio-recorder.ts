import {
  Component,
  inject,
  output,
  signal,
  PLATFORM_ID,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-audio-recorder',
  standalone: true,
  templateUrl: './audio-recorder.html',
  styleUrl: './audio-recorder.scss',
})
export class AudioRecorder implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  /** Fichier prêt (webm) ou null si effacé. */
  readonly fileReady = output<File | null>();

  readonly supported = signal(false);
  readonly recording = signal(false);
  readonly error = signal<string | null>(null);
  readonly label = signal<string | null>(null);

  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private stream: MediaStream | null = null;

  constructor() {
    if (
      isPlatformBrowser(this.platformId) &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
    ) {
      this.supported.set(true);
    }
  }

  ngOnDestroy(): void {
    this.stopTracks();
  }

  async start(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    this.error.set(null);
    this.label.set(null);
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : '';
      this.mediaRecorder = mime
        ? new MediaRecorder(this.stream, { mimeType: mime })
        : new MediaRecorder(this.stream);
      this.chunks = [];
      this.mediaRecorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data.size > 0) this.chunks.push(ev.data);
      };
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm',
        });
        const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
        const file = new File([blob], `enregistrement-${Date.now()}.${ext}`, {
          type: blob.type || 'audio/webm',
        });
        this.label.set(`${file.name} (${(file.size / 1024).toFixed(0)} Ko)`);
        this.fileReady.emit(file);
        this.stopTracks();
      };
      this.mediaRecorder.start();
      this.recording.set(true);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Micro inaccessible ou refusé.";
      this.error.set(msg);
      this.stopTracks();
    }
  }

  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.recording.set(false);
    this.mediaRecorder = null;
  }

  clear(): void {
    this.stop();
    this.label.set(null);
    this.chunks = [];
    this.fileReady.emit(null);
  }

  private stopTracks(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}
