import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastService } from '../../services/podcast.service';
import { AudioRecorder } from '../../components/audio-recorder/audio-recorder';

/**
 * Page dédiée : fichier OU micro exclusifs (nouvel enregistrement remplace le fichier choisi).
 */
@Component({
  selector: 'app-episode-studio',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AudioRecorder],
  templateUrl: './episode-studio.html',
  styleUrl: './episode-studio.scss',
})
export class EpisodeStudio implements OnInit {
  readonly store = inject(PodcastStore);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly podcastService = inject(PodcastService);

  readonly podcastId = signal('');
  readonly audioPick = signal<File | null>(null);
  readonly recordedFile = signal<File | null>(null);
  readonly localError = signal<string | null>(null);
  readonly busy = signal(false);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    publishNow: [false],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.podcastId.set(id);
    if (id) void this.store.loadOne(id);
  }

  onAudioChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.audioPick.set(file);
      this.recordedFile.set(null);
      this.localError.set(null);
    }
  }

  onRecorded(file: File | null): void {
    this.recordedFile.set(file);
    if (file) {
      this.audioPick.set(null);
      this.localError.set(null);
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
    const audio = this.pickedAudio();
    const pid = this.podcastId();

    if (this.form.invalid || !audio || !pid) {
      if (!audio && this.form.valid) {
        this.localError.set(
          'Choisissez un fichier audio ou enregistrez au micro — le dernier média utilisé est conservé.'
        );
      }
      return;
    }

    this.localError.set(null);
    this.busy.set(true);
    try {
      const vals = this.form.getRawValue();
      await this.podcastService.addEpisode(pid, {
        title: vals.title.trim(),
        description: vals.description?.trim(),
        publishNow: vals.publishNow,
        audio,
      });
      await this.store.loadOne(pid);
      void this.router.navigate(['/podcasts', pid]);
    } catch (err: unknown) {
      const e = err as { error?: { detail?: string }; message?: string };
      const message =
        e.error?.detail ?? e.message ?? 'Impossible d\'ajouter l\'épisode.';
      this.localError.set(message);
    } finally {
      this.busy.set(false);
    }
  }
}
