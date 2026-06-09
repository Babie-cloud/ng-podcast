import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WritingStore } from '../../../store/writing.store';
import { PODCAST_CONTENT_THEMES, WRITING_TYPE_OPTIONS } from '../../../constants/content-taxonomy';
import { ContentUploadService } from '../../../services/content-upload.service';

@Component({
  selector: 'app-writing-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './writing-create.html',
})
export class WritingCreate {
  readonly store = inject(WritingStore);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly uploads = inject(ContentUploadService);
  readonly coverFile = signal<File | null>(null);
  readonly uploadError = signal<string | null>(null);

  readonly typeOptions = WRITING_TYPE_OPTIONS;
  readonly podcastThemes = PODCAST_CONTENT_THEMES;

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    content: ['', [Validators.required, Validators.minLength(5)]],
    type: ['POEM'],
    status: ['PUBLISHED' as 'DRAFT' | 'PUBLISHED'],
    audioUrl: [''],
    coverUrl: [''],
    anonymousAuthor: [false],
    podcastCategory: [''],
  });

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

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
    const id = await this.store.create({
      title: v.title,
      content: v.content,
      type: v.type,
      status: v.status,
      ...(audio !== '' ? { audioUrl: audio } : {}),
      ...(cover !== '' ? { coverUrl: cover } : {}),
      anonymousAuthor: v.anonymousAuthor,
      ...(category !== '' ? { podcastCategory: category } : { podcastCategory: null }),
    });
    if (id) {
      await this.router.navigate(['/writing/mine'], {
        queryParams: { created: id },
      });
    }
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.coverFile.set(input.files?.[0] ?? null);
    this.uploadError.set(null);
  }
}
