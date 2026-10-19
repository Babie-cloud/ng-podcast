import {
  Component,
  OnInit,
  inject,
  computed,
  signal,
  effect,
  ViewChildren,
  QueryList,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PodcastStore } from '../../store/podcast.store';
import { AudioService } from '../../services/audio';
import { AuthService } from '../../services/auth.service';
import { Episode } from '../../models/podcast.model';
import { CaptionCue, parseCaptionCues } from './caption-cues';

@Component({
  selector: 'app-episode-play',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './episode-play.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './episode-play.scss',
})
export class EpisodePlay implements OnInit {
  readonly store = inject(PodcastStore);
  readonly audio = inject(AudioService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChildren('cueLine') private cueLines!: QueryList<ElementRef<HTMLElement>>;

  readonly cues = signal<CaptionCue[]>([]);
  readonly episode = signal<Episode | null>(null);

  constructor() {
    effect(() => {
      const idx = this.activeCueIndex();
      if (idx < 0) return;
      const el = this.cueLines?.get(idx)?.nativeElement;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  readonly activeCueIndex = computed(() => {
    const list = this.cues();
    if (!list.length) return -1;
    const t = this.audio.currentTime();
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (t >= c.s && t < c.e) return i;
    }
    for (let i = list.length - 1; i >= 0; i--) {
      if (t >= list[i].s) return i;
    }
    return -1;
  });

  ngOnInit(): void {
    const pid = this.route.snapshot.paramMap.get('id') ?? '';
    const eid = this.route.snapshot.paramMap.get('episodeId') ?? '';
    if (!pid || !eid) {
      void this.router.navigate(['/podcasts']);
      return;
    }
    void this.hydrate(pid, eid);
  }

  private async hydrate(podcastId: string, episodeId: string): Promise<void> {
    await this.store.loadOne(podcastId);
    const p = this.store.selected();
    const ep = p?.episodes.find((e) => e.id === episodeId);
    if (!p || !ep?.audioUrl) {
      void this.router.navigate(['/podcasts', podcastId]);
      return;
    }

    this.episode.set(ep);
    this.cues.set(parseCaptionCues(ep.captions));
    this.store.play(ep);
  }

  onSeekPct(event: MouseEvent): void {
    const bar = event.currentTarget as HTMLElement;
    const ratio = event.offsetX / bar.offsetWidth;
    this.audio.seekToPercent(Math.max(0, Math.min(100, ratio * 100)));
  }

  togglePlay(ep: Episode): void {
    this.store.isPlaying() && this.store.currentEpisode()?.id === ep.id
      ? this.store.pause()
      : this.store.play(ep);
  }

  cueTrackClass(i: number): string {
    const active = this.activeCueIndex();
    if (active < 0) return 'episode-play-cue episode-play-cue-idle';
    if (i === active) return 'episode-play-cue episode-play-cue-active';
    if (i === active + 1) return 'episode-play-cue episode-play-cue-soon';
    return 'episode-play-cue episode-play-cue-idle';
  }

  isOwner(podcast: { authorId: string }): boolean {
    const u = this.auth.user();
    return !!u && podcast.authorId === u.id;
  }
}
