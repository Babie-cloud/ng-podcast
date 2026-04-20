// podcast-card.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';      // ← indispensable !
import { DatePipe } from '@angular/common';
import { Podcast, Episode } from '../../models/podcast.model';

@Component({
  selector: 'app-podcast-card',
  standalone: true,
  imports: [RouterLink, DatePipe],                 // ← RouterLink ici !
  templateUrl: './podcast-card.html',
  styleUrl: './podcast-card.scss'
})
export class PodcastCard {
  @Input({ required: true }) podcast!: Podcast;
  @Output() play   = new EventEmitter<Episode>();
  @Output() delete = new EventEmitter<string>();

  onPlay(episode: Episode) { this.play.emit(episode); }
  onDelete() { this.delete.emit(this.podcast.id); }

  get firstEpisode(): Episode | null {
    return this.podcast.episodes?.[0] ?? null;
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  }
}