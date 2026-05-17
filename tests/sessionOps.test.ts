import { describe, it, expect } from 'vitest'
import { isResumable } from '../src/utils/sessionOps'

const HOUR = 3600 * 1000

describe('isResumable', () => {
  it('reprenable juste après le démarrage', () => {
    const now = Date.now()
    expect(isResumable(now, now)).toBe(true)
  })
  it('reprenable à 11 h d’écart', () => {
    const now = Date.now()
    expect(isResumable(now - 11 * HOUR, now)).toBe(true)
  })
  it('non reprenable au-delà de 12 h', () => {
    const now = Date.now()
    expect(isResumable(now - 13 * HOUR, now)).toBe(false)
  })
})
