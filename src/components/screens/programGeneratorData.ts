// Données et constantes du wizard de génération de programme.
// Pas de dépendance React — importable depuis les tests si besoin.

import type { Equipment, ProgramGoal, ProgramLevel, Weekday } from '../../types'
import type { FocusMuscle } from '../../utils/programGenerator'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Step<T> {
  question: string
  subtitle?: string
  options: { value: T; label: string; sub: string }[]
}

export type Lieu = 'gym' | 'home' | 'outdoor' | 'custom'

export interface LieuOption {
  value: Lieu
  emoji: string
  label: string
  sub: string
  preset: Equipment[]
}

export interface EquipmentOption {
  value: Equipment
  emoji: string
  label: string
  sub: string
}

export interface FocusOption {
  value: FocusMuscle
  emoji: string
  label: string
  sub: string
}

export interface ProgramWeeksOption {
  value: number | null
  label: string
  sub: string
}

// ── Étapes ────────────────────────────────────────────────────────────────────

export const STEP_GOAL: Step<ProgramGoal> = {
  question: "Quel est ton objectif ?",
  options: [
    { value: 'hypertrophy', label: '📈 Masse',       sub: 'Prise de volume musculaire'        },
    { value: 'strength',    label: '💪 Force',        sub: 'Soulever plus lourd'               },
    { value: 'fat_loss',    label: '🏃 Forme',        sub: 'Perdre du gras, tonifier'          },
    { value: 'endurance',   label: '🔁 Endurance',    sub: 'Séries longues, peu de repos — cardio non inclus' },
  ],
}

export const STEP_DAYS: Step<2 | 3 | 4 | 5> = {
  question: "Combien de séances par semaine ?",
  subtitle: "Sois réaliste — mieux vaut 3 séances régulières que 5 irrégulières.",
  options: [
    { value: 2, label: '2 séances', sub: '2 jours d\'entraînement' },
    { value: 3, label: '3 séances', sub: 'Idéal pour débuter'      },
    { value: 4, label: '4 séances', sub: 'Bon équilibre charge / récup' },
    { value: 5, label: '5 séances', sub: 'Pour les confirmés'      },
  ],
}

export const WEEKDAY_OPTIONS: { value: Weekday; label: string; full: string }[] = [
  { value: 'monday',    label: 'Lun', full: 'Lundi'    },
  { value: 'tuesday',   label: 'Mar', full: 'Mardi'    },
  { value: 'wednesday', label: 'Mer', full: 'Mercredi' },
  { value: 'thursday',  label: 'Jeu', full: 'Jeudi'    },
  { value: 'friday',    label: 'Ven', full: 'Vendredi' },
  { value: 'saturday',  label: 'Sam', full: 'Samedi'   },
  { value: 'sunday',    label: 'Dim', full: 'Dimanche' },
]

export const STEP_DURATION: Step<20 | 45 | 60 | 90> = {
  question: "Durée d'une séance ?",
  subtitle: "Échauffement non inclus.",
  options: [
    { value: 20, label: '20 min',  sub: 'Séance express'           },
    { value: 45, label: '45 min',  sub: 'Courte et efficace'       },
    { value: 60, label: '1 heure', sub: 'Le format classique'      },
    { value: 90, label: '1h 30',   sub: 'Volume élevé'             },
  ],
}

export const LIEU_OPTIONS: LieuOption[] = [
  {
    value: 'gym',
    emoji: '🏟️',
    label: 'Salle de sport',
    sub: 'Barre, haltères, câbles, machines',
    preset: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'pullup_bar', 'cardio_machine'],
  },
  {
    value: 'home',
    emoji: '🏠',
    label: 'Home gym',
    sub: 'Haltères, kettlebell, élastiques',
    preset: ['dumbbell', 'kettlebell', 'band', 'bodyweight'],
  },
  {
    value: 'outdoor',
    emoji: '🤸',
    label: 'Extérieur / Calisthenics',
    sub: 'Poids du corps + barre de traction',
    preset: ['bodyweight', 'pullup_bar'],
  },
  {
    value: 'custom',
    emoji: '✏️',
    label: 'Setup sur-mesure',
    sub: 'Je choisis moi-même',
    preset: [],
  },
]

