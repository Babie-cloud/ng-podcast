import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { WritingStore } from '../../../store/writing.store';

@Component({
  selector: 'app-writing-list',
  standalone: true,
  imports: [RouterLink, DatePipe, SlicePipe],
  templateUrl: './writing-list.html',
})
export class WritingList implements OnInit {
  readonly store = inject(WritingStore);
  readonly query = signal('');

  ngOnInit(): void {
    void this.store.loadPublished();
  }

  search(): void {
    void this.store.loadPublished(this.query());
  }
}
