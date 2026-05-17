import { describe, it, expect } from 'vitest'
import { epley, brzycki, lombardi, estimate1RM } from '../src/utils/oneRM'

describe('epley', () => {
  it('rend le poids tel quel à 1 rep', () => {
    expect(epley(100, 1)).toBe(100)
  })
  it('100 kg × 10 → 133.33', () => {
    expect(epley(100, 10)).toBeCloseTo(133.333, 2)
  })
  it('croît avec les reps', () => {
    expect(epley(100, 8)).toBeGreaterThan(epley(100, 5))
  })
})

describe('brzycki', () => {
  it('rend le poids tel quel à 1 rep', () => {
    expect(brzycki(100, 1)).toBe(100)
  })
  it('100 kg × 10 → 133.33', () => {
    expect(brzycki(100, 10)).toBeCloseTo(133.333, 2)
  })
  it('retombe sur Epley au-delà de 37 reps (dénominateur invalide)', () => {
    expect(brzycki(100, 40)).toBe(epley(100, 40))
  })
})

describe('lombardi', () => {
  it('rend le poids tel quel à 1 rep', () => {
    expect(lombardi(100, 1)).toBe(100)
  })
  it('croît avec les reps', () => {
    expect(lombardi(100, 10)).toBeGreaterThan(100)
  })
})

describe('estimate1RM', () => {
  it('utilise Epley par défaut', () => {
    expect(estimate1RM(100, 10)).toBe(epley(100, 10))
  })
  it('sélectionne la formule demandée', () => {
    expect(estimate1RM(100, 10, 'brzycki')).toBe(brzycki(100, 10))
    expect(estimate1RM(100, 10, 'lombardi')).toBe(lombardi(100, 10))
  })
  it('rend 0 pour un poids ou des reps nuls', () => {
    expect(estimate1RM(0, 10)).toBe(0)
    expect(estimate1RM(100, 0)).toBe(0)
  })
})