/** Musculation — force et hypertrophie */
export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { value: 'barbell',    emoji: '🏋️', label: 'Barre + rack',              sub: 'Squat, développé couché, SDT…'          },
  { value: 'dumbbell',   emoji: '🔩',  label: 'Haltères',                  sub: 'Unilatéral, rowing, press…'             },
  { value: 'cable',      emoji: '🔗',  label: 'Station câbles',            sub: 'Tirage, face pull, cable cross…'        },
  { value: 'machine',    emoji: '⚙️',  label: 'Appareils guidés',          sub: 'Leg press, pec deck, hack squat…'       },
  { value: 'bodyweight', emoji: '🤸',  label: 'Poids du corps (au sol)',   sub: 'Pompes, squats, abdos, fentes…'         },
  { value: 'pullup_bar', emoji: '🏗️',  label: 'Barre de traction / dips', sub: 'Tractions, dips, rowing inversé…'       },
  { value: 'kettlebell', emoji: '🫙',  label: 'Kettlebell',                sub: 'Swing, goblet squat, press…'            },
  { value: 'band',       emoji: '🪢',  label: 'Élastiques',                sub: 'Résistance, activation, mobilité'       },
]

/** Cardio — équipements distinctement cardio */
export const CARDIO_OPTIONS: EquipmentOption[] = [
  { value: 'cardio_machine', emoji: '🚴', label: 'Cardio machine', sub: 'Vélo, tapis de course, rameur, elliptique…' },
]

export const STEP_LEVEL: Step<ProgramLevel> = {
  question: "Quel est ton niveau ?",
  options: [
    { value: 'beginner',     label: '🌱 Débutant',     sub: 'Moins d\'un an de pratique'  },
    { value: 'intermediate', label: '💡 Intermédiaire', sub: 'Entre 1 et 3 ans'           },
    { value: 'advanced',     label: '🔥 Confirmé',     sub: 'Plus de 3 ans d\'expérience' },
  ],
}

export const FOCUS_OPTIONS: FocusOption[] = [
  { value: 'chest',     emoji: '🏋️', label: 'Pectoraux',  sub: 'Poitrine, grand pectoral'          },
  { value: 'back',      emoji: '🔗',  label: 'Dos',         sub: 'Largeur et épaisseur de dos'        },
  { value: 'shoulders', emoji: '🎯',  label: 'Épaules',     sub: 'Deltoïdes antérieurs, médians…'    },
  { value: 'arms',      emoji: '💪',  label: 'Bras',         sub: 'Biceps, triceps, avant-bras'       },
  { value: 'legs',      emoji: '🦵',  label: 'Jambes',       sub: 'Quadris, ischios, fessiers, mollets' },
  { value: 'core',      emoji: '⭕',  label: 'Core',         sub: 'Abdominaux, gainage'               },
]

// 0: Objectif  1: Niveau  2: Fréquence  3: Durée  4: Structure  5: Muscles(si auto)
// 6: Jours  7: Lieu  8: Équipement  9: Programme
// Si splitPreference !== 'auto', l'étape 5 (Muscles) est sautée → 9 étapes effectives
export const STEP_TITLE = [
  'Objectif', 'Niveau', 'Fréquence', 'Durée', 'Structure',
  'Muscles', 'Jours', 'Lieu', 'Équipement', 'Programme',
]

export const TOTAL = 10

export function programWeeksOptions(level: ProgramLevel | null): ProgramWeeksOption[] {
  const defaultWeeks = level === 'beginner' ? 8 : level === 'intermediate' ? 12 : 16
  return [
    { value: null,  label: '📅 Standard',    sub: `${defaultWeeks} sem. selon ton niveau` },
    { value: 8,     label: '8 semaines',      sub: 'Bloc court — idéal pour tester' },
    { value: 10,    label: '10 semaines',     sub: 'Adaptation + Progression + Intensification' },
    { value: 12,    label: '12 semaines',     sub: 'Le classique 3 mois — équilibré' },
    { value: 16,    label: '16 semaines',     sub: 'Programme long — gains durables' },
  ]
}
