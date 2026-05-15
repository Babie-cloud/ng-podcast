import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { StorytellingService, CreateStorytellingPayload, UpdateStorytellingPayload } from '../services/storytelling.service';
import { Storytelling } from '../models/storytelling.model';

interface StorytellingStoreState {
  published: Storytelling[];
  mine: Storytelling[];
  selected: Storytelling | null;
  loading: boolean;
  error: string | null;
}

const initial: StorytellingStoreState = {
  published: [],
  mine: [],
  selected: null,
  loading: false,
  error: null,
};

function httpMessage(e: unknown, fallback: string): string {
  if (e instanceof HttpErrorResponse) {
    const body = e.error as { detail?: string; message?: string } | undefined;
    return body?.detail ?? body?.message ?? e.message ?? fallback;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

export const StorytellingStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withComputed((store) => ({
    mineCount: computed(() => store.mine().length),
    publishedCount: computed(() => store.published().length),
    hasError: computed(() => store.error() !== null),
  })),
  withMethods((store, api = inject(StorytellingService)) => ({
    async loadPublished(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const published = await api.listPublished();
        patchState(store, { published, loading: false });
      } catch (e: unknown) {
        patchState(store, {
          error: httpMessage(e, 'Impossible de charger les témoignages.'),
          loading: false,
        });
      }
    },

    async loadMine(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const mine = await api.listMine();
        patchState(store, { mine, loading: false });
      } catch (e: unknown) {
        patchState(store, {
          error: httpMessage(e, 'Impossible de charger vos histoires.'),
          loading: false,
        });
      }
    },

    async loadOne(id: string): Promise<void> {
      patchState(store, { loading: true, error: null, selected: null });
      try {
        const selected = await api.getById(id);
        patchState(store, { selected, loading: false });
      } catch (e: unknown) {
        patchState(store, {
          error: httpMessage(e, 'Histoire introuvable ou accès refusé.'),
          loading: false,
        });
      }
    },

    async create(payload: CreateStorytellingPayload): Promise<string | null> {
      patchState(store, { loading: true, error: null });
      try {
        const created = await api.create(payload);
        patchState(store, {
          mine: [created, ...store.mine()],
          loading: false,
        });
        return created.id;
      } catch (e: unknown) {
        patchState(store, {
          error: httpMessage(e, 'Erreur lors de la création.'),
          loading: false,
        });
        return null;
      }
    },

    async update(id: string, payload: UpdateStorytellingPayload): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        const updated = await api.update(id, payload);
        patchState(store, {
          mine: store.mine().map((s) => (s.id === id ? updated : s)),
          published: store.published().map((s) => (s.id === id ? updated : s)),
          selected: store.selected()?.id === id ? updated : store.selected(),
          loading: false,
        });
        return true;
      } catch (e: unknown) {
        patchState(store, {
          error: httpMessage(e, 'Mise à jour impossible.'),
          loading: false,
        });
        return false;
      }
    },

    async delete(id: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.delete(id);
        patchState(store, {
          mine: store.mine().filter((s) => s.id !== id),
          published: store.published().filter((s) => s.id !== id),
          selected: store.selected()?.id === id ? null : store.selected(),
          loading: false,
        });
      } catch (e: unknown) {
        patchState(store, {
          error: httpMessage(e, 'Suppression impossible.'),
          loading: false,
        });
      }
    },

    clearSelected(): void {
      patchState(store, { selected: null });
    },

    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);
