import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { WritingService, CreateWritingPayload, UpdateWritingPayload } from '../services/writing.service';
import { Writing } from '../models/writing.model';

interface WritingStoreState {
  published: Writing[];
  mine: Writing[];
  selected: Writing | null;
  loading: boolean;
  error: string | null;
}

const initial: WritingStoreState = {
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

function isPublished(w: Writing): boolean {
  return w.status === 'PUBLISHED';
}

function upsertPublished(list: Writing[], writing: Writing): Writing[] {
  const without = list.filter((w) => w.id !== writing.id);
  return isPublished(writing) ? [writing, ...without] : without;
}

export const WritingStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withComputed((store) => ({
    mineCount: computed(() => store.mine().length),
    publishedCount: computed(() => store.published().length),
    hasError: computed(() => store.error() !== null),
  })),
  withMethods((store, api = inject(WritingService)) => ({
    async loadPublished(q?: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const published = await api.listPublished(q);
        patchState(store, { published, loading: false });
      } catch (e: unknown) {
        patchState(store, {
          error: httpMessage(e, 'Impossible de charger les textes.'),
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
          error: httpMessage(e, 'Impossible de charger vos textes.'),
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
          error: httpMessage(e, 'Texte introuvable ou accès refusé.'),
          loading: false,
        });
      }
    },

    async create(payload: CreateWritingPayload): Promise<string | null> {
      patchState(store, { loading: true, error: null });
      try {
        const created = await api.create(payload);
        patchState(store, {
          mine: [created, ...store.mine()],
          published: upsertPublished(store.published(), created),
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

    async update(id: string, payload: UpdateWritingPayload): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        const updated = await api.update(id, payload);
        patchState(store, {
          mine: store.mine().map((w) => (w.id === id ? updated : w)),
          published: upsertPublished(store.published(), updated),
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
          mine: store.mine().filter((w) => w.id !== id),
          published: store.published().filter((w) => w.id !== id),
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
