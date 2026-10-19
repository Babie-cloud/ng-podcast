// src/app/features/podcast/pages/search/search.ts
import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastCard } from '../../components/podcast-card/podcast-card';
import { Podcast } from '../../models/podcast.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, PodcastCard],
  templateUrl: './search.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './search.scss',
})
export class Search implements OnInit {
  // readonly pour que le template Angular y accède (pas private !)
  readonly store = inject(PodcastStore);

  query = signal('');
  results = signal<Podcast[]>([]);

  ngOnInit(): void {
    this.store.loadAll();
  }

  onSearch(q: string): void {
    this.query.set(q);
    if (!q.trim()) {
      this.results.set([]);
      return;
    }
    const lower = q.toLowerCase();
    this.results.set(
      this.store
        .podcasts()
        .filter(
          (p: Podcast) =>
            p.title.toLowerCase().includes(lower) ||
            p.description.toLowerCase().includes(lower) ||
            p.authorName.toLowerCase().includes(lower),
        ),
    );
  }
}
