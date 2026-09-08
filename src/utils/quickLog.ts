// Logique pure du wizard Quick Log — sans dépendance IDB ni React.

export type ActivityKind = 'cardio' | 'team_sport' | 'strength_free' | 'other'

export interface CardioParams {
  kind: 'cardio'
  sport: 'running' | 'cycling' | 'swimming' | 'rowing' | 'elliptical' | 'other'
  durationMin: number
  distanceKm?: number
  intensityRating: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export interface TeamSportParams {
  kind: 'team_sport'
  sport: string
  durationMin: number
  intensityRating: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export interface StrengthFreeParams {
  kind: 'strength_free'
  durationMin: number
  muscleGroups: string[]
  intensityRating: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export interface OtherParams {
  kind: 'other'
  label: string
  durationMin: number
  intensityRating: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export type ActivityParams =
  | CardioParams
  | TeamSportParams
  | StrengthFreeParams
  | OtherParams

/** Labels d'affichage pour chaque activité cardio. */
export const CARDIO_SPORTS: { value: CardioParams['sport']; label: string; emoji: string }[] = [
  { value: 'running',    label: 'Course à pied', emoji: '🏃' },
  { value: 'cycling',    label: 'Vélo',           emoji: '🚴' },
  { value: 'swimming',   label: 'Natation',       emoji: '🏊' },
  { value: 'rowing',     label: 'Rameur',         emoji: '🚣' },
  { value: 'elliptical', label: 'Elliptique',     emoji: '⚙️' },
  { value: 'other',      label: 'Autre cardio',   emoji: '❤️' },
]

/** Déduit le nom de la séance à afficher dans l'historique. */
export function sessionNameFromParams(params: ActivityParams): string {
  switch (params.kind) {
    case 'cardio': {
      const found = CARDIO_SPORTS.find((s) => s.value === params.sport)
      return found ? found.label : 'Cardio'
    }
    case 'team_sport':
      return params.sport || 'Sport collectif'
    case 'strength_free':
      return 'Musculation libre'
    case 'other':
      return params.label || 'Activité'
  }
}

/** Emoji représentatif de l'activité (utilisé dans l'historique). */
export function emojiFromParams(params: ActivityParams): string {
  switch (params.kind) {
    case 'cardio': {
      const found = CARDIO_SPORTS.find((s) => s.value === params.sport)
      return found?.emoji ?? '🏃'
    }
    case 'team_sport':    return '⚽'
    case 'strength_free': return '🏋️'
    case 'other':         return '🏃'
  }
}
