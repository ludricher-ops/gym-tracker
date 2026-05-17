import { describe, it, expect } from 'vitest'
import { shouldProgress, nextTargetWeight, type ProgressionInput } from '../src/utils/progression'

const range: ProgressionInput = {
  repsMode: 'range',
  targetRepsMin: 6,
  targetRepsMax: 8,
  autoProgress: true,
  progressStepKg: 2.5,
}
const fixed: ProgressionInput = {
  repsMode: 'fixed',
  targetRepsMin: 5,
  autoProgress: true,
  progressStepKg: 2.5,
}

describe('shouldProgress', () => {
  it('plage : progresse au haut de la fourchette', () => {
    expect(shouldProgress(8, range)).toBe(true)
    expect(shouldProgress(9, range)).toBe(true)
  })
  it('plage : ne progresse pas en dessous du max', () => {
    expect(shouldProgress(7, range)).toBe(false)
  })
  it('fixe : progresse à la cible atteinte', () => {
    expect(shouldProgress(5, fixed)).toBe(true)
    expect(shouldProgress(4, fixed)).toBe(false)
  })
  it('ne progresse jamais si autoProgress est désactivé', () => {
    expect(shouldProgress(10, { ...range, autoProgress: false })).toBe(false)
  })
})

describe('nextTargetWeight', () => {
  it('ajoute le pas quand la cible est atteinte', () => {
    expect(nextTargetWeight(80, 8, range)).toBe(82.5)
  })
  it('garde le poids quand la cible n’est pas atteinte', () => {
    expect(nextTargetWeight(80, 6, range)).toBe(80)
  })
  it('laisse un poids nul inchangé (exercice au poids du corps)', () => {
    expect(nextTargetWeight(0, 12, range)).toBe(0)
  })
})
