export type SoundLibraryCategory = 'jingle' | 'background';

export interface FreesoundPreviews {
  'preview-hq-mp3'?: string;
  'preview-lq-mp3'?: string;
  'preview-hq-ogg'?: string;
  'preview-lq-ogg'?: string;
}

export interface FreesoundSound {
  id: number;
  name: string;
  duration: number;
  previews?: FreesoundPreviews;
  username?: string;
  license?: string;
}

export interface FreesoundSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FreesoundSound[];
}

export const SOUND_LIBRARY_DURATION_LIMITS: Record<SoundLibraryCategory, number> = {
  jingle: 30,
  background: 120,
};
