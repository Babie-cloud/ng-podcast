// src/app/features/podcast/pages/detail/detail.ts
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private readonly router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    void this.store.loadOne(id);
  }

  isOwner(podcast: { authorId: string }): boolean {
    const u = this.auth.user();
    return !!u && podcast.authorId === u.id;
  }

  /** Ouvre la vue « plein cadre » (jaquette + synchro léger façon Spotify). */
  openEpisodePlay(podcastId: string, ep: Episode): void {
    this.store.play(ep);
    void this.router.navigate(['/podcasts', podcastId, 'episode', ep.id]);
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}min ${s < 10 ? '0' + s : s}s`;
  }

  episodeStatus(ep: Episode): string {
    return ep.status ?? 'DRAFT';
  }
}
