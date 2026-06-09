import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { StorytellingStore } from '../../../store/storytelling.store';

@Component({
  selector: 'app-storytelling-mine',
  standalone: true,
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './storytelling-mine.html',
})
export class StorytellingMine implements OnInit {
  readonly store = inject(StorytellingStore);
  readonly createdId = signal<string | null>(null);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.createdId.set(this.route.snapshot.queryParamMap.get('created'));
    void this.store.loadMine();
  }

  isCreated(id: string): boolean {
    return this.createdId() === id;
  }

  confirmDelete(id: string, title: string): void {
    if (confirm(`Supprimer « ${title} » ?`)) {
      void this.store.delete(id);
    }
  }
}
