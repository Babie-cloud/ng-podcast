export interface Storytelling {
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
  createdAt: Date;
}
