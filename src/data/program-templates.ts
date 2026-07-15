import type { Program, WorkoutExerciseTemplate, WorkoutTemplate } from '../types'

export const PROGRAM_TEMPLATES: never[] = []

interface TemplateRecords {
  programs: Program[]
  workoutTemplates: WorkoutTemplate[]
  workoutExerciseTemplates: WorkoutExerciseTemplate[]
}

/** Aucun template built-in — conservé pour compatibilité avec seed.ts. */
export function buildTemplateRecords(_now: number): TemplateRecords {
  return { programs: [], workoutTemplates: [], workoutExerciseTemplates: [] }
}
