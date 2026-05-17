import { describe, it, expect } from 'vitest'
import { detectPRs, isAnyPR, type PerformedSet } from '../src/utils/pr'

describe('detectPRs', () => {
  it('la toute première série valide est un PR sur tous les axes', () => {
    const r = detectPRs({ weightKg: 100, reps: 5 }, [])
    expect(r.is1RM).toBe(true)
    expect(r.isVolumeSet).toBe(true)
    expect(r.isRepsAtWeight).toBe(true)
  })

  it('détecte un nouveau 1RM', () => {
    const history: PerformedSet[] = [{ weightKg: 100, reps: 5 }]
    const r = detectPRs({ weightKg: 110, reps: 5 }, history)
    expect(r.is1RM).toBe(true)
  })

  it('pas de PR si la performance est identique', () => {
    const history: PerformedSet[] = [{ weightKg: 100, reps: 5 }]
    const r = detectPRs({ weightKg: 100, reps: 5 }, history)
    expect(r.is1RM).toBe(false)
    expect(r.isVolumeSet).toBe(false)
    expect(r.isRepsAtWeight).toBe(false)
  })

  it('détecte un PR de volume de série', () => {
    const history: PerformedSet[] = [{ weightKg: 100, reps: 5 }]
    const r = detectPRs({ weightKg: 100, reps: 6 }, history)
    expect(r.isVolumeSet).toBe(true)
    expect(r.isRepsAtWeight).toBe(true)
  })

  it('reps_at_weight faux si jamais soulevé à ce poids', () => {
    const history: PerformedSet[] = [{ weightKg: 80, reps: 10 }]
    const r = detectPRs({ weightKg: 100, reps: 3 }, history)
    expect(r.isRepsAtWeight).toBe(false)
  })

  it('série invalide (0 kg / 0 rep) → aucun PR', () => {
    const r = detectPRs({ weightKg: 0, reps: 0 }, [])
    expect(isAnyPR(r)).toBe(false)
  })
})
