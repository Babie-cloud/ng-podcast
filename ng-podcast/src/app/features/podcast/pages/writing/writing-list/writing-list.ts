import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { WritingStore } from '../../../store/writing.store';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-writing-list',
  standalone: true,
  imports: [RouterLink, DatePipe, SlicePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './writing-list.html',
})
export class WritingList implements OnInit {
  readonly store = inject(WritingStore);
  readonly auth = inject(AuthService);
  readonly query = signal('');

  ngOnInit(): void {
    void this.load();
  }

  search(): void {
    void this.store.loadPublished(this.query());
  }

  private async load(): Promise<void> {
    await this.auth.whenAuthHydrated();
    await this.store.loadPublished();
  }
}
