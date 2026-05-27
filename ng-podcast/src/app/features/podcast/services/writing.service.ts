import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SSR_API_BASE_URL } from '../../core/tokens/ssr-api-base-url.token';
import { Writing } from '../models/writing.model';

interface WritingApiDto {
  id: string;
  title: string;
  content: string;
  type: string;
  audioUrl: string | null;
  coverUrl: string | null;
  status: string;
  views: number;
  authorId: string | null;
  authorName: string;
  anonymousAuthor?: boolean | null;
  podcastCategory?: string | null;
  createdAt: string;
}

export interface CreateWritingPayload {
  title: string;
  content: string;
  type?: string;
  status?: string;
  audioUrl?: string | null;
  coverUrl?: string | null;
  anonymousAuthor?: boolean;
  podcastCategory?: string | null;
}

export type UpdateWritingPayload = CreateWritingPayload;

@Injectable({ providedIn: 'root' })
export class WritingService {
  private readonly http = inject(HttpClient);
  private readonly publicHttp = new HttpClient(inject(HttpBackend));
  private readonly apiRoot =
    inject(SSR_API_BASE_URL, { optional: true }) ?? environment.apiUrl;
  private readonly base = `${this.apiRoot}/api/writings`;

  // ✅ Plus besoin de bearerOpts() ni d'injecter AuthService :
  // le JwtAuthInterceptor ajoute automatiquement le header Authorization
  // sur toutes les requêtes HttpClient dès qu'un token est présent.

  async listPublished(q?: string): Promise<Writing[]> {
    let params = new HttpParams();
    if (q != null && q.trim() !== '') {
      params = params.set('q', q.trim());
    }
    const rows = await firstValueFrom(
      this.publicHttp.get<WritingApiDto[]>(this.base, { params })
    );
    return rows.map((r) => this.mapRow(r));
  }

  async listMine(): Promise<Writing[]> {
    const rows = await firstValueFrom(
      this.http.get<WritingApiDto[]>(`${this.base}/mine`)
    );
    return rows.map((r) => this.mapRow(r));
  }

  async getById(id: string): Promise<Writing> {
    const row = await firstValueFrom(
      this.http.get<WritingApiDto>(`${this.base}/${id}`)
    );
    return this.mapRow(row);
  }

  async create(payload: CreateWritingPayload): Promise<Writing> {
    const row = await firstValueFrom(
      this.http.post<WritingApiDto>(this.base, {
        title: payload.title,
        content: payload.content,
        type: payload.type,
        status: payload.status,
        audioUrl: payload.audioUrl ?? null,
        coverUrl: payload.coverUrl ?? null,
        anonymousAuthor: payload.anonymousAuthor === true,
        podcastCategory:
          payload.podcastCategory?.trim() ? payload.podcastCategory.trim() : null,
      })
    );
    return this.mapRow(row);
  }

  async update(id: string, payload: UpdateWritingPayload): Promise<Writing> {
    const row = await firstValueFrom(
      this.http.put<WritingApiDto>(`${this.base}/${id}`, {
        title: payload.title,
        content: payload.content,
        type: payload.type,
        status: payload.status,
        audioUrl: payload.audioUrl ?? null,
        coverUrl: payload.coverUrl ?? null,
        anonymousAuthor: !!payload.anonymousAuthor,
        podcastCategory:
          payload.podcastCategory?.trim() ? payload.podcastCategory.trim() : null,
      })
    );
    return this.mapRow(row);
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }

  private mapRow(r: WritingApiDto): Writing {
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      type: r.type,
      audioUrl: r.audioUrl,
      coverUrl: r.coverUrl,
      status: r.status,
      views: r.views ?? 0,
      authorId: r.authorId,
      authorName: r.authorName,
      anonymousAuthor: !!r.anonymousAuthor,
      podcastCategory: r.podcastCategory ?? null,
      createdAt: new Date(r.createdAt),
    };
  }
}