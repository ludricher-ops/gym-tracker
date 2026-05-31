import { describe, it, expect } from 'vitest'
import { generateWarmup } from '../src/utils/warmup'

describe('generateWarmup', () => {
  it('aucun échauffement si le poids de travail ≤ la barre', () => {
    expect(generateWarmup(20)).toEqual([])
    expect(generateWarmup(15)).toEqual([])
  })

  it('produit 3 paliers barre / 50 % / 70 %', () => {
    const w = generateWarmup(100)
    expect(w).toHaveLength(3)
    expect(w[0].weightKg).toBe(20)
    expect(w[1].weightKg).toBe(50)
    expect(w[2].weightKg).toBe(70)
  })

  it('élimine le palier 50 % quand il est égal à la barre (poids travail = 40 kg)', () => {
    // 40 kg × 50 % = 20 kg = barre → palier redondant supprimé, résultat < 3 entrées
    const w = generateWarmup(40)
    expect(w.length).toBeLessThan(3)
    // Tous les paliers sont strictement croissants
    for (let i = 1; i < w.length; i++) expect(w[i]!.weightKg).toBeGreaterThan(w[i - 1]!.weightKg)
  })

  it('élimine le palier 50 % quand il est inférieur à la barre (poids travail = 30 kg)', () => {
    // 30 kg × 50 % = 15 kg < 20 kg (barre) → palier 50 % supprimé
    const w = generateWarmup(30)
    expect(w.length).toBeLessThan(3)
    // Tous les paliers sont strictement croissants
    for (let i = 1; i < w.length; i++) expect(w[i]!.weightKg).toBeGreaterThan(w[i - 1]!.weightKg)
  })

  it('arrondit les paliers au pas de 2.5 kg', () => {
    const w = generateWarmup(105)
    for (const set of w) {
      expect(set.weightKg % 2.5).toBe(0)
    }
  })

  it('les reps décroissent (12 → 8 → 5)', () => {
    const w = generateWarmup(120)
    expect(w.map((s) => s.reps)).toEqual([12, 8, 5])
  })
})
