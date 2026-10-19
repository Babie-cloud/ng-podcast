// src/app/features/podcast/pages/my-podcasts/my-podcasts.ts
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PodcastStore } from '../../store/podcast.store';

@Component({
  selector: 'app-my-podcasts',
  standalone: true,
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './my-podcasts.html',
})
export class MyPodcasts implements OnInit {
  readonly store = inject(PodcastStore);

  ngOnInit() {
    this.store.loadMine();
  }

  confirmDelete(id: string, title: string) {
    if (confirm(`Supprimer "${title}" ?`)) {
      this.store.delete(id);
    }
  }
}
