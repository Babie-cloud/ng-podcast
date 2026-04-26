import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './features/podcast/services/theme.service';
import { PodcastStore } from './features/podcast/store/podcast.store';
import { AudioService } from './features/podcast/services/audio';
import { Player } from './features/podcast/components/player/player';
import { Footer } from './features/layout/footer/footer';
import { Header } from './features/layout/header/header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Player, Footer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App implements OnInit {
  readonly theme = inject(ThemeService);
  readonly store = inject(PodcastStore);
  readonly audio = inject(AudioService);

  ngOnInit(): void {}
}
