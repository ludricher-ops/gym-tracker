// Dérive la séance active du store global et expose les helpers de mutation.
// Pas de store dédié : la séance vit dans les collections existantes,
// identifiée par son id. Les timers restent locaux au composant.

import { useMemo, useState } from 'react'
import type { Exercise, Session, SessionExercise, SetRecord } from '../types'
import type { PRResult } from '../utils/pr'
import { useStore } from './useStore'
import {
  deleteSession, finalizeSession, validateSet as runValidateSet,
} from '../utils/sessionOps'
import { nextSupersetIndex } from '../utils/superset'
import { uuid } from '../utils/uuid'

export interface ActiveExercise {
  se: SessionExercise
  exercise: Exercise | undefined
  sets: SetRecord[]
}

export interface ValidateOutcome {
  pr: PRResult
  /** Durée de repos à lancer après cette série (secondes). */
  restSec: number
  /** L'exercice courant est-il terminé après cette validation ? */
  exerciseDone: boolean
  /** Tous les exercices de la séance sont terminés. */
  sessionDone: boolean
  /** Bascule automatique vers le prochain exercice du superset (pas de repos). */
  supersetRotated: boolean
}

export interface ActiveSessionApi {
  session: Session | undefined
  exercises: ActiveExercise[]
  exIndex: number
  currentSE: SessionExercise | undefined
  currentExercise: Exercise | undefined
  currentSets: SetRecord[]
  doneCount: number
  totalCount: number
  /** Repos planifié pour l'exercice courant (secondes). */
  restSec: number
  goToExercise: (index: number) => void
  skipExercise: () => void
  /** Valide une série planifiée : crée le Set, détecte les PR, avance. */
  validateSet: (set: SetRecord) => Promise<ValidateOutcome>
  /** Met à jour une série déjà validée (édition). */
  updateSet: (set: SetRecord) => Promise<void>
  /** Ajoute une série à l'exercice courant. */
  addSet: () => Promise<void>
  removeSet: (id: string) => Promise<void>
  toggleSetFlag: (set: SetRecord, flag: 'isWarmup' | 'isFailure') => Promise<void>
  swapExercise: (exerciseId: string) => Promise<void>
  addExercises: (exerciseIds: string[]) => Promise<void>
  reorderExercise: (fromIndex: number, toIndex: number) => Promise<void>
  finish: () => Promise<Session | undefined>
  cancel: () => Promise<void>
}

