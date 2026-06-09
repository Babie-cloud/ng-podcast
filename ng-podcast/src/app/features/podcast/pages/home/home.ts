// src/app/features/podcast/pages/home/home.ts
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastCard } from '../../components/podcast-card/podcast-card';
import { AuthService } from '../../services/auth.service';
import { NewsletterForm } from '../../../../shared/components/newsletter-form/newsletter-form';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, PodcastCard, NewsletterForm],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './home.html',
})
export class Home implements OnInit {
  readonly store = inject(PodcastStore);
  readonly auth = inject(AuthService);

  // ✅ topics manquait dans la classe
  readonly topics = [
    'Intelligence Artificielle',
    'Startups',
    'Robotique',
    'Cybersécurité',
    'Futurisme',
    'Web3',
    'Quantique',
    'Biotech',
    'Spatial',
    'Open Source',
    'Green Tech',
    'Design',
    'Poésie',
    'Témoignages',
    'Confessions',
  ];

  ngOnInit() {
    this.store.loadAll();
  }
}
