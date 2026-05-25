// src/app/features/podcast/pages/publish/publish.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastService } from '../../services/podcast.service';

@Component({
  selector: 'app-publish',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './publish.html',
})
export class Publish implements OnInit {
  readonly store = inject(PodcastStore);
  readonly router = inject(Router);
  readonly podcastId = signal<string>('');

  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly podcastService = inject(PodcastService);

  audioFile = signal<File | null>(null);
  platforms = signal<string[]>(['spotify', 'apple', 'youtube']);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', Validators.required],
    publishNow: [true],
    scheduledAt: [null as string | null],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.podcastId.set(id);
    if (id) void this.store.loadOne(id);
  }

  onAudioChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.audioFile.set(file);
    }
  }

  togglePlatform(p: string): void {
    const current = this.platforms();
    this.platforms.set(
      current.includes(p) ? current.filter((x: string) => x !== p) : [...current, p]
    );
  }

  pickedAudio(): File | null {
    return this.audioFile();
  }

  async submit(): Promise<void> {
    const audio = this.pickedAudio();
    if (this.form.invalid || !audio) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.podcastId();
    if (!id) return;

    this.errorMsg.set(null);
    this.saving.set(true);
    try {
      const vals = this.form.getRawValue();
      await this.podcastService.addEpisode(id, {
        title: vals.title!,
        description: vals.description ?? '',
        publishNow: vals.publishNow !== false,
        audio,
      });
      await this.store.loadOne(id);
      await this.router.navigate(['/podcasts', id]);
    } catch (err: unknown) {
      let message = "Impossible d'enregistrer l'épisode.";
      const e = err as { error?: { detail?: string; message?: string }; message?: string };
      message = e.error?.detail ?? e.error?.message ?? e.message ?? message;
      this.errorMsg.set(message);
    } finally {
      this.saving.set(false);
    }
  }
}
