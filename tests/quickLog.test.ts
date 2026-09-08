import { describe, it, expect } from 'vitest'
import {
  sessionNameFromParams,
  emojiFromParams,
  type CardioParams,
  type TeamSportParams,
  type StrengthFreeParams,
  type OtherParams,
} from '../src/utils/quickLog'

describe('sessionNameFromParams', () => {
  it('cardio running → "Course à pied"', () => {
    const p: CardioParams = { kind: 'cardio', sport: 'running', durationMin: 40, intensityRating: 3 }
    expect(sessionNameFromParams(p)).toBe('Course à pied')
  })
  it('cardio other → "Autre cardio"', () => {
    const p: CardioParams = { kind: 'cardio', sport: 'other', durationMin: 30, intensityRating: 2 }
    expect(sessionNameFromParams(p)).toBe('Autre cardio')
  })
  it('team_sport football → "Football"', () => {
    const p: TeamSportParams = { kind: 'team_sport', sport: 'Football', durationMin: 90, intensityRating: 4 }
    expect(sessionNameFromParams(p)).toBe('Football')
  })
  it('team_sport vide → "Sport collectif"', () => {
    const p: TeamSportParams = { kind: 'team_sport', sport: '', durationMin: 60, intensityRating: 3 }
    expect(sessionNameFromParams(p)).toBe('Sport collectif')
  })
  it('strength_free → "Musculation libre"', () => {
    const p: StrengthFreeParams = { kind: 'strength_free', durationMin: 45, muscleGroups: ['chest'], intensityRating: 3 }
    expect(sessionNameFromParams(p)).toBe('Musculation libre')
  })
  it('other avec label → label', () => {
    const p: OtherParams = { kind: 'other', label: 'Yoga', durationMin: 30, intensityRating: 2 }
    expect(sessionNameFromParams(p)).toBe('Yoga')
  })
  it('other sans label → "Activité"', () => {
    const p: OtherParams = { kind: 'other', label: '', durationMin: 20, intensityRating: 1 }
    expect(sessionNameFromParams(p)).toBe('Activité')
  })
})

describe('emojiFromParams', () => {
  it('cycling → 🚴', () => {
    const p: CardioParams = { kind: 'cardio', sport: 'cycling', durationMin: 60, intensityRating: 3 }
    expect(emojiFromParams(p)).toBe('🚴')
  })
  it('team_sport → ⚽', () => {
    const p: TeamSportParams = { kind: 'team_sport', sport: 'Tennis', durationMin: 60, intensityRating: 3 }
    expect(emojiFromParams(p)).toBe('⚽')
  })
  it('strength_free → 🏋️', () => {
    const p: StrengthFreeParams = { kind: 'strength_free', durationMin: 45, muscleGroups: [], intensityRating: 3 }
    expect(emojiFromParams(p)).toBe('🏋️')
  })
})
