// features/podcast/pages/create/create.component.ts
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastService } from '../../services/podcast.service';
import { PODCAST_CONTENT_THEMES } from '../../constants/content-taxonomy';
import { AudioRecorder } from '../../components/audio-recorder/audio-recorder';
import { AudioStudioEditor } from '../../components/audio-studio-editor/audio-studio-editor';

export interface DraftEpisode {
  id: string;
  title: string;
  audio: File;
}

@Component({
  selector: 'app-podcast-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AudioRecorder, AudioStudioEditor],
  templateUrl: './create.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./create.scss'],
})
export class Create {
  readonly store = inject(PodcastStore);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly podcastService = inject(PodcastService);

  readonly steps = [
    { index: 0, label: 'Informations' },
    { index: 1, label: 'Couverture' },
    { index: 2, label: 'Épisodes' },
  ];

  readonly categories = [...PODCAST_CONTENT_THEMES];

  coverPreview = signal<string | null>(null);
  coverFile = signal<File | null>(null);
  audioPick = signal<File | null>(null);
  recordedFile = signal<File | null>(null);
  studioFile = signal<File | null>(null);
  draftEpisodes = signal<DraftEpisode[]>([]);
  currentStep = signal(0);
  coverError = signal<string | null>(null);
  episodeError = signal<string | null>(null);
  showAudioStudio = signal(false);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    category: [''],
    language: ['fr'],
    episodeTitle: ['', [Validators.minLength(2)]],
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
    if (!file) return;
    this.audioPick.set(file);
    this.recordedFile.set(null);
    this.studioFile.set(null);
    this.episodeError.set(null);
  }

  onAudioDrop(ev: DragEvent): void {
    ev.preventDefault();
    const file = ev.dataTransfer?.files?.[0];
    if (!file) return;
    this.audioPick.set(file);
    this.recordedFile.set(null);
    this.studioFile.set(null);
    this.episodeError.set(null);
  }

  onRecorded(file: File | null): void {
    this.recordedFile.set(file);
    if (file) {
      this.audioPick.set(null);
      this.studioFile.set(null);
      this.episodeError.set(null);
    }
  }

  onStudioExport(file: File | null): void {
    this.studioFile.set(file);
    if (file) {
      this.audioPick.set(null);
      this.recordedFile.set(null);
      this.episodeError.set(null);
    }
  }

  pickedAudio(): File | null {
    return this.studioFile() ?? this.recordedFile() ?? this.audioPick();
  }

  pickedAudioLabel(): string | null {
    const file = this.pickedAudio();
    if (!file) return null;
    return `${file.name} (${this.formatSize(file.size)})`;
  }

  clearCurrentAudio(ev?: MouseEvent): void {
    ev?.stopPropagation();
    this.audioPick.set(null);
    this.recordedFile.set(null);
    this.studioFile.set(null);
  }

  toggleAudioStudio(): void {
    this.showAudioStudio.update((open) => !open);
  }

  addDraftEpisode(): void {
    const title = this.form.controls.episodeTitle.value?.trim() ?? '';
    const audio = this.pickedAudio();

    if (!title) {
      this.episodeError.set('Donnez un titre à cet épisode.');
      this.form.controls.episodeTitle.markAsTouched();
      return;
    }
    if (!audio) {
      this.episodeError.set(
        'Ajoutez un audio : déposez un fichier, enregistrez au micro ou exportez depuis l’atelier.',
      );
      return;
    }

    this.episodeError.set(null);
    this.draftEpisodes.update((list) => [
      ...list,
      { id: crypto.randomUUID(), title, audio },
    ]);
    this.form.controls.episodeTitle.reset('');
    this.clearCurrentAudio();
    this.showAudioStudio.set(false);
  }

  removeDraftEpisode(id: string): void {
    this.draftEpisodes.update((list) => list.filter((ep) => ep.id !== id));
  }

  formatSize(n: number): string {
    if (n >= 1048576) return `${(n / 1048576).toFixed(1)} Mo`;
    if (n >= 1024) return `${Math.round(n / 1024)} Ko`;
    return `${n} o`;
  }

  async submit(): Promise<void> {
    this.episodeError.set(null);

    const pendingTitle = this.form.controls.episodeTitle.value?.trim() ?? '';
    const pendingAudio = this.pickedAudio();
    if (pendingAudio && !pendingTitle) {
      this.episodeError.set(
        'Ajoutez le titre de l’épisode en cours ou retirez l’audio avant de créer le podcast.',
      );
      return;
    }

    const episodes = [...this.draftEpisodes()];
    if (pendingAudio && pendingTitle) {
      episodes.push({
        id: crypto.randomUUID(),
        title: pendingTitle,
        audio: pendingAudio,
      });
    }

    const { title, description, category, language } = this.form.getRawValue();

    const id = await this.store.create({
      title: title!,
      description: description!,
      coverFile: this.coverFile() ?? undefined,
      category: category || undefined,
      language: language || undefined,
    });
    if (!id) return;

    if (!episodes.length) {
      await this.router.navigate(['/podcasts', id]);
      return;
    }

    try {
      for (const ep of episodes) {
        await this.podcastService.addEpisode(id, {
          title: ep.title,
          publishNow: false,
          audio: ep.audio,
        });
      }
      await this.router.navigate(['/podcasts', id]);
    } catch {
      await this.router.navigate(['/podcasts', id]);
    }
  }
}
