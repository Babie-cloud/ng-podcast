import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  MusixmatchArtistListBody,
  MusixmatchEnvelope,
  MusixmatchLyricsBody,
  MusixmatchSnippetBody,
  MusixmatchTrack,
  MusixmatchTrackListBody,
} from '../models/musixmatch.types';

@Injectable({ providedIn: 'root' })
export class MusixmatchService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/musixmatch`;

  async getConfig(): Promise<{ configured: boolean }> {
    return firstValueFrom(this.http.get<{ configured: boolean }>(`${this.base}/config`));
  }

  async searchTracks(
    qTrack: string,
    qArtist?: string,
    page = 1,
    pageSize = 10,
  ): Promise<MusixmatchTrack[]> {
    const params: Record<string, string> = {
      q_track: qTrack.trim(),
      page: String(page),
      page_size: String(pageSize),
    };
    if (qArtist?.trim()) {
      params['q_artist'] = qArtist.trim();
    }

    const response = await firstValueFrom(
      this.http.get<MusixmatchEnvelope<MusixmatchTrackListBody>>(`${this.base}/tracks/search`, {
        params,
      }),
    );

    return (response.message.body.track_list ?? []).map((row) => row.track);
  }

  async getLyricsBody(trackId: number): Promise<string> {
    const response = await firstValueFrom(
      this.http.get<MusixmatchEnvelope<MusixmatchLyricsBody>>(
        `${this.base}/tracks/${trackId}/lyrics`,
      ),
    );

    const body = response.message.body.lyrics?.lyrics_body?.trim();
    if (!body) {
      throw new Error('Aucune parole disponible pour ce titre.');
    }
    return body;
  }

  async getSnippetBody(trackId: number): Promise<string> {
    const response = await firstValueFrom(
      this.http.get<MusixmatchEnvelope<MusixmatchSnippetBody>>(
        `${this.base}/tracks/${trackId}/snippet`,
      ),
    );

    const body = response.message.body.snippet?.snippet_body?.trim();
    if (!body) {
      throw new Error('Aucun extrait disponible pour ce titre.');
    }
    return body;
  }

  async searchArtists(qArtist: string, page = 1, pageSize = 10): Promise<MusixmatchArtistListBody> {
    return firstValueFrom(
      this.http.get<MusixmatchEnvelope<MusixmatchArtistListBody>>(`${this.base}/artists/search`, {
        params: {
          q_artist: qArtist.trim(),
          page: String(page),
          page_size: String(pageSize),
        },
      }),
    ).then((r) => r.message.body);
  }

  async getAlbumTracks(albumId: number, page = 1, pageSize = 20): Promise<MusixmatchTrack[]> {
    const response = await firstValueFrom(
      this.http.get<MusixmatchEnvelope<MusixmatchTrackListBody>>(
        `${this.base}/albums/${albumId}/tracks`,
        {
          params: { page: String(page), page_size: String(pageSize) },
        },
      ),
    );
    return (response.message.body.track_list ?? []).map((row) => row.track);
  }

  async getChartTracks(
    chartName = 'top',
    country = 'us',
    page = 1,
    pageSize = 10,
  ): Promise<MusixmatchTrack[]> {
    const response = await firstValueFrom(
      this.http.get<MusixmatchEnvelope<MusixmatchTrackListBody>>(`${this.base}/charts/tracks`, {
        params: {
          chart_name: chartName,
          country,
          page: String(page),
          page_size: String(pageSize),
        },
      }),
    );
    return (response.message.body.track_list ?? []).map((row) => row.track);
  }

  formatError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 503) {
        const detail = this.readProblemDetail(err);
        if (detail) return detail;
        return 'Musixmatch n’est pas configuré côté serveur (MUSIXMATCH_API_KEY).';
      }
      if (err.status === 404) {
        const detail = this.readProblemDetail(err);
        return detail || 'Aucun résultat Musixmatch pour cette recherche.';
      }
      const detail = this.readProblemDetail(err);
      if (detail) return detail;
      return err.message || `Erreur Musixmatch (${err.status}).`;
    }
    return err instanceof Error ? err.message : 'Recherche Musixmatch impossible.';
  }

  private readProblemDetail(err: HttpErrorResponse): string | null {
    if (typeof err.error !== 'object' || !err.error) return null;
    const body = err.error as Record<string, unknown>;
    if (typeof body['detail'] === 'string' && body['detail'].trim()) {
      return body['detail'].trim();
    }
    if (typeof body['message'] === 'string' && body['message'].trim()) {
      return body['message'].trim();
    }
    return null;
  }
}
