import { describe, it, expect } from 'vitest'
import { isResumable, recoverableSession } from '../src/utils/sessionOps'

const HOUR = 3600 * 1000

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
})
