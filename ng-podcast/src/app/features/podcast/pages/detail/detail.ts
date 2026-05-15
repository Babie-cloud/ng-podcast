// src/app/features/podcast/pages/detail/detail.ts
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PodcastStore } from '../../store/podcast.store';
import { AuthService } from '../../services/auth.service';
import { Episode } from '../../models/podcast.model';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './detail.html',
})
export class Detail implements OnInit {
  readonly store = inject(PodcastStore);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    void this.store.loadOne(id);
  }

  isOwner(podcast: { authorId: string }): boolean {
    const u = this.auth.user();
    return !!u && podcast.authorId === u.id;
  }

  playEpisode(ep: Episode): void {
    this.store.isPlaying() && this.store.currentEpisode()?.id === ep.id
      ? this.store.pause()
      : this.store.play(ep);
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}min ${s < 10 ? '0' + s : s}s`;
  }

  episodeStatus(ep: Episode): string {
    return ep.status ?? 'DRAFT';
  }

  async toggleEpisodePublish(podcastId: string, ep: Episode): Promise<void> {
    const next = this.episodeStatus(ep) !== 'PUBLISHED';
    await this.store.patchEpisode(podcastId, ep.id, { publishNow: next });
  }

  async deleteEpisode(podcastId: string, ep: Episode): Promise<void> {
    if (!confirm(`Supprimer l'épisode « ${ep.title} » ?`)) return;
    await this.store.deleteEpisode(podcastId, ep.id);
  }
}
