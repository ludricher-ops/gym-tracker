// Progression des objectifs (cahier 6.8). La valeur courante est calculée en
// direct depuis les données pour les types mesurables ; les types manuels
// (poids de corps, personnalisé) portent leur valeur sur le Goal lui-même.

import type { Goal } from '../types'
import type { StoreApi } from '../hooks/useStore'
import { estimate1RM } from './oneRM'
import { statsForWeek } from './stats'

/** Ratio de progression borné à [0, 1]. */
export function goalProgressRatio(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.max(0, Math.min(1, current / target))
}

/** L'objectif est-il atteint ? */
export function isGoalAchieved(current: number, target: number): boolean {
  return target > 0 && current >= target
}

/** Valeur courante d'un objectif, calculée selon son type. */
export function currentGoalValue(goal: Goal, store: StoreApi): number {
  switch (goal.type) {
    case 'sessions_per_week':
      return statsForWeek(
        store.sessions.filter((s) => s.endedAt != null),
        Date.now(),
        store.settings.preferences.weekStart,
      ).sessions

    case 'exercise_1rm':
    case 'exercise_reps': {
      if (!goal.exerciseId) return 0
      const seIds = new Set(
        store.sessionExercises
          .filter((se) => se.exerciseId === goal.exerciseId)
          .map((se) => se.id),
      )
      const sets = store.sets.filter(
        (s) => seIds.has(s.sessionExerciseId) && s.completedAt != null && !s.isWarmup,
      )
      if (sets.length === 0) return 0
      if (goal.type === 'exercise_reps') {
        return Math.max(...sets.map((s) => s.reps))
      }
      const formula = store.settings.preferences.oneRMFormula
      return Math.max(...sets.map((s) => estimate1RM(s.weightKg, s.reps, formula)))
    }

    case 'bodyweight':
    case 'custom':
    default:
      return goal.manualValue ?? 0
  }
}

/** Les types dont la valeur courante est saisie manuellement. */
export function isManualGoal(type: Goal['type']): boolean {
  return type === 'bodyweight' || type === 'custom'
}
