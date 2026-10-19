// src/app/features/podcast/store/podcast.store.ts
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  PodcastService,
  PodcastPatchPayload,
  EpisodePatchPayload,
} from '../services/podcast.service';
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

    /** Catalogue accueil : podcasts publiés + brouillons du créateur connecté. */
    async loadHomeCatalog(includeMine: boolean): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const published = await service.getAll();
        const merged = [...published];
        if (includeMine) {
          try {
            const mine = await service.getMine();
            for (const p of mine) {
              if (!merged.some((row) => row.id === p.id)) {
                merged.unshift(p);
              }
            }
          } catch {
            /* non connecté ou session expirée */
          }
        }
        patchState(store, { podcasts: merged, loading: false });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Erreur réseau';
        patchState(store, { error: message, loading: false });
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

 
    async create(payload: {
      title: string;
      description: string;
      coverFile?: File;
      category?: string;
      language?: string;
    }): Promise<string | null> {
      patchState(store, { loading: true, error: null, uploadProgress: 0 });
      try {
        const podcast = await service.createHttp({
          title: payload.title,
          description: payload.description,
          coverFile: payload.coverFile,
          category: payload.category,
          language: payload.language,
        });
        patchState(store, {
          loading: false,
          uploadProgress: 0,
          podcasts: [podcast, ...store.podcasts()],
          selected: podcast,
        });
        return podcast.id;
      } catch (e: unknown) {
        let message = 'Erreur lors de la création';
        if (e instanceof HttpErrorResponse) {
          const body = e.error as { detail?: string; message?: string } | undefined;
          if (body?.detail) {
            message = body.detail;
          } else if (body?.message) {
            message = body.message;
          } else if (e.message) {
            message = e.message;
          }
        } else if (e instanceof Error) {
          message = e.message;
        }
        patchState(store, { error: message, loading: false, uploadProgress: 0 });
        return null;
      }
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

    async patchPodcastMeta(id: string, payload: PodcastPatchPayload): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        const podcast = await service.patchPodcast(id, payload);
        patchState(store, {
          podcasts: store.podcasts().map((p) => (p.id === id ? podcast : p)),
          selected: store.selected()?.id === id ? podcast : store.selected(),
          loading: false,
        });
        return true;
      } catch (e: unknown) {
        patchState(store, {
          error: e instanceof HttpErrorResponse ? e.message : 'Mise à jour impossible',
          loading: false,
        });
        return false;
      }
    },

    /** Multipart POST `/api/podcasts/:id/episodes`. */
    async addEpisode(
      podcastId: string,
      opts: {
        title: string;
        description?: string;
        publishNow: boolean;
        audio: File;
      },
    ): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        const podcast = await service.addEpisode(podcastId, {
          title: opts.title,
          description: opts.description ?? '',
          publishNow: opts.publishNow,
          audio: opts.audio,
        });
        patchState(store, {
          podcasts: store.podcasts().map((p) => (p.id === podcastId ? podcast : p)),
          selected: store.selected()?.id === podcastId ? podcast : store.selected(),
          loading: false,
        });
        return true;
      } catch (e: unknown) {
        let message = "Impossible d'ajouter l'épisode.";
        if (e instanceof HttpErrorResponse) {
          const body = e.error as { detail?: string; message?: string } | undefined;
          if (body?.detail) {
            message = body.detail;
          } else if (body?.message) {
            message = body.message;
          } else if (e.message) {
            message = e.message;
          }
        } else if (e instanceof Error) {
          message = e.message;
        }
        patchState(store, { error: message, loading: false });
        return false;
      }
    },

    async patchEpisode(podcastId: string, episodeId: string, payload: EpisodePatchPayload): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        const podcast = await service.patchEpisode(podcastId, episodeId, payload);
        patchState(store, {
          podcasts: store.podcasts().map((p) => (p.id === podcastId ? podcast : p)),
          selected: store.selected()?.id === podcastId ? podcast : store.selected(),
          loading: false,
        });
        return true;
      } catch (e: unknown) {
        patchState(store, {
          error: e instanceof HttpErrorResponse ? e.message : 'Mise à jour épisode impossible',
          loading: false,
        });
        return false;
      }
    },

    async deleteEpisode(podcastId: string, episodeId: string): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        await service.deleteEpisode(podcastId, episodeId);
        const podcast = await service.getById(podcastId);
        patchState(store, {
          podcasts: store.podcasts().map((p) => (p.id === podcastId ? podcast : p)),
          selected: store.selected()?.id === podcastId ? podcast : store.selected(),
          loading: false,
        });
        const playing = store.currentEpisode()?.id === episodeId;
        if (playing) {
          patchState(store, { currentEpisode: null, isPlaying: false });
        }
        return true;
      } catch (e: unknown) {
        patchState(store, {
          error: e instanceof HttpErrorResponse ? e.message : 'Suppression épisode impossible',
          loading: false,
        });
        return false;
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

    stopPlayback(): void {
      patchState(store, { currentEpisode: null, isPlaying: false });
    },


    setVolume(volume: number): void {
      patchState(store, { volume });
    },

    
    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);