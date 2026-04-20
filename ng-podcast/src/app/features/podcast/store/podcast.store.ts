// features/podcast/store/podcast.store.ts
import { Injectable, computed, signal, effect } from '@angular/core';
import { Podcast, Episode } from '../models/podcast.model';
import { PodcastService, CreatePodcastPayload } from '../services/podcast.service';

export interface PlayerState {
  currentEpisode: Episode | null;
  isPlaying:      boolean;
  currentTime:    number;
  volume:         number;
}

@Injectable({ providedIn: 'root' })
export class PodcastStore {

  constructor(private podcastService: PodcastService) {
    effect(() => {
      const state = this._player();
      if (state.isPlaying) {
        console.debug('[Player]', state.currentEpisode?.title);
      }
    });
  }

  // ─── STATE ───────────────────────────────────────────────────
  private readonly _podcasts       = signal<Podcast[]>([]);
  private readonly _selected       = signal<Podcast | null>(null);
  private readonly _loading        = signal<boolean>(false);
  private readonly _error          = signal<string | null>(null);
  private readonly _uploadProgress = signal<number>(0);
  private readonly _player         = signal<PlayerState>({
    currentEpisode: null,
    isPlaying:      false,
    currentTime:    0,
    volume:         1,
  });

  // ─── COMPUTED ────────────────────────────────────────────────
  readonly podcasts        = this._podcasts.asReadonly();
  readonly selected        = this._selected.asReadonly();
  readonly loading         = this._loading.asReadonly();
  readonly error           = this._error.asReadonly();
  readonly uploadProgress  = this._uploadProgress.asReadonly();
  readonly player          = this._player.asReadonly();

  readonly podcastCount    = computed(() => this._podcasts().length);
  readonly hasError        = computed(() => this._error() !== null);
  readonly isPlaying       = computed(() => this._player().isPlaying);
  readonly currentEpisode  = computed(() => this._player().currentEpisode);

  // ─── ACTIONS PODCAST ─────────────────────────────────────────

  async loadAll(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const podcasts = await this.podcastService.getAll();
      this._podcasts.set(podcasts);
    } catch (e: any) {
      this._error.set(e.message ?? 'Erreur de chargement');
    } finally {
      this._loading.set(false);
    }
  }

  async loadOne(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const podcast = await this.podcastService.getById(id);
      this._selected.set(podcast);
    } catch (e: any) {
      this._error.set(e.message ?? 'Podcast introuvable');
    } finally {
      this._loading.set(false);
    }
  }

  // ← Version unique de create() avec upload progress
  create(data: CreatePodcastPayload): void {
    this._loading.set(true);
    this._error.set(null);
    this._uploadProgress.set(0);

    this.podcastService.create(data).subscribe({
      next: (progress) => {
        this._uploadProgress.set(progress.percent);
        if (progress.done) {
          this._loading.set(false);
        }
      },
      error: (e: any) => {
        this._error.set(e.message ?? 'Erreur lors de la création');
        this._loading.set(false);
        this._uploadProgress.set(0);
      }
    });
  }

  async update(id: string, data: Partial<CreatePodcastPayload>): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const updated = await this.podcastService.update(id, data);
      this._podcasts.update(list =>
        list.map(p => p.id === id ? updated : p)
      );
      if (this._selected()?.id === id) {
        this._selected.set(updated);
      }
    } catch (e: any) {
      this._error.set(e.message ?? 'Erreur lors de la mise à jour');
    } finally {
      this._loading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this._error.set(null);
    try {
      await this.podcastService.delete(id);
      this._podcasts.update(list => list.filter(p => p.id !== id));
    } catch (e: any) {
      this._error.set(e.message ?? 'Erreur lors de la suppression');
    }
  }

  // ─── ACTIONS PLAYER ──────────────────────────────────────────

  // ← utilisé dans home.html via (play)="store.play($event)"
  play(episode: Episode): void {
    this._player.update(s => ({
      ...s,
      currentEpisode: episode,
      isPlaying:      true
    }));
  }

  pause(): void {
    this._player.update(s => ({ ...s, isPlaying: false }));
  }

  setTime(time: number): void {
    this._player.update(s => ({ ...s, currentTime: time }));
  }

  setVolume(volume: number): void {
    this._player.update(s => ({ ...s, volume }));
  }
}