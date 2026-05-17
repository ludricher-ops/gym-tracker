import { describe, it, expect } from 'vitest'
import { computeStreak, streakInDanger, longestStreak } from '../src/utils/streak'

const TODAY = new Date(2026, 4, 17)

describe('computeStreak', () => {
  it('aucune séance → 0', () => {
    expect(computeStreak([], TODAY)).toBe(0)
  })

  it('compte les jours consécutifs jusqu’à aujourd’hui', () => {
    expect(computeStreak(['2026-05-15', '2026-05-16', '2026-05-17'], TODAY)).toBe(3)
  })

  it('aujourd’hui non entraîné : le streak d’hier tient encore', () => {
    expect(computeStreak(['2026-05-15', '2026-05-16'], TODAY)).toBe(2)
  })

  it('un trou rompt le streak', () => {
    expect(computeStreak(['2026-05-13', '2026-05-14', '2026-05-17'], TODAY)).toBe(1)
  })

  it('ignore les doublons de jour', () => {
    expect(computeStreak(['2026-05-17', '2026-05-17', '2026-05-16'], TODAY)).toBe(2)
  })

  it('streak rompu si rien hier ni aujourd’hui', () => {
    expect(computeStreak(['2026-05-14'], TODAY)).toBe(0)
  })
})

describe('longestStreak', () => {
  it('aucune séance → 0', () => {
    expect(longestStreak([])).toBe(0)
  })
  it('trouve la plus longue série historique', () => {
    expect(
      longestStreak([
        '2026-01-01', '2026-01-02', '2026-01-03',
        '2026-02-10',
        '2026-03-01', '2026-03-02',
      ]),
    ).toBe(3)
  })
  it('jours isolés → 1', () => {
    expect(longestStreak(['2026-01-01', '2026-03-01'])).toBe(1)
  })
})

describe('streakInDanger', () => {
  it('vrai si streak vivant mais aujourd’hui pas entraîné', () => {
    expect(streakInDanger(['2026-05-15', '2026-05-16'], TODAY)).toBe(true)
  })
  it('faux si déjà entraîné aujourd’hui', () => {
    expect(streakInDanger(['2026-05-16', '2026-05-17'], TODAY)).toBe(false)
  })
  it('faux si aucun streak', () => {
    expect(streakInDanger(['2026-05-10'], TODAY)).toBe(false)
  })
})
