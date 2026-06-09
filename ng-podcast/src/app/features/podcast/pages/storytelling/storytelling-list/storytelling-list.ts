import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { StorytellingStore } from '../../../store/storytelling.store';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-storytelling-list',
  standalone: true,
  imports: [RouterLink, DatePipe, SlicePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './storytelling-list.html',
})
export class StorytellingList implements OnInit {
  readonly store = inject(StorytellingStore);
  readonly auth = inject(AuthService);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    await this.auth.whenAuthHydrated();
    await this.store.loadPublished();
  }
}
