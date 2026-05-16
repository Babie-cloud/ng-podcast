export interface Writing {
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
  anonymousAuthor: boolean;
  podcastCategory?: string | null;
  createdAt: Date;
}
