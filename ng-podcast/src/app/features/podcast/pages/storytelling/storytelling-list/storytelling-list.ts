import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { StorytellingStore } from '../../../store/storytelling.store';

@Component({
  selector: 'app-storytelling-list',
  standalone: true,
  imports: [RouterLink, DatePipe, SlicePipe],
  templateUrl: './storytelling-list.html',
})
export class StorytellingList implements OnInit {
  readonly store = inject(StorytellingStore);

  ngOnInit(): void {
    void this.store.loadPublished();
  }
}