export function useActiveSession(sessionId: string): ActiveSessionApi {
  const store = useStore()

  // Initialise sur le premier exercice avec au moins une série incomplète.
  // Ne s'exécute qu'au montage : survive à une fermeture/réouverture de la séance.
  const [exIndex, setExIndex] = useState(() => {
    const ses = store.sessionExercises
      .filter((se) => se.sessionId === sessionId)
      .sort((a, b) => {
        const rank = (se: typeof a) => se.isWarmup ? 0 : se.isAb ? 2 : 1
        if (rank(a) !== rank(b)) return rank(a) - rank(b)
        return a.order - b.order
      })
    const idx = ses.findIndex((se) =>
      store.sets.some((s) => s.sessionExerciseId === se.id && s.completedAt == null),
    )
    return idx >= 0 ? idx : 0
  })

  const session = store.sessions.find((s) => s.id === sessionId)

  const sessionExercises = useMemo(
    () =>
      store.sessionExercises
        .filter((se) => se.sessionId === sessionId)
        .sort((a, b) => {
          const rank = (se: typeof a) => se.isWarmup ? 0 : se.isAb ? 2 : 1
          if (rank(a) !== rank(b)) return rank(a) - rank(b)
          return a.order - b.order
        }),
    [store.sessionExercises, sessionId],
  )

  const exercises = useMemo<ActiveExercise[]>(
    () =>
      sessionExercises.map((se) => ({
        se,
        exercise: store.exercises.find((e) => e.id === se.exerciseId),
        sets: store.sets
          .filter((s) => s.sessionExerciseId === se.id)
          .sort((a, b) => a.index - b.index),
      })),
    [sessionExercises, store.exercises, store.sets],
  )

  const current = exercises[exIndex]
  const currentSE = current?.se
  const currentExercise = current?.exercise
  const currentSets = current?.sets ?? []

  const allSets = useMemo(
    () => exercises.flatMap((e) => e.sets),
    [exercises],
  )
  const doneCount = allSets.filter((s) => s.completedAt != null).length
  const totalCount = allSets.length

  const restSecFor = (se: SessionExercise | undefined): number =>
    store.workoutExerciseTemplates.find(
      (w) =>
        w.workoutTemplateId === session?.workoutTemplateId &&
        w.exerciseId === se?.exerciseId,
    )?.restSec ?? store.settings.preferences.defaultRestSec

  const restSec = restSecFor(currentSE)

  const goToExercise = (index: number) => {
    if (index >= 0 && index < exercises.length) setExIndex(index)
  }
  const skipExercise = () => {
    if (exIndex < exercises.length - 1) setExIndex(exIndex + 1)
  }

  const validateSet = async (set: SetRecord): Promise<ValidateOutcome> => {
    const se = store.sessionExercises.find((x) => x.id === set.sessionExerciseId)
    const pr = await runValidateSet(set, se?.exerciseId ?? '', store)
    const seSets = store.sets.filter((s) => s.sessionExerciseId === set.sessionExerciseId)
    const exerciseDone =
      seSets.filter((s) => s.completedAt == null && s.id !== set.id).length === 0
    const sessionDone = exerciseDone && exIndex === sessionExercises.length - 1

    let supersetRotated = false
    if (sessionDone) {
      // La séance est terminée — SessionModal appelle finish()
    } else if (exerciseDone) {
      setExIndex(exIndex + 1)
    } else if (se?.supersetGroup) {
      // Superset : rotation automatique vers le prochain exercice du groupe
      const groupIndices = sessionExercises
        .map((e, i) => (e.supersetGroup === se.supersetGroup ? i : -1))
        .filter((i) => i !== -1)
      const next = nextSupersetIndex(groupIndices, exIndex)
      if (next !== null) {
        setExIndex(next)
        supersetRotated = true
      }
    }

    return { pr, restSec: restSecFor(se), exerciseDone, sessionDone, supersetRotated }
  }

  const updateSet = async (set: SetRecord): Promise<void> => {
    await store.set.save(set)
  }

  const addSet = async (): Promise<void> => {
    if (!currentSE) return
    const last = currentSets[currentSets.length - 1]
    await store.set.save({
      id: uuid(),
      sessionExerciseId: currentSE.id,
      index: currentSets.length,
      weightKg: last?.weightKg ?? 0,
      reps: last?.reps ?? 8,
      isWarmup: false,
      isFailure: false,
      isPersonalRecord: false,
    })
  }

  const removeSet = async (id: string): Promise<void> => {
    await store.set.remove(id)
  }

  const toggleSetFlag = async (
    set: SetRecord,
    flag: 'isWarmup' | 'isFailure',
  ): Promise<void> => {
    await store.set.save({ ...set, [flag]: !set[flag] })
  }

  const swapExercise = async (exerciseId: string): Promise<void> => {
    if (!currentSE) return
    await store.sessionExercise.save({ ...currentSE, exerciseId })
  }

  const addExercises = async (exerciseIds: string[]): Promise<void> => {
    let order = sessionExercises.length
    for (const exerciseId of exerciseIds) {
      const seId = uuid()
      await store.sessionExercise.save({
        id: seId,
        sessionId,
        exerciseId,
        order: order++,
      })
      // Une seule série par défaut — l'utilisateur en ajoute ensuite.
      await store.set.save({
        id: uuid(),
        sessionExerciseId: seId,
        index: 0,
        weightKg: 0,
        reps: 8,
        isWarmup: false,
        isFailure: false,
        isPersonalRecord: false,
      })
    }
  }

  const reorderExercise = async (fromIndex: number, toIndex: number): Promise<void> => {
    if (fromIndex === toIndex) return
    const list = sessionExercises.slice()
    const [moved] = list.splice(fromIndex, 1)
    if (!moved) return
    list.splice(toIndex, 0, moved)
    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      if (item && item.order !== i) await store.sessionExercise.save({ ...item, order: i })
    }
  }

  const finish = async (): Promise<Session | undefined> => {
    if (!session) return undefined
    return finalizeSession(session, store)
  }

  const cancel = async (): Promise<void> => {
    if (session) await deleteSession(session, store)
  }

  return {
    session,
    exercises,
    exIndex,
    currentSE,
    currentExercise,
    currentSets,
    doneCount,
    totalCount,
    restSec,
    goToExercise,
    skipExercise,
    validateSet,
    updateSet,
    addSet,
    removeSet,
    toggleSetFlag,
    swapExercise,
    addExercises,
    reorderExercise,
    finish,
    cancel,
  }
}
