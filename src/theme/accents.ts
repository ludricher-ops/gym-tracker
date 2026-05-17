// Palette d'accents configurables (cahier 4.1). `accent` est posé sur
// --accent, `ink` sur --accent-ink (texte lisible par-dessus l'accent).

export interface AccentDef {
  key: string
  label: string
  accent: string
  ink: string
}

export const ACCENTS: AccentDef[] = [
  { key: 'lime', label: 'Lime', accent: 'oklch(0.88 0.20 130)', ink: 'oklch(0.18 0.02 130)' },
  { key: 'orange', label: 'Orange', accent: 'oklch(0.74 0.19 48)', ink: 'oklch(0.18 0.02 48)' },
  { key: 'blue', label: 'Bleu', accent: 'oklch(0.74 0.17 245)', ink: 'oklch(0.18 0.02 245)' },
  { key: 'pink', label: 'Rose', accent: 'oklch(0.74 0.20 8)', ink: 'oklch(0.18 0.02 8)' },
  { key: 'amber', label: 'Ambre', accent: 'oklch(0.78 0.16 75)', ink: 'oklch(0.18 0.02 75)' },
]

export const DEFAULT_ACCENT = ACCENTS[0].accent

/** Retrouve la couleur d'encre associée à un accent (repli : encre sombre). */
export function inkFor(accent: string): string {
  return ACCENTS.find((a) => a.accent === accent)?.ink ?? 'oklch(0.18 0.02 75)'
}
