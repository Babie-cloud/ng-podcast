export interface MusixmatchTrack {
  track_id: number;
  track_name: string;
  artist_name: string;
  album_name?: string;
  track_share_url?: string;
  has_lyrics?: number;
}

export interface MusixmatchArtist {
  artist_id: number;
  artist_name: string;
}

export interface MusixmatchLyrics {
  lyrics_id?: number;
  lyrics_body?: string;
  lyrics_language?: string;
  lyrics_copyright?: string;
}

export interface MusixmatchSnippet {
  snippet_body?: string;
  snippet_language?: string;
}

export interface MusixmatchResponseHeader {
  status_code: number;
  execute_time?: number;
}

export interface MusixmatchEnvelope<T> {
  message: {
    header: MusixmatchResponseHeader;
    body: T;
  };
}

export interface MusixmatchTrackListBody {
  track_list?: Array<{ track: MusixmatchTrack }>;
}

export interface MusixmatchLyricsBody {
  lyrics?: MusixmatchLyrics;
}

export interface MusixmatchSnippetBody {
  snippet?: MusixmatchSnippet;
}

export interface MusixmatchArtistListBody {
  artist_list?: Array<{ artist: MusixmatchArtist }>;
}
