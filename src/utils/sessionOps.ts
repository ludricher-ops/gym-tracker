// Opérations sur les séances : démarrage (depuis un template ou libre),
// validation d'une série avec détection de PR, reprise après crash.

import type {
  Exercise, Session, SessionExercise, SetRecord, WorkoutExerciseTemplate,
  WorkoutTemplate,
} from '../types'
import type { StoreApi } from '../hooks/useStore'
import { idbGetAll } from '../db/idb'
import { uuid } from './uuid'
import { nextTargetWeight } from './progression'
import { detectPRs, isAnyPR } from './pr'
import type { PRResult } from './pr'
import { daysBetween } from './dates'

const BARBELL_WEIGHT = 20
/** Reprise proposée si la séance ouverte date de moins de 12 h (cahier 7). */
export const RESUME_WINDOW_MS = 12 * 3600 * 1000

/** Dernière série de travail validée pour un exercice (toutes séances). */
export function lastWorkingSet(exerciseId: string, store: StoreApi): SetRecord | null {
  const seIds = new Set(
    store.sessionExercises.filter((se) => se.exerciseId === exerciseId).map((se) => se.id),
  )
  const sets = store.sets
    .filter((s) => seIds.has(s.sessionExerciseId) && s.completedAt != null && !s.isWarmup)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
  return sets[0] ?? null
}

/** Poids et reps pré-remplis pour une série planifiée. */
function prefill(
  template: WorkoutExerciseTemplate,
  exercise: Exercise | undefined,
  store: StoreApi,
): { weightKg: number; reps: number } {
  const last = lastWorkingSet(template.exerciseId, store)

  if (exercise?.trackingType === 'time') {
    return { weightKg: 0, reps: last?.reps ?? template.targetDurationSec ?? 30 }
  }

  if (last) {
    return {
      weightKg: nextTargetWeight(last.weightKg, last.reps, template),
      reps: template.targetRepsMin,
    }
  }
  const levelWeights: Record<string, number> = { beginner: 10, intermediate: 15, advanced: 20 }
  const activeProgram = store.programs.find((p) => p.isActive)
  const levelWeight = levelWeights[activeProgram?.level ?? 'intermediate']
  const useBar = store.settings.preferences.autoBarbellWeight && exercise?.equipment === 'barbell'
  return { weightKg: useBar ? BARBELL_WEIGHT : levelWeight, reps: template.targetRepsMin }
}

/** Semaine en cours du programme actif (1-indexée, bornée par la durée). */
function currentProgramWeek(store: StoreApi): { programId?: string; week?: number } {
  const program = store.programs.find((p) => p.isActive)
  if (!program?.startedAt) return {}
  const week = Math.floor(daysBetween(program.startedAt, Date.now()) / 7) + 1
  return { programId: program.id, week: Math.min(Math.max(1, week), program.durationWeeks) }
}

/**
 * Démarre une séance depuis un template : crée la Session, les
 * SessionExercises et les séries planifiées (pré-remplies). Renvoie la session.
 */
export async function startSessionFromTemplate(
  workoutTemplate: WorkoutTemplate,
  store: StoreApi,
): Promise<Session> {
  const now = Date.now()
  const wets = store.workoutExerciseTemplates
    .filter((e) => e.workoutTemplateId === workoutTemplate.id)
    .sort((a, b) => a.order - b.order)

  const { programId, week } = currentProgramWeek(store)
  const sessionId = uuid()
  let totalSets = 0

  for (const wet of wets) {
    const exercise = store.exercises.find((x) => x.id === wet.exerciseId)
    const seId = uuid()
    await store.sessionExercise.save({
      id: seId,
      sessionId,
      exerciseId: wet.exerciseId,
      order: wet.order,
      supersetGroup: wet.supersetGroup,
    })
    const target = prefill(wet, exercise, store)
    for (let i = 0; i < wet.targetSets; i++) {
      await store.set.save({
        id: uuid(),
        sessionExerciseId: seId,
        index: i,
        weightKg: target.weightKg,
        reps: target.reps,
        isWarmup: false,
        isFailure: false,
        isPersonalRecord: false,
      })
      totalSets++
    }
  }

  return store.session.save({
    id: sessionId,
    workoutTemplateId: workoutTemplate.id,
    programId,
    programWeek: week,
    name: workoutTemplate.name,
    startedAt: now,
    totalSets,
    completedSets: 0,
  })
}

/** Démarre une séance libre, sans exercices (ajoutés en cours de séance). */
export async function startFreestyleSession(store: StoreApi): Promise<Session> {
  return store.session.save({
    id: uuid(),
    name: 'Séance libre',
    startedAt: Date.now(),
    totalSets: 0,
    completedSets: 0,
  })
}

/**
 * Valide une série : marque `completedAt`, détecte les PR, crée les
 * PersonalRecords correspondants et renvoie le résultat PR.
 */
