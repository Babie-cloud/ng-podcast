// features/podcast/models/podcast.model.ts
export interface Podcast {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  authorId: string;
  authorName: string;
  episodes: Episode[];
  createdAt: Date;
  status?: string;
  category?: string;
  language?: string;
}

export interface Episode {
  id: string;
  title: string;
  audioUrl: string;
  duration: number; // en secondes
  podcastId: string;
  createdAt: Date;
  /** DRAFT ou PUBLISHED — les brouillons ne sont visibles que par le créateur (filtrés côté API). */
  status?: string;
}

export interface PlayerState {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
}
