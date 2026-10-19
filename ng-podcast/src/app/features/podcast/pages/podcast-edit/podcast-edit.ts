import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PodcastStore } from '../../store/podcast.store';
import { Episode } from '../../models/podcast.model';
import { MusixmatchService } from '../../services/musixmatch.service';
import type { MusixmatchTrack } from '../../models/musixmatch.types';
import { lyricsToCaptionCues } from '../../utils/lyrics-to-cues.util';
import { AudioRecorder } from '../../components/audio-recorder/audio-recorder';
import { AudioStudioEditor } from '../../components/audio-studio-editor/audio-studio-editor';

@Component({
  selector: 'app-podcast-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, AudioRecorder, AudioStudioEditor],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './podcast-edit.html',
  styleUrl: './podcast-edit.scss',
})
export class PodcastEdit implements OnInit {
  readonly store = inject(PodcastStore);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly musixmatch = inject(MusixmatchService);

  readonly podcastId = signal('');
  readonly categories = [
    'Tech',
    'Société',
    'Poésie',
    'Culture',
    'Témoignages',
    'Confessions',
    'Autre',
  ];

  readonly episodeLocalError = signal<string | null>(null);
  readonly captionsBusyId = signal<string | null>(null);
  readonly musixmatchBusyId = signal<string | null>(null);
  readonly musixmatchImportId = signal<number | null>(null);
  readonly musixmatchError = signal<string | null>(null);
  readonly musixmatchResults = signal<MusixmatchTrack[]>([]);
  readonly musixmatchQueryTrack = signal('');
  readonly musixmatchQueryArtist = signal('');
  readonly musixmatchActiveEpisodeId = signal<string | null>(null);
  readonly musixmatchConfigured = signal<boolean | null>(null);

