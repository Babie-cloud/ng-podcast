import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastCard } from '../../components/podcast-card/podcast-card';

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [RouterLink, PodcastCard],
  templateUrl: './landingpage.html',
  styleUrl: './landingpage.scss',
})
export class Landingpage implements OnInit {
  readonly store = inject(PodcastStore);

  ngOnInit(): void {
    this.store.loadAll();
  }
}