export async function validateSet(
  set: SetRecord,
  exerciseId: string,
  store: StoreApi,
): Promise<PRResult> {
  const now = Date.now()
  const formula = store.settings.preferences.oneRMFormula

  // Historique : séries de travail validées du même exercice, hors celle-ci.
  const seIds = new Set(
    store.sessionExercises.filter((se) => se.exerciseId === exerciseId).map((se) => se.id),
  )
  const history = store.sets
    .filter(
      (s) =>
        seIds.has(s.sessionExerciseId) &&
        s.completedAt != null &&
        !s.isWarmup &&
        s.id !== set.id,
    )
    .map((s) => ({ weightKg: s.weightKg, reps: s.reps }))

  const pr: PRResult = set.isWarmup
    ? {
        estimated1RM: 0,
        previousBest1RM: 0,
        is1RM: false,
        isVolumeSet: false,
        isRepsAtWeight: false,
      }
    : detectPRs({ weightKg: set.weightKg, reps: set.reps }, history, formula)

  await store.set.save({ ...set, completedAt: now, isPersonalRecord: isAnyPR(pr) })

  if (isAnyPR(pr)) {
    const types: ('1rm' | 'volume_set' | 'reps_at_weight')[] = []
    if (pr.is1RM) types.push('1rm')
    if (pr.isVolumeSet) types.push('volume_set')
    if (pr.isRepsAtWeight) types.push('reps_at_weight')
    for (const type of types) {
      await store.personalRecord.save({
        id: uuid(),
        exerciseId,
        type,
        weightKg: set.weightKg,
        reps: set.reps,
        estimated1RM: pr.estimated1RM,
        setId: set.id,
        achievedAt: now,
      })
    }
  }

  return pr
}

/**
 * Termine une séance : supprime les séries planifiées non réalisées, calcule
 * la durée, le volume total et les compteurs, puis marque `endedAt`.
 */
export async function finalizeSession(session: Session, store: StoreApi): Promise<Session> {
  const now = Date.now()
  const seIds = new Set(
    store.sessionExercises.filter((se) => se.sessionId === session.id).map((se) => se.id),
  )
  const sets = store.sets.filter((s) => seIds.has(s.sessionExerciseId))

  for (const s of sets) {
    if (s.completedAt == null) await store.set.remove(s.id)
  }

  const completed = sets.filter((s) => s.completedAt != null)
  const totalVolumeKg = completed
    .filter((s) => !s.isWarmup)
    .reduce((sum, s) => sum + s.weightKg * s.reps, 0)

  return store.session.save({
    ...session,
    endedAt: now,
    durationSec: Math.floor((now - session.startedAt) / 1000),
    totalVolumeKg,
    totalSets: completed.length,
    completedSets: completed.length,
  })
}

/**
 * Supprime une séance et tout ce qui lui est rattaché : exercices de séance,
 * séries, et records personnels établis sur ces séries.
 */
export async function deleteSession(session: Session, store: StoreApi): Promise<void> {
  const seIds = new Set(
    store.sessionExercises.filter((se) => se.sessionId === session.id).map((se) => se.id),
  )
  const sessionSets = store.sets.filter((s) => seIds.has(s.sessionExerciseId))
  const setIds = new Set(sessionSets.map((s) => s.id))

  for (const pr of store.personalRecords) {
    if (setIds.has(pr.setId)) await store.personalRecord.remove(pr.id)
  }
  for (const s of sessionSets) await store.set.remove(s.id)
  for (const seId of seIds) await store.sessionExercise.remove(seId)
  await store.session.remove(session.id)
}

/**
 * Recalcule volume et compteurs d'une séance depuis IndexedDB (source de
 * vérité fraîche) — à appeler après l'édition des séries d'une séance passée.
 */
export async function recomputeSessionTotals(
  session: Session,
  store: StoreApi,
): Promise<void> {
  const [allSE, allSets] = await Promise.all([
    idbGetAll<SessionExercise>('sessionExercises'),
    idbGetAll<SetRecord>('sets'),
  ])
  const seIds = new Set(
    allSE.filter((se) => !se.deleted && se.sessionId === session.id).map((se) => se.id),
  )
  const completed = allSets.filter(
    (s) => !s.deleted && seIds.has(s.sessionExerciseId) && s.completedAt != null,
  )
  const totalVolumeKg = completed
    .filter((s) => !s.isWarmup)
    .reduce((sum, s) => sum + s.weightKg * s.reps, 0)

  await store.session.save({
    ...session,
    totalVolumeKg,
    totalSets: completed.length,
    completedSets: completed.length,
  })
}

/** Une séance ouverte est-elle encore reprenable (< 12 h) ? */
export function isResumable(startedAt: number, now: number = Date.now()): boolean {
  return now - startedAt < RESUME_WINDOW_MS
}

/** Séance ouverte (non terminée) éligible à une reprise, le cas échéant. */
export function recoverableSession(store: StoreApi): Session | null {
  const open = store.sessions
    .filter((s) => s.endedAt == null)
    .sort((a, b) => b.startedAt - a.startedAt)[0]
  if (!open) return null
  return isResumable(open.startedAt) ? open : null
}
