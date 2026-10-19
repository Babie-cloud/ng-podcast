import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StorytellingStore } from '../../../store/storytelling.store';
import { ContentUploadService } from '../../../services/content-upload.service';

@Component({
  selector: 'app-storytelling-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './storytelling-create.html',
})
export class StorytellingCreate {
  readonly store = inject(StorytellingStore);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly uploads = inject(ContentUploadService);
  readonly coverFile = signal<File | null>(null);
  readonly uploadError = signal<string | null>(null);

  readonly types = ['TESTIMONY', 'CONFESSION', 'EXPERIENCE', 'ANONYMOUS'];

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    content: [''],
    type: ['TESTIMONY'],
    status: ['PUBLISHED' as 'DRAFT' | 'PUBLISHED'],
    anonymous: [false],
    coverUrl: [''],
  });

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    let cover = v.coverUrl.trim();
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
      content: v.content || '',
      type: v.type,
      status: v.status,
      anonymous: v.anonymous,
      ...(cover !== '' ? { coverUrl: cover } : {}),
    });
    if (id) {
      await this.router.navigate(['/storytelling/mine'], {
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
