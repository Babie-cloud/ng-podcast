import type { CaptionCue } from '../pages/episode-play/caption-cues';

const MUSIXMATCH_DISCLAIMER =
  /^(thank you for reading|this lyrics is not for commercial use|\*{3,})/i;

/** Convert plain Musixmatch lyrics into timed caption cues over an episode duration. */
export function lyricsToCaptionCues(lyricsBody: string, durationSec: number): CaptionCue[] {
  const duration = durationSec > 0 ? durationSec : 180;
  const lines = lyricsBody
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^\*+$/.test(line) && !MUSIXMATCH_DISCLAIMER.test(line));

  if (!lines.length) return [];

  const weights = lines.map((line) => Math.max(1, line.length));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let cursor = 0;
  const cues: CaptionCue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const share = (weights[i] / totalWeight) * duration;
    const start = cursor;
    const end = i === lines.length - 1 ? duration : cursor + share;
    cues.push({
      s: roundSec(start),
      e: roundSec(Math.max(start + 0.05, end)),
      t: lines[i],
    });
    cursor = end;
  }

  return cues;
}

function roundSec(value: number): number {
  return Math.round(value * 100) / 100;
}
