// Construction des données de récap d'une séance terminée — consommées par
// l'écran de célébration et le récap détaillé.

import type { Session, SetRecord, TrackingType } from '../types'
import type { StoreApi } from '../hooks/useStore'
import { regionLabel } from './labels'
import { tonnage } from './stats'

export interface RecapExercise {
  sessionExerciseId: string
  exerciseId: string
  name: string
  supersetGroup?: string
  tonnageKg: number
  sets: SetRecord[]
  trackingType: TrackingType
}

export interface MuscleSlice {
  region: string
  volumeKg: number
  pct: number
}

export interface SessionRecap {
  session: Session
  exercises: RecapExercise[]
  durationSec: number
  totalVolumeKg: number
  completedSets: number
  prCount: number
  muscleSlices: MuscleSlice[]
  avgRPE: number | null
  /** Séance équivalente précédente (même template), pour comparaison. */
  previous: { volumeKg: number; durationSec: number; avgRPE: number | null } | null
}

function averageRPE(sets: SetRecord[]): number | null {
  const rated = sets.filter((s) => !s.isWarmup && s.rpe != null)
  if (rated.length === 0) return null
  return rated.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / rated.length
}

export function buildSessionRecap(sessionId: string, store: StoreApi): SessionRecap | null {
  const session = store.sessions.find((s) => s.id === sessionId)
  if (!session) return null

  const ses = store.sessionExercises
    .filter((se) => se.sessionId === sessionId)
    .sort((a, b) => a.order - b.order)

  const exercises: RecapExercise[] = []
  const allSets: SetRecord[] = []

  for (const se of ses) {
    const sets = store.sets
      .filter((s) => s.sessionExerciseId === se.id && s.completedAt != null)
      .sort((a, b) => a.index - b.index)
    if (sets.length === 0) continue
    allSets.push(...sets)
    const exercise = store.exercises.find((e) => e.id === se.exerciseId)
    exercises.push({
      sessionExerciseId: se.id,
      exerciseId: se.exerciseId,
      name: exercise?.name ?? 'Exercice',
      supersetGroup: se.supersetGroup,
      tonnageKg: tonnage(sets),
      sets,
      trackingType: exercise?.trackingType ?? 'weight_reps',
    })
  }

  // Volume par région musculaire (échauffement exclu).
  const byRegion = new Map<string, number>()
  for (const ex of exercises) {
    const muscle = store.exercises.find((e) => e.id === ex.exerciseId)?.primaryMuscle
    if (!muscle) continue
    const region = regionLabel(muscle)
    byRegion.set(region, (byRegion.get(region) ?? 0) + ex.tonnageKg)
  }
  const totalRegionVolume = [...byRegion.values()].reduce((a, b) => a + b, 0)
  const muscleSlices: MuscleSlice[] = [...byRegion.entries()]
    .map(([region, volumeKg]) => ({
      region,
      volumeKg,
      pct: totalRegionVolume > 0 ? volumeKg / totalRegionVolume : 0,
    }))
    .sort((a, b) => b.volumeKg - a.volumeKg)

  // Séance équivalente précédente (même template).
  let previous: SessionRecap['previous'] = null
  if (session.workoutTemplateId) {
    const prev = store.sessions
      .filter(
        (s) =>
          s.id !== sessionId &&
          s.endedAt != null &&
          s.workoutTemplateId === session.workoutTemplateId &&
          s.startedAt < session.startedAt,
      )
      .sort((a, b) => b.startedAt - a.startedAt)[0]
    if (prev) {
      const prevSeIds = new Set(
        store.sessionExercises.filter((se) => se.sessionId === prev.id).map((se) => se.id),
      )
      const prevSets = store.sets.filter(
        (s) => prevSeIds.has(s.sessionExerciseId) && s.completedAt != null,
      )
      previous = {
        volumeKg: prev.totalVolumeKg ?? 0,
        durationSec: prev.durationSec ?? 0,
        avgRPE: averageRPE(prevSets),
      }
    }
  }

  return {
    session,
    exercises,
    durationSec: session.durationSec ?? 0,
    totalVolumeKg: session.totalVolumeKg ?? 0,
    completedSets: allSets.length,
    prCount: allSets.filter((s) => s.isPersonalRecord).length,
    muscleSlices,
    avgRPE: averageRPE(allSets),
    previous,
  }
}
