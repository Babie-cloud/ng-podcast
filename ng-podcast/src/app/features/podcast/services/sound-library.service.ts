import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  FreesoundSearchResponse,
  FreesoundSound,
  SoundLibraryCategory,
} from '../models/freesound.types';
import { SOUND_LIBRARY_DURATION_LIMITS } from '../models/freesound.types';

@Injectable({ providedIn: 'root' })
export class SoundLibraryService {
  private readonly http = inject(HttpClient);

  private readonly apiBase = environment.freesoundApiBaseUrl.replace(/\/$/, '');
  private readonly apiKey = environment.freesoundApiKey;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly results = signal<FreesoundSound[]>([]);
  readonly totalCount = signal(0);
  readonly lastQuery = signal('');
  readonly category = signal<SoundLibraryCategory>('background');

  clearError(): void {
    this.error.set(null);
  }

  clearResults(): void {
    this.results.set([]);
    this.totalCount.set(0);
  }

  setCategory(category: SoundLibraryCategory): void {
    this.category.set(category);
  }

  hasApiKey(): boolean {
    return !!this.apiKey?.trim();
  }

  /** Search Freesound by keyword with a duration cap for the active category. */
  async search(
    query: string,
    category: SoundLibraryCategory = this.category(),
  ): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed) {
      this.error.set('Enter a search keyword.');
      return;
    }

    if (!this.hasApiKey()) {
      this.error.set(
        'Freesound API key is missing. Add freesoundApiKey in src/environments/environment.development.ts.',
      );
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.lastQuery.set(trimmed);
    this.category.set(category);

    const maxDuration = SOUND_LIBRARY_DURATION_LIMITS[category];
    const filter = `duration:[0 TO ${maxDuration}]`;
    const fields = 'id,name,duration,previews,username,license';

    const url = `${this.apiBase}/search/`;
    const params = {
      query: trimmed,
      filter,
      fields,
      page_size: '20',
      sort: 'score',
    };

    try {
      const response = await firstValueFrom(
        this.http.get<FreesoundSearchResponse>(url, {
          params,
          headers: this.authHeaders(),
        }),
      );
      this.results.set(response.results ?? []);
      this.totalCount.set(response.count ?? 0);
      if (!response.results?.length) {
        this.error.set('No sounds found. Try another keyword or category.');
      }
    } catch (err: unknown) {
      this.results.set([]);
      this.totalCount.set(0);
      this.error.set(this.formatError(err));
    } finally {
      this.loading.set(false);
    }
  }

  /** Best available preview URL for playback and studio import. */
  getPreviewUrl(sound: FreesoundSound): string | null {
    const previews = sound.previews;
    if (!previews) return null;
    return (
      previews['preview-hq-mp3'] ??
      previews['preview-lq-mp3'] ??
      previews['preview-hq-ogg'] ??
      previews['preview-lq-ogg'] ??
      null
    );
  }

  /** Fetch preview audio as a Blob (preview MP3; full download needs OAuth2). */
  async fetchPreviewBlob(sound: FreesoundSound): Promise<Blob> {
    const url = this.getPreviewUrl(sound);
    if (!url) {
      throw new Error('No preview available for this sound.');
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load preview (${response.status}).`);
    }
    return response.blob();
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Token ${this.apiKey}`,
    });
  }

  private formatError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Could not reach Freesound. Check your network or dev proxy configuration.';
      }
      if (err.status === 401) {
        return 'Invalid Freesound API key.';
      }
      const detail =
        typeof err.error === 'object' && err.error && 'detail' in err.error
          ? String((err.error as { detail: string }).detail)
          : err.message;
      return detail || `Freesound API error (${err.status}).`;
    }
    return err instanceof Error ? err.message : 'Freesound search failed.';
  }
}
