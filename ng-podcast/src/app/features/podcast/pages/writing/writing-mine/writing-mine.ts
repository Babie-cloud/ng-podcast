import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { WritingStore } from '../../../store/writing.store';

@Component({
  selector: 'app-writing-mine',
  standalone: true,
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './writing-mine.html',
})
export class WritingMine implements OnInit {
  readonly store = inject(WritingStore);
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
