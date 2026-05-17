// Brouillon de programme : modèle en mémoire manipulé pendant le workflow de
// création en 4 étapes, persisté seulement à la validation finale.

import type {
  MuscleGroup, Program, ProgramGoal, ProgramLevel, RepsMode, TrackingType, Weekday,
  WorkoutType,
} from '../../types'
import type { StoreApi } from '../../hooks/useStore'
import { uuid } from '../../utils/uuid'

export interface DraftWE {
  localId: string
  exerciseId: string
  supersetGroup?: string
  targetSets: number
  repsMode: RepsMode
  targetRepsMin: number
  targetRepsMax?: number
  targetDurationSec?: number
  targetRPE?: number
  restSec: number
  autoProgress: boolean
  progressStepKg: number
  notes?: string
}

export interface DraftWorkout {
  localId: string
  name: string
  type: WorkoutType
  muscleGroups: MuscleGroup[]
  exercises: DraftWE[]
}

export interface DraftProgram {
  name: string
  goal: ProgramGoal
  level: ProgramLevel
  durationWeeks: number
  sessionsPerWeek: number
  color: string
  workouts: DraftWorkout[]
  /** jour de semaine → localId de la séance assignée. */
  week: Partial<Record<Weekday, string>>
}

/** Palette de couleurs de programme (cahier 6.12, étape 1). */
export const PROGRAM_COLORS = ['#c8f000', '#ff8a3d', '#5b9dff', '#ff5d8f', '#f3c14b']

export const WEEKDAYS: Weekday[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu',
  friday: 'Ven', saturday: 'Sam', sunday: 'Dim',
}

export function defaultWE(exerciseId: string, trackingType?: TrackingType): DraftWE {
  if (trackingType === 'time') {
    return {
      localId: uuid(),
      exerciseId,
      targetSets: 3,
      repsMode: 'fixed',
      targetRepsMin: 1,
      targetDurationSec: 30,
      restSec: 60,
      autoProgress: false,
      progressStepKg: 0,
    }
  }
  return {
    localId: uuid(),
    exerciseId,
    targetSets: 3,
    repsMode: 'range',
    targetRepsMin: 8,
    targetRepsMax: 12,
    restSec: 90,
    autoProgress: true,
    progressStepKg: 2.5,
  }
}

export function emptyDraft(): DraftProgram {
  return {
    name: '',
    goal: 'hypertrophy',
    level: 'intermediate',
    durationWeeks: 12,
    sessionsPerWeek: 3,
    color: PROGRAM_COLORS[0],
    workouts: [],
    week: {},
  }
}

/** Reconstruit un brouillon à partir d'un programme existant (édition). */
export function draftFromProgram(program: Program, store: StoreApi): DraftProgram {
  const wtIdToLocal = new Map<string, string>()
  const workouts: DraftWorkout[] = store.workoutTemplates
    .filter((w) => w.programId === program.id)
    .map((wt) => {
      const localId = uuid()
      wtIdToLocal.set(wt.id, localId)
      const exercises: DraftWE[] = store.workoutExerciseTemplates
        .filter((e) => e.workoutTemplateId === wt.id)
        .sort((a, b) => a.order - b.order)
        .map((e) => ({
          localId: uuid(),
          exerciseId: e.exerciseId,
          supersetGroup: e.supersetGroup,
          targetSets: e.targetSets,
          repsMode: e.repsMode,
          targetRepsMin: e.targetRepsMin,
          targetRepsMax: e.targetRepsMax,
          targetDurationSec: e.targetDurationSec,
          targetRPE: e.targetRPE,
          restSec: e.restSec,
          autoProgress: e.autoProgress,
          progressStepKg: e.progressStepKg,
          notes: e.notes,
        }))
      return {
        localId,
        name: wt.name,
        type: wt.type,
        muscleGroups: wt.muscleGroups,
        exercises,
      }
    })

  const week: DraftProgram['week'] = {}
  for (const [day, wtId] of Object.entries(program.weekTemplate)) {
    const local = wtId ? wtIdToLocal.get(wtId) : undefined
    if (local) week[day as Weekday] = local
  }

  return {
    name: program.name,
    goal: program.goal,
    level: program.level,
    durationWeeks: program.durationWeeks,
    sessionsPerWeek: program.sessionsPerWeek,
    color: program.color,
    workouts,
    week,
  }
}

/**
 * Met à jour un programme existant en place : supprime les anciennes séances
 * et exercices, recrée les nouveaux, met à jour l'enregistrement programme.
 */
