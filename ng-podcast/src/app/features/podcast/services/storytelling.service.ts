import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SSR_API_BASE_URL } from '../../core/tokens/ssr-api-base-url.token';
import { Storytelling } from '../models/storytelling.model';

interface StorytellingApiDto {
  id: string;
  title: string;
  content: string;
  type: string;
  audioUrl: string | null;
  coverUrl: string | null;
  anonymous: boolean;
  status: string;
  views: number;
  likes: number;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface CreateStorytellingPayload {
  title: string;
  content: string;
  type?: string;
  status?: string;
  anonymous?: boolean;
  audioUrl?: string;
  coverUrl?: string;
}

export type UpdateStorytellingPayload = CreateStorytellingPayload;

@Injectable({ providedIn: 'root' })
export class StorytellingService {
  private readonly http = inject(HttpClient);
  private readonly publicHttp = new HttpClient(inject(HttpBackend));
  private readonly apiRoot =
    inject(SSR_API_BASE_URL, { optional: true }) ?? environment.apiUrl;
  private readonly base = `${this.apiRoot}/api/storytellings`;

  async listPublished(): Promise<Storytelling[]> {
    const rows = await firstValueFrom(
      this.publicHttp.get<StorytellingApiDto[]>(this.base)
    );
    return rows.map((r) => this.mapRow(r));
  }

  async listMine(): Promise<Storytelling[]> {
    const rows = await firstValueFrom(this.http.get<StorytellingApiDto[]>(`${this.base}/mine`));
    return rows.map((r) => this.mapRow(r));
  }

  async getById(id: string): Promise<Storytelling> {
    const row = await firstValueFrom(this.http.get<StorytellingApiDto>(`${this.base}/${id}`));
    return this.mapRow(row);
  }

  async create(payload: CreateStorytellingPayload): Promise<Storytelling> {
    const row = await firstValueFrom(
      this.http.post<StorytellingApiDto>(this.base, {
        title: payload.title,
        content: payload.content ?? '',
        type: payload.type,
        status: payload.status,
        anonymous: payload.anonymous,
        audioUrl: payload.audioUrl,
        coverUrl: payload.coverUrl,
      })
    );
    return this.mapRow(row);
  }

  async update(id: string, payload: UpdateStorytellingPayload): Promise<Storytelling> {
    const row = await firstValueFrom(
      this.http.put<StorytellingApiDto>(`${this.base}/${id}`, {
        title: payload.title,
        content: payload.content ?? '',
        type: payload.type,
        status: payload.status,
        anonymous: payload.anonymous,
        audioUrl: payload.audioUrl,
        coverUrl: payload.coverUrl,
      })
    );
    return this.mapRow(row);
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }

  private mapRow(r: StorytellingApiDto): Storytelling {
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      type: r.type,
      audioUrl: r.audioUrl,
      coverUrl: r.coverUrl,
      anonymous: r.anonymous ?? false,
      status: r.status,
      views: r.views ?? 0,
      likes: r.likes ?? 0,
      authorId: r.authorId,
      authorName: r.authorName,
      createdAt: new Date(r.createdAt),
    };
  }
}
