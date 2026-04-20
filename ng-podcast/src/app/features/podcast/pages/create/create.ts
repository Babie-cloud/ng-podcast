// features/podcast/pages/create/create.component.ts
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PodcastStore } from '../../store/podcast.store';

@Component({
  selector: 'app-podcast-create',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `./create.html`,
  styleUrls: ['./create.scss'],
})
export class Create {
  readonly store  = inject(PodcastStore);
  readonly router = inject(Router);
  private fb      = inject(FormBuilder);

  coverPreview = signal<string | null>(null);
  audioFile    = signal<File | null>(null);

  form = this.fb.group({
    title:       ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  isInvalid(field: 'title' | 'description'): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.invalid && ctrl.touched;
  }

  onCoverChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.coverPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onAudioChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.audioFile.set(file);
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { title, description } = this.form.getRawValue();
    await this.store.create({ title: title!, description: description! });
    if (!this.store.hasError()) {
      this.router.navigate(['/podcasts']);
    }
  }

  
}