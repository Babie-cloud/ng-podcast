import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SSR_API_BASE_URL } from '../../core/tokens/ssr-api-base-url.token';
import { Podcast, Episode } from '../models/podcast.model';
import { CreatePodcastPayload } from './podcast.service.types';

export type { UploadProgress, CreatePodcastPayload } from './podcast.service.types';

interface EpisodeApiDto {
  id: string;
  title: string;
  audioUrl: string | null;
  duration: number;
  podcastId: string;
  createdAt: string;
}

interface PodcastSummaryApiDto {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  authorId: string;
  authorName: string;
  status: string;
  createdAt: string;
}

interface PodcastDetailApiDto extends PodcastSummaryApiDto {
  episodes: EpisodeApiDto[];
}

@Injectable({ providedIn: 'root' })
export class PodcastService {
  private readonly http = inject(HttpClient);
  private readonly apiRoot =
    inject(SSR_API_BASE_URL, { optional: true }) ?? environment.apiUrl;
  private readonly base = `${this.apiRoot}/api/podcasts`;

  async getAll(): Promise<Podcast[]> {
    const rows = await firstValueFrom(this.http.get<PodcastSummaryApiDto[]>(this.base));
    return rows.map((r) => this.mapSummary(r));
  }

  async getMine(): Promise<Podcast[]> {
    const rows = await firstValueFrom(this.http.get<PodcastSummaryApiDto[]>(`${this.base}/mine`));
    return rows.map((r) => this.mapSummary(r));
  }

  async getById(id: string): Promise<Podcast> {
    const row = await firstValueFrom(this.http.get<PodcastDetailApiDto>(`${this.base}/${id}`));
    return this.mapDetail(row);
  }

  /** Création (multipart). Ajoutez les épisodes via {@link addEpisode}. */
  async createHttp(payload: CreatePodcastPayload): Promise<Podcast> {
    const fd = new FormData();
    fd.append('title', payload.title);
    fd.append('description', payload.description);
    fd.append('status', 'DRAFT');
    if (payload.category) {
      fd.append('category', payload.category);
    }
    if (payload.language) {
      fd.append('language', payload.language);
    }
    if (payload.coverFile instanceof File) {
      fd.append('cover', payload.coverFile);
    }

    const created = await firstValueFrom(this.http.post<PodcastDetailApiDto>(this.base, fd));
    return this.mapDetail(created);
  }

  async addEpisode(
    podcastId: string,
    opts: { title: string; description?: string; publishNow: boolean; audio: File }
  ): Promise<Podcast> {
    const fd = new FormData();
    fd.append('title', opts.title);
    fd.append('description', opts.description ?? '');
    fd.append('publishNow', String(opts.publishNow));
    fd.append('audio', opts.audio);

    const updated = await firstValueFrom(
      this.http.post<PodcastDetailApiDto>(`${this.base}/${podcastId}/episodes`, fd)
    );
    return this.mapDetail(updated);
  }

  async update(id: string, payload: Partial<CreatePodcastPayload>): Promise<Podcast> {
    await Promise.resolve(payload);
    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }

  private mapSummary(r: PodcastSummaryApiDto): Podcast {
    return {
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      coverUrl: r.coverUrl ?? '',
      authorId: r.authorId,
      authorName: r.authorName,
      episodes: [],
      createdAt: new Date(r.createdAt),
      status: r.status,
    };
  }

  private mapDetail(row: PodcastDetailApiDto): Podcast {
    const p = this.mapSummary(row);
    const episodes = (row.episodes ?? []).map((e) => this.mapEpisode(e));
    return { ...p, episodes };
  }

  private mapEpisode(e: EpisodeApiDto): Episode {
    return {
      id: e.id,
      title: e.title,
      audioUrl: e.audioUrl ?? '',
      duration: e.duration ?? 0,
      podcastId: e.podcastId,
      createdAt: new Date(e.createdAt),
    };
  }
}
