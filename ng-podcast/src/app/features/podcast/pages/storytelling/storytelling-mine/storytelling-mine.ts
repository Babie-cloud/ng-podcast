import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { StorytellingStore } from '../../../store/storytelling.store';

@Component({
  selector: 'app-storytelling-mine',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './storytelling-mine.html',
})
export class StorytellingMine implements OnInit {
  readonly store = inject(StorytellingStore);

  ngOnInit(): void {
    void this.store.loadMine();
  }

  confirmDelete(id: string, title: string): void {
    if (confirm(`Supprimer « ${title} » ?`)) {
      void this.store.delete(id);
    }
  }
}
