import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PodcastStore } from '../../store/podcast.store';
import { AudioRecorder } from '../../components/audio-recorder/audio-recorder';
import { Episode } from '../../models/podcast.model';

@Component({
  selector: 'app-podcast-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AudioRecorder, DatePipe],
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

  /** Nouvel épisode — upload ou enregistrement micro. */
  readonly audioPick = signal<File | null>(null);
  readonly recordedFile = signal<File | null>(null);
  readonly episodeLocalError = signal<string | null>(null);
  readonly episodeBusy = signal(false);

  episodeForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    publishNow: [false],
  });

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

  onAudioChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.audioPick.set(file);
      this.recordedFile.set(null);
      this.episodeLocalError.set(null);
    }
  }

  onRecorded(file: File | null): void {
    this.recordedFile.set(file);
    if (file) {
      this.audioPick.set(null);
      this.episodeLocalError.set(null);
    }
  }

  clearPickedAudio(): void {
    this.audioPick.set(null);
    this.recordedFile.set(null);
  }

  pickedAudio(): File | null {
    return this.audioPick() ?? this.recordedFile();
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

  async submitNewEpisode(): Promise<void> {
    this.episodeForm.markAllAsTouched();
    const audio = this.pickedAudio();
    const pid = this.podcastId();

    if (this.episodeForm.invalid || !audio || !pid) {
      if (!audio && this.episodeForm.valid) {
        this.episodeLocalError.set('Choisissez un fichier audio ou enregistrez depuis le navigateur.');
      }
      return;
    }

    this.episodeLocalError.set(null);
    this.episodeBusy.set(true);

    const v = this.episodeForm.getRawValue();
    const ok = await this.store.addEpisode(pid, {
      title: v.title.trim(),
      description: v.description?.trim(),
      publishNow: v.publishNow,
      audio,
    });

    this.episodeBusy.set(false);

    if (ok) {
      this.episodeForm.reset({
        title: '',
        description: '',
        publishNow: false,
      });
      this.clearPickedAudio();
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
}
