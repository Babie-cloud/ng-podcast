import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { WritingStore } from '../../../store/writing.store';

@Component({
  selector: 'app-writing-mine',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './writing-mine.html',
})
export class WritingMine implements OnInit {
  readonly store = inject(WritingStore);

  ngOnInit(): void {
    void this.store.loadMine();
  }

  confirmDelete(id: string, title: string): void {
    if (confirm(`Supprimer « ${title} » ?`)) {
      void this.store.delete(id);
    }
  }
}
