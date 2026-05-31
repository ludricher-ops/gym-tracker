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

  // Pré-indexage pour éviter l'itération O(sessions × sessionExercises × sets).
  // seBySession : sessionId → SessionExercise (premier match pour cet exercice)
  const seBySession = new Map<string, typeof store.sessionExercises[0]>()
  for (const se of store.sessionExercises) {
    if (se.exerciseId === exerciseId && !seBySession.has(se.sessionId)) {
      seBySession.set(se.sessionId, se)
    }
  }
  // setsBySeId : sessionExerciseId → SetRecord[]
  const setsBySeId = new Map<string, SetRecord[]>()
  for (const s of store.sets) {
    if (!setsBySeId.has(s.sessionExerciseId)) setsBySeId.set(s.sessionExerciseId, [])
    setsBySeId.get(s.sessionExerciseId)!.push(s)
  }

  const performances: ExercisePerformance[] = []
  let totalTonnage = 0
  let totalSets = 0

  for (const session of store.sessions) {
    const se = seBySession.get(session.id)
    if (!se) continue
    const allSets = setsBySeId.get(se.id) ?? []
    const sets = allSets
      .filter((s) => s.completedAt != null && !s.isWarmup)
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
  // Pré-indexage des sets complétés par sessionExerciseId pour éviter O(SE × sets).
  const completedSeIds = new Set<string>()
  for (const s of store.sets) {
    if (s.completedAt != null && !s.isWarmup) completedSeIds.add(s.sessionExerciseId)
  }
  const ids = new Set<string>()
  for (const se of store.sessionExercises) {
    if (completedSeIds.has(se.id)) ids.add(se.exerciseId)
  }
  return [...ids]
}
