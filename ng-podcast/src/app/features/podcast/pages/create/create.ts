// features/podcast/pages/create/create.component.ts
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastService } from '../../services/podcast.service';

@Component({
  selector: 'app-podcast-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `./create.html`,
  styleUrls: ['./create.scss'],
})
export class Create {
  readonly store = inject(PodcastStore);
  readonly router = inject(Router);
  private fb = inject(FormBuilder);
  private podcastService = inject(PodcastService);

  readonly steps = [
    { index: 0, label: 'Infos' },
    { index: 1, label: 'Couverture' },
    { index: 2, label: 'Épisode' },
  ];

  readonly categories = [
    'Tech', 'Société', 'Poésie', 'Culture', 'Témoignages', 'Confessions', 'Autre',
  ];

  coverPreview = signal<string | null>(null);
  coverFile = signal<File | null>(null);
  audioFile = signal<File | null>(null);
  currentStep = signal(0);
  coverError = signal<string | null>(null);
  episodeError = signal<string | null>(null);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    category: [''],
    language: ['fr'],
    episodeTitle: [''],
  });

  isInvalid(field: 'title' | 'description'): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.invalid && ctrl.touched;
  }

  step0Invalid(): boolean {
    return this.form.controls.title.invalid || this.form.controls.description.invalid;
  }

  nextStep(): void {
    if (this.currentStep() === 0) {
      this.form.controls.title.markAsTouched();
      this.form.controls.description.markAsTouched();
      if (this.step0Invalid()) return;
    }
    const next = this.currentStep() + 1;
    if (next < this.steps.length) {
      this.currentStep.set(next);
    }
  }

  prevStep(): void {
    const p = this.currentStep() - 1;
    if (p >= 0) this.currentStep.set(p);
  }

  private attachCover(file: File | undefined): void {
    if (!file) return;

    const maxMb = 5;
    const maxBytes = maxMb * 1024 * 1024;
    const allowedPrefix = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedPrefix.includes(file.type)) {
      this.coverError.set('Format non pris en charge (JPG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > maxBytes) {
      this.coverError.set(`Fichier trop volumineux (max ${maxMb} Mo).`);
      return;
    }
    this.coverError.set(null);
    this.coverFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.coverPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onCoverChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.attachCover(file);
  }

  onCoverDrop(ev: DragEvent): void {
    ev.preventDefault();
    const file = ev.dataTransfer?.files?.[0];
    if (file) this.attachCover(file);
  }

  onAudioChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.audioFile.set(file);
  }

  onAudioDrop(ev: DragEvent): void {
    ev.preventDefault();
    const file = ev.dataTransfer?.files?.[0];
    if (file) this.audioFile.set(file);
  }

  removeAudio(ev: MouseEvent): void {
    ev.stopPropagation();
    this.audioFile.set(null);
  }

  formatSize(n: number): string {
    if (n >= 1048576) return `${(n / 1048576).toFixed(1)} Mo`;
    if (n >= 1024) return `${Math.round(n / 1024)} Ko`;
    return `${n} o`;
  }

  async submit(): Promise<void> {
    const episodeTitleRaw = this.form.controls.episodeTitle.value?.trim() ?? '';
    const audio = this.audioFile();

    if (audio !== null && episodeTitleRaw === '') {
      this.episodeError.set("Ajoutez un titre pour l'épisode ou retirez le fichier audio.");
      return;
    }
    this.episodeError.set(null);

    const { title, description, category, language } = this.form.getRawValue();

    const id = await this.store.create({
      title: title!,
      description: description!,
      coverFile: this.coverFile() ?? undefined,
      category: category || undefined,
      language: language || undefined,
    });
    if (!id) return;

    if (audio !== null && episodeTitleRaw !== '') {
      try {
        await this.podcastService.addEpisode(id, {
          title: episodeTitleRaw,
          publishNow: false,
          audio,
        });
        await this.router.navigate(['/podcasts', id]);
      } catch {
        await this.router.navigate(['/podcasts', id, 'publish']);
      }
      return;
    }

    await this.router.navigate(['/podcasts', id, 'publish']);
  }
}
