// Libellés français des énumérations du modèle de données.

import type {
  Equipment, ExerciseCategory, GoalType, MuscleGroup, ProgramGoal,
  ProgramLevel, RepsMode, TrackingType, WorkoutType,
} from '../types'

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: 'Pectoraux',
  chest_upper: 'Haut des pecs',
  chest_lower: 'Bas des pecs',
  back: 'Dos',
  back_width: 'Largeur du dos',
  back_thickness: 'Épaisseur du dos',
  shoulders: 'Épaules',
  shoulders_front: 'Deltoïdes antérieurs',
  shoulders_lateral: 'Deltoïdes latéraux',
  shoulders_rear: 'Deltoïdes postérieurs',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Avant-bras',
  quads: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  glutes: 'Fessiers',
  calves: 'Mollets',
  core: 'Abdominaux',
  cardio: 'Cardio',
}

/** Régions musculaires — utilisées par le picker et les filtres. */
export interface MuscleRegion {
  key: string
  label: string
  muscles: MuscleGroup[]
}

export const MUSCLE_REGIONS: MuscleRegion[] = [
  { key: 'chest', label: 'Pectoraux', muscles: ['chest', 'chest_upper', 'chest_lower'] },
  { key: 'back', label: 'Dos', muscles: ['back', 'back_width', 'back_thickness'] },
  {
    key: 'shoulders',
    label: 'Épaules',
    muscles: ['shoulders', 'shoulders_front', 'shoulders_lateral', 'shoulders_rear'],
  },
  { key: 'arms', label: 'Bras', muscles: ['biceps', 'triceps', 'forearms'] },
  { key: 'legs', label: 'Jambes', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { key: 'core', label: 'Core', muscles: ['core', 'cardio'] },
]

const MUSCLE_TO_REGION: Record<MuscleGroup, string> = (() => {
  const map = {} as Record<MuscleGroup, string>
  for (const region of MUSCLE_REGIONS) {
    for (const muscle of region.muscles) map[muscle] = region.label
  }
  return map
})()

/** Région musculaire de haut niveau d'un muscle (pour les agrégats). */
export function regionLabel(muscle: MuscleGroup): string {
  return MUSCLE_TO_REGION[muscle] ?? MUSCLE_LABEL[muscle]
}

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barre',
  dumbbell: 'Haltères',
  cable: 'Poulie',
  machine: 'Machine',
  bodyweight: 'Poids du corps',
  kettlebell: 'Kettlebell',
  band: 'Élastique',
  pullup_bar: 'Barre de traction',
  cardio_machine: 'Cardio machine',
}

export const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  compound: 'Polyarticulaire',
  isolation: 'Isolation',
}

export const TRACKING_LABEL: Record<TrackingType, string> = {
  weight_reps: 'Poids × Reps',
  reps_only: 'Reps seules',
  time: 'Temps',
}

export const GOAL_LABEL: Record<ProgramGoal, string> = {
  hypertrophy: 'Hypertrophie',
  strength: 'Force',
  endurance: 'Endurance',
  fat_loss: 'Perte de gras',
}

export const LEVEL_LABEL: Record<ProgramLevel, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
}

export const WORKOUT_TYPE_LABEL: Record<WorkoutType, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  upper: 'Upper',
  lower: 'Lower',
  fullbody: 'Full body',
  custom: 'Custom',
}

export const REPS_MODE_LABEL: Record<RepsMode, string> = {
  fixed: 'Fixe',
  range: 'Plage',
  amrap: 'AMRAP',
}

export const GOAL_TYPE_LABEL: Record<GoalType, string> = {
  exercise_1rm: '1RM sur un exercice',
  exercise_reps: 'Répétitions sur un exercice',
  sessions_per_week: 'Séances par semaine',
  bodyweight: 'Poids de corps',
  custom: 'Personnalisé',
}
