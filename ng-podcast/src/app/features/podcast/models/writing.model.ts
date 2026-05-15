export interface Writing {
  id: string;
  title: string;
  content: string;
  type: string;
  audioUrl: string | null;
  coverUrl: string | null;
  status: string;
  views: number;
  authorId: string;
  authorName: string;
  createdAt: Date;
}
