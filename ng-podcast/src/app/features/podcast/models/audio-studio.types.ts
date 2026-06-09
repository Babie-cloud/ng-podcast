export type AudioStudioTrackType = 'voice' | 'music' | 'recording' | 'imported';

export interface AudioStudioTrack {
  id: string;
  name: string;
  type: AudioStudioTrackType;
  source: Blob | string;
  volume: number;
  muted: boolean;
  duration: number;
}

export interface TrimRegion {
  start: number;
  end: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export interface AudioStudioState {
  tracks: AudioStudioTrack[];
  activeTrackId: string | null;
  trimRegion: TrimRegion | null;
  playback: PlaybackState;
  recording: boolean;
  exporting: boolean;
  error: string | null;
}
