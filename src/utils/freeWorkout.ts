// Logique pure du wizard Séance libre — sans dépendance IDB ni React.

import type { Exercise } from '../types'

export type EnergyLevel    = 1 | 2 | 3 | 4 | 5
export type SleepQuality   = 'bad' | 'medium' | 'good'
export type WorkoutGoal    = 'force' | 'hypertrophie' | 'pump' | 'recup'
export type AvailableTime  = 20 | 30 | 45 | 60 | 90
export type EquipmentPreset = 'full' | 'dumbbells' | 'barbell' | 'bodyweight'

// Matériel accepté par preset — doit correspondre aux valeurs Equipment de types.ts
const PRESET_GEAR: Record<EquipmentPreset, string[]> = {
  full:       ['barbell', 'dumbbell', 'cable', 'machine', 'pullup_bar', 'bodyweight'],
  barbell:    ['barbell', 'dumbbell', 'bodyweight'],
  dumbbells:  ['dumbbell', 'bodyweight'],
  bodyweight: ['bodyweight'],
}

export const EQUIPMENT_LABELS: Record<EquipmentPreset, { emoji: string; label: string; sub: string }> = {
  full:       { emoji: '🏋️', label: 'Salle complète',  sub: 'Barre, haltères, câbles, machines' },
  barbell:    { emoji: '🔩', label: 'Barre + disques', sub: 'Barre olympique et haltères'        },
  dumbbells:  { emoji: '💪', label: 'Haltères seuls',  sub: 'Haltères et poids de corps'         },
  bodyweight: { emoji: '🤸', label: 'Poids de corps',  sub: 'Aucun matériel nécessaire'          },
}

export interface FreeWorkoutInput {
  energyLevel:   EnergyLevel
  sleepQuality:  SleepQuality
  availableTime: AvailableTime
  goal:          WorkoutGoal
  targetZones:   string[]       // 'full_body' ou clés de MUSCLE_ZONE_KEYS
  equipment:     EquipmentPreset
  /** Bibliothèque d'exercices du store — seuls ces exercices seront proposés. */
  library:       Exercise[]
}

export interface SuggestedExercise {
  name:    string
  emoji:   string
  sets:    number
  reps:    string
  restSec: number
  tip:     string
}

export interface SuggestedWorkout {
  exercises:      SuggestedExercise[]
  estimatedMin:   number
  goalLabel:      string
  intensityLabel: string
  adjustedGoal:   WorkoutGoal
}

// ── Profils par objectif ─────────────────────────────────────────────────────

type GoalProfile = {
  label:    string
  sets:     number
  reps:     string
  restSec:  number
  minPerEx: number   // temps estimé par exercice (minutes)
}

export const GOAL_PROFILES: Record<WorkoutGoal, GoalProfile> = {
  force:        { label: 'Force',        sets: 4, reps: '4-6',   restSec: 180, minPerEx: 14 },
  hypertrophie: { label: 'Hypertrophie', sets: 4, reps: '8-12',  restSec: 90,  minPerEx: 9  },
  pump:         { label: 'Pump',         sets: 3, reps: '15-20', restSec: 45,  minPerEx: 5  },
  recup:        { label: 'Récupération', sets: 2, reps: '12-15', restSec: 60,  minPerEx: 6  },
}

// ── Normalisation des groupes musculaires ────────────────────────────────────
// Ramène les sous-groupes (chest_upper, back_width…) aux zones sélectionnables
// dans le wizard (chest, back, shoulders…).

const MUSCLE_NORMALIZE: Record<string, string> = {
  chest_upper:       'chest',
  chest_lower:       'chest',
  back_width:        'back',
  back_thickness:    'back',
  shoulders_front:   'shoulders',
  shoulders_lateral: 'shoulders',
  shoulders_rear:    'shoulders',
  forearms:          'biceps',
}

function normalizeZone(muscle: string): string {
  return MUSCLE_NORMALIZE[muscle] ?? muscle
}

// ── Emoji par groupe musculaire principal ─────────────────────────────────────

const MUSCLE_EMOJI: Record<string, string> = {
  chest:             '📐',
  chest_upper:       '📐',
  chest_lower:       '📐',
  back:              '🚣',
  back_width:        '🔝',
  back_thickness:    '🚣',
  shoulders:         '🪖',
  shoulders_front:   '🪖',
  shoulders_lateral: '🪁',
  shoulders_rear:    '🐦',
  biceps:            '💪',
  triceps:           '↕️',
  forearms:          '💪',
  quads:             '🦵',
  hamstrings:        '🏗️',
  glutes:            '🍑',
  core:              '📏',
  calves:            '🦶',
  cardio:            '🏃',
}

