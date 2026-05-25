/** Segments synchronisés (secondes décimaux). Format JSON tableau : [{"s":0,"e":4.5,"t":"Première ligne"}] */
export type CaptionCue = { s: number; e: number; t: string };

export function parseCaptionCues(raw: string | undefined | null): CaptionCue[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const out: CaptionCue[] = [];
    for (const row of parsed) {
      if (row === null || typeof row !== 'object') continue;
      const o = row as Record<string, unknown>;
      const s = num(o['s'] ?? o['start']);
      const eNum = num(o['e'] ?? o['end']);
      const t = String(o['t'] ?? o['text'] ?? '').trim();
      if (t === '' || s === null || eNum === null || eNum <= s) continue;
      out.push({ s, e: eNum, t });
    }
    return out.sort((a, b) => a.s - b.s);
  } catch {
    return [];
  }
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const x = Number(v.replace(',', '.'));
    if (Number.isFinite(x)) return x;
  }
  return null;
}
