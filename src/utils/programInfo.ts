// Agrégats d'un programme persisté (séances, jours, exercices).

import type { Program } from '../types'
import type { StoreApi } from '../hooks/useStore'

export interface ProgramSummary {
  trainingDays: number
  workoutCount: number
  exerciseCount: number
}

export function programSummary(program: Program, store: StoreApi): ProgramSummary {
  const wts = store.workoutTemplates.filter((w) => w.programId === program.id)
  const trainingDays = Object.values(program.weekTemplate).filter(Boolean).length
  const exerciseCount = wts.reduce(
    (sum, w) =>
      sum + store.workoutExerciseTemplates.filter((e) => e.workoutTemplateId === w.id).length,
    0,
  )
  return { trainingDays, workoutCount: wts.length, exerciseCount }
}
