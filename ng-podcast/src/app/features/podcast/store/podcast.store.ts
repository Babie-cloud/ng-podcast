// src/app/features/podcast/store/podcast.store.ts
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { PodcastService } from '../services/podcast.service';
import { Podcast, Episode } from '../models/podcast.model';

interface PodcastState {
  podcasts:       Podcast[];
  selected:       Podcast | null;
  currentEpisode: Episode | null;
  isPlaying:      boolean;
  volume:         number;
  uploadProgress: number;
  loading:        boolean;
  error:          string | null;
}

const initialState: PodcastState = {
  podcasts:       [],
  selected:       null,
  currentEpisode: null,
  isPlaying:      false,
  volume:         1,
  uploadProgress: 0,
  loading:        false,
  error:          null,
};

export const PodcastStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),


  withComputed((store) => ({
    podcastCount: computed(() => store.podcasts().length),
    hasError:     computed(() => store.error() !== null),
  })),

  withMethods((store, service = inject(PodcastService)) => ({

    /** Charge tous les podcasts */
    async loadAll(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const podcasts = await service.getAll();
        patchState(store, { podcasts, loading: false });
      } catch (e: any) {
        patchState(store, { error: e.message ?? 'Erreur réseau', loading: false });
      }
    },

    async loadMine(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const podcasts = await service.getMine();
        patchState(store, { podcasts, loading: false });
      } catch (e: any) {
        patchState(store, { error: e.message ?? 'Erreur réseau', loading: false });
      }
    },


    async loadOne(id: string): Promise<void> {
      patchState(store, { loading: true, error: null, selected: null });
      try {
        const podcast = await service.getById(id);
        patchState(store, { selected: podcast, loading: false });
      } catch (e: any) {
        patchState(store, { error: e.message ?? 'Introuvable', loading: false });
      }
    },

 
    async create(payload: { title: string; description: string; coverFile?: File; audioFile?: File }): Promise<void> {
      patchState(store, { loading: true, error: null, uploadProgress: 0 });

      const coverUrl = payload.coverFile ? URL.createObjectURL(payload.coverFile) : undefined;

      service.create({
        title:       payload.title,
        description: payload.description,
        coverFile:   coverUrl,
      }).subscribe({
        next: (progress) => {
          patchState(store, { uploadProgress: progress.percent });
          if (progress.done) {
            patchState(store, { loading: false, uploadProgress: 0 });
          }
        },
        error: (e) => {
          patchState(store, { error: e.message ?? 'Erreur upload', loading: false, uploadProgress: 0 });
        },
      });
    },

    async delete(id: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await service.delete(id);
        patchState(store, {
          podcasts: store.podcasts().filter(p => p.id !== id),
          // Si on supprime le podcast sélectionné, on vide la sélection
          selected: store.selected()?.id === id ? null : store.selected(),
          loading: false,
        });
      } catch (e: any) {
        patchState(store, { error: e.message ?? 'Erreur suppression', loading: false });
      }
    },

    play(episode: Episode): void {
      // Si c'est le même épisode, on reprend simplement
      if (store.currentEpisode()?.id === episode.id) {
        patchState(store, { isPlaying: true });
        return;
      }
      // Sinon on charge le nouvel épisode et on lance
      patchState(store, { currentEpisode: episode, isPlaying: true, error: null });
    },


    pause(): void {
      patchState(store, { isPlaying: false });
    },


    setVolume(volume: number): void {
      patchState(store, { volume });
    },

    
    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);