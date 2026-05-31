/**
 * Tests unitaires pour les fonctions async de sessionOps :
 * finalizeSession et startSessionFromTemplate.
 *
 * Le store est entièrement mocké en mémoire — aucune vraie IDB ni base.
 */
import { describe, it, expect, vi } from 'vitest'
import { finalizeSession, startSessionFromTemplate } from '../src/utils/sessionOps'
import type { Session, SessionExercise, SetRecord, WorkoutTemplate, WorkoutExerciseTemplate, Exercise } from '../src/types'
import type { StoreApi } from '../src/hooks/useStore'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'sess1', updatedAt: 0, deleted: false, dirty: false,
    name: 'Test', startedAt: 1_000_000, totalSets: 0, completedSets: 0,
    ...overrides,
  }
}

function makeSE(overrides: Partial<SessionExercise> = {}): SessionExercise {
  return {
    id: 'se1', updatedAt: 0, deleted: false, dirty: false,
    sessionId: 'sess1', exerciseId: 'ex1', order: 0,
    ...overrides,
  }
}

function makeSet(overrides: Partial<SetRecord> = {}): SetRecord {
  return {
    id: 'set1', updatedAt: 0, deleted: false, dirty: false,
    sessionExerciseId: 'se1', index: 0,
    weightKg: 80, reps: 5,
    isWarmup: false, isFailure: false, isPersonalRecord: false,
    ...overrides,
  }
}

function makeWT(): WorkoutTemplate {
  return {
    id: 'wt1', updatedAt: 0, deleted: false, dirty: false,
    programId: 'p1', name: 'Upper', type: 'upper', muscleGroups: [],
  }
}

function makeWET(overrides: Partial<WorkoutExerciseTemplate> = {}): WorkoutExerciseTemplate {
  return {
    id: 'wet1', updatedAt: 0, deleted: false, dirty: false,
    workoutTemplateId: 'wt1', exerciseId: 'ex1', order: 0, ...overrides,
    targetSets: 3, repsMode: 'fixed', targetRepsMin: 8,
    restSec: 90, autoProgress: true, progressStepKg: 2.5,
  }
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex1', updatedAt: 0, deleted: false, dirty: false,
    name: 'Développé couché', primaryMuscle: 'chest', secondaryMuscles: [],
    equipment: 'barbell', category: 'compound', trackingType: 'weight_reps',
    isCustom: false, usageCount: 0, createdAt: 0,
    ...overrides,
  }
}

/** Mock minimal d'un StoreApi — capture les appels save/remove. */
function makeStore(opts: {
  sessionExercises?: SessionExercise[]
  sets?: SetRecord[]
  exercises?: Exercise[]
  workoutExerciseTemplates?: WorkoutExerciseTemplate[]
  programs?: []
  personalRecords?: []
} = {}): StoreApi & { saved: unknown[]; removed: string[] } {
  const saved: unknown[] = []
  const removed: string[] = []

  const makeMutator = <T extends { id: string }>(_list?: T[]) => ({
    save: vi.fn(async (item: T) => { saved.push(item); return item }),
    remove: vi.fn(async (id: string) => { removed.push(id) }),
  })

  return {
    sessionExercises: opts.sessionExercises ?? [],
    sets: opts.sets ?? [],
    exercises: opts.exercises ?? [],
    workoutExerciseTemplates: opts.workoutExerciseTemplates ?? [],
    programs: opts.programs ?? [],
    personalRecords: opts.personalRecords ?? [],
    sessions: [],
    workoutTemplates: [],
    goals: [],
    bodyMeasurements: [],
    settings: {
      id: 'singleton', updatedAt: 0, deleted: false, dirty: false,
      firstName: '', lastName: '', createdAt: 0,
      preferences: {
        weightUnit: 'kg', distanceUnit: 'km', measurementUnit: 'cm',
        defaultRestSec: 90, weightStep: 2.5,
        restSoundEnabled: true, hapticsEnabled: true,
        autoBarbellWeight: false, autoWarmup: false,
        theme: 'dark', accentColor: '#fff', language: 'fr',
        weekStart: 'monday', rpeScale: '6-10', oneRMFormula: 'epley',
        notificationsEnabled: false, skipDayPreview: false,
        skipBriefing: false, prCelebrationEnabled: true,
      },
    },
    session: makeMutator<Session>([]),
    sessionExercise: makeMutator<SessionExercise>([]),
    set: makeMutator<SetRecord>([]),
    exercise: makeMutator<Exercise>([]),
    workoutTemplate: { save: vi.fn(), remove: vi.fn() },
    workoutExerciseTemplate: { save: vi.fn(), remove: vi.fn() },
    program: { save: vi.fn(), remove: vi.fn() },
    personalRecord: { save: vi.fn(), remove: vi.fn() },
    goal: { save: vi.fn(), remove: vi.fn() },
    bodyMeasurement: { save: vi.fn(), remove: vi.fn() },
    reload: vi.fn(),
    saved,
    removed,
  } as unknown as StoreApi & { saved: unknown[]; removed: string[] }
}

