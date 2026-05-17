// Statistiques hebdomadaires et tonnage. Les séances terminées portent déjà
// `totalVolumeKg` et `durationSec` (calculés à la finalisation).

import type { WeekStart } from '../types'
import { weekRange, addWeeks } from './dates'

export interface WeeklyStats {
  sessions: number
  volumeKg: number
  timeSec: number
}

/** Sous-ensemble de Session nécessaire au calcul des stats. */
export interface StatSession {
  startedAt: number
  endedAt?: number
  totalVolumeKg?: number
  durationSec?: number
}

const ZERO: WeeklyStats = { sessions: 0, volumeKg: 0, timeSec: 0 }

/** Stats de la semaine contenant `ref` (séances terminées uniquement). */
export function statsForWeek(
  sessions: StatSession[],
  ref: Date | number,
  weekStart: WeekStart = 'monday',
): WeeklyStats {
  const { start, end } = weekRange(ref, weekStart)
  const lo = start.getTime()
  const hi = end.getTime()
  const inWeek = sessions.filter(
    (s) => s.endedAt != null && s.startedAt >= lo && s.startedAt < hi,
  )
  return inWeek.reduce<WeeklyStats>(
    (acc, s) => ({
      sessions: acc.sessions + 1,
      volumeKg: acc.volumeKg + (s.totalVolumeKg ?? 0),
      timeSec: acc.timeSec + (s.durationSec ?? 0),
    }),
    { ...ZERO },
  )
}

/** Stats de la semaine précédant `ref`. */
export function statsForPreviousWeek(
  sessions: StatSession[],
  ref: Date | number,
  weekStart: WeekStart = 'monday',
): WeeklyStats {
  return statsForWeek(sessions, addWeeks(ref, -1), weekStart)
}

/** Variations (current − previous) champ par champ. */
export function weekDeltas(current: WeeklyStats, previous: WeeklyStats): WeeklyStats {
  return {
    sessions: current.sessions - previous.sessions,
    volumeKg: current.volumeKg - previous.volumeKg,
    timeSec: current.timeSec - previous.timeSec,
  }
}

/** Tonnage d'un ensemble de séries (échauffement exclu). */
export function tonnage(sets: { weightKg: number; reps: number; isWarmup: boolean }[]): number {
  return sets
    .filter((s) => !s.isWarmup)
    .reduce((sum, s) => sum + s.weightKg * s.reps, 0)
}
