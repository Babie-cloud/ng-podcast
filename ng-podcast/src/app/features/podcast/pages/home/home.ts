// src/app/features/podcast/pages/home/home.ts
import { Component, OnInit, inject } from '@angular/core';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastCard } from '../../components/podcast-card/podcast-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PodcastCard],   // ← PodcastCard importé ici
  templateUrl: './home.html'
})
export class Home implements OnInit {
  readonly store = inject(PodcastStore);

  ngOnInit() {
    this.store.loadAll();
  }
}