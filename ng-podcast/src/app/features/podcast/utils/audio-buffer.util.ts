/** Decode a Blob or URL into an AudioBuffer via Web Audio API. */
export async function decodeAudioSource(
  source: Blob | string,
  context: AudioContext,
): Promise<AudioBuffer> {
  const arrayBuffer =
    typeof source === 'string'
      ? await fetch(source).then((r) => r.arrayBuffer())
      : await source.arrayBuffer();
  return context.decodeAudioData(arrayBuffer.slice(0));
}

/** Extract a sub-range from an AudioBuffer. */
export async function trimAudioBuffer(
  buffer: AudioBuffer,
  startSec: number,
  endSec: number,
): Promise<AudioBuffer> {
  const start = Math.max(0, startSec);
  const end = Math.min(buffer.duration, endSec);
  const duration = Math.max(0, end - start);
  if (duration <= 0) {
    throw new Error('Invalid trim range.');
  }

  const offline = new OfflineAudioContext(
    buffer.numberOfChannels,
    Math.ceil(duration * buffer.sampleRate),
    buffer.sampleRate,
  );
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start(0, start, duration);
  return offline.startRendering();
}

/** Encode an AudioBuffer as a 16-bit PCM WAV Blob. */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  const samples = buffer.length;
  const blockAlign = (numChannels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string): void => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/** Resolve a track source to a Blob (fetching URLs when needed). */
export async function sourceToBlob(source: Blob | string): Promise<Blob> {
  if (source instanceof Blob) return source;
  const response = await fetch(source);
  return response.blob();
}

/** Format seconds as m:ss or h:mm:ss. */
export function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}
