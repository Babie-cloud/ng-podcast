import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WritingStore } from '../../../store/writing.store';
import { PODCAST_CONTENT_THEMES, WRITING_TYPE_OPTIONS } from '../../../constants/content-taxonomy';

@Component({
  selector: 'app-writing-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './writing-create.html',
})
export class WritingCreate {
  readonly store = inject(WritingStore);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly typeOptions = WRITING_TYPE_OPTIONS;
  readonly podcastThemes = PODCAST_CONTENT_THEMES;

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

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const audio = v.audioUrl.trim();
    const cover = v.coverUrl.trim();
    const category = v.podcastCategory.trim();
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
      await this.router.navigate(['/writing', id]);
    }
  }
}
