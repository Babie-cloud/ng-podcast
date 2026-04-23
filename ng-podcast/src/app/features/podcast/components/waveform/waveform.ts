// src/app/features/podcast/components/waveform/waveform.ts
import {
  Component,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AudioService } from '../../services/audio';

@Component({
  selector: 'app-waveform',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas class="waveform-canvas"></canvas>`,
  styles: [`
    .waveform-canvas {
      width: 100%;
      height: 48px;
      display: block;
      border-radius: 4px;
    }
  `],
})
export class Waveform implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly audio      = inject(AudioService);
  private readonly platformId = inject(PLATFORM_ID);
  private animId?: number;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.draw();
  }

  ngOnDestroy(): void {
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  private draw(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    // Adapte la résolution au devicePixelRatio pour des barres nettes
    const dpr    = window.devicePixelRatio || 1;
    const rect   = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    const loop = () => {
      ctx.clearRect(0, 0, W, H);

      const data     = this.audio.analyserData;   // Uint8Array(128)
      const barCount = 40;
      const gap      = 3;
      const barW     = (W - gap * (barCount - 1)) / barCount;

      for (let i = 0; i < barCount; i++) {
        // Sous-échantillonnage du tableau d'analyse
        const dataIndex = Math.floor((i / barCount) * data.length);
        const value     = data[dataIndex] / 255;          // 0 → 1
        const barH      = Math.max(3, value * H);

        const x = i * (barW + gap);
        const y = (H - barH) / 2;

        // Couleur calée sur la palette --np-primary
        const alpha = 0.4 + value * 0.6;
        ctx.fillStyle = `rgba(193, 122, 78, ${alpha})`;

        // Barres arrondies
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 2);
        ctx.fill();
      }

      this.animId = requestAnimationFrame(loop);
    };

    loop();
  }
}