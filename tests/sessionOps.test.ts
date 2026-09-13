import { describe, it, expect, vi } from 'vitest'
import {
  isResumable, lastWorkingSet, recoverableSession,
  programWeekNumber, activePhase, validateSet, deleteSession,
} from '../src/utils/sessionOps'
import type { SetRecord, SessionExercise, Session, PersonalRecord } from '../src/types'
import type { StoreApi } from '../src/hooks/useStore'

const HOUR = 3600 * 1000
const DAY = 24 * HOUR
const WEEK = 7 * DAY

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSet(overrides: Partial<SetRecord>): SetRecord {
  return {
    id: 'set1', updatedAt: 0, deleted: false, dirty: false,
    sessionExerciseId: 'se1', index: 0,
    weightKg: 80, reps: 5,
    isWarmup: false, isFailure: false, isPersonalRecord: false,
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

function makeSetStore(
  sessionExercises: SessionExercise[],
  sets: SetRecord[],
) {
  return { sessionExercises, sets } as Parameters<typeof lastWorkingSet>[1]
}

function makeStore(sessions: { id: string; startedAt: number; endedAt?: number }[]) {
  return { sessions } as Parameters<typeof recoverableSession>[0]
}

describe('isResumable', () => {
  it('reprenable juste apres le demarrage', () => {
    const now = Date.now()
    expect(isResumable(now, now)).toBe(true)
  })
  it('reprenable a 11h d ecart', () => {
    const now = Date.now()
    expect(isResumable(now - 11 * HOUR, now)).toBe(true)
  })
  it('non reprenable au-dela de 12h', () => {
    const now = Date.now()
    expect(isResumable(now - 13 * HOUR, now)).toBe(false)
  })
  it('exactement a la limite 12h : non reprenable', () => {
    const now = Date.now()
    expect(isResumable(now - 12 * HOUR, now)).toBe(false)
  })
})

describe('recoverableSession', () => {
  it('retourne null si aucune seance', () => {
    expect(recoverableSession(makeStore([]))).toBeNull()
  })
  it('retourne null si toutes les seances sont terminees', () => {
    const now = Date.now()
    const store = makeStore([{ id: 'a', startedAt: now - HOUR, endedAt: now }])
    expect(recoverableSession(store)).toBeNull()
  })
  it('retourne la seance ouverte recente', () => {
    const now = Date.now()
    const store = makeStore([{ id: 'a', startedAt: now - HOUR }])
    expect(recoverableSession(store)?.id).toBe('a')
  })
  it('retourne null pour une seance ouverte trop ancienne', () => {
    const now = Date.now()
    const store = makeStore([{ id: 'a', startedAt: now - 13 * HOUR }])
    expect(recoverableSession(store)).toBeNull()
  })
  it('retourne la seance la plus recente si plusieurs ouvertes', () => {
    const now = Date.now()
    const store = makeStore([
      { id: 'old', startedAt: now - 3 * HOUR },
      { id: 'new', startedAt: now - HOUR },
    ])
    expect(recoverableSession(store)?.id).toBe('new')
  })
  it('ignore les seances terminees parmi les ouvertes', () => {
    const now = Date.now()
    const store = makeStore([
      { id: 'done', startedAt: now - HOUR, endedAt: now },
      { id: 'open', startedAt: now - 2 * HOUR },
    ])
    expect(recoverableSession(store)?.id).toBe('open')
  })
  it('retourne null quand la seance ouverte recente est trop ancienne mais pas les terminees', () => {
    const now = Date.now()
    const store = makeStore([
      { id: 'done', startedAt: now - HOUR, endedAt: now },
      { id: 'old-open', startedAt: now - 13 * HOUR },
    ])
    expect(recoverableSession(store)).toBeNull()
  })
})

// ── lastWorkingSet ────────────────────────────────────────────────────────────

describe('lastWorkingSet', () => {
  it('retourne null quand aucun set', () => {
    const store = makeSetStore([], [])
    expect(lastWorkingSet('ex1', store)).toBeNull()
  })

  it('retourne null quand aucun sessionExercise pour cet exercice', () => {
    const se = makeSE({ exerciseId: 'autre-ex' })
    const set = makeSet({ completedAt: Date.now() })
    const store = makeSetStore([se], [set])
    expect(lastWorkingSet('ex1', store)).toBeNull()
  })

  it('ignore les series non completees', () => {
    const se = makeSE()
    const set = makeSet({ completedAt: undefined }) // incomplète
    const store = makeSetStore([se], [set])
    expect(lastWorkingSet('ex1', store)).toBeNull()
  })

  it('ignore les series d echauffement', () => {
    const se = makeSE()
    const set = makeSet({ completedAt: Date.now(), isWarmup: true })
    const store = makeSetStore([se], [set])
    expect(lastWorkingSet('ex1', store)).toBeNull()
  })

  it('retourne la serie de travail completee la plus recente', () => {
    const se = makeSE()
    const older = makeSet({ id: 'old', completedAt: 1000, weightKg: 60 })
    const newer = makeSet({ id: 'new', completedAt: 2000, weightKg: 80 })
    const store = makeSetStore([se], [older, newer])
    expect(lastWorkingSet('ex1', store)?.id).toBe('new')
  })

  it('fonctionne avec plusieurs sessionExercises pour le meme exercice', () => {
    const se1 = makeSE({ id: 'se1' })
    const se2 = makeSE({ id: 'se2', sessionId: 'sess2' })
    const setInSe1 = makeSet({ id: 's1', sessionExerciseId: 'se1', completedAt: 1000, weightKg: 70 })
    const setInSe2 = makeSet({ id: 's2', sessionExerciseId: 'se2', completedAt: 2000, weightKg: 85 })
    const store = makeSetStore([se1, se2], [setInSe1, setInSe2])
    expect(lastWorkingSet('ex1', store)?.id).toBe('s2') // la plus récente
  })
})

// ── programWeekNumber ─────────────────────────────────────────────────────────

describe('programWeekNumber', () => {
  it('renvoie 1 le jour du démarrage', () => {
    const start = Date.now()
    expect(programWeekNumber(start, 12, start)).toBe(1)
  })

  it('renvoie 1 à J+6', () => {
    const start = Date.now() - 6 * DAY
    expect(programWeekNumber(start, 12)).toBe(1)
  })

  it('renvoie 2 à J+7 exactement', () => {
    const start = Date.now() - 7 * DAY
    expect(programWeekNumber(start, 12)).toBe(2)
  })

  it('borne à durationWeeks si le programme est dépassé', () => {
    const start = Date.now() - 20 * WEEK
    expect(programWeekNumber(start, 12)).toBe(12)
  })

  it('borne à 1 si now < startedAt (horloge désynchronisée)', () => {
    const start = Date.now() + WEEK
    expect(programWeekNumber(start, 12)).toBe(1)
  })
})

// ── activePhase ───────────────────────────────────────────────────────────────

function makeActivePhaseStore(startedAt: number | undefined, durationWeeks: number): StoreApi {
  return {
    programs: startedAt != null
      ? [{ id: 'p1', updatedAt: 0, deleted: false, dirty: false,
           name: 'Test', isActive: true, isTemplate: false, goal: 'hypertrophy',
           level: 'intermediate', durationWeeks, sessionsPerWeek: 3,
           color: '#fff', weekTemplate: {}, createdAt: 0, startedAt }]
      : [],
    sets: [], sessions: [], sessionExercises: [], workoutTemplates: [],
    workoutExerciseTemplates: [], personalRecords: [], goals: [],
    bodyMeasurements: [], exercises: [],
    settings: { id: 'singleton', updatedAt: 0, deleted: false, dirty: false,
      firstName: '', lastName: '', createdAt: 0,
      preferences: { weightUnit: 'kg', distanceUnit: 'km', measurementUnit: 'cm',
        defaultRestSec: 90, weightStep: 2.5, restSoundEnabled: true, hapticsEnabled: true,
        autoBarbellWeight: false, autoWarmup: false, theme: 'dark', accentColor: '#fff',
        language: 'fr', weekStart: 'monday', rpeScale: '6-10', oneRMFormula: 'epley',
        notificationsEnabled: false, skipDayPreview: false, skipBriefing: false,
        prCelebrationEnabled: true } },
    ready: true, isAdmin: false,
    session: { save: vi.fn(), remove: vi.fn() },
    sessionExercise: { save: vi.fn(), remove: vi.fn() },
    set: { save: vi.fn(), remove: vi.fn() },
    exercise: { save: vi.fn(), remove: vi.fn() },
    program: { save: vi.fn(), remove: vi.fn() },
    workoutTemplate: { save: vi.fn(), remove: vi.fn() },
    workoutExerciseTemplate: { save: vi.fn(), remove: vi.fn() },
    personalRecord: { save: vi.fn(), remove: vi.fn() },
    goal: { save: vi.fn(), remove: vi.fn() },
    bodyMeasurement: { save: vi.fn(), remove: vi.fn() },
    saveSettings: vi.fn(), reload: vi.fn(),
  } as unknown as StoreApi
}

describe('activePhase', () => {
  it('renvoie undefined si pas de programme actif', () => {
    expect(activePhase(makeActivePhaseStore(undefined, 12))).toBeUndefined()
  })

  it('renvoie undefined si durée < 8 semaines (pas de phases)', () => {
    const start = Date.now() - 2 * WEEK
    expect(activePhase(makeActivePhaseStore(start, 6))).toBeUndefined()
  })

  it('renvoie une phase pour un programme de 12 semaines en semaine 1', () => {
    const start = Date.now() - 2 * DAY // ~J+2 → semaine 1
    const phase = activePhase(makeActivePhaseStore(start, 12))
    expect(phase).toBeDefined()
    expect(phase!.weekStart).toBeLessThanOrEqual(1)
    expect(phase!.weekEnd).toBeGreaterThanOrEqual(1)
  })

  it('change de phase à partir de la semaine de début de la phase suivante', () => {
    // Programme 12 sem. : phase 1 = adaptation sem. 1-4, phase 2 = progression sem. 5-8
    const startWeek5 = Date.now() - 4 * WEEK // exactement 4 semaines = semaine 5
    const phase = activePhase(makeActivePhaseStore(startWeek5, 12))
    expect(phase?.focus).toBe('progression')
  })
})

// ── validateSet ───────────────────────────────────────────────────────────────

function makeValidateStore(opts: {
  sets?: SetRecord[]
  sessionExercises?: SessionExercise[]
  personalRecords?: PersonalRecord[]
} = {}): StoreApi & { saved: unknown[]; removed: string[] } {
  const saved: unknown[] = []
  const removed: string[] = []
  const makeMutator = () => ({
    save: vi.fn(async (item: unknown) => { saved.push(item); return item }),
    remove: vi.fn(async (id: string) => { removed.push(id) }),
  })
  return {
    sets: opts.sets ?? [],
    sessionExercises: opts.sessionExercises ?? [],
    personalRecords: opts.personalRecords ?? [],
    sessions: [], exercises: [], programs: [], workoutTemplates: [],
    workoutExerciseTemplates: [], goals: [], bodyMeasurements: [],
    settings: { id: 'singleton', updatedAt: 0, deleted: false, dirty: false,
      firstName: '', lastName: '', createdAt: 0,
      preferences: { weightUnit: 'kg', distanceUnit: 'km', measurementUnit: 'cm',
        defaultRestSec: 90, weightStep: 2.5, restSoundEnabled: true, hapticsEnabled: true,
        autoBarbellWeight: false, autoWarmup: false, theme: 'dark', accentColor: '#fff',
        language: 'fr', weekStart: 'monday', rpeScale: '6-10', oneRMFormula: 'epley',
        notificationsEnabled: false, skipDayPreview: false, skipBriefing: false,
        prCelebrationEnabled: true } },
    ready: true, isAdmin: false,
    set: makeMutator(), session: makeMutator(), sessionExercise: makeMutator(),
    exercise: makeMutator(), program: makeMutator(), workoutTemplate: makeMutator(),
    workoutExerciseTemplate: makeMutator(), personalRecord: makeMutator(),
    goal: makeMutator(), bodyMeasurement: makeMutator(),
    saveSettings: vi.fn(), reload: vi.fn(),
    saved, removed,
  } as unknown as StoreApi & { saved: unknown[]; removed: string[] }
}

describe('validateSet', () => {
  it('stampe completedAt sur la série', async () => {
    const se = makeSE()
    const set = makeSet({ sessionExerciseId: 'se1' })
    const store = makeValidateStore({ sets: [], sessionExercises: [se] })
    await validateSet(set, 'ex1', store as unknown as StoreApi)
    const saved = (store as unknown as { saved: unknown[] }).saved
    const savedSet = saved.find((s: unknown) => (s as SetRecord).id === 'set1') as SetRecord | undefined
    expect(savedSet?.completedAt).toBeDefined()
  })

  it('ne crée pas de PR sur une série d échauffement', async () => {
    const se = makeSE()
    const set = makeSet({ sessionExerciseId: 'se1', isWarmup: true, weightKg: 200, reps: 1 })
    const store = makeValidateStore({ sets: [], sessionExercises: [se] })
    const pr = await validateSet(set, 'ex1', store as unknown as StoreApi)
    expect(pr.is1RM).toBe(false)
    expect(pr.isVolumeSet).toBe(false)
  })

  it('détecte un PR 1RM quand la série dépasse le record précédent', async () => {
    const se = makeSE()
    // Historique : 80 kg × 5 reps (déjà validé)
    const previous = makeSet({
      id: 'prev', sessionExerciseId: 'se1',
      weightKg: 80, reps: 5, completedAt: 1000,
    })
    // Nouvelle série : 100 kg × 5 reps → 1RM estimé supérieur
    const current = makeSet({ id: 'curr', sessionExerciseId: 'se1', weightKg: 100, reps: 5 })
    const store = makeValidateStore({ sets: [previous], sessionExercises: [se] })
    const pr = await validateSet(current, 'ex1', store as unknown as StoreApi)
    expect(pr.is1RM).toBe(true)
  })
})

// ── deleteSession ─────────────────────────────────────────────────────────────

function makeDeleteStore(opts: {
  session: Session
  sessionExercises?: SessionExercise[]
  sets?: SetRecord[]
  personalRecords?: PersonalRecord[]
}): StoreApi & { removed: string[] } {
  const removed: string[] = []
  const makeMutator = () => ({
    save: vi.fn(async (item: unknown) => item),
    remove: vi.fn(async (id: string) => { removed.push(id) }),
  })
  return {
    sets: opts.sets ?? [],
    sessionExercises: opts.sessionExercises ?? [],
    personalRecords: opts.personalRecords ?? [],
    sessions: [opts.session],
    exercises: [], programs: [], workoutTemplates: [],
    workoutExerciseTemplates: [], goals: [], bodyMeasurements: [],
    settings: { id: 'singleton', updatedAt: 0, deleted: false, dirty: false,
      firstName: '', lastName: '', createdAt: 0,
      preferences: { weightUnit: 'kg', distanceUnit: 'km', measurementUnit: 'cm',
        defaultRestSec: 90, weightStep: 2.5, restSoundEnabled: true, hapticsEnabled: true,
        autoBarbellWeight: false, autoWarmup: false, theme: 'dark', accentColor: '#fff',
        language: 'fr', weekStart: 'monday', rpeScale: '6-10', oneRMFormula: 'epley',
        notificationsEnabled: false, skipDayPreview: false, skipBriefing: false,
        prCelebrationEnabled: true } },
    ready: true, isAdmin: false,
    set: makeMutator(), session: makeMutator(), sessionExercise: makeMutator(),
    exercise: makeMutator(), program: makeMutator(), workoutTemplate: makeMutator(),
    workoutExerciseTemplate: makeMutator(), personalRecord: makeMutator(),
    goal: makeMutator(), bodyMeasurement: makeMutator(),
    saveSettings: vi.fn(), reload: vi.fn(),
    removed,
  } as unknown as StoreApi & { removed: string[] }
}

describe('deleteSession', () => {
  it('supprime la séance, ses exercises et ses séries', async () => {
    const session: Session = { id: 'sess1', updatedAt: 0, deleted: false, dirty: false,
      name: 'Test', startedAt: 1000, totalSets: 0, completedSets: 0 }
    const se = makeSE({ sessionId: 'sess1' })
    const set = makeSet({ sessionExerciseId: 'se1' })
    const store = makeDeleteStore({ session, sessionExercises: [se], sets: [set] })

    await deleteSession(session, store as unknown as StoreApi)

    expect(store.removed).toContain('sess1')
    expect(store.removed).toContain('se1')
    expect(store.removed).toContain('set1')
  })

  it('supprime aussi les PRs liés aux séries de la séance', async () => {
    const session: Session = { id: 'sess1', updatedAt: 0, deleted: false, dirty: false,
      name: 'Test', startedAt: 1000, totalSets: 0, completedSets: 0 }
    const se = makeSE({ sessionId: 'sess1' })
    const set = makeSet({ id: 'set1', sessionExerciseId: 'se1' })
    const pr: PersonalRecord = { id: 'pr1', updatedAt: 0, deleted: false, dirty: false,
      exerciseId: 'ex1', type: '1rm', weightKg: 100, reps: 1,
      estimated1RM: 100, setId: 'set1', achievedAt: 1000 }
    const store = makeDeleteStore({ session, sessionExercises: [se], sets: [set], personalRecords: [pr] })

    await deleteSession(session, store as unknown as StoreApi)

    expect(store.removed).toContain('pr1')
  })

  it('ne touche pas aux séries d\'une autre séance', async () => {
    const session: Session = { id: 'sess1', updatedAt: 0, deleted: false, dirty: false,
      name: 'Test', startedAt: 1000, totalSets: 0, completedSets: 0 }
    const seOther = makeSE({ id: 'se2', sessionId: 'sess2' })
    const setOther = makeSet({ id: 'set2', sessionExerciseId: 'se2' })
    const store = makeDeleteStore({ session, sessionExercises: [seOther], sets: [setOther] })

    await deleteSession(session, store as unknown as StoreApi)

    expect(store.removed).toContain('sess1')
    expect(store.removed).not.toContain('se2')
    expect(store.removed).not.toContain('set2')
  })
})
