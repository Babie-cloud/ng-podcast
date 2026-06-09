import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WritingStore } from '../../../store/writing.store';
import { PODCAST_CONTENT_THEMES, WRITING_TYPE_OPTIONS } from '../../../constants/content-taxonomy';
import { ContentUploadService } from '../../../services/content-upload.service';

@Component({
  selector: 'app-writing-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './writing-edit.html',
})
export class WritingEdit implements OnInit {
  readonly store = inject(WritingStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly uploads = inject(ContentUploadService);

  readonly typeOptions = WRITING_TYPE_OPTIONS;
  readonly podcastThemes = PODCAST_CONTENT_THEMES;
  readonly id = signal<string>('');
  readonly coverFile = signal<File | null>(null);
  readonly uploadError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    content: ['', [Validators.required, Validators.minLength(5)]],
    type: ['POEM'],
    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED'],
    audioUrl: [''],
    coverUrl: [''],
    anonymousAuthor: [false],
    podcastCategory: [''],
  });

  async ngOnInit(): Promise<void> {
    const raw = this.route.snapshot.paramMap.get('id');
    if (!raw) return;
    this.id.set(raw);
    await this.store.loadOne(raw);
    const w = this.store.selected();
    if (!w || w.id !== raw) return;
    this.form.patchValue({
      title: w.title,
      content: w.content,
      type: w.type,
      status: w.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      audioUrl: w.audioUrl ?? '',
      coverUrl: w.coverUrl ?? '',
      anonymousAuthor: w.anonymousAuthor,
      podcastCategory: w.podcastCategory ?? '',
    });
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const rawId = this.id();
    if (!rawId) return;

    const v = this.form.getRawValue();
    const audio = v.audioUrl.trim();
    let cover = v.coverUrl.trim();
    const category = v.podcastCategory.trim();
    this.uploadError.set(null);
    if (this.coverFile()) {
      try {
        cover = await this.uploads.uploadImage(this.coverFile()!);
      } catch {
        this.uploadError.set("Impossible d'importer l'image. Vous pouvez essayer avec une URL.");
        return;
      }
    }

    const ok = await this.store.update(rawId, {
      title: v.title,
      content: v.content,
      type: v.type,
      status: v.status,
      ...(audio !== '' ? { audioUrl: audio } : { audioUrl: null }),
      ...(cover !== '' ? { coverUrl: cover } : { coverUrl: null }),
      anonymousAuthor: v.anonymousAuthor,
      podcastCategory: category !== '' ? category : null,
    });
    if (ok) {
      await this.router.navigate(['/writing', rawId]);
    }
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.coverFile.set(input.files?.[0] ?? null);
    this.uploadError.set(null);
  }
}
