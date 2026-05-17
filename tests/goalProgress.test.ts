import { describe, it, expect } from 'vitest'
import { goalProgressRatio, isGoalAchieved, isManualGoal } from '../src/utils/goalProgress'

describe('goalProgressRatio', () => {
  it('proportion simple', () => {
    expect(goalProgressRatio(50, 100)).toBe(0.5)
  })
  it('borné à 1 au-delà de la cible', () => {
    expect(goalProgressRatio(150, 100)).toBe(1)
  })
  it('borné à 0 pour une valeur négative', () => {
    expect(goalProgressRatio(-10, 100)).toBe(0)
  })
  it('rend 0 si la cible est nulle ou négative', () => {
    expect(goalProgressRatio(50, 0)).toBe(0)
  })
})

describe('isGoalAchieved', () => {
  it('vrai quand la cible est atteinte ou dépassée', () => {
    expect(isGoalAchieved(100, 100)).toBe(true)
    expect(isGoalAchieved(120, 100)).toBe(true)
  })
  it('faux en dessous de la cible', () => {
    expect(isGoalAchieved(99, 100)).toBe(false)
  })
  it('faux si la cible est nulle', () => {
    expect(isGoalAchieved(0, 0)).toBe(false)
  })
})

describe('isManualGoal', () => {
  it('poids de corps et personnalisé sont manuels', () => {
    expect(isManualGoal('bodyweight')).toBe(true)
    expect(isManualGoal('custom')).toBe(true)
  })
  it('les types mesurables ne le sont pas', () => {
    expect(isManualGoal('exercise_1rm')).toBe(false)
    expect(isManualGoal('sessions_per_week')).toBe(false)
  })
})