  readonly episodeAddBusy = signal(false);
  readonly showAudioStudio = signal(false);
  readonly audioPick = signal<File | null>(null);
  readonly recordedFile = signal<File | null>(null);
  readonly studioFile = signal<File | null>(null);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: [''],
    language: ['fr'],
    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED'],
  });

  episodeForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    publishNow: [false],
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) return;
    this.podcastId.set(id);
    await this.store.loadOne(id);
    const p = this.store.selected();
    if (!p || p.id !== id) return;
    this.form.patchValue({
      title: p.title,
      description: p.description,
      category: p.category ?? '',
      language: p.language ?? 'fr',
      status: p.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    });
    void this.loadMusixmatchConfig();
  }

  private async loadMusixmatchConfig(): Promise<void> {
    try {
      const cfg = await this.musixmatch.getConfig();
      this.musixmatchConfigured.set(cfg.configured);
    } catch {
      this.musixmatchConfigured.set(false);
    }
  }

  isPublishedEpisode(ep: Episode): boolean {
    return (ep.status ?? '').toUpperCase() === 'PUBLISHED';
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const id = this.podcastId();
    if (!id) return;
    const v = this.form.getRawValue();
    const ok = await this.store.patchPodcastMeta(id, {
      title: v.title,
      description: v.description,
      status: v.status,
      category: v.category || undefined,
      language: v.language || undefined,
    });
    if (ok) {
      await this.store.loadOne(id);
    }
  }

  async toggleEpisodePublish(ep: Episode): Promise<void> {
    const pid = this.podcastId();
    if (!pid) return;
    this.episodeLocalError.set(null);
    const nextPublished = !this.isPublishedEpisode(ep);
    const ok = await this.store.patchEpisode(pid, ep.id, { publishNow: nextPublished });
    if (!ok) {
      const err = this.store.error();
      this.episodeLocalError.set(err ?? 'Publication impossible.');
    }
  }

  async removeEpisode(ep: Episode): Promise<void> {
    const pid = this.podcastId();
    if (!pid) return;
    if (!confirm(`Supprimer définitivement l’épisode « ${ep.title} » ?`)) return;

    this.episodeLocalError.set(null);
    const ok = await this.store.deleteEpisode(pid, ep.id);
    if (!ok) {
      const err = this.store.error();
      this.episodeLocalError.set(err ?? 'Suppression impossible.');
    }
  }

  async saveCaptions(ep: Episode, value: string): Promise<void> {
    const pid = this.podcastId();
    if (!pid) return;
    this.episodeLocalError.set(null);
    this.captionsBusyId.set(ep.id);
    const captions = value.trim().length === 0 ? '' : value.trim();
    const ok = await this.store.patchEpisode(pid, ep.id, { captions });
    this.captionsBusyId.set(null);
    if (!ok) {
      const err = this.store.error();
      this.episodeLocalError.set(err ?? 'Enregistrement des paroles impossible.');
      return;
    }
    await this.store.loadOne(pid);
  }

  onAudioChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.audioPick.set(file);
    this.recordedFile.set(null);
    this.studioFile.set(null);
    this.episodeLocalError.set(null);
  }

  onRecorded(file: File | null): void {
    this.recordedFile.set(file);
    if (file) {
      this.audioPick.set(null);
      this.studioFile.set(null);
      this.episodeLocalError.set(null);
    }
  }

  onStudioExport(file: File | null): void {
    this.studioFile.set(file);
    if (file) {
      this.audioPick.set(null);
      this.recordedFile.set(null);
      this.episodeLocalError.set(null);
    }
  }

  clearPickedAudio(): void {
    this.audioPick.set(null);
    this.recordedFile.set(null);
    this.studioFile.set(null);
  }

  pickedAudioLabel(): string | null {
    const file = this.pickedAudio();
    if (!file) return null;
    return `${file.name} (${(file.size / 1024).toFixed(0)} Ko)`;
  }

  pickedAudio(): File | null {
    return this.studioFile() ?? this.recordedFile() ?? this.audioPick();
  }

  toggleAudioStudio(): void {
    this.showAudioStudio.update((open) => !open);
  }

  async addEpisode(): Promise<void> {
    this.episodeForm.markAllAsTouched();
    const pid = this.podcastId();
    const audio = this.pickedAudio();

    if (!pid || this.episodeForm.invalid || !audio) {
      if (!audio && this.episodeForm.valid) {
        this.episodeLocalError.set(
          'Choisissez un fichier, enregistrez au micro ou exportez depuis l’atelier audio.',
        );
      }
      return;
    }

    this.episodeLocalError.set(null);
    this.episodeAddBusy.set(true);

    try {
      const vals = this.episodeForm.getRawValue();
      const ok = await this.store.addEpisode(pid, {
        title: vals.title.trim(),
        description: vals.description?.trim(),
        publishNow: vals.publishNow,
        audio,
      });
      if (!ok) {
        this.episodeLocalError.set(this.store.error() ?? "Impossible d'ajouter l'épisode.");
        return;
      }

      this.episodeForm.reset({ title: '', description: '', publishNow: false });
      this.clearPickedAudio();
      this.showAudioStudio.set(false);
      await this.store.loadOne(pid);
    } finally {
      this.episodeAddBusy.set(false);
    }
  }

  openMusixmatchSearch(ep: Episode): void {
    this.musixmatchActiveEpisodeId.set(ep.id);
    this.musixmatchError.set(null);
    this.musixmatchResults.set([]);
    this.musixmatchQueryTrack.set(ep.title);
    this.musixmatchQueryArtist.set('');
    if (this.musixmatchConfigured() === false) {
      this.musixmatchError.set(
        'Musixmatch n’est pas configuré côté serveur. Ajoutez MUSIXMATCH_API_KEY dans sdk-podcast/mon-api/.env puis redémarrez l’API.',
      );
    }
  }

  closeMusixmatchSearch(): void {
    this.musixmatchActiveEpisodeId.set(null);
    this.musixmatchResults.set([]);
    this.musixmatchError.set(null);
  }

  isMusixmatchOpen(ep: Episode): boolean {
    return this.musixmatchActiveEpisodeId() === ep.id;
  }

  async searchMusixmatch(ep: Episode): Promise<void> {
    if (this.musixmatchConfigured() === false) {
      this.musixmatchError.set(
        'Musixmatch n’est pas configuré côté serveur. Ajoutez MUSIXMATCH_API_KEY dans sdk-podcast/mon-api/.env puis redémarrez l’API.',
      );
      return;
    }

    const qTrack = this.musixmatchQueryTrack().trim();
    if (!qTrack) {
      this.musixmatchError.set('Indiquez au moins le titre du morceau.');
      return;
    }

    this.musixmatchBusyId.set(ep.id);
    this.musixmatchError.set(null);
    this.musixmatchActiveEpisodeId.set(ep.id);

    try {
      const results = await this.musixmatch.searchTracks(
        qTrack,
        this.musixmatchQueryArtist().trim() || undefined,
      );
      this.musixmatchResults.set(results);
      if (!results.length) {
        this.musixmatchError.set('Aucun titre trouvé. Essayez un autre titre ou artiste.');
      }
    } catch (err: unknown) {
      this.musixmatchResults.set([]);
      this.musixmatchError.set(this.musixmatch.formatError(err));
    } finally {
      this.musixmatchBusyId.set(null);
    }
  }

  async importMusixmatchLyrics(ep: Episode, track: MusixmatchTrack): Promise<void> {
    const capTa = document.getElementById(`caps-${ep.id}`) as HTMLTextAreaElement | null;
    if (!capTa) {
      this.musixmatchError.set('Zone de paroles introuvable.');
      return;
    }

    this.musixmatchImportId.set(track.track_id);
    this.musixmatchError.set(null);

    try {
      const lyricsBody = await this.musixmatch.getLyricsBody(track.track_id);
      const duration = ep.duration > 0 ? ep.duration : 180;
      const cues = lyricsToCaptionCues(lyricsBody, duration);
      if (!cues.length) {
        throw new Error('Les paroles récupérées sont vides ou invalides.');
      }
      capTa.value = JSON.stringify(cues, null, 2);
      this.musixmatchError.set(null);
    } catch (err: unknown) {
      this.musixmatchError.set(this.musixmatch.formatError(err));
    } finally {
      this.musixmatchImportId.set(null);
    }
  }
}
