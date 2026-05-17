// Programmes built-in (templates). Insérés au premier lancement. Les ids
// sont déterministes pour rester cohérents entre appareils.

import type {
  MuscleGroup, Program, ProgramGoal, ProgramLevel, RepsMode, Weekday,
  WorkoutExerciseTemplate, WorkoutTemplate, WorkoutType,
} from '../types'

interface TemplateExercise {
  exerciseId: string
  targetSets: number
  repsMode: RepsMode
  targetRepsMin: number
  targetRepsMax?: number
  restSec: number
  supersetGroup?: string
}

interface TemplateWorkout {
  key: string
  name: string
  type: WorkoutType
  muscleGroups: MuscleGroup[]
  days: Weekday[]
  exercises: TemplateExercise[]
}

interface ProgramTemplateDef {
  key: string
  name: string
  goal: ProgramGoal
  level: ProgramLevel
  durationWeeks: number
  sessionsPerWeek: number
  color: string
  workouts: TemplateWorkout[]
}

const r = (
  exerciseId: string,
  targetSets: number,
  min: number,
  max: number,
  restSec: number,
): TemplateExercise => ({
  exerciseId,
  targetSets,
  repsMode: 'range',
  targetRepsMin: min,
  targetRepsMax: max,
  restSec,
})

export const PROGRAM_TEMPLATES: ProgramTemplateDef[] = [
  {
    key: 'fullbody3',
    name: 'Full Body 3×',
    goal: 'hypertrophy',
    level: 'beginner',
    durationWeeks: 8,
    sessionsPerWeek: 3,
    color: '#c8f000',
    workouts: [
      {
        key: 'fb',
        name: 'Full Body',
        type: 'fullbody',
        muscleGroups: ['quads', 'chest', 'back', 'shoulders', 'biceps', 'core'],
        days: ['monday', 'wednesday', 'friday'],
        exercises: [
          r('seed-squat-barbell', 3, 8, 10, 150),
          r('seed-bench-barbell', 3, 8, 10, 120),
          r('seed-row-barbell', 3, 8, 10, 120),
          r('seed-ohp-barbell', 3, 8, 10, 120),
          r('seed-curl-dumbbell', 3, 10, 12, 75),
          r('seed-leg-curl-lying', 3, 10, 12, 75),
          r('seed-plank', 3, 30, 45, 60),
        ],
      },
    ],
  },
  {
    key: 'ppl3',
    name: 'Push Pull Legs',
    goal: 'hypertrophy',
    level: 'intermediate',
    durationWeeks: 8,
    sessionsPerWeek: 3,
    color: '#5b9dff',
    workouts: [
      {
        key: 'push',
        name: 'Push · Pec & Triceps',
        type: 'push',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        days: ['monday'],
        exercises: [
          r('seed-bench-barbell', 4, 6, 8, 150),
          r('seed-incline-bench-dumbbell', 3, 8, 10, 120),
          r('seed-shoulder-press-dumbbell', 3, 8, 10, 120),
          r('seed-lateral-raise', 3, 12, 15, 60),
          r('seed-triceps-pushdown', 3, 10, 12, 75),
          r('seed-triceps-rope', 3, 12, 15, 60),
        ],
      },
      {
        key: 'pull',
        name: 'Pull · Dos & Biceps',
        type: 'pull',
        muscleGroups: ['back', 'biceps', 'shoulders_rear'],
        days: ['wednesday'],
        exercises: [
          r('seed-pullup', 4, 6, 10, 150),
          r('seed-row-barbell', 4, 6, 8, 150),
          r('seed-lat-pulldown', 3, 10, 12, 90),
          r('seed-face-pull', 3, 12, 15, 60),
          r('seed-curl-barbell', 3, 8, 10, 75),
          r('seed-curl-hammer', 3, 10, 12, 60),
        ],
      },
      {
        key: 'legs',
        name: 'Legs · Jambes',
        type: 'legs',
        muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'],
        days: ['friday'],
        exercises: [
          r('seed-squat-barbell', 4, 6, 8, 180),
          r('seed-romanian-deadlift', 3, 8, 10, 150),
          r('seed-leg-press', 3, 10, 12, 120),
          r('seed-leg-curl-lying', 3, 10, 12, 75),
          r('seed-calf-raise-standing', 4, 12, 15, 60),
          r('seed-plank', 3, 30, 45, 60),
        ],
      },
    ],
  },
]

interface TemplateRecords {
  programs: Program[]
  workoutTemplates: WorkoutTemplate[]
  workoutExerciseTemplates: WorkoutExerciseTemplate[]
}

/** Développe les définitions en enregistrements persistables (ids stables). */
export function buildTemplateRecords(now: number): TemplateRecords {
  const programs: Program[] = []
  const workoutTemplates: WorkoutTemplate[] = []
  const workoutExerciseTemplates: WorkoutExerciseTemplate[] = []

  for (const def of PROGRAM_TEMPLATES) {
    const programId = `tpl-${def.key}`
    const weekTemplate: Program['weekTemplate'] = {}

    for (const w of def.workouts) {
      const wtId = `${programId}-${w.key}`
      workoutTemplates.push({
        id: wtId,
        programId,
        name: w.name,
        type: w.type,
        muscleGroups: w.muscleGroups,
        updatedAt: now,
        deleted: false,
        dirty: true,
      })
      for (const day of w.days) weekTemplate[day] = wtId

      w.exercises.forEach((ex, i) => {
        workoutExerciseTemplates.push({
          id: `${wtId}-e${i}`,
          workoutTemplateId: wtId,
          exerciseId: ex.exerciseId,
          order: i,
          supersetGroup: ex.supersetGroup,
          targetSets: ex.targetSets,
          repsMode: ex.repsMode,
          targetRepsMin: ex.targetRepsMin,
          targetRepsMax: ex.targetRepsMax,
          restSec: ex.restSec,
          autoProgress: true,
          progressStepKg: 2.5,
          updatedAt: now,
          deleted: false,
          dirty: true,
        })
      })
    }

    programs.push({
      id: programId,
      name: def.name,
      goal: def.goal,
      level: def.level,
      durationWeeks: def.durationWeeks,
      sessionsPerWeek: def.sessionsPerWeek,
      color: def.color,
      isTemplate: true,
      isActive: false,
      weekTemplate,
      createdAt: now,
      updatedAt: now,
      deleted: false,
      dirty: true,
    })
  }

  return { programs, workoutTemplates, workoutExerciseTemplates }
}
