import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PodcastStore } from '../../store/podcast.store';
import { Episode } from '../../models/podcast.model';

@Component({
  selector: 'app-podcast-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './podcast-edit.html',
})
export class PodcastEdit implements OnInit {
  readonly store = inject(PodcastStore);
  private readonly route = inject(ActivatedRoute);
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

  readonly episodeLocalError = signal<string | null>(null);
  readonly captionsBusyId = signal<string | null>(null);

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

  isPublishedEpisode(ep: Episode): boolean {
    return (ep.status ?? '').toUpperCase() === 'PUBLISHED';
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
      await this.store.loadOne(id);
    }
  }

  async toggleEpisodePublish(ep: Episode): Promise<void> {
    const pid = this.podcastId();
    if (!pid) return;
    this.episodeLocalError.set(null);
    const nextPublished = !this.isPublishedEpisode(ep);
    const ok = await this.store.patchEpisode(pid, ep.id, { publishNow: nextPublished });
    if (!ok) {
      const err = this.store.error();
      this.episodeLocalError.set(err ?? 'Publication impossible.');
    }
  }

  async removeEpisode(ep: Episode): Promise<void> {
    const pid = this.podcastId();
    if (!pid) return;
    if (!confirm(`Supprimer définitivement l’épisode « ${ep.title} » ?`)) return;

    this.episodeLocalError.set(null);
    const ok = await this.store.deleteEpisode(pid, ep.id);
    if (!ok) {
      const err = this.store.error();
      this.episodeLocalError.set(err ?? 'Suppression impossible.');
    }
  }

  async saveCaptions(ep: Episode, value: string): Promise<void> {
    const pid = this.podcastId();
    if (!pid) return;
    this.episodeLocalError.set(null);
    this.captionsBusyId.set(ep.id);
    const captions = value.trim().length === 0 ? '' : value.trim();
    const ok = await this.store.patchEpisode(pid, ep.id, { captions });
    this.captionsBusyId.set(null);
    if (!ok) {
      const err = this.store.error();
      this.episodeLocalError.set(err ?? 'Enregistrement des paroles impossible.');
      return;
    }
    await this.store.loadOne(pid);
  }
}
