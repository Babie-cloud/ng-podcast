/** Types d'écrits alignés sur l'ENUM PostgreSQL `writing_type`. */
export const WRITING_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'POEM', label: 'Poème' },
  { value: 'STORY', label: 'Récit / narration' },
  { value: 'CONFESSION', label: 'Confession' },
  { value: 'TESTIMONY', label: 'Témoignage' },
];

/** Même nomenclature que la création de podcast (segmentation « thème » pour un texte). */
export const PODCAST_CONTENT_THEMES: ReadonlyArray<string> = [
  'Tech',
  'Société',
  'Poésie',
  'Culture',
  'Témoignages',
  'Confessions',
  'Autre',
];

export function writingTypeLabel(value: string): string {
  const row = WRITING_TYPE_OPTIONS.find((t) => t.value === value);
  return row?.label ?? value;
}
