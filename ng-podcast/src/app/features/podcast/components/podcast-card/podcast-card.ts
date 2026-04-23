// src/app/features/podcast/components/podcast-card/podcast-card.ts
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Podcast, Episode } from '../../models/podcast.model';
import { PodcastStore } from '../../store/podcast.store';

@Component({
  selector: 'app-podcast-card',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `podcast-card.html`,
  styles: [`podcast-card.scss`],
})
export class PodcastCard {
  readonly podcast = input.required<Podcast>();
  readonly play    = output<Episode>();

  private readonly store = inject(PodcastStore);

  get latestEpisode(): () => Episode | undefined {
    return () => this.podcast().episodes.at(-1);
  }

  isCurrentlyPlaying(): boolean {
    const latest = this.podcast().episodes.at(-1);
    return !!latest
      && this.store.currentEpisode()?.id === latest.id
      && this.store.isPlaying();
  }

  onPlayLatest(): void {
    const ep = this.podcast().episodes.at(-1);
    if (!ep) return;

    if (this.isCurrentlyPlaying()) {
      this.store.pause();
    } else {
      this.store.play(ep);
      this.play.emit(ep);
    }
  }
}