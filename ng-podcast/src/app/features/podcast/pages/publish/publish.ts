// src/app/features/podcast/pages/publish/publish.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PodcastStore } from '../../store/podcast.store';

@Component({
  selector: 'app-publish',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './publish.html',
})
export class Publish implements OnInit {
  // readonly = accessible depuis le template (pas private !)
  readonly store     = inject(PodcastStore);
  readonly router    = inject(Router);
  readonly podcastId = signal<string>('');

  private readonly route = inject(ActivatedRoute);
  private readonly fb    = inject(FormBuilder);

  audioFile = signal<File | null>(null);
  platforms = signal<string[]>(['spotify', 'apple', 'youtube']);

  form = this.fb.group({
    title:       ['', [Validators.required, Validators.minLength(3)]],
    description: ['', Validators.required],
    publishNow:  [true],
    scheduledAt: [null as string | null],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.podcastId.set(id);
    if (id) this.store.loadOne(id);
  }

  onAudioChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.audioFile.set(file);
  }

  togglePlatform(p: string): void {
    const current = this.platforms();
    this.platforms.set(
      current.includes(p)
        ? current.filter((x: string) => x !== p)
        : [...current, p]
    );
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.audioFile()) {
      this.form.markAllAsTouched();
      return;
    }
    // TODO : appeler le service d'upload d'épisode → Spring Boot
    // await this.episodeService.publish(this.podcastId(), this.form.value, this.audioFile()!)
    this.router.navigate(['/podcasts', this.podcastId()]);
  }
}