import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { StorytellingStore } from '../../../store/storytelling.store';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-storytelling-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './storytelling-detail.html',
  styleUrl: './storytelling-detail.scss',
})
export class StorytellingDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(StorytellingStore);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    void this.store.loadOne(id);
    if (this.auth.isLogged()) {
      void this.store.loadMine();
    }
  }

  ngOnDestroy(): void {
    this.store.clearSelected();
  }

  get canManage(): boolean {
    const u = this.auth.user();
    const s = this.store.selected();
    if (!u || !s) return false;
    if (s.authorId && s.authorId === u.id) return true;
    return false;
  }

  /** Permet « Modifier » même pour les histoires anonymes (authorId vide en lecture publique). */
  get canEdit(): boolean {
    const s = this.store.selected();
    if (!s || !this.auth.isLogged()) return false;
    if (this.canManage) return true;
    return this.store.mine().some((x) => x.id === s.id);
  }

  async remove(): Promise<void> {
    const s = this.store.selected();
    if (!s || !confirm(`Supprimer « ${s.title} » ?`)) return;
    await this.store.delete(s.id);
    void this.router.navigate(['/storytelling/mine']);
  }
}
