import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Podcast, Episode } from '../../models/podcast.model';
import { PodcastStore }     from '../../store/podcast.store';

@Component({
  selector: 'app-podcast-card',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './podcast-card.html',
  styleUrl:    './podcast-card.scss',   // ← fichier externe (voir podcast-card.scss)
})
export class PodcastCard {
  readonly podcast = input.required<Podcast>();
  readonly play    = output<Episode>();

  readonly store = inject(PodcastStore);

  latestEpisode(): Episode | undefined {
    return this.podcast().episodes.at(-1);
  }

  isCurrentlyPlaying(): boolean {
    const latest = this.latestEpisode();
    return !!latest
      && this.store.currentEpisode()?.id === latest.id
      && this.store.isPlaying();
  }

  onPlayLatest(): void {
    const ep = this.latestEpisode();
    if (!ep) return;

    if (this.isCurrentlyPlaying()) {
      this.store.pause();
    } else {
      this.store.play(ep);
      this.play.emit(ep);
    }
  }
}