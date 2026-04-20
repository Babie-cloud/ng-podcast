// src/app/features/podcast/pages/detail/detail.ts
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PodcastStore } from '../../store/podcast.store';
import { Episode } from '../../models/podcast.model';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],   // ← gardés car utilisés dans le template
  templateUrl: './detail.html'
})
export class Detail implements OnInit {
  readonly store = inject(PodcastStore);
  private route  = inject(ActivatedRoute);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.store.loadOne(id);
  }

  playEpisode(ep: Episode) {
    this.store.isPlaying() && this.store.currentEpisode()?.id === ep.id
      ? this.store.pause()
      : this.store.play(ep);
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}min ${s < 10 ? '0' + s : s}s`;
  }
}