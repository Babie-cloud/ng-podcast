import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { WritingStore } from '../../../store/writing.store';
import { AuthService } from '../../../services/auth.service';
import { writingTypeLabel } from '../../../constants/content-taxonomy';

@Component({
  selector: 'app-writing-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './writing-detail.html',
  styleUrl: './writing-detail.scss',
})
export class WritingDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(WritingStore);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.loadAndCountView(id);
  }

  ngOnDestroy(): void {
    this.store.clearSelected();
  }

  get canManage(): boolean {
    const u = this.auth.user();
    const w = this.store.selected();
    return !!u && !!w && w.authorId != null && w.authorId === u.id;
  }

  labelType(code: string): string {
    return writingTypeLabel(code);
  }

  private async loadAndCountView(id: string): Promise<void> {
    await this.auth.whenAuthHydrated();
    await this.store.loadOne(id);
    const selected = this.store.selected();
    if (this.auth.isLogged() && selected?.status === 'PUBLISHED' && !this.canManage) {
      await this.store.registerView(id);
    }
  }

  async remove(): Promise<void> {
    const w = this.store.selected();
    if (!w || !confirm(`Supprimer « ${w.title} » ?`)) return;
    await this.store.delete(w.id);
    void this.router.navigate(['/writing/mine']);
  }
}
