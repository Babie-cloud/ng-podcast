// features/podcast/components/waveform/waveform.component.ts
import {
  Component, inject, ElementRef, ViewChild,
  AfterViewInit, OnDestroy, ChangeDetectionStrategy
} from '@angular/core';
import { AudioService } from '../../services/audio';

@Component({
  selector: 'app-waveform',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #canvas class="w-100" style="height:64px; border-radius:8px"></canvas>
  `,
  styleUrls: ['./waveform.scss']
})
export class Waveform implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private audio = inject(AudioService);
  private rafId?: number;
  private ctx!:   CanvasRenderingContext2D;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.draw();
  }

  private draw() {
    const canvas = this.canvasRef.nativeElement;
    const ctx    = this.ctx;
    const data   = this.audio.analyserData;
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = 64;

    ctx.clearRect(0, 0, W, H);

    const barW   = W / data.length;
    const accent = '#6c6ce4';

    data.forEach((value, i) => {
      const barH  = (value / 255) * H;
      const alpha = 0.4 + (value / 255) * 0.6;
      ctx.fillStyle = accent;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.roundRect(
        i * barW + 1,
        H - barH,
        Math.max(barW - 2, 1),
        barH,
        2
      );
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    this.rafId = requestAnimationFrame(() => this.draw());
  }

  ngOnDestroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}