// ── finalizeSession ───────────────────────────────────────────────────────────

describe('finalizeSession', () => {
  it('supprime les séries incomplètes et sauvegarde la séance terminée', async () => {
    const se = makeSE()
    const done = makeSet({ id: 'done', completedAt: 1_001_000, weightKg: 80, reps: 5 })
    const todo = makeSet({ id: 'todo', index: 1 }) // completedAt absent
    const session = makeSession({ startedAt: 1_000_000 })
    const store = makeStore({ sessionExercises: [se], sets: [done, todo] })

    const result = await finalizeSession(session, store as unknown as StoreApi)

    // La série incomplète doit être supprimée
    expect(store.removed).toContain('todo')
    // La série complète ne doit pas être supprimée
    expect(store.removed).not.toContain('done')
    // La séance doit être sauvegardée avec endedAt
    expect(result.endedAt).toBeDefined()
    expect(result.totalSets).toBe(1)
    expect(result.completedSets).toBe(1)
  })

  it('calcule le volume (séries de travail, hors échauffement)', async () => {
    const se = makeSE()
    const work = makeSet({ id: 'w1', completedAt: 1_001_000, weightKg: 100, reps: 5, isWarmup: false })
    const warmup = makeSet({ id: 'wu', completedAt: 1_001_000, weightKg: 20, reps: 12, isWarmup: true })
    const session = makeSession()
    const store = makeStore({ sessionExercises: [se], sets: [work, warmup] })

    const result = await finalizeSession(session, store as unknown as StoreApi)

    // Volume = 100 × 5 = 500 kg (échauffement exclu)
    expect(result.totalVolumeKg).toBe(500)
  })

  it('retourne une séance avec durationSec calculée', async () => {
    const se = makeSE()
    const done = makeSet({ completedAt: 1_003_600_000 })
    const session = makeSession({ startedAt: 1_000_000_000 })
    const store = makeStore({ sessionExercises: [se], sets: [done] })

    const result = await finalizeSession(session, store as unknown as StoreApi)

    expect(result.durationSec).toBeGreaterThan(0)
    expect(typeof result.durationSec).toBe('number')
  })

  it('fonctionne avec zéro séries (séance vide)', async () => {
    const session = makeSession()
    const store = makeStore({ sessionExercises: [], sets: [] })

    const result = await finalizeSession(session, store as unknown as StoreApi)

    expect(result.totalSets).toBe(0)
    expect(result.totalVolumeKg).toBe(0)
    expect(store.removed).toHaveLength(0)
  })
})

// ── startSessionFromTemplate ──────────────────────────────────────────────────

describe('startSessionFromTemplate', () => {
  it('crée une session avec le bon workoutTemplateId', async () => {
    const wt = makeWT()
    const wet = makeWET()
    const ex = makeExercise()
    const store = makeStore({
      exercises: [ex],
      workoutExerciseTemplates: [wet],
      sets: [],
      sessionExercises: [],
    })

    const session = await startSessionFromTemplate(wt, store as unknown as StoreApi)

    expect(session.workoutTemplateId).toBe('wt1')
    expect(session.startedAt).toBeGreaterThan(0)
  })

  it('stocke le programSessionLabel quand fourni', async () => {
    const wt = makeWT()
    const wet = makeWET()
    const ex = makeExercise()
    const store = makeStore({
      exercises: [ex],
      workoutExerciseTemplates: [wet],
      sets: [],
      sessionExercises: [],
    })

    const session = await startSessionFromTemplate(wt, store as unknown as StoreApi, 'S1.01')

    expect(session.programSessionLabel).toBe('S1.01')
  })

  it('crée autant de SessionExercise que de WorkoutExerciseTemplate', async () => {
    const wt = makeWT()
    const wet1 = makeWET({ id: 'wet1', exerciseId: 'ex1', order: 0 })
    const wet2 = makeWET({ id: 'wet2', exerciseId: 'ex2', order: 1, workoutTemplateId: 'wt1' })
    const ex1 = makeExercise({ id: 'ex1' })
    const ex2 = makeExercise({ id: 'ex2' })
    const store = makeStore({
      exercises: [ex1, ex2],
      workoutExerciseTemplates: [wet1, wet2],
      sets: [],
      sessionExercises: [],
    })

    await startSessionFromTemplate(wt, store as unknown as StoreApi)

    const seCalls = (store.sessionExercise.save as ReturnType<typeof vi.fn>).mock.calls
    expect(seCalls).toHaveLength(2)
  })

  it('crée au moins une série par exercice', async () => {
    const wt = makeWT()
    const wet = makeWET({ targetSets: 3 })
    const ex = makeExercise()
    const store = makeStore({
      exercises: [ex],
      workoutExerciseTemplates: [wet],
      sets: [],
      sessionExercises: [],
    })

    await startSessionFromTemplate(wt, store as unknown as StoreApi)

    const setCalls = (store.set.save as ReturnType<typeof vi.fn>).mock.calls
    expect(setCalls.length).toBeGreaterThan(0)
  })
})
