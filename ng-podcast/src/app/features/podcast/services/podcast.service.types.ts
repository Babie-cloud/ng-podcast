// src/app/features/podcast/services/podcast.service.types.ts
// Vérifier que le fichier contient bien "export"

export interface UploadProgress {
  percent: number;
  done:    boolean;
}

export interface CreatePodcastPayload {
  title:       string;
  description: string;
  category?:   string;
  language?:   string;
  coverFile?:  File;
  episode?: {
    title:     string;
    audioFile: File;
  };
}