// ── Conseils génériques par catégorie ────────────────────────────────────────

const TIP_COMPOUND = 'Contrôle la descente, amplitude complète, respiration régulière.'
const TIP_ISOLATION = 'Isolation stricte du muscle, contraction tenue 1 s en haut.'

// ── Génération du programme ──────────────────────────────────────────────────

export function generateFreeWorkout(input: FreeWorkoutInput): SuggestedWorkout {
  // Ajuster l'énergie en fonction du sommeil
  const adjustedEnergy: EnergyLevel = input.sleepQuality === 'bad'
    ? (Math.max(1, input.energyLevel - 1) as EnergyLevel)
    : input.energyLevel

  // Adapter l'objectif selon l'énergie réelle
  const adjustedGoal: WorkoutGoal = (() => {
    if (adjustedEnergy === 1) return 'recup'
    if (adjustedEnergy === 2 && input.goal === 'force') return 'hypertrophie'
    return input.goal
  })()

  const profile = GOAL_PROFILES[adjustedGoal]

  // Nombre d'exercices selon le temps disponible
  const numExercises = Math.max(3, Math.min(10, Math.floor(input.availableTime / profile.minPerEx)))

  // Zones cibles (résoudre full_body)
  const ALL_ZONES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'core', 'calves']
  const isFullBody    = input.targetZones.includes('full_body')
  const targetZones   = new Set(isFullBody ? ALL_ZONES : input.targetZones)

  // Matériel disponible
  const availableGear = new Set(PRESET_GEAR[input.equipment])

  // Filtrer la bibliothèque : bon matériel + couvre au moins une zone cible + pas cardio pur
  const eligible = input.library.filter(ex => {
    if (ex.deleted) return false
    if (!availableGear.has(ex.equipment)) return false
    if (ex.primaryMuscle === 'cardio') return false
    if (ex.isWarmupExercise) return false
    const allMuscles = [ex.primaryMuscle, ...ex.secondaryMuscles]
    return allMuscles.some(m => targetZones.has(normalizeZone(m)))
  })

  // Trier : compounds (priority 1) d'abord, puis isolations
  const compounds  = eligible.filter(e => e.category === 'compound')
  const isolations = eligible.filter(e => e.category === 'isolation')

  // Sélection : couvrir un maximum de zones, compounds en premier
  const selected: Exercise[] = []
  const coveredZones = new Set<string>()

  // 1er passage : compounds qui couvrent une nouvelle zone normalisée
  for (const ex of compounds) {
    if (selected.length >= numExercises) break
    const allMuscles = [ex.primaryMuscle, ...ex.secondaryMuscles]
    const newZones   = allMuscles.map(normalizeZone).filter(z => !coveredZones.has(z))
    if (newZones.length > 0) {
      selected.push(ex)
      allMuscles.forEach(m => coveredZones.add(normalizeZone(m)))
    }
  }

  // 2e passage : compounds restants (volume supplémentaire)
  for (const ex of compounds) {
    if (selected.length >= numExercises) break
    if (!selected.includes(ex)) selected.push(ex)
  }

  // 3e passage : isolations pour compléter
  for (const ex of isolations) {
    if (selected.length >= numExercises) break
    if (!selected.includes(ex)) selected.push(ex)
  }

  // Réduire les séries si énergie très basse
  const setCount = Math.max(2, profile.sets - (adjustedEnergy === 1 ? 1 : 0))

  const exercises: SuggestedExercise[] = selected.slice(0, numExercises).map(ex => ({
    name:    ex.name,
    emoji:   MUSCLE_EMOJI[ex.primaryMuscle] ?? '💪',
    sets:    setCount,
    reps:    profile.reps,
    restSec: profile.restSec,
    tip:     ex.instructions ?? (ex.category === 'compound' ? TIP_COMPOUND : TIP_ISOLATION),
  }))

  // Estimation de la durée totale
  const parts   = profile.reps.split('-')
  const lo      = parseInt(parts[0] ?? '8', 10)
  const hi      = parseInt(parts[1] ?? lo.toString(), 10)
  const avgReps = (lo + hi) / 2
  const estimatedMin = Math.round(
    exercises.reduce((acc, ex) => acc + ex.sets * (avgReps * 3 + ex.restSec) / 60 + 1, 0)
  )

  const intensityLabel =
    adjustedEnergy <= 2 ? 'Allégée' :
    adjustedEnergy === 3 ? 'Modérée' :
    adjustedEnergy === 4 ? 'Standard' : 'Intensive'

  return { exercises, estimatedMin, goalLabel: profile.label, intensityLabel, adjustedGoal }
}
