import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PodcastStore } from '../../store/podcast.store';

@Component({
  selector: 'app-podcast-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './podcast-edit.html',
})
export class PodcastEdit implements OnInit {
  readonly store = inject(PodcastStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly podcastId = signal('');
  readonly categories = [
    'Tech',
    'Société',
    'Poésie',
    'Culture',
    'Témoignages',
    'Confessions',
    'Autre',
  ];

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: [''],
    language: ['fr'],
    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED'],
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) return;
    this.podcastId.set(id);
    await this.store.loadOne(id);
    const p = this.store.selected();
    if (!p || p.id !== id) return;
    this.form.patchValue({
      title: p.title,
      description: p.description,
      category: p.category ?? '',
      language: p.language ?? 'fr',
      status: p.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    });
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const id = this.podcastId();
    if (!id) return;
    const v = this.form.getRawValue();
    const ok = await this.store.patchPodcastMeta(id, {
      title: v.title,
      description: v.description,
      status: v.status,
      category: v.category || undefined,
      language: v.language || undefined,
    });
    if (ok) {
      await this.router.navigate(['/podcasts', id]);
    }
  }
}
