import { describe, it, expect } from 'vitest'
import { isResumable, lastWorkingSet, recoverableSession } from '../src/utils/sessionOps'
import type { SetRecord, SessionExercise } from '../src/types'

const HOUR = 3600 * 1000

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
