// src/app/features/podcast/components/podcast-card/podcast-card.ts
import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Podcast, Episode } from '../../models/podcast.model';
import { PodcastStore } from '../../store/podcast.store';
import { inject } from '@angular/core';

@Component({
  selector: 'app-podcast-card',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './podcast-card.html',
  styleUrl: './podcast-card.scss'
})
export class PodcastCard {

  // ─── INPUT classique (pas signal) ────────────────────────────
  @Input({ required: true }) podcast!: Podcast;

  // ─── OUTPUTS ─────────────────────────────────────────────────
  @Output() play   = new EventEmitter<Episode>();
  @Output() delete = new EventEmitter<string>();

  readonly store = inject(PodcastStore);

  // ─── GETTERS (remplacent computed()) ─────────────────────────
  get firstEpisode(): Episode | null {
    return this.podcast?.episodes?.[0] ?? null;
  }

  get isCurrentlyPlaying(): boolean {
    return this.store.currentEpisode()?.id === this.firstEpisode?.id
      && this.store.isPlaying();
  }

  // ─── MÉTHODES ────────────────────────────────────────────────
  onPlay(episode: Episode) {
    this.play.emit(episode);
  }

  onDelete() {
    this.delete.emit(this.podcast.id);
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  }
}