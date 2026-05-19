import { describe, it, expect } from 'vitest'
import { nextSupersetIndex } from '../src/utils/superset'

describe('nextSupersetIndex', () => {
  it('retourne null pour un groupe vide', () => {
    expect(nextSupersetIndex([], 0)).toBeNull()
  })

  it('retourne null pour un groupe d\'un seul exercice', () => {
    expect(nextSupersetIndex([2], 2)).toBeNull()
  })

  it('retourne null si l\'index courant n\'appartient pas au groupe', () => {
    expect(nextSupersetIndex([0, 2, 4], 1)).toBeNull()
  })

  it('superset 2 exercices : A→B', () => {
    expect(nextSupersetIndex([0, 1], 0)).toBe(1)
  })

  it('superset 2 exercices : wrap-around B→A', () => {
    expect(nextSupersetIndex([0, 1], 1)).toBe(0)
  })

  it('triset : rotation circulaire complète', () => {
    const indices = [1, 3, 5]
    expect(nextSupersetIndex(indices, 1)).toBe(3)
    expect(nextSupersetIndex(indices, 3)).toBe(5)
    expect(nextSupersetIndex(indices, 5)).toBe(1)
  })

  it('indices non contigus (exercices intercalés)', () => {
    expect(nextSupersetIndex([0, 4, 8], 4)).toBe(8)
    expect(nextSupersetIndex([0, 4, 8], 8)).toBe(0)
  })

  it('fonctionne si les indices ne commencent pas à 0', () => {
    expect(nextSupersetIndex([2, 5], 2)).toBe(5)
    expect(nextSupersetIndex([2, 5], 5)).toBe(2)
  })
})