export async function updateDraft(
  programId: string,
  draft: DraftProgram,
  store: StoreApi,
): Promise<Program> {
  const existing = store.programs.find((p) => p.id === programId)
  if (!existing) throw new Error(`Programme ${programId} introuvable`)

  const oldWTs = store.workoutTemplates.filter((w) => w.programId === programId)
  for (const wt of oldWTs) {
    const wets = store.workoutExerciseTemplates.filter((e) => e.workoutTemplateId === wt.id)
    for (const wet of wets) await store.workoutExerciseTemplate.remove(wet.id)
    await store.workoutTemplate.remove(wt.id)
  }

  const localToReal = new Map<string, string>()
  const assignedIds = new Set(Object.values(draft.week).filter(Boolean) as string[])
  const workoutsToSave = draft.workouts.filter((w) => assignedIds.has(w.localId))

  for (const w of workoutsToSave) {
    const wtId = uuid()
    localToReal.set(w.localId, wtId)
    await store.workoutTemplate.save({
      id: wtId,
      programId,
      name: w.name,
      type: w.type,
      muscleGroups: w.muscleGroups,
    })
    for (let i = 0; i < w.exercises.length; i++) {
      const ex = w.exercises[i]
      await store.workoutExerciseTemplate.save({
        id: uuid(),
        workoutTemplateId: wtId,
        exerciseId: ex.exerciseId,
        order: i,
        supersetGroup: ex.supersetGroup,
        targetSets: ex.targetSets,
        repsMode: ex.repsMode,
        targetRepsMin: ex.targetRepsMin,
        targetRepsMax: ex.targetRepsMax,
        targetDurationSec: ex.targetDurationSec,
        targetRPE: ex.targetRPE,
        restSec: ex.restSec,
        autoProgress: ex.autoProgress,
        progressStepKg: ex.progressStepKg,
        notes: ex.notes,
      })
    }
  }

  const weekTemplate: Program['weekTemplate'] = {}
  for (const [day, localId] of Object.entries(draft.week)) {
    const real = localId ? localToReal.get(localId) : undefined
    if (real) weekTemplate[day as Weekday] = real
  }

  return store.program.save({
    ...existing,
    name: draft.name.trim(),
    goal: draft.goal,
    level: draft.level,
    durationWeeks: draft.durationWeeks,
    sessionsPerWeek: draft.sessionsPerWeek,
    color: draft.color,
    weekTemplate,
  })
}

export interface DraftStats {
  trainingDays: number
  restDays: number
  totalExercises: number
}

export function draftStats(draft: DraftProgram): DraftStats {
  const trainingDays = Object.keys(draft.week).length
  const totalExercises = draft.workouts.reduce((sum, w) => sum + w.exercises.length, 0)
  return { trainingDays, restDays: 7 - trainingDays, totalExercises }
}

/** Persiste le brouillon : crée le programme, ses séances et ses exercices. */
export async function commitDraft(draft: DraftProgram, store: StoreApi): Promise<Program> {
  const now = Date.now()
  const programId = uuid()
  const localToReal = new Map<string, string>()

  const assignedLocalIds = new Set(Object.values(draft.week).filter(Boolean) as string[])
  const workoutsToSave = draft.workouts.filter((w) => assignedLocalIds.has(w.localId))

  for (const w of workoutsToSave) {
    const wtId = uuid()
    localToReal.set(w.localId, wtId)
    await store.workoutTemplate.save({
      id: wtId,
      programId,
      name: w.name,
      type: w.type,
      muscleGroups: w.muscleGroups,
    })
    for (let i = 0; i < w.exercises.length; i++) {
      const ex = w.exercises[i]
      await store.workoutExerciseTemplate.save({
        id: uuid(),
        workoutTemplateId: wtId,
        exerciseId: ex.exerciseId,
        order: i,
        supersetGroup: ex.supersetGroup,
        targetSets: ex.targetSets,
        repsMode: ex.repsMode,
        targetRepsMin: ex.targetRepsMin,
        targetRepsMax: ex.targetRepsMax,
        targetDurationSec: ex.targetDurationSec,
        targetRPE: ex.targetRPE,
        restSec: ex.restSec,
        autoProgress: ex.autoProgress,
        progressStepKg: ex.progressStepKg,
        notes: ex.notes,
      })
    }
  }

  const weekTemplate: Program['weekTemplate'] = {}
  for (const [day, localId] of Object.entries(draft.week)) {
    const real = localId ? localToReal.get(localId) : undefined
    if (real) weekTemplate[day as Weekday] = real
  }

  return store.program.save({
    id: programId,
    name: draft.name.trim(),
    goal: draft.goal,
    level: draft.level,
    durationWeeks: draft.durationWeeks,
    sessionsPerWeek: draft.sessionsPerWeek,
    color: draft.color,
    isTemplate: false,
    isActive: false,
    weekTemplate,
    createdAt: now,
  })
}
