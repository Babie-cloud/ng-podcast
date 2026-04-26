// src/app/features/podcast/pages/home/home.ts
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastCard } from '../../components/podcast-card/podcast-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, PodcastCard],
  templateUrl: './home.html'
})
export class Home implements OnInit {
  readonly store = inject(PodcastStore);

  // ✅ topics manquait dans la classe
  readonly topics = [
    'Intelligence Artificielle', 'Startups', 'Robotique',
    'Cybersécurité', 'Futurisme', 'Web3', 'Quantique',
    'Biotech', 'Spatial', 'Open Source', 'Green Tech', 'Design',
    'Poésie', 'Témoignages', 'Confessions'
  ];

  ngOnInit() {
    this.store.loadAll();
  }
}