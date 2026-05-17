import { describe, it, expect } from 'vitest'
import { isValidSet, repsLookSuspicious } from '../src/utils/setValidation'

describe('isValidSet', () => {
  it('bloque une série 0 kg / 0 rep', () => {
    expect(isValidSet(0, 0)).toBe(false)
  })
  it('accepte une série au poids du corps (0 kg, reps > 0)', () => {
    expect(isValidSet(0, 12)).toBe(true)
  })
  it('accepte une série chargée', () => {
    expect(isValidSet(80, 5)).toBe(true)
  })
})

describe('repsLookSuspicious', () => {
  it('avertit au-delà de 30 reps', () => {
    expect(repsLookSuspicious(31)).toBe(true)
  })
  it('n’avertit pas jusqu’à 30 reps', () => {
    expect(repsLookSuspicious(30)).toBe(false)
    expect(repsLookSuspicious(8)).toBe(false)
  })
})
