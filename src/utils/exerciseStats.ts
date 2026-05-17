// Agrégats de progression pour un exercice : PR, tonnage et performances
// regroupées par séance (cahier 6.4).

import type { PersonalRecord, SetRecord } from '../types'
import type { StoreApi } from '../hooks/useStore'
import { estimate1RM } from './oneRM'
import { tonnage } from './stats'

export interface ExercisePerformance {
  sessionId: string
  sessionName: string
  date: number
  sets: SetRecord[]
  topSet: SetRecord | null
  best1RM: number
}

export interface ExerciseStats {
  bestPR: PersonalRecord | null
  totalTonnage: number
  totalSets: number
  /** Performances par séance, de la plus récente à la plus ancienne. */
  performances: ExercisePerformance[]
}

export function buildExerciseStats(exerciseId: string, store: StoreApi): ExerciseStats {
  const formula = store.settings.preferences.oneRMFormula

  const bestPR =
    store.personalRecords
      .filter((p) => p.exerciseId === exerciseId && p.type === '1rm')
      .sort((a, b) => b.estimated1RM - a.estimated1RM)[0] ?? null

  const performances: ExercisePerformance[] = []
  let totalTonnage = 0
  let totalSets = 0

  for (const session of store.sessions) {
    const se = store.sessionExercises.find(
      (x) => x.sessionId === session.id && x.exerciseId === exerciseId,
    )
    if (!se) continue
    const sets = store.sets
      .filter((s) => s.sessionExerciseId === se.id && s.completedAt != null && !s.isWarmup)
      .sort((a, b) => a.index - b.index)
    if (sets.length === 0) continue

    totalTonnage += tonnage(sets)
    totalSets += sets.length

    let topSet: SetRecord | null = null
    let best1RM = 0
    for (const s of sets) {
      const e = estimate1RM(s.weightKg, s.reps, formula)
      if (e >= best1RM) {
        best1RM = e
        topSet = s
      }
    }

    performances.push({
      sessionId: session.id,
      sessionName: session.name,
      date: session.startedAt,
      sets,
      topSet,
      best1RM,
    })
  }

  performances.sort((a, b) => b.date - a.date)
  return { bestPR, totalTonnage, totalSets, performances }
}

/** Exercices ayant au moins une performance enregistrée. */
export function exercisesWithHistory(store: StoreApi): string[] {
  const ids = new Set<string>()
  for (const se of store.sessionExercises) {
    const hasCompleted = store.sets.some(
      (s) => s.sessionExerciseId === se.id && s.completedAt != null && !s.isWarmup,
    )
    if (hasCompleted) ids.add(se.exerciseId)
  }
  return [...ids]
}
