// src/app/features/podcast/components/player/player.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AudioService } from '../../services/audio';
import { PodcastStore } from '../../store/podcast.store';
import { Waveform } from '../waveform/waveform';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [Waveform],   // ← gardé car <app-waveform> est dans le template
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './player.html'
})
export class Player {
  readonly audio = inject(AudioService);
  readonly store = inject(PodcastStore);

  togglePlay() {
    this.store.isPlaying()
      ? this.store.pause()
      : this.store.play(this.store.currentEpisode()!);
  }

  onSeekClick(event: MouseEvent) {
    const bar   = event.currentTarget as HTMLElement;
    const ratio = event.offsetX / bar.offsetWidth;
    this.audio.seekToPercent(ratio * 100);
  }

  onVolumeChange(event: Event) {
    this.audio.setVolume(
      parseFloat((event.target as HTMLInputElement).value)
    );
  }

  onRateChange(event: Event) {
    this.audio.setPlaybackRate(
      parseFloat((event.target as HTMLSelectElement).value)
    );
  }